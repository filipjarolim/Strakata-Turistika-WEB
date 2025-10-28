import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Updating PlaceTypeConfig values to match mobile app...\n');
  
  // Update values to match mobile app defaults
  await prisma.placeTypeConfig.update({
    where: { name: 'PEAK' },
    data: { points: 1, label: 'Vrchol' }
  });
  console.log('✅ PEAK updated: 1 bod');

  await prisma.placeTypeConfig.update({
    where: { name: 'TOWER' },
    data: { points: 1, label: 'Rozhledna' }
  });
  console.log('✅ TOWER updated: 1 bod');

  await prisma.placeTypeConfig.update({
    where: { name: 'TREE' },
    data: { points: 1, label: 'Památný strom' }
  });
  console.log('✅ TREE updated: 1 bod, label: "Památný strom"');

  await prisma.placeTypeConfig.update({
    where: { name: 'OTHER' },
    data: { points: 0, label: 'Jiné' }
  });
  console.log('✅ OTHER updated: 0 bodů');

  console.log('\n📊 Final values:');
  const configs = await prisma.placeTypeConfig.findMany({
    orderBy: { order: 'asc' }
  });
  
  configs.forEach(config => {
    console.log(`${config.name.padEnd(10)} | ${config.label.padEnd(20)} | ${config.points} ${config.points === 1 ? 'bod' : config.points < 5 ? 'body' : 'bodů'}`);
  });
}

main()
  .catch((e) => console.error('Error:', e))
  .finally(async () => await prisma.$disconnect());
