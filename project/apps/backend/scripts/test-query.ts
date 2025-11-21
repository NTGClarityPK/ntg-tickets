import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testQuery() {
  try {
    const activeWorkflowId = '7074ca34-3001-40a5-a3d4-4836cc733395';
    const normalizedStatus = 'OPEN';
    
    // Test using Prisma's model name (it will handle table name mapping)
    const ticket = await prisma.ticket.findFirst({
      where: {
        workflowId: activeWorkflowId,
        status: 'OPEN',
      },
    });
    console.log('🔍 Ticket found with Prisma:', ticket);
    
    // Test the exact query we're generating - use lowercase table name
    const query = `SELECT COUNT(*)::int as count FROM "ticket" WHERE ("workflowId" = '${activeWorkflowId}' AND UPPER(REPLACE("status", ' ', '_')) = '${normalizedStatus}')`;
    
    console.log('\n🔍 Testing Query:');
    console.log(query);
    console.log('\n');
    
    const result = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(query);
    console.log('📊 Result:', result);
    console.log('Count:', Number(result[0]?.count || 0));
    
    // Also test with direct status match
    const directQuery = `SELECT COUNT(*)::int as count FROM "ticket" WHERE "workflowId" = '${activeWorkflowId}' AND "status" = 'OPEN'`;
    console.log('\n🔍 Direct Query:');
    console.log(directQuery);
    const directResult = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(directQuery);
    console.log('📊 Direct Result:', directResult);
    console.log('Direct Count:', Number(directResult[0]?.count || 0));
    
    // Check what the normalization actually produces
    const normalizationTest = await prisma.$queryRawUnsafe<Array<{ status: string; normalized: string }>>(
      `SELECT "status", UPPER(REPLACE("status", ' ', '_')) as normalized FROM "ticket" WHERE "workflowId" = '${activeWorkflowId}' LIMIT 5`
    );
    console.log('\n🔍 Status Normalization Test:');
    console.log(JSON.stringify(normalizationTest, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testQuery();

