const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  try {
    const res = await prisma.category.updateMany({
      where: { name: 'HARDWARE' },
      data: { isActive: true },
    });
    const category = await prisma.category.findFirst({ where: { name: 'HARDWARE' } });
    console.log(JSON.stringify({ updatedCount: res.count, category }, null, 2));
  } catch (e) {
    console.error(e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();


