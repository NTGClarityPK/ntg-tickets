'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
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
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  EdgeProps,
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
  Badge,
  Alert,
  Table,
  ScrollArea,
  useMantineTheme,
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

const StatusNode = ({ data, selected }: { data: StatusNodeData; selected: boolean }) => {
  const theme = useMantineTheme();
  return (
    <div
      style={{
        background: selected ? '#e3f2fd' : '#fff',
        border: `2px solid ${data.color || '#1976d2'}`,
        borderRadius: '8px',
        padding: '16px 24px',
        minWidth: '160px',
        textAlign: 'center',
        boxShadow: selected ? '0 4px 8px rgba(0,0,0,0.1)' : '0 2px 4px rgba(0,0,0,0.1)',
        position: 'relative',
        margin: '8px',
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: data.color || '#1976d2', width: 12, height: 12 }}
      />
      <Text size="sm" fw={500} style={{ lineHeight: 1.4 }}>
        {data.label}
      </Text>
      {data.isInitial && (
        <Badge size="xs" color={theme.primaryColor} style={{ marginTop: '6px' }}>
          Start
        </Badge>
      )}
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: data.color || '#1976d2', width: 12, height: 12 }}
      />
    </div>
  );
};

const nodeTypes: NodeTypes = {
  statusNode: StatusNode,
};

// Custom edge component that shows roles and actions in read-only mode
const CustomEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
  label,
  selected,

}: EdgeProps) => {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const formatRoleName = (role: string) => {
    return role
      .split('_')
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ');
  };

  const roles = data?.roles || [];
  const actions = data?.actions || [];

  // Calculate direction vector for perpendicular offset
  const dx = targetX - sourceX;
  const dy = targetY - sourceY;
  const length = Math.sqrt(dx * dx + dy * dy);
  
  // Detect if nodes are vertically aligned (same X position, different Y)
  const verticalAlignmentThreshold = 50; // Nodes within 50px horizontally are considered vertically aligned
  const isVerticallyAligned = Math.abs(dx) < verticalAlignmentThreshold && Math.abs(dy) > 50;
  
  // Normalize and get perpendicular vector (rotate 90 degrees)
  // For vertical edges, we want left/right positioning, so perpX should be ±1
  const perpX = isVerticallyAligned 
    ? (dx >= 0 ? 1 : -1) // For vertical alignment, use consistent left/right direction
    : (-dy / (length || 1)); // For other edges, use perpendicular
  const perpY = isVerticallyAligned 
    ? 0 // No vertical component for horizontal offset
    : (dx / (length || 1)); // For other edges, use perpendicular
  
  // Use edge data to determine offset direction for bidirectional edges
  // This ensures opposite sides for edges between the same nodes
  const hasReverseEdge = data?.hasReverseEdge || false;
  const isReverse = data?.isReverse || false;
  
  // Determine perpendicular offset
  const edgeIdNum = parseInt(id.replace(/\D/g, '')) || 0;
  let perpendicularOffset: number;
  
  if (isVerticallyAligned) {
    // For vertically aligned nodes, place labels on opposite sides
    // If there's a reverse edge, use the isReverse flag to place on opposite sides
    // Otherwise, use edge direction to determine side
    if (hasReverseEdge) {
      // For bidirectional edges between vertically aligned nodes, place on opposite sides
      perpendicularOffset = isReverse ? -80 : 80; // One on left, one on right
    } else {
      // For single edge between vertically aligned nodes, use consistent side based on direction
      // Edges going down go to right, edges going up go to left (or vice versa)
      const isDownward = dy > 0;
      perpendicularOffset = isDownward ? 80 : -80; // Downward edges on right, upward on left
    }
  } else if (hasReverseEdge) {
    // For bidirectional edges (not vertically aligned), offset to opposite sides
    perpendicularOffset = isReverse ? -70 : 70;
  } else {
    // For single-direction edges, use a smaller offset based on edge ID
    perpendicularOffset = (edgeIdNum % 3 - 1) * 30;
  }
  
  // Apply vertical stagger only for non-vertically-aligned edges
  const verticalOffset = isVerticallyAligned 
    ? 0 // No vertical offset for vertically aligned nodes - rely on perpendicular only
    : ((edgeIdNum % 5 - 2) * 30); // Vertical stagger for other edges
  
  const offsetX = perpX * perpendicularOffset;
  const offsetY = perpY * perpendicularOffset + verticalOffset;

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX + offsetX}px,${labelY + offsetY}px)`,
            fontSize: 11,
            pointerEvents: 'all',
            zIndex: 10,
          }}
          className="nodrag nopan"
        >
          <div
            style={{
              background: selected ? '#e3f2fd' : '#fff',
              border: `1px solid ${selected ? '#1976d2' : '#ccc'}`,
              borderRadius: '4px',
              padding: '4px 8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              maxWidth: '200px',
              whiteSpace: 'nowrap',
              margin: '4px',
            }}
          >
            <Text size="xs" fw={500} style={{ marginBottom: '2px', lineHeight: 1.2 }}>
              {String(label || '')}
            </Text>
            {roles.length > 0 && (
              <div style={{ marginTop: '2px' }}>
                <Text size="xs" c="dimmed" style={{ marginBottom: '1px', fontSize: 10 }}>
                  R: {roles.map((r: string) => formatRoleName(r)).join(', ')}
                </Text>
              </div>
            )}
            {actions.length > 0 && (
              <div style={{ marginTop: '2px' }}>
                <Text size="xs" c="dimmed" style={{ fontSize: 10 }}>
                  A: {actions.map((a: string) => a.replace(/_/g, ' ').split(' ')[0]).join(', ')}
                </Text>
              </div>
            )}
          </div>
        </div>
      </EdgeLabelRenderer>
    </>
  );
};

const edgeTypes: EdgeTypes = {
  custom: CustomEdge,
};

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
  const theme = useMantineTheme();
  const isReadOnly = !onSave;
  
  const [nodes, setNodes, onNodesChange] = useNodesState(
    (workflow?.definition as unknown as WorkflowDefinition)?.nodes || [
      {
        id: 'create',
        type: 'statusNode',
        position: { x: 50, y: 80 },
        data: { label: 'Create Ticket', color: '#4caf50', isInitial: true },
      },
      {
        id: 'new',
        type: 'statusNode',
        position: { x: 280, y: 80 },
        data: { label: 'New', color: '#ff9800' },
      },
      {
        id: 'open',
        type: 'statusNode',
        position: { x: 510, y: 80 },
        data: { label: 'Open', color: '#2196f3' },
      },
      {
        id: 'resolved',
        type: 'statusNode',
        position: { x: 740, y: 80 },
        data: { label: 'Resolved', color: '#4caf50' },
      },
      {
        id: 'closed',
        type: 'statusNode',
        position: { x: 970, y: 80 },
        data: { label: 'Closed', color: '#9e9e9e' },
      },
      {
        id: 'reopened',
        type: 'statusNode',
        position: { x: 1100, y: 280 },
        data: { label: 'Reopened', color: '#ff6f00' },
      },
      {
        id: 'in_progress',
        type: 'statusNode',
        position: { x: 630, y: 280 },
        data: { label: 'In Progress', color: '#9c27b0' },
      },
      {
        id: 'on_hold',
        type: 'statusNode',
        position: { x: 510, y: 430 },
        data: { label: 'On Hold', color: '#ff5722' },
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
          roles: ['END_USER'],
          conditions: [],
          actions: [],
          isCreateTransition: true, // Special flag
        },
      },
      {
        id: 'e1',
        source: 'new',
        target: 'open',
        label: 'Open',
        type: 'smoothstep',
        markerEnd: { type: MarkerType.ArrowClosed },
        data: {
          roles: ['SUPPORT_MANAGER', 'ADMIN'],
          conditions: [],
          actions: [],
        },
      },
      {
        id: 'e2',
        source: 'open',
        target: 'in_progress',
        label: 'Start Work',
        type: 'smoothstep',
        markerEnd: { type: MarkerType.ArrowClosed },
        data: {
          roles: ['SUPPORT_STAFF', 'ADMIN'],
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
          roles: ['SUPPORT_STAFF', 'ADMIN'],
          conditions: [],
          actions: [],
        },
      },
      {
        id: 'e3-hold',
        source: 'in_progress',
        target: 'on_hold',
        label: 'Put On Hold',
        type: 'smoothstep',
        markerEnd: { type: MarkerType.ArrowClosed },
        data: {
          roles: ['SUPPORT_STAFF', 'ADMIN'],
          conditions: [],
          actions: [],
        },
      },
      {
        id: 'e3-resume',
        source: 'on_hold',
        target: 'in_progress',
        label: 'Resume Work',
        type: 'smoothstep',
        markerEnd: { type: MarkerType.ArrowClosed },
        data: {
          roles: ['SUPPORT_STAFF', 'ADMIN'],
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
          roles: ['SUPPORT_STAFF', 'ADMIN'],
          conditions: [],
          actions: [],
        },
      },
      {
        id: 'e5',
        source: 'closed',
        target: 'reopened',
        label: 'Reopen',
        type: 'smoothstep',
        markerEnd: { type: MarkerType.ArrowClosed },
        data: {
          roles: ['END_USER', 'ADMIN'],
          conditions: [],
          actions: [],
        },
      },
      {
        id: 'e6',
        source: 'reopened',
        target: 'in_progress',
        label: 'Resume Work',
        type: 'smoothstep',
        markerEnd: { type: MarkerType.ArrowClosed },
        data: {
          roles: ['SUPPORT_STAFF', 'ADMIN'],
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
  const [isActive ] = useState((workflow as { status?: string })?.status === 'ACTIVE');
  const spacingAppliedRef = useRef(false);

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

  // Increase node spacing in read-only mode
  useEffect(() => {
    if (isReadOnly && nodes.length > 0 && !spacingAppliedRef.current) {
      // Check if nodes already have increased spacing by checking horizontal distance between first two nodes
      const sortedNodes = [...nodes].sort((a, b) => {
        if (Math.abs(a.position.y - b.position.y) < 50) {
          return a.position.x - b.position.x;
        }
        return a.position.y - b.position.y;
      });
      
      // Check spacing - if nodes are close together (< 300px horizontally), apply spacing
      const needsSpacing = sortedNodes.length > 1 && 
        (sortedNodes[1].position.x - sortedNodes[0].position.x < 300 || 
         Math.abs(sortedNodes[1].position.y - sortedNodes[0].position.y) < 250);
      
      if (needsSpacing) {
        // Calculate spacing multiplier for view mode
        const horizontalSpacing = 400; // Increased from ~230px to 400px
        const verticalSpacing = 300; // Increased from ~200px to 300px
        
        // Group nodes by approximate Y position to maintain row structure
        const nodeRows: { [key: number]: Node[] } = {};
        nodes.forEach(node => {
          const rowKey = Math.round(node.position.y / 100) * 100;
          if (!nodeRows[rowKey]) {
            nodeRows[rowKey] = [];
          }
          nodeRows[rowKey].push(node);
        });

        // Sort rows by Y position
        const sortedRows = Object.keys(nodeRows)
          .map(Number)
          .sort((a, b) => a - b);

        // Reposition nodes with increased spacing
        const updatedNodes = nodes.map(node => {
          const rowKey = Math.round(node.position.y / 100) * 100;
          const rowIndex = sortedRows.indexOf(rowKey);
          const rowNodes = nodeRows[rowKey].sort((a, b) => a.position.x - b.position.x);
          const nodeIndexInRow = rowNodes.findIndex(n => n.id === node.id);

          // Calculate new position
          const newX = 100 + (nodeIndexInRow * horizontalSpacing);
          const newY = 100 + (rowIndex * verticalSpacing);

          return {
            ...node,
            position: { x: newX, y: newY },
          };
        });

        setNodes(updatedNodes);
        spacingAppliedRef.current = true;
      }
    }
    
    // Reset ref when exiting read-only mode
    if (!isReadOnly) {
      spacingAppliedRef.current = false;
    }
  }, [isReadOnly, nodes, setNodes]); // Include nodes to check spacing, but use ref to prevent re-applying

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
          color: theme.colors[theme.primaryColor][9],
        });
        return;
      }
      // Prevent deletion of the new node
      if (nodeId === 'new') {
        notifications.show({
          title: 'Cannot Delete',
          message: 'The "New" status cannot be deleted as it is required for the workflow.',
          color: theme.colors[theme.primaryColor][9],
        });
        return;
      }
      // "closed" node can now be deleted
      setNodes((nds) => nds.filter((node) => node.id !== nodeId));
      setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
    },
    [setNodes, setEdges, theme]
  );


  const deleteEdge = useCallback(
    (edgeId: string) => {
      // Prevent deletion of the create transition
      const edge = edges.find(e => e.id === edgeId);
      if (edge?.data?.isCreateTransition) {
        notifications.show({
          title: 'Cannot Delete',
          message: 'The "Create Ticket" transition cannot be deleted as it is required for the workflow.',
          color: theme.colors[theme.primaryColor][9],
        });
        return;
      }
      setEdges((eds) => eds.filter((edge) => edge.id !== edgeId));
    },
    [setEdges, edges, theme]
  );

  const handleSave = useCallback(() => {
    if (!workflowName.trim()) {
      notifications.show({
        title: 'Error',
        message: 'Please enter a workflow name',
        color: theme.colors[theme.primaryColor][9],
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
  }, [workflowName, workflowDescription, isActive, nodes, edges, onSave, theme]);

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

  // Format role name for display
  const formatRoleName = (role: string) => {
    return role
      .split('_')
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ');
  };

  // Get source and target node labels for display
  const getNodeLabel = (nodeId: string) => {
    const node = nodes.find((n) => n.id === nodeId);
    return node?.data?.label || nodeId;
  };

  // Prepare edges with custom type for read-only mode
  // Also detect bidirectional edges and mark them for proper label positioning
  const displayEdges = edges.map((edge) => {
    // Check if there's a reverse edge (bidirectional relationship)
    const reverseEdge = edges.find(
      (e) => e.source === edge.target && e.target === edge.source && e.id !== edge.id
    );
    const hasReverseEdge = !!reverseEdge;
    
    // Determine which edge is "reverse" by comparing source/target alphabetically
    // This ensures consistent labeling regardless of edge ID
    const isReverse = hasReverseEdge && edge.source > edge.target;
    
    return {
      ...edge,
      type: isReadOnly ? 'custom' : edge.type,
      data: {
        ...edge.data,
        hasReverseEdge,
        isReverse,
      },
    };
  });

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

            <div style={{ height: isReadOnly ? '1000px' : '600px', border: '1px solid #e0e0e0', borderRadius: '8px' }}>
              <ReactFlow
                nodes={nodes}
                edges={displayEdges}
                onNodesChange={isReadOnly ? undefined : onNodesChange}
                onEdgesChange={isReadOnly ? undefined : onEdgesChange}
                onConnect={isReadOnly ? undefined : onConnect}
                onNodeClick={isReadOnly ? undefined : onNodeClick}
                onEdgeClick={isReadOnly ? undefined : onEdgeClick}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                connectionMode={ConnectionMode.Loose}
                fitView
                fitViewOptions={isReadOnly ? { padding: 0.3, minZoom: 0.4, maxZoom: 1.5 } : { padding: 0.1 }}
                attributionPosition="bottom-left"
                nodesDraggable={!isReadOnly}
                nodesConnectable={!isReadOnly}
                elementsSelectable={!isReadOnly}
                defaultEdgeOptions={{
                  style: { strokeWidth: 2.5 },
                  markerEnd: { type: MarkerType.ArrowClosed, width: 22, height: 22 },
                }}
              >
                <Controls />
                <MiniMap />
                <Background />
              </ReactFlow>
            </div>

            <Alert color={theme.primaryColor} variant="light">
              <Text size="sm">
                {isReadOnly
                  ? 'This is a read-only view of the workflow. You cannot make changes.'
                  : 'Click states to edit or click arrows to configure transitions.'}
              </Text>
            </Alert>
          </Stack>
        </Card>

        {/* Transition Summary - Only show in read-only mode */}
        {isReadOnly && edges.length > 0 && (
          <Card withBorder>
            <Stack gap="md">
              <Title order={4}>Transition Permissions & Actions</Title>
              <Text size="sm" c="dimmed">
                This table shows which roles can perform each transition and what actions are executed.
              </Text>
              <ScrollArea>
                <Table>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Transition</Table.Th>
                      <Table.Th>From</Table.Th>
                      <Table.Th>To</Table.Th>
                      <Table.Th>Allowed Roles</Table.Th>
                      <Table.Th>Actions</Table.Th>
                      <Table.Th>Conditions</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {edges.map((edge) => {
                      const roles = edge.data?.roles || [];
                      const actions = edge.data?.actions || [];
                      const conditions = edge.data?.conditions || [];
                      return (
                        <Table.Tr key={edge.id}>
                          <Table.Td>
                            <Text fw={500}>
                              {edge.data?.isCreateTransition ? 'Create Ticket' : String(edge.label || 'Unnamed')}
                            </Text>
                          </Table.Td>
                          <Table.Td>
                            <Badge variant="light" color="gray">
                              {getNodeLabel(edge.source)}
                            </Badge>
                          </Table.Td>
                          <Table.Td>
                            <Badge variant="light" color="gray">
                              {getNodeLabel(edge.target)}
                            </Badge>
                          </Table.Td>
                          <Table.Td>
                            {roles.length > 0 ? (
                              <Group gap={4}>
                                {roles.map((role: string) => (
                                  <Badge key={role} size="sm" variant="light" color={theme.primaryColor}>
                                    {formatRoleName(role)}
                                  </Badge>
                                ))}
                              </Group>
                            ) : (
                              <Text size="sm" c="dimmed" fs="italic">
                                No roles assigned
                              </Text>
                            )}
                          </Table.Td>
                          <Table.Td>
                            {actions.length > 0 ? (
                              <Group gap={4}>
                                {actions.map((action: string) => (
                                  <Badge key={action} size="sm" variant="light" color={theme.primaryColor}>
                                    {action.replace(/_/g, ' ')}
                                  </Badge>
                                ))}
                              </Group>
                            ) : (
                              <Text size="sm" c="dimmed" fs="italic">
                                No actions
                              </Text>
                            )}
                          </Table.Td>
                          <Table.Td>
                            {conditions.length > 0 ? (
                              <Group gap={4}>
                                {conditions.map((condition: string) => (
                                  <Badge key={condition} size="sm" variant="light" color="orange">
                                    {condition.replace(/_/g, ' ')}
                                  </Badge>
                                ))}
                              </Group>
                            ) : (
                              <Text size="sm" c="dimmed" fs="italic">
                                No conditions
                              </Text>
                            )}
                          </Table.Td>
                        </Table.Tr>
                      );
                    })}
                  </Table.Tbody>
                </Table>
              </ScrollArea>
            </Stack>
          </Card>
        )}

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
                <Alert color={theme.primaryColor} variant="light">
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
                    color={theme.colors[theme.primaryColor][9]}
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
                <Alert color={theme.primaryColor} variant="light">
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
                    color={theme.colors[theme.primaryColor][9]}
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
