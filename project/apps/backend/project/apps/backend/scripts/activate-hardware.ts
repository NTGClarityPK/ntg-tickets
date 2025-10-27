import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  try {
    const result = await prisma.category.updateMany({
      where: { name: 'HARDWARE' },
      data: { isActive: true },
    });
    const category = await prisma.category.findFirst({ where: { name: 'HARDWARE' } });
    // Log concise confirmation
    console.log(JSON.stringify({ updatedCount: result.count, category }, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


