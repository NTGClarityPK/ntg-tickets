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
      isCreateTransition?: boolean;
    };
  }>;
}

interface WorkflowData {
  id?: string;
  name: string;
  description?: string;
  status?: string;
  definition?: Record<string, unknown>;
}

interface WorkflowEditorProps {
  workflow?: WorkflowData;
  onSave?: (workflow: WorkflowData) => void;
  onCancel?: () => void;
}

export function WorkflowEditor({ workflow, onSave, onCancel }: WorkflowEditorProps) {
  const isReadOnly = !onSave;
  
  const [nodes, setNodes, onNodesChange] = useNodesState(
    (workflow?.definition as unknown as WorkflowDefinition)?.nodes || [
      {
        id: 'create',
        type: 'statusNode',
        position: { x: 50, y: 100 },
        data: { label: 'Create Ticket', color: '#4caf50', isInitial: true },
      },
      {
        id: 'new',
        type: 'statusNode',
        position: { x: 250, y: 100 },
        data: { label: 'New', color: '#ff9800' },
      },
      {
        id: 'open',
        type: 'statusNode',
        position: { x: 450, y: 100 },
        data: { label: 'Open', color: '#2196f3' },
      },
      {
        id: 'in_progress',
        type: 'statusNode',
        position: { x: 650, y: 100 },
        data: { label: 'In Progress', color: '#9c27b0' },
      },
      {
        id: 'resolved',
        type: 'statusNode',
        position: { x: 850, y: 100 },
        data: { label: 'Resolved', color: '#4caf50' },
      },
      {
        id: 'closed',
        type: 'statusNode',
        position: { x: 1050, y: 100 },
        data: { label: 'Closed', color: '#9e9e9e' },
      },
    ]
  );

  const [edges, setEdges, onEdgesChange] = useEdgesState(
    (workflow?.definition as unknown as WorkflowDefinition)?.edges || [
      {
        id: 'e0-create',
        source: 'create',
        target: 'new',
        label: 'Create Ticket',
        type: 'smoothstep',
        markerEnd: { type: MarkerType.ArrowClosed },
        data: {
          roles: [],
          conditions: [],
          actions: [],
          isCreateTransition: true, // Special flag
        },
      },
      {
        id: 'e1',
        source: 'new',
        target: 'open',
        label: 'Start Work',
        type: 'smoothstep',
        markerEnd: { type: MarkerType.ArrowClosed },
        data: {
          roles: [],
          conditions: [],
          actions: [],
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
          roles: [],
          conditions: [],
          actions: [],
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
          roles: [],
          conditions: [],
          actions: [],
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
          roles: [],
          conditions: [],
          actions: [],
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
  const [isActive, setIsActive] = useState((workflow as { status?: string })?.status === 'ACTIVE');

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
      // Prevent deletion of the create node
      if (nodeId === 'create') {
        notifications.show({
          title: 'Cannot Delete',
          message: 'The "Create Ticket" state cannot be deleted as it is required for the workflow.',
          color: 'red',
        });
        return;
      }
      // Prevent deletion of the new node
      if (nodeId === 'new') {
        notifications.show({
          title: 'Cannot Delete',
          message: 'The "New" status cannot be deleted as it is required for the workflow.',
          color: 'red',
        });
        return;
      }
      // "closed" node can now be deleted
      setNodes((nds) => nds.filter((node) => node.id !== nodeId));
      setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
    },
    [setNodes, setEdges]
  );


  const deleteEdge = useCallback(
    (edgeId: string) => {
      // Prevent deletion of the create transition
      const edge = edges.find(e => e.id === edgeId);
      if (edge?.data?.isCreateTransition) {
        notifications.show({
          title: 'Cannot Delete',
          message: 'The "Create Ticket" transition cannot be deleted as it is required for the workflow.',
          color: 'red',
        });
        return;
      }
      setEdges((eds) => eds.filter((edge) => edge.id !== edgeId));
    },
    [setEdges, edges]
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
      status: isActive ? 'ACTIVE' : 'INACTIVE',
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
  }, [workflowName, workflowDescription, isActive, nodes, edges, onSave]);

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
          <Title order={2}>{isReadOnly ? 'Workflow Viewer' : 'Workflow Editor'}</Title>
          <Group>
            {onCancel && (
              <Button variant="outline" onClick={onCancel}>
                {isReadOnly ? 'Close' : 'Cancel'}
              </Button>
            )}
            {onSave && (
              <Button onClick={handleSave} leftSection={<IconCheck size={16} />}>
                Save Workflow
              </Button>
            )}
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
                readOnly={isReadOnly}
                style={{ flex: 1 }}
              />
              <Switch
                label="Activate"
                description="Make this workflow active immediately"
                checked={isActive}
                onChange={(e) => setIsActive(e.currentTarget.checked)}
                disabled={isReadOnly}
              />
            </Group>
            <Textarea
              label="Description"
              placeholder="Enter workflow description"
              value={workflowDescription}
              onChange={(e) => setWorkflowDescription(e.target.value)}
              readOnly={isReadOnly}
              rows={2}
            />
          </Stack>
        </Card>

        <Card withBorder>
          <Stack gap="md">
            <Group justify="space-between">
              <Title order={4}>Workflow Diagram</Title>
              {!isReadOnly && (
                <Button
                  size="sm"
                  leftSection={<IconPlus size={16} />}
                  onClick={addNode}
                >
                  Add State
                </Button>
              )}
            </Group>

            <div style={{ height: '600px', border: '1px solid #e0e0e0', borderRadius: '8px' }}>
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={isReadOnly ? undefined : onNodesChange}
                onEdgesChange={isReadOnly ? undefined : onEdgesChange}
                onConnect={isReadOnly ? undefined : onConnect}
                onNodeClick={isReadOnly ? undefined : onNodeClick}
                onEdgeClick={isReadOnly ? undefined : onEdgeClick}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                connectionMode={ConnectionMode.Loose}
                fitView
                attributionPosition="bottom-left"
                nodesDraggable={!isReadOnly}
                nodesConnectable={!isReadOnly}
                elementsSelectable={!isReadOnly}
              >
                <Controls />
                <MiniMap />
                <Background />
              </ReactFlow>
            </div>

            <Alert color="blue" variant="light">
              <Text size="sm">
                {isReadOnly
                  ? 'This is a read-only view of the workflow. You cannot make changes.'
                  : 'Click states to edit or click arrows to configure transitions.'}
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
              {selectedNode.id === 'create' && (
                <Alert color="blue" variant="light">
                  <Text size="sm">
                    The "Create Ticket" state is required and cannot be renamed or deleted.
                  </Text>
                </Alert>
              )}
              
              <TextInput
                label="State Name"
                value={selectedNode.data?.label || ''}
                disabled={selectedNode.id === 'create'}
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
                {selectedNode.id !== 'create' && selectedNode.id !== 'new' && (
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
                )}
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
          title={selectedEdge?.data?.isCreateTransition ? "Configure Ticket Creation" : "Configure Transition"}
          size="lg"
        >
          {selectedEdge && (
            <Stack gap="md">
              {selectedEdge.data?.isCreateTransition && (
                <Alert color="blue" variant="light">
                  <Text size="sm">
                    This is the ticket creation transition. Configure who can create tickets and what actions should occur.
                  </Text>
                </Alert>
              )}
              
              {!selectedEdge.data?.isCreateTransition && (
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
              )}

              <MultiSelect
                label={selectedEdge.data?.isCreateTransition ? "Who can create tickets?" : "Allowed Roles"}
                placeholder={selectedEdge.data?.isCreateTransition ? "Select roles that can create tickets" : "Select roles that can execute this transition"}
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

              {!selectedEdge.data?.isCreateTransition && (
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
              )}

              <MultiSelect
                label={selectedEdge.data?.isCreateTransition ? "Actions on ticket creation" : "Actions"}
                placeholder={selectedEdge.data?.isCreateTransition ? "Select actions to execute when ticket is created" : "Select actions to execute on transition"}
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
                {!selectedEdge.data?.isCreateTransition && (
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
                )}
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
