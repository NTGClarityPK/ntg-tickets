import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const prisma = new PrismaClient();

async function testSnapshotWorkflow() {
  console.log('\n🧪 Testing workflow snapshot functionality...\n');
  
  const ticketNumber = 'TKT-2024-000024';
  
  // Get ticket
  const ticket = await prisma.ticket.findUnique({
    where: { ticketNumber },
    include: {
      workflow: true,
    },
  });

  if (!ticket) {
    console.log('❌ Ticket not found!');
    return;
  }

  console.log('📋 Before test:');
  console.log(`   Ticket: ${ticket.ticketNumber}`);
  console.log(`   Has Snapshot: ${ticket.workflowSnapshot ? '✅ YES' : '❌ NO'}`);
  console.log(`   Current Workflow Status: ${ticket.workflow?.status || 'N/A'}`);
  
  if (ticket.workflowSnapshot) {
    const snapshot = ticket.workflowSnapshot as any;
    console.log(`   Snapshot Status: ${snapshot.status || 'N/A'}`);
  }

  // Temporarily set workflow to INACTIVE
  if (ticket.workflowId) {
    console.log('\n🔧 Setting workflow to INACTIVE...');
    await prisma.workflow.update({
      where: { id: ticket.workflowId },
      data: {
        status: 'INACTIVE',
        isActive: false,
      },
    });
    console.log('✅ Workflow set to INACTIVE');
  }

  // Check again
  const updatedTicket = await prisma.ticket.findUnique({
    where: { ticketNumber },
    include: {
      workflow: true,
    },
  });

  console.log('\n📋 After setting workflow to INACTIVE:');
  console.log(`   Current Workflow Status: ${updatedTicket?.workflow?.status || 'N/A'}`);
  console.log(`   Current Workflow IsActive: ${updatedTicket?.workflow?.isActive || 'N/A'}`);
  
  if (updatedTicket?.workflowSnapshot) {
    const snapshot = updatedTicket.workflowSnapshot as any;
    console.log(`   Snapshot Status: ${snapshot.status || 'N/A'}`);
    console.log(`   Snapshot IsActive: ${snapshot.isActive !== false ? 'true' : 'false'}`);
    console.log('\n✅ The workflow execution service should use the SNAPSHOT (ACTIVE)');
    console.log('   instead of the current workflow (INACTIVE) for this ticket.');
  }

  // Restore workflow to ACTIVE
  if (ticket.workflowId) {
    console.log('\n🔧 Restoring workflow to ACTIVE...');
    await prisma.workflow.update({
      where: { id: ticket.workflowId },
      data: {
        status: 'ACTIVE',
        isActive: true,
      },
    });
    console.log('✅ Workflow restored to ACTIVE');
  }
}

testSnapshotWorkflow()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

