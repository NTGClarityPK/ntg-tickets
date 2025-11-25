import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const prisma = new PrismaClient();

async function checkTicket() {
  const ticketNumber = 'TKT-2024-000024';
  
  console.log(`\n🔍 Checking ticket: ${ticketNumber}\n`);
  
  const ticket = await prisma.ticket.findUnique({
    where: { ticketNumber },
    include: {
      workflow: {
        select: {
          id: true,
          name: true,
          status: true,
          isDefault: true,
          isSystemDefault: true,
          definition: true,
        },
      },
    },
  });

  if (!ticket) {
    console.log('❌ Ticket not found!');
    return;
  }

  console.log('📋 Ticket Details:');
  console.log(`   ID: ${ticket.id}`);
  console.log(`   Status: ${ticket.status}`);
  console.log(`   Workflow ID: ${ticket.workflowId || 'NULL (No workflow assigned!)'}`);
  console.log(`   Has Workflow Snapshot: ${ticket.workflowSnapshot ? '✅ YES' : '❌ NO'}`);
  console.log(`   Workflow Version: ${ticket.workflowVersion || 'N/A'}`);
  console.log(`   Title: ${ticket.title}`);
  console.log(`   Priority: ${ticket.priority}`);
  console.log(`   Created: ${ticket.createdAt}`);
  console.log(`   Updated: ${ticket.updatedAt}`);
  
  if (ticket.workflowSnapshot) {
    const snapshot = ticket.workflowSnapshot as any;
    console.log('\n📸 Workflow Snapshot (used for this ticket):');
    console.log(`   Name: ${snapshot.name || 'N/A'}`);
    console.log(`   Status: ${snapshot.status || 'N/A'}`);
    console.log(`   IsActive: ${snapshot.isActive !== false ? 'true' : 'false'}`);
    console.log(`   Version: ${snapshot.version || ticket.workflowVersion || 'N/A'}`);
    console.log(`   Note: This ticket will use the snapshot workflow even if the current workflow is inactive.`);
  }

  if (ticket.workflow) {
    console.log('\n📊 Workflow Details:');
    console.log(`   Workflow ID: ${ticket.workflow.id}`);
    console.log(`   Name: ${ticket.workflow.name}`);
    console.log(`   Status: ${ticket.workflow.status}`);
    console.log(`   Is Default: ${ticket.workflow.isDefault}`);
    console.log(`   Is System Default: ${ticket.workflow.isSystemDefault}`);
    
    if (ticket.workflow.definition) {
      const def = ticket.workflow.definition as any;
      console.log(`   Definition Type: ${def.edges ? 'Visual Workflow' : 'Legacy'}`);
      
      if (def.nodes) {
        console.log(`   Nodes: ${def.nodes.length}`);
        console.log('   Node IDs:', def.nodes.map((n: any) => n.id).join(', '));
        console.log('   Node Labels:', def.nodes.map((n: any) => n.data?.label || n.id).join(', '));
      }
      
      if (def.edges) {
        console.log(`   Edges: ${def.edges.length}`);
        console.log('   Transitions from current status:');
        const currentStatusNormalized = ticket.status.toLowerCase().replace(/[\s-]+/g, '_');
        def.edges.forEach((edge: any) => {
          const sourceNode = def.nodes?.find((n: any) => n.id === edge.source);
          const sourceLabel = sourceNode?.data?.label || edge.source;
          const sourceNormalized = sourceLabel.toLowerCase().replace(/[\s-]+/g, '_');
          
          if (sourceNormalized === currentStatusNormalized || edge.source.toLowerCase() === currentStatusNormalized) {
            const targetNode = def.nodes?.find((n: any) => n.id === edge.target);
            const targetLabel = targetNode?.data?.label || edge.target;
            console.log(`     - ${sourceLabel} -> ${targetLabel} (${edge.label || 'No label'})`);
            if (edge.data?.roles) {
              console.log(`       Allowed Roles: ${edge.data.roles.join(', ')}`);
            }
          }
        });
      }
    }
  } else {
    console.log('\n⚠️  No workflow assigned to this ticket!');
    
    // Check for default workflow
    const defaultWorkflow = await prisma.workflow.findFirst({
      where: { isSystemDefault: true },
    });
    
    if (defaultWorkflow) {
      console.log(`\n✅ Default workflow found: ${defaultWorkflow.name} (ID: ${defaultWorkflow.id})`);
      console.log('   This ticket should be assigned to this workflow.');
    } else {
      console.log('\n❌ No default workflow found in database!');
    }
  }

  // Check all tickets without workflows
  const ticketsWithoutWorkflow = await prisma.ticket.count({
    where: { workflowId: null },
  });
  
  console.log(`\n📊 Statistics:`);
  console.log(`   Tickets without workflow: ${ticketsWithoutWorkflow}`);
  
  const totalTickets = await prisma.ticket.count();
  console.log(`   Total tickets: ${totalTickets}`);
}

checkTicket()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

