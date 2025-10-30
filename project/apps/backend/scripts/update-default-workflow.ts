import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateDefaultWorkflow() {
  try {
    console.log('🔍 Looking for system default workflow...');
    
    // Find the system default workflow
    const defaultWorkflow = await prisma.workflow.findFirst({
      where: { 
        OR: [
          { isSystemDefault: true },
          { isDefault: true }
        ]
      },
    });
    
    if (!defaultWorkflow) {
      console.error('❌ No default workflow found. Please run create-default-workflow.ts first.');
      return;
    }
    
    console.log(`✅ Found default workflow: "${defaultWorkflow.name}" (ID: ${defaultWorkflow.id})`);
    console.log('📝 Updating workflow with on_hold state and improved positioning...');
    
    // Create updated workflow definition with on_hold state and better positioning
    const updatedDefinition = {
      nodes: [
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
      ],
      edges: [
        {
          id: 'e0-create',
          source: 'create',
          target: 'new',
          label: 'Create Ticket',
          type: 'smoothstep',
          markerEnd: { type: 'arrowclosed' },
          data: {
            roles: ['END_USER', 'ADMIN'],
            conditions: [],
            actions: [],
            isCreateTransition: true,
          },
        },
        {
          id: 'e1',
          source: 'new',
          target: 'open',
          label: 'Open',
          type: 'smoothstep',
          markerEnd: { type: 'arrowclosed' },
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
          markerEnd: { type: 'arrowclosed' },
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
          markerEnd: { type: 'arrowclosed' },
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
          markerEnd: { type: 'arrowclosed' },
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
          markerEnd: { type: 'arrowclosed' },
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
          markerEnd: { type: 'arrowclosed' },
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
          markerEnd: { type: 'arrowclosed' },
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
          markerEnd: { type: 'arrowclosed' },
          data: {
            roles: ['SUPPORT_STAFF', 'ADMIN'],
            conditions: [],
            actions: [],
          },
        },
      ],
    };
    
    // Update the workflow
    await prisma.workflow.update({
      where: { id: defaultWorkflow.id },
      data: {
        definition: updatedDefinition as any,
        version: defaultWorkflow.version + 1,
      },
    });
    
    console.log('✅ Successfully updated default workflow!');
    console.log('   Changes applied:');
    console.log('   ✓ Reorganized layout: horizontal top row (Create→New→Open→Resolved→Closed)');
    console.log('   ✓ Added REOPENED state (x:1100, y:280) as separate state');
    console.log('   ✓ In Progress positioned below and right of Open (x:630, y:280)');
    console.log('   ✓ On Hold positioned below In Progress (x:510, y:430)');
    console.log('   ✓ Added "Put On Hold" transition (In Progress → On Hold)');
    console.log('   ✓ Added "Resume Work" transition (On Hold → In Progress)');
    console.log('   ✓ Clean layout with no overlapping transition lines');
    console.log('   ✓ Updated workflow flow:');
    console.log('       - END_USER creates ticket → NEW');
    console.log('       - SUPPORT_MANAGER: NEW → OPEN');
    console.log('       - SUPPORT_STAFF: OPEN → IN_PROGRESS');
    console.log('       - SUPPORT_STAFF: IN_PROGRESS → RESOLVED or ON_HOLD');
    console.log('       - SUPPORT_STAFF: ON_HOLD → IN_PROGRESS');
    console.log('       - SUPPORT_STAFF: RESOLVED → CLOSED');
    console.log('       - END_USER: CLOSED → REOPENED');
    console.log('       - SUPPORT_STAFF: REOPENED → IN_PROGRESS');
    console.log(`   ✓ Workflow version incremented to: ${defaultWorkflow.version + 1}`);
    
  } catch (error) {
    console.error('❌ Error updating default workflow:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

updateDefaultWorkflow()
  .then(() => {
    console.log('✅ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Failed:', error);
    process.exit(1);
  });

