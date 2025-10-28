import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🗑️  Deleting all DRAFT visit data...\n');
  
  const result = await prisma.visitData.deleteMany({
    where: { state: 'DRAFT' }
  });
  
  console.log(`✅ Deleted ${result.count} DRAFT visits`);
}

main()
  .catch((e) => console.error('Error:', e))
  .finally(async () => await prisma.$disconnect());
