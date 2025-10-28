'use client';

import React, { useState, useCallback, useEffect } from 'react';
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  MiniMap,
  NodeTypes,
  EdgeTypes,
  MarkerType,
  EdgeMarkerType,
  applyNodeChanges,
  applyEdgeChanges,
  Handle,
  Position,
  ConnectionMode,
} from 'reactflow';
import 'reactflow/dist/style.css';
import {
  Container,
  Stack,
  Title,
  Button,
  Group,
  Card,
  Text,
  Modal,
  TextInput,
  Textarea,
  MultiSelect,
  Switch,
  Badge,
  Alert,
} from '@mantine/core';
import {
  IconPlus,
  IconTrash,
  IconCheck,
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';

// Custom node types
interface StatusNodeData {
  label: string;
  color: string;
  isInitial?: boolean;
}

const StatusNode = ({ data, selected }: { data: StatusNodeData; selected: boolean }) => (
  <div
    style={{
      background: selected ? '#e3f2fd' : '#fff',
      border: `2px solid ${data.color || '#1976d2'}`,
      borderRadius: '8px',
      padding: '10px 15px',
      minWidth: '120px',
      textAlign: 'center',
      boxShadow: selected ? '0 4px 8px rgba(0,0,0,0.1)' : '0 2px 4px rgba(0,0,0,0.1)',
      position: 'relative',
    }}
  >
    <Handle
      type="target"
      position={Position.Top}
      style={{ background: data.color || '#1976d2' }}
    />
    <Text size="sm" fw={500}>
      {data.label}
    </Text>
    {data.isInitial && (
      <Badge size="xs" color="green" style={{ marginTop: '4px' }}>
        Start
      </Badge>
    )}
    <Handle
      type="source"
      position={Position.Bottom}
      style={{ background: data.color || '#1976d2' }}
    />
  </div>
);

const nodeTypes: NodeTypes = {
  statusNode: StatusNode,
};

const edgeTypes: EdgeTypes = {};

interface WorkflowDefinition {
  nodes: Array<{
    id: string;
    type?: string;
    position: { x: number; y: number };
    data: StatusNodeData;
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
    label?: string;
    type?: string;
    markerEnd?: EdgeMarkerType;
    data: {
      roles: string[];
      conditions: string[];
      actions: string[];
    };
  }>;
}

interface WorkflowData {
  id?: string;
  name: string;
  description?: string;
  isDefault?: boolean;
  definition?: Record<string, unknown>;
}

interface WorkflowEditorProps {
  workflow?: WorkflowData;
  onSave?: (workflow: WorkflowData) => void;
  onCancel?: () => void;
}

export function WorkflowEditor({ workflow, onSave, onCancel }: WorkflowEditorProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(
    (workflow?.definition as unknown as WorkflowDefinition)?.nodes || [
      {
        id: 'new',
        type: 'statusNode',
        position: { x: 100, y: 100 },
        data: { label: 'New', color: '#ff9800', isInitial: true },
      },
      {
        id: 'open',
        type: 'statusNode',
        position: { x: 300, y: 100 },
        data: { label: 'Open', color: '#2196f3' },
      },
      {
        id: 'in_progress',
        type: 'statusNode',
        position: { x: 500, y: 100 },
        data: { label: 'In Progress', color: '#9c27b0' },
      },
      {
        id: 'resolved',
        type: 'statusNode',
        position: { x: 700, y: 100 },
        data: { label: 'Resolved', color: '#4caf50' },
      },
      {
        id: 'closed',
        type: 'statusNode',
        position: { x: 900, y: 100 },
        data: { label: 'Closed', color: '#9e9e9e' },
      },
    ]
  );

  const [edges, setEdges, onEdgesChange] = useEdgesState(
    (workflow?.definition as unknown as WorkflowDefinition)?.edges || [
      {
        id: 'e1',
        source: 'new',
        target: 'open',
        label: 'Start Work',
        type: 'smoothstep',
        markerEnd: { type: MarkerType.ArrowClosed },
        data: {
          roles: ['SUPPORT_STAFF', 'SUPPORT_MANAGER'],
          conditions: ['REQUIRES_COMMENT'],
          actions: ['SEND_NOTIFICATION'],
        },
      },
      {
        id: 'e2',
        source: 'open',
        target: 'in_progress',
        label: 'Begin Work',
        type: 'smoothstep',
        markerEnd: { type: MarkerType.ArrowClosed },
        data: {
          roles: ['SUPPORT_STAFF'],
          conditions: [],
          actions: ['ASSIGN_TO_USER'],
        },
      },
      {
        id: 'e3',
        source: 'in_progress',
        target: 'resolved',
        label: 'Resolve',
        type: 'smoothstep',
        markerEnd: { type: MarkerType.ArrowClosed },
        data: {
          roles: ['SUPPORT_STAFF'],
          conditions: ['REQUIRES_RESOLUTION'],
          actions: ['SEND_NOTIFICATION', 'CALCULATE_RESOLUTION_TIME'],
        },
      },
      {
        id: 'e4',
        source: 'resolved',
        target: 'closed',
        label: 'Close',
        type: 'smoothstep',
        markerEnd: { type: MarkerType.ArrowClosed },
        data: {
          roles: ['SUPPORT_STAFF', 'SUPPORT_MANAGER'],
          conditions: [],
          actions: ['SEND_NOTIFICATION'],
        },
      },
    ]
  );

  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [showEdgeModal, setShowEdgeModal] = useState(false);
  const [showNodeModal, setShowNodeModal] = useState(false);
  const [workflowName, setWorkflowName] = useState(workflow?.name || '');
  const [workflowDescription, setWorkflowDescription] = useState(workflow?.description || '');
  const [isDefault, setIsDefault] = useState(workflow?.isDefault || false);

  const onConnect = useCallback(
    (params: Connection) => {
      const newEdge = {
        ...params,
        id: `e${Date.now()}`,
        label: 'New Transition',
        type: 'smoothstep',
        markerEnd: { type: MarkerType.ArrowClosed },
        data: {
          roles: [],
          conditions: [],
          actions: [],
        },
      };
      setEdges((eds) => addEdge(newEdge, eds));
    },
    [setEdges]
  );

  const onEdgeClick = useCallback((event: React.MouseEvent, edge: Edge) => {
    setSelectedEdge(edge);
    setShowEdgeModal(true);
  }, []);

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
    setShowNodeModal(true);
  }, []);

  // Sync selectedNode with actual node data when modal opens
  useEffect(() => {
    if (showNodeModal && selectedNode) {
      const currentNode = nodes.find(n => n.id === selectedNode.id);
      if (currentNode) {
        setSelectedNode(currentNode);
      }
    }
  }, [showNodeModal, selectedNode, nodes]);

  // Sync selectedEdge with actual edge data when modal opens
  useEffect(() => {
    if (showEdgeModal && selectedEdge) {
      const currentEdge = edges.find(e => e.id === selectedEdge.id);
      if (currentEdge) {
        setSelectedEdge(currentEdge);
      }
    }
  }, [showEdgeModal, selectedEdge, edges]);

  const updateEdge = useCallback(
    (edgeId: string, updates: Partial<Edge>) => {
      setEdges((eds) =>
        eds.map((edge) => (edge.id === edgeId ? { ...edge, ...updates } : edge))
      );
    },
    [setEdges]
  );

  const addNode = useCallback(() => {
    const newNode: Node = {
      id: `node_${Date.now()}`,
      type: 'statusNode',
      position: { x: Math.random() * 400 + 100, y: Math.random() * 300 + 100 },
      data: { label: 'New State', color: '#1976d2' },
    };
    setNodes((nds) => [...nds, newNode]);
  }, [setNodes]);

  const updateNode = useCallback(
    (nodeId: string, updates: Partial<Node>) => {
      setNodes((nds) =>
        nds.map((node) => (node.id === nodeId ? { ...node, ...updates } : node))
      );
    },
    [setNodes]
  );

  const deleteNode = useCallback(
    (nodeId: string) => {
      setNodes((nds) => nds.filter((node) => node.id !== nodeId));
      setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
    },
    [setNodes, setEdges]
  );


  const deleteEdge = useCallback(
    (edgeId: string) => {
      setEdges((eds) => eds.filter((edge) => edge.id !== edgeId));
    },
    [setEdges]
  );

  const handleSave = useCallback(() => {
    if (!workflowName.trim()) {
      notifications.show({
        title: 'Error',
        message: 'Please enter a workflow name',
        color: 'red',
      });
      return;
    }

    const workflowData = {
      name: workflowName,
      description: workflowDescription,
      isDefault,
      definition: {
        nodes: nodes.map((node) => ({
          id: node.id,
          type: node.type,
          position: node.position,
          data: node.data,
        })),
        edges: edges.map((edge) => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          label: typeof edge.label === 'string' ? edge.label : String(edge.label || ''),
          type: edge.type,
          markerEnd: edge.markerEnd,
          data: edge.data || { roles: [], conditions: [], actions: [] },
        })),
      },
    };

    onSave?.(workflowData);
  }, [workflowName, workflowDescription, isDefault, nodes, edges, onSave]);

  const availableRoles = [
    { value: 'END_USER', label: 'End User' },
    { value: 'SUPPORT_STAFF', label: 'Support Staff' },
    { value: 'SUPPORT_MANAGER', label: 'Support Manager' },
    { value: 'ADMIN', label: 'Admin' },
  ];

  const availableConditions = [
    { value: 'REQUIRES_COMMENT', label: 'Requires Comment' },
  ];

  const availableActions = [
    { value: 'SEND_NOTIFICATION', label: 'Send Notification' },
  ];

  return (
    <Container size="xl">
      <Stack gap="md">
        <Group justify="space-between">
          <Title order={2}>Workflow Editor</Title>
          <Group>
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button onClick={handleSave} leftSection={<IconCheck size={16} />}>
              Save Workflow
            </Button>
          </Group>
        </Group>

        <Card withBorder>
          <Stack gap="md">
            <Group>
              <TextInput
                label="Workflow Name"
                placeholder="Enter workflow name"
                value={workflowName}
                onChange={(e) => setWorkflowName(e.target.value)}
                style={{ flex: 1 }}
              />
              <Switch
                label="Set as Default"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.currentTarget.checked)}
              />
            </Group>
            <Textarea
              label="Description"
              placeholder="Enter workflow description"
              value={workflowDescription}
              onChange={(e) => setWorkflowDescription(e.target.value)}
              rows={2}
            />
          </Stack>
        </Card>

        <Card withBorder>
          <Stack gap="md">
            <Group justify="space-between">
              <Title order={4}>Workflow Diagram</Title>
              <Button
                size="sm"
                leftSection={<IconPlus size={16} />}
                onClick={addNode}
              >
                Add State
              </Button>
            </Group>

            <div style={{ height: '600px', border: '1px solid #e0e0e0', borderRadius: '8px' }}>
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onNodeClick={onNodeClick}
                onEdgeClick={onEdgeClick}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                connectionMode={ConnectionMode.Loose}
                fitView
                attributionPosition="bottom-left"
              >
                <Controls />
                <MiniMap />
                <Background />
              </ReactFlow>
            </div>

            <Alert color="blue" variant="light">
              <Text size="sm">
                Click states to edit or click arrows to configure transitions.
              </Text>
            </Alert>
          </Stack>
        </Card>

        {/* Node Configuration Modal */}
        <Modal
          opened={showNodeModal}
          onClose={() => setShowNodeModal(false)}
          title="Configure State"
          size="md"
        >
          {selectedNode && (
            <Stack gap="md">
              <TextInput
                label="State Name"
                value={selectedNode.data?.label || ''}
                onChange={(e) => {
                  const newLabel = e.target.value;
                  const updatedNode = {
                    ...selectedNode,
                    data: { ...selectedNode.data, label: newLabel }
                  };
                  setSelectedNode(updatedNode);
                  updateNode(selectedNode.id, {
                    data: { ...selectedNode.data, label: newLabel }
                  });
                }}
              />

              <TextInput
                label="Color"
                type="color"
                value={selectedNode.data?.color || '#1976d2'}
                onChange={(e) => {
                  const newColor = e.target.value;
                  const updatedNode = {
                    ...selectedNode,
                    data: { ...selectedNode.data, color: newColor }
                  };
                  setSelectedNode(updatedNode);
                  updateNode(selectedNode.id, {
                    data: { ...selectedNode.data, color: newColor }
                  });
                }}
              />

              <Group justify="flex-end">
                <Button
                  variant="outline"
                  color="red"
                  leftSection={<IconTrash size={16} />}
                  onClick={() => {
                    deleteNode(selectedNode.id);
                    setShowNodeModal(false);
                  }}
                >
                  Delete State
                </Button>
                <Button onClick={() => setShowNodeModal(false)}>
                  Close
                </Button>
              </Group>
            </Stack>
          )}
        </Modal>

        {/* Edge Configuration Modal */}
        <Modal
          opened={showEdgeModal}
          onClose={() => setShowEdgeModal(false)}
          title="Configure Transition"
          size="lg"
        >
          {selectedEdge && (
            <Stack gap="md">
              <TextInput
                label="Transition Name"
                value={String(selectedEdge.label || '')}
                onChange={(e) => {
                  const newLabel = e.target.value;
                  const updatedEdge = {
                    ...selectedEdge,
                    label: newLabel
                  };
                  setSelectedEdge(updatedEdge);
                  updateEdge(selectedEdge.id, { label: newLabel });
                }}
              />

              <MultiSelect
                label="Allowed Roles"
                placeholder="Select roles that can execute this transition"
                data={availableRoles}
                value={selectedEdge.data?.roles || []}
                onChange={(value) => {
                  const updatedEdge = {
                    ...selectedEdge,
                    data: { ...selectedEdge.data, roles: value }
                  };
                  setSelectedEdge(updatedEdge);
                  updateEdge(selectedEdge.id, {
                    data: { ...selectedEdge.data, roles: value },
                  });
                }}
              />

              <MultiSelect
                label="Conditions"
                placeholder="Select conditions for this transition"
                data={availableConditions}
                value={selectedEdge.data?.conditions || []}
                onChange={(value) => {
                  const updatedEdge = {
                    ...selectedEdge,
                    data: { ...selectedEdge.data, conditions: value }
                  };
                  setSelectedEdge(updatedEdge);
                  updateEdge(selectedEdge.id, {
                    data: { ...selectedEdge.data, conditions: value },
                  });
                }}
              />

              <MultiSelect
                label="Actions"
                placeholder="Select actions to execute on transition"
                data={availableActions}
                value={selectedEdge.data?.actions || []}
                onChange={(value) => {
                  const updatedEdge = {
                    ...selectedEdge,
                    data: { ...selectedEdge.data, actions: value }
                  };
                  setSelectedEdge(updatedEdge);
                  updateEdge(selectedEdge.id, {
                    data: { ...selectedEdge.data, actions: value },
                  });
                }}
              />

              <Group justify="flex-end">
                <Button
                  variant="outline"
                  color="red"
                  leftSection={<IconTrash size={16} />}
                  onClick={() => {
                    deleteEdge(selectedEdge.id);
                    setShowEdgeModal(false);
                  }}
                >
                  Delete Transition
                </Button>
                <Button onClick={() => setShowEdgeModal(false)}>
                  Close
                </Button>
              </Group>
            </Stack>
          )}
        </Modal>
      </Stack>
    </Container>
  );
}
