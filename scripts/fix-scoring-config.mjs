import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Updating ScoringConfig to match mobile app...\n');
  
  // Update to match mobile app values
  const updated = await prisma.scoringConfig.updateMany({
    where: { active: true },
    data: {
      placeTypePoints: {
        PEAK: 1,
        TOWER: 1,
        TREE: 1,
        OTHER: 0
      }
    }
  });
  
  console.log(`✅ Updated ${updated.count} ScoringConfig record(s)\n`);
  
  const config = await prisma.scoringConfig.findFirst({
    where: { active: true }
  });
  
  console.log('📊 New values:');
  console.log('placeTypePoints:', config.placeTypePoints);
}

main()
  .catch((e) => console.error('Error:', e))
  .finally(async () => await prisma.$disconnect());
