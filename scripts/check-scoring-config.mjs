import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('📊 Current ScoringConfig:\n');
  
  const config = await prisma.scoringConfig.findFirst({
    where: { active: true }
  });
  
  if (config) {
    console.log('pointsPerKm:', config.pointsPerKm);
    console.log('minDistanceKm:', config.minDistanceKm);
    console.log('requireAtLeastOnePlace:', config.requireAtLeastOnePlace);
    console.log('\nplaceTypePoints:', config.placeTypePoints);
  } else {
    console.log('No active scoring config found');
  }
}

main()
  .catch((e) => console.error('Error:', e))
  .finally(async () => await prisma.$disconnect());
