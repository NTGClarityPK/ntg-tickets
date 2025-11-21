import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testFixedQuery() {
  try {
    const activeWorkflowId = '070b89b8-d220-4e52-b77d-fdf6c6996f91';
    const defaultWorkflowId = '6c3c4da7-03c4-46e0-b53e-7b1cc4336522';
    
    // Test the fixed query with null workflowId handling
    const workingStatuses = ['NEW', 'OPEN', 'IN_PROGRESS', 'REOPENED'];
    const doneStatuses = ['RESOLVED', 'CLOSED'];
    
    // Build conditions like the fixed code does
    const workingConditions: string[] = [];
    workingStatuses.forEach(status => {
      const statusParam = status.replace(/'/g, "''");
      // Match default workflow
      workingConditions.push(
        `("workflowId" = '${defaultWorkflowId}' AND UPPER(REPLACE("status", ' ', '_')) = '${statusParam}')`
      );
      // Match active workflow
      workingConditions.push(
        `("workflowId" = '${activeWorkflowId}' AND UPPER(REPLACE("status", ' ', '_')) = '${statusParam}')`
      );
    });
    
    // Add null workflowId matching
    const nullStatusConditions = workingStatuses.map(status => {
      const statusParam = status.replace(/'/g, "''");
      return `UPPER(REPLACE("status", ' ', '_')) = '${statusParam}'`;
    });
    workingConditions.push(
      `("workflowId" IS NULL AND (${nullStatusConditions.join(' OR ')}))`
    );
    
    const workingQuery = `SELECT COUNT(*)::int as count FROM tickets WHERE (${workingConditions.join(' OR ')})`;
    console.log('🔍 Working Query (with null handling):');
    console.log(workingQuery.substring(0, 200) + '...');
    console.log('\n');
    
    const workingResult = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(workingQuery);
    console.log(`✅ Working Count: ${Number(workingResult[0]?.count || 0)}`);
    
    // Test done query
    const doneConditions: string[] = [];
    doneStatuses.forEach(status => {
      const statusParam = status.replace(/'/g, "''");
      doneConditions.push(
        `("workflowId" = '${defaultWorkflowId}' AND UPPER(REPLACE("status", ' ', '_')) = '${statusParam}')`
      );
      doneConditions.push(
        `("workflowId" = '${activeWorkflowId}' AND UPPER(REPLACE("status", ' ', '_')) = '${statusParam}')`
      );
    });
    
    const nullDoneConditions = doneStatuses.map(status => {
      const statusParam = status.replace(/'/g, "''");
      return `UPPER(REPLACE("status", ' ', '_')) = '${statusParam}'`;
    });
    doneConditions.push(
      `("workflowId" IS NULL AND (${nullDoneConditions.join(' OR ')}))`
    );
    
    const doneQuery = `SELECT COUNT(*)::int as count FROM tickets WHERE (${doneConditions.join(' OR ')})`;
    console.log('\n🔍 Done Query (with null handling):');
    console.log(doneQuery.substring(0, 200) + '...');
    console.log('\n');
    
    const doneResult = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(doneQuery);
    console.log(`✅ Done Count: ${Number(doneResult[0]?.count || 0)}`);
    
    // Expected counts based on ticket stats
    console.log('\n📊 Expected counts based on ticket stats:');
    console.log('  Working: NEW(4) + OPEN(10) + IN_PROGRESS(11) + REOPENED(1) = 26');
    console.log('  Done: RESOLVED(3) + CLOSED(2) = 5');
    console.log('  Hold: ON_HOLD(4) = 4');
    console.log('  Total: 35');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testFixedQuery();

