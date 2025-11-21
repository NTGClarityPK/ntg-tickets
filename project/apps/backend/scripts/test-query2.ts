import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testQuery() {
  try {
    const activeWorkflowId = '7074ca34-3001-40a5-a3d4-4836cc733395';
    const normalizedStatus = 'OPEN';
    
    // First, let's see what the actual table and column names are
    const tableInfo = await prisma.$queryRawUnsafe<Array<{ column_name: string; data_type: string }>>(
      `SELECT column_name, data_type 
       FROM information_schema.columns 
       WHERE table_name = 'tickets' 
       AND column_name IN ('workflowId', 'status', 'workflow_id', 'status')
       ORDER BY column_name`
    );
    console.log('🔍 Table columns:', JSON.stringify(tableInfo, null, 2));
    
    // Test with different column name variations
    const queries = [
      `SELECT COUNT(*)::int as count FROM tickets WHERE "workflowId" = '${activeWorkflowId}' AND UPPER(REPLACE("status", ' ', '_')) = '${normalizedStatus}'`,
      `SELECT COUNT(*)::int as count FROM tickets WHERE workflowId = '${activeWorkflowId}' AND UPPER(REPLACE(status, ' ', '_')) = '${normalizedStatus}'`,
      `SELECT COUNT(*)::int as count FROM tickets WHERE "workflow_id" = '${activeWorkflowId}' AND UPPER(REPLACE("status", ' ', '_')) = '${normalizedStatus}'`,
    ];
    
    for (const query of queries) {
      try {
        console.log('\n🔍 Testing query:', query);
        const result = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(query);
        console.log('✅ Success! Count:', Number(result[0]?.count || 0));
        break;
      } catch (error: any) {
        console.log('❌ Failed:', error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testQuery();

