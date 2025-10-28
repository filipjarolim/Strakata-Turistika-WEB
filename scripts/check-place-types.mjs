import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('📊 Current PlaceTypeConfig values:\n');
  
  const configs = await prisma.placeTypeConfig.findMany({
    orderBy: { order: 'asc' }
  });
  
  configs.forEach(config => {
    console.log(`${config.name.padEnd(10)} | ${config.label.padEnd(15)} | ${config.points} bodů | order: ${config.order} | active: ${config.isActive}`);
  });
  
  console.log('\n');
}

main()
  .catch((e) => console.error('Error:', e))
  .finally(async () => await prisma.$disconnect());
