import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const prisma = new PrismaClient();

async function fixWorkflowStatus() {
  console.log('\n🔧 Fixing default workflow status...\n');
  
  // Find the default workflow
  const defaultWorkflow = await prisma.workflow.findFirst({
    where: { isSystemDefault: true },
  });

  if (!defaultWorkflow) {
    console.log('❌ No default workflow found!');
    return;
  }

  console.log(`📋 Current Workflow Status:`);
  console.log(`   ID: ${defaultWorkflow.id}`);
  console.log(`   Name: ${defaultWorkflow.name}`);
  console.log(`   Status: ${defaultWorkflow.status}`);
  console.log(`   IsActive: ${defaultWorkflow.isActive}`);
  console.log(`   IsDefault: ${defaultWorkflow.isDefault}`);
  console.log(`   IsSystemDefault: ${defaultWorkflow.isSystemDefault}`);

  if (defaultWorkflow.status === 'ACTIVE' && defaultWorkflow.isActive) {
    console.log('\n✅ Workflow is already active. No changes needed.');
    return;
  }

  // Update to ACTIVE
  const updated = await prisma.workflow.update({
    where: { id: defaultWorkflow.id },
    data: {
      status: 'ACTIVE',
      isActive: true,
    },
  });

  console.log('\n✅ Workflow updated successfully!');
  console.log(`   New Status: ${updated.status}`);
  console.log(`   New IsActive: ${updated.isActive}`);
  
  // Count tickets using this workflow
  const ticketCount = await prisma.ticket.count({
    where: { workflowId: defaultWorkflow.id },
  });
  
  console.log(`\n📊 Tickets using this workflow: ${ticketCount}`);
}

fixWorkflowStatus()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

