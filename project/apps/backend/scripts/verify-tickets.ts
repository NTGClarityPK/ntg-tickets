import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verify() {
  const tickets = await prisma.ticket.findMany({
    take: 10,
    select: {
      ticketNumber: true,
      workflowId: true,
      status: true,
    },
  });
  
  console.log('Sample tickets:');
  console.log(JSON.stringify(tickets, null, 2));
  
  const nullWorkflowId = await prisma.ticket.count({
    where: { workflowId: null },
  });
  
  console.log(`\nTickets with null workflowId: ${nullWorkflowId}`);
  
  const total = await prisma.ticket.count();
  console.log(`Total tickets: ${total}`);
  
  await prisma.$disconnect();
}

verify();

