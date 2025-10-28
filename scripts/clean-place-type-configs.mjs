/**
 * Clean old PlaceTypeConfig records and recreate with new structure
 * Run: node scripts/clean-place-type-configs.mjs
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Cleaning old PlaceTypeConfig records...');

  // Delete all existing PlaceTypeConfig records
  const deleted = await prisma.$runCommandRaw({
    delete: 'PlaceTypeConfig',
    deletes: [{ q: {}, limit: 0 }]
  });

  console.log(`✅ Deleted ${deleted.n} old records`);

  // Also clean FormField if needed
  const deletedFormFields = await prisma.$runCommandRaw({
    delete: 'FormField',
    deletes: [{ q: {}, limit: 0 }]
  });

  console.log(`✅ Deleted ${deletedFormFields.n} old FormField records`);

  console.log('🎉 Cleanup completed! Now run: node scripts/seed-scoring-config.mjs');
}

main()
  .catch((e) => {
    console.error('❌ Error cleaning database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


