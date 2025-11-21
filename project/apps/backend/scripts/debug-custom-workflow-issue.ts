import { PrismaClient, WorkflowStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function debugIssue() {
  try {
    console.log('🔍 Debugging Custom Workflow Categorization Issue...\n');

    // 1. Get active workflow
    const activeWorkflow = await prisma.workflow.findFirst({
      where: { status: WorkflowStatus.ACTIVE },
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

    if (!activeWorkflow) {
      console.log('❌ No active workflow found!');
      return;
    }

    // 2. Get all workflows to see which is which
    const allWorkflows = await prisma.workflow.findMany({
      select: {
        id: true,
        name: true,
        status: true,
        isSystemDefault: true,
      },
    });

    console.log('🔄 All Workflows:');
    console.log(JSON.stringify(allWorkflows, null, 2));
    console.log('\n');

    // 3. Get sample tickets and their workflow IDs
    const sampleTickets = await prisma.ticket.findMany({
      take: 10,
      select: {
        id: true,
        ticketNumber: true,
        workflowId: true,
        status: true,
        title: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    console.log('🎫 Sample Tickets:');
    console.log(JSON.stringify(sampleTickets, null, 2));
    console.log('\n');

    // 4. Group tickets by workflow and status
    const ticketStats = await prisma.ticket.groupBy({
      by: ['workflowId', 'status'],
      _count: {
        id: true,
      },
    });

    console.log('📊 Ticket Stats by Workflow and Status:');
    console.log(JSON.stringify(ticketStats, null, 2));
    console.log('\n');

    // 5. Test the extraction logic
    const extractWorkflowAndStatus = (statusId: string): { workflowId: string | null; statusName: string } => {
      if (statusId.startsWith('workflow-')) {
        const match = statusId.match(/^workflow-([a-f0-9-]+)-(.+)$/i);
        if (match && match[1] && match[2]) {
          return { workflowId: match[1], statusName: match[2] };
        }
        const lastHyphenIndex = statusId.lastIndexOf('-');
        if (lastHyphenIndex > 0 && lastHyphenIndex < statusId.length - 1) {
          const workflowIdPart = statusId.substring(8, lastHyphenIndex);
          return { workflowId: workflowIdPart, statusName: statusId.substring(lastHyphenIndex + 1) };
        }
      }
      return { workflowId: null, statusName: statusId };
    };

    const normalizeStatus = (status: string): string => {
      return status.toUpperCase().replace(/\s+/g, '_').trim();
    };

    console.log('🧪 Testing Status Extraction:');
    if (activeWorkflow.workingStatuses && activeWorkflow.workingStatuses.length > 0) {
      console.log('\n  Working Statuses:');
      activeWorkflow.workingStatuses.forEach(statusId => {
        const { workflowId, statusName } = extractWorkflowAndStatus(statusId);
        const normalized = normalizeStatus(statusName);
        console.log(`    ${statusId}`);
        console.log(`      -> workflowId: ${workflowId || 'null'}`);
        console.log(`      -> statusName: "${statusName}" -> normalized: "${normalized}"`);
      });
    }

    if (activeWorkflow.doneStatuses && activeWorkflow.doneStatuses.length > 0) {
      console.log('\n  Done Statuses:');
      activeWorkflow.doneStatuses.forEach(statusId => {
        const { workflowId, statusName } = extractWorkflowAndStatus(statusId);
        const normalized = normalizeStatus(statusName);
        console.log(`    ${statusId}`);
        console.log(`      -> workflowId: ${workflowId || 'null'}`);
        console.log(`      -> statusName: "${statusName}" -> normalized: "${normalized}"`);
      });
    }

    // 6. Build the query conditions like the service does
    const workingStatusesByWorkflow = new Map<string, Set<string>>();
    if (activeWorkflow.workingStatuses && activeWorkflow.workingStatuses.length > 0) {
      activeWorkflow.workingStatuses.forEach(statusId => {
        const { workflowId, statusName } = extractWorkflowAndStatus(statusId);
        const normalized = normalizeStatus(statusName);
        const mappedWorkflowId = workflowId === null ? activeWorkflow.id : workflowId;
        
        if (!workingStatusesByWorkflow.has(mappedWorkflowId)) {
          workingStatusesByWorkflow.set(mappedWorkflowId, new Set());
        }
        workingStatusesByWorkflow.get(mappedWorkflowId)!.add(normalized);
      });
    }

    console.log('\n🔍 Working Statuses by Workflow:');
    workingStatusesByWorkflow.forEach((statusSet, workflowId) => {
      console.log(`  Workflow ${workflowId}: ${Array.from(statusSet).join(', ')}`);
    });

    // 7. Test the actual SQL query
    const workingConditions: string[] = [];
    workingStatusesByWorkflow.forEach((statusSet, workflowId) => {
      statusSet.forEach(normalizedStatus => {
        const workflowIdParam = workflowId.replace(/'/g, "''");
        const statusParam = normalizedStatus.replace(/'/g, "''");
        workingConditions.push(
          `("workflowId" = '${workflowIdParam}' AND UPPER(REPLACE("status", ' ', '_')) = '${statusParam}')`
        );
        if (workflowId !== activeWorkflow.id) {
          const activeWorkflowIdParam = activeWorkflow.id.replace(/'/g, "''");
          workingConditions.push(
            `("workflowId" = '${activeWorkflowIdParam}' AND UPPER(REPLACE("status", ' ', '_')) = '${statusParam}')`
          );
        }
      });
    });

    if (workingConditions.length > 0) {
      const workingQuery = `SELECT COUNT(*)::int as count FROM tickets WHERE (${workingConditions.join(' OR ')})`;
      console.log('\n🔍 Working Query:');
      console.log(workingQuery);
      try {
        const workingResult = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(workingQuery);
        console.log(`  ✅ Working Count: ${Number(workingResult[0]?.count || 0)}`);
      } catch (error: any) {
        console.log(`  ❌ Error: ${error.message}`);
      }
    }

    // 8. Check what workflow IDs tickets actually have
    const ticketsByWorkflow = await prisma.ticket.groupBy({
      by: ['workflowId'],
      _count: {
        id: true,
      },
    });

    console.log('\n📊 Tickets by Workflow ID:');
    console.log(JSON.stringify(ticketsByWorkflow, null, 2));

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugIssue();

