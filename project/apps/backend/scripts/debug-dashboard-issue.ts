import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugDashboardIssue() {
  try {
    console.log('🔍 Debugging Dashboard Stats Issue...\n');

    // 1. Check active workflow and its categorization
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

    if (!activeWorkflow) {
      console.log('❌ No active workflow found!');
      return;
    }

    // 2. Check all tickets and their statuses
    const allTickets = await prisma.ticket.findMany({
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

    console.log('🎫 All Tickets:');
    console.log(`Total: ${allTickets.length}`);
    console.log(JSON.stringify(allTickets, null, 2));
    console.log('\n');

    // 3. Group tickets by workflow and status
    const ticketStats = await prisma.ticket.groupBy({
      by: ['workflowId', 'status'],
      _count: {
        id: true,
      },
    });

    console.log('📊 Ticket Stats by Workflow and Status:');
    console.log(JSON.stringify(ticketStats, null, 2));
    console.log('\n');

    // 4. Test the extraction and normalization logic
    const normalizeStatus = (status: string): string => {
      return status.toUpperCase().replace(/\s+/g, '_').trim();
    };

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

    console.log('🧪 Testing Status Extraction and Normalization:');
    if (activeWorkflow.workingStatuses && activeWorkflow.workingStatuses.length > 0) {
      console.log('\n  Working Statuses:');
      activeWorkflow.workingStatuses.forEach(statusId => {
        const { workflowId, statusName } = extractWorkflowAndStatus(statusId);
        const normalized = normalizeStatus(statusName);
        const mappedWorkflowId = workflowId === null ? activeWorkflow.id : workflowId;
        console.log(`    ${statusId}`);
        console.log(`      -> workflowId: ${workflowId || 'null'} -> mapped: ${mappedWorkflowId}`);
        console.log(`      -> statusName: "${statusName}" -> normalized: "${normalized}"`);
      });
    }

    if (activeWorkflow.doneStatuses && activeWorkflow.doneStatuses.length > 0) {
      console.log('\n  Done Statuses:');
      activeWorkflow.doneStatuses.forEach(statusId => {
        const { workflowId, statusName } = extractWorkflowAndStatus(statusId);
        const normalized = normalizeStatus(statusName);
        const mappedWorkflowId = workflowId === null ? activeWorkflow.id : workflowId;
        console.log(`    ${statusId}`);
        console.log(`      -> workflowId: ${workflowId || 'null'} -> mapped: ${mappedWorkflowId}`);
        console.log(`      -> statusName: "${statusName}" -> normalized: "${normalized}"`);
      });
    }

    // 5. Test the actual SQL query
    console.log('\n🔍 Testing SQL Queries:');
    
    // Build working conditions
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
      console.log('\n  Working Query:');
      console.log(workingQuery);
      try {
        const workingResult = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(workingQuery);
        console.log(`  ✅ Working Count: ${Number(workingResult[0]?.count || 0)}`);
      } catch (error: any) {
        console.log(`  ❌ Error: ${error.message}`);
      }
    }

    // Build done conditions
    const doneStatusesByWorkflow = new Map<string, Set<string>>();
    if (activeWorkflow.doneStatuses && activeWorkflow.doneStatuses.length > 0) {
      activeWorkflow.doneStatuses.forEach(statusId => {
        const { workflowId, statusName } = extractWorkflowAndStatus(statusId);
        const normalized = normalizeStatus(statusName);
        const mappedWorkflowId = workflowId === null ? activeWorkflow.id : workflowId;
        
        if (!doneStatusesByWorkflow.has(mappedWorkflowId)) {
          doneStatusesByWorkflow.set(mappedWorkflowId, new Set());
        }
        doneStatusesByWorkflow.get(mappedWorkflowId)!.add(normalized);
      });
    }

    const doneConditions: string[] = [];
    doneStatusesByWorkflow.forEach((statusSet, workflowId) => {
      statusSet.forEach(normalizedStatus => {
        const workflowIdParam = workflowId.replace(/'/g, "''");
        const statusParam = normalizedStatus.replace(/'/g, "''");
        doneConditions.push(
          `("workflowId" = '${workflowIdParam}' AND UPPER(REPLACE("status", ' ', '_')) = '${statusParam}')`
        );
        if (workflowId !== activeWorkflow.id) {
          const activeWorkflowIdParam = activeWorkflow.id.replace(/'/g, "''");
          doneConditions.push(
            `("workflowId" = '${activeWorkflowIdParam}' AND UPPER(REPLACE("status", ' ', '_')) = '${statusParam}')`
          );
        }
      });
    });

    if (doneConditions.length > 0) {
      const doneQuery = `SELECT COUNT(*)::int as count FROM tickets WHERE (${doneConditions.join(' OR ')})`;
      console.log('\n  Done Query:');
      console.log(doneQuery);
      try {
        const doneResult = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(doneQuery);
        console.log(`  ✅ Done Count: ${Number(doneResult[0]?.count || 0)}`);
      } catch (error: any) {
        console.log(`  ❌ Error: ${error.message}`);
      }
    }

    // 6. Check what statuses tickets actually have vs what we're looking for
    console.log('\n🔍 Status Comparison:');
    const ticketStatuses = new Set(allTickets.map(t => t.status));
    console.log('  Ticket statuses in DB:', Array.from(ticketStatuses));
    
    const lookingForWorking = new Set<string>();
    workingStatusesByWorkflow.forEach((statusSet) => {
      statusSet.forEach(s => lookingForWorking.add(s));
    });
    console.log('  Looking for (working):', Array.from(lookingForWorking));
    
    const lookingForDone = new Set<string>();
    doneStatusesByWorkflow.forEach((statusSet) => {
      statusSet.forEach(s => lookingForDone.add(s));
    });
    console.log('  Looking for (done):', Array.from(lookingForDone));

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugDashboardIssue();

