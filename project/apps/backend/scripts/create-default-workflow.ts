/// <reference types="node" />
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createDefaultWorkflow() {
  try {
    console.log('🔍 Checking for existing workflows...');
    
    // Check if any workflows exist
    const workflowCount = await prisma.workflow.count();
    
    if (workflowCount > 0) {
      console.log(`✅ Found ${workflowCount} workflow(s) in database`);
      
      // Check if system default exists
      const systemDefault = await prisma.workflow.findFirst({
        where: { isSystemDefault: true },
      });
      
      if (systemDefault) {
        console.log(`✅ System default workflow already exists: "${systemDefault.name}"`);
        return;
      } else {
        console.log('⚠️  No system default found, marking oldest workflow as system default...');
        const oldestWorkflow = await prisma.workflow.findFirst({
          orderBy: { createdAt: 'asc' },
        });
        
        if (oldestWorkflow) {
          await prisma.workflow.update({
            where: { id: oldestWorkflow.id },
            data: { 
              isSystemDefault: true,
              isDefault: true,
              status: 'ACTIVE',
            },
          });
          console.log(`✅ Marked "${oldestWorkflow.name}" as system default`);
        }
        return;
      }
    }
    
    console.log('📝 No workflows found, creating system default workflow...');
    
    // Get the first admin user to set as creator
    const adminUser = await prisma.user.findFirst({
      where: {
        roles: {
          has: 'ADMIN',
        },
      },
    });
    
    if (!adminUser) {
      console.error('❌ No admin user found. Please create an admin user first.');
      return;
    }
    
    // Create default workflow definition
    const defaultDefinition = {
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
            roles: ['END_USER'],
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
    
    const workflow = await prisma.workflow.create({
      data: {
        name: 'Default Workflow',
        description: 'System default workflow for ticket management. This workflow cannot be edited or deleted.',
        status: 'ACTIVE',
        isDefault: true,
        isSystemDefault: true,
        isActive: true,
        version: 1,
        definition: defaultDefinition as any,
        createdBy: adminUser.id,
      },
    });
    
    console.log('✅ Successfully created system default workflow!');
    console.log(`   ID: ${workflow.id}`);
    console.log(`   Name: ${workflow.name}`);
    console.log(`   Status: ${workflow.status}`);
    console.log(`   Is System Default: ${workflow.isSystemDefault}`);
    
  } catch (error) {
    console.error('❌ Error creating default workflow:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createDefaultWorkflow()
  .then(() => {
    console.log('✅ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Failed:', error);
    process.exit(1);
  });


