import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDashboardStats() {
  try {
    console.log('🔍 Checking Dashboard Stats Data...\n');

    // 1. Check active workflow
    const activeWorkflow = await prisma.workflow.findFirst({
      where: { status: 'ACTIVE' },
      select: {
        id: true,
        name: true,
        workingStatuses: true,
        doneStatuses: true,
      },
    });

    console.log('📋 Active Workflow:');
    console.log(JSON.stringify(activeWorkflow, null, 2));
    console.log('\n');

    // 2. Check sample tickets
    const tickets = await prisma.ticket.findMany({
      take: 20,
      select: {
        id: true,
        ticketNumber: true,
        workflowId: true,
        status: true,
        title: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log('🎫 Sample Tickets (last 20):');
    console.log(JSON.stringify(tickets, null, 2));
    console.log('\n');

    // 3. Count tickets by workflow and status
    const ticketStats = await prisma.ticket.groupBy({
      by: ['workflowId', 'status'],
      _count: {
        id: true,
      },
    });

    console.log('📊 Ticket Stats by Workflow and Status:');
    console.log(JSON.stringify(ticketStats, null, 2));
    console.log('\n');

    // 4. Check all workflows
    const allWorkflows = await prisma.workflow.findMany({
      select: {
        id: true,
        name: true,
        status: true,
        workingStatuses: true,
        doneStatuses: true,
      },
    });

    console.log('🔄 All Workflows:');
    console.log(JSON.stringify(allWorkflows, null, 2));
    console.log('\n');

    // 5. Test the normalization
    if (activeWorkflow) {
      const normalizeStatus = (status: string): string => {
        return status.toUpperCase().replace(/\s+/g, '_').trim();
      };

      console.log('🧪 Testing Status Normalization:');
      tickets.forEach(ticket => {
        const normalized = normalizeStatus(ticket.status);
        console.log(`  "${ticket.status}" -> "${normalized}"`);
      });
      console.log('\n');

      // 6. Test what we're looking for
      console.log('🔎 What we\'re searching for:');
      if (activeWorkflow.workingStatuses && activeWorkflow.workingStatuses.length > 0) {
        console.log('  Working Statuses:', activeWorkflow.workingStatuses);
        activeWorkflow.workingStatuses.forEach(statusId => {
          if (statusId.startsWith('workflow-')) {
            const match = statusId.match(/^workflow-([a-f0-9-]+)-(.+)$/i);
            if (match) {
              const workflowId = match[1];
              const statusName = match[2];
              const normalized = normalizeStatus(statusName);
              console.log(`    ${statusId} -> workflowId: ${workflowId}, status: "${statusName}" -> "${normalized}"`);
            }
          } else {
            const normalized = normalizeStatus(statusId);
            console.log(`    ${statusId} -> "${normalized}"`);
          }
        });
      }
      if (activeWorkflow.doneStatuses && activeWorkflow.doneStatuses.length > 0) {
        console.log('  Done Statuses:', activeWorkflow.doneStatuses);
        activeWorkflow.doneStatuses.forEach(statusId => {
          if (statusId.startsWith('workflow-')) {
            const match = statusId.match(/^workflow-([a-f0-9-]+)-(.+)$/i);
            if (match) {
              const workflowId = match[1];
              const statusName = match[2];
              const normalized = normalizeStatus(statusName);
              console.log(`    ${statusId} -> workflowId: ${workflowId}, status: "${statusName}" -> "${normalized}"`);
            }
          } else {
            const normalized = normalizeStatus(statusId);
            console.log(`    ${statusId} -> "${normalized}"`);
          }
        });
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDashboardStats();

