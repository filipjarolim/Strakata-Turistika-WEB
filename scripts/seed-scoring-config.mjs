/**
 * Seed script for initializing scoring configuration and place type configs
 * Run: node scripts/seed-scoring-config.mjs
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding scoring configuration...');

  // Create default scoring config
  const scoringConfig = await prisma.scoringConfig.upsert({
    where: { id: 'default_scoring_config' },
    update: {
      pointsPerKm: 2.0,
      minDistanceKm: 3.0,
      requireAtLeastOnePlace: true,
      placeTypePoints: {
        PEAK: 1.0,
        TOWER: 1.0,
        TREE: 1.0,
        OTHER: 0.0
      },
      active: true
    },
    create: {
      id: 'default_scoring_config',
      pointsPerKm: 2.0,
      minDistanceKm: 3.0,
      requireAtLeastOnePlace: true,
      placeTypePoints: {
        PEAK: 1.0,
        TOWER: 1.0,
        TREE: 1.0,
        OTHER: 0.0
      },
      active: true
    }
  });

  console.log('✅ Created scoring config:', scoringConfig);

  // Create place type configs
  const placeTypes = [
    {
      name: 'PEAK',
      label: 'Vrchol',
      icon: 'Mountain',
      color: 'text-blue-500',
      points: 1.0,
      isActive: true,
      order: 0
    },
    {
      name: 'TOWER',
      label: 'Rozhledna',
      icon: 'Eye',
      color: 'text-purple-500',
      points: 1.0,
      isActive: true,
      order: 1
    },
    {
      name: 'TREE',
      label: 'Památný strom',
      icon: 'TreeDeciduous',
      color: 'text-green-500',
      points: 1.0,
      isActive: true,
      order: 2
    },
    {
      name: 'OTHER',
      label: 'Jiné',
      icon: 'MapPin',
      color: 'text-orange-500',
      points: 0.0,
      isActive: true,
      order: 3
    }
  ];

  for (const placeType of placeTypes) {
    const created = await prisma.placeTypeConfig.upsert({
      where: { name: placeType.name },
      update: placeType,
      create: placeType
    });
    console.log(`✅ Created place type config: ${created.name}`);
  }

  console.log('🎉 Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

