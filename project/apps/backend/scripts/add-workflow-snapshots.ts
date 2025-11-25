import { PrismaClient, Prisma } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const prisma = new PrismaClient();

async function addWorkflowSnapshots() {
  console.log('\n📸 Adding workflow snapshots to existing tickets...\n');
  
  // Find the default workflow
  const defaultWorkflow = await prisma.workflow.findFirst({
    where: { isSystemDefault: true },
  });

  if (!defaultWorkflow) {
    console.log('❌ No default workflow found!');
    return;
  }

  console.log(`✅ Found default workflow: ${defaultWorkflow.name} (ID: ${defaultWorkflow.id})`);

  // Find all tickets without snapshots
  // Get all tickets with the workflow, then filter in memory
  const allTickets = await prisma.ticket.findMany({
    where: {
      workflowId: defaultWorkflow.id,
    },
  });
  
  const ticketsWithoutSnapshots = allTickets.filter(ticket => ticket.workflowSnapshot === null);

  console.log(`\n📊 Found ${ticketsWithoutSnapshots.length} tickets without snapshots`);

  if (ticketsWithoutSnapshots.length === 0) {
    console.log('✅ All tickets already have snapshots!');
    return;
  }

  // Create snapshot from current workflow
  const workflowSnapshot = {
    id: defaultWorkflow.id,
    name: defaultWorkflow.name,
    description: defaultWorkflow.description,
    status: defaultWorkflow.status,
    isActive: defaultWorkflow.isActive,
    isDefault: defaultWorkflow.isDefault,
    isSystemDefault: defaultWorkflow.isSystemDefault,
    version: defaultWorkflow.version,
    definition: defaultWorkflow.definition,
    workingStatuses: defaultWorkflow.workingStatuses,
    doneStatuses: defaultWorkflow.doneStatuses,
  };

  // Update all tickets with snapshots
  let updated = 0;
  for (const ticket of ticketsWithoutSnapshots) {
    await prisma.ticket.update({
      where: { id: ticket.id },
      data: {
        workflowSnapshot: workflowSnapshot as any,
        workflowVersion: defaultWorkflow.version,
      },
    });
    updated++;
    
    if (updated % 10 === 0) {
      console.log(`   Updated ${updated}/${ticketsWithoutSnapshots.length} tickets...`);
    }
  }

  console.log(`\n✅ Successfully added snapshots to ${updated} tickets!`);
  
  // Verify
  const allTicketsForVerification = await prisma.ticket.findMany({
    where: {
      workflowId: defaultWorkflow.id,
    },
  });
  const ticketsWithSnapshots = allTicketsForVerification.filter(t => t.workflowSnapshot !== null).length;
  
  console.log(`\n📊 Verification:`);
  console.log(`   Tickets with snapshots: ${ticketsWithSnapshots}`);
  console.log(`   Total tickets using default workflow: ${await prisma.ticket.count({ where: { workflowId: defaultWorkflow.id } })}`);
}

addWorkflowSnapshots()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

