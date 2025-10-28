import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Recalculating points for all DRAFT visit data...\n');
  
  // Get all DRAFT visits
  const draftVisits = await prisma.visitData.findMany({
    where: { state: 'DRAFT' }
  });
  
  console.log(`Found ${draftVisits.length} DRAFT visits\n`);
  
  // Get scoring config
  const scoringConfig = await prisma.scoringConfig.findFirst({
    where: { active: true }
  });
  
  if (!scoringConfig) {
    console.log('❌ No active scoring config found');
    return;
  }
  
  console.log('📊 Using scoring config:');
  console.log('placeTypePoints:', scoringConfig.placeTypePoints);
  console.log('');
  
  // Update each visit
  for (const visit of draftVisits) {
    const places = visit.places || [];
    const route = visit.route || {};
    
    // Count places
    const peaks = Array.isArray(places) ? places.filter(p => p.type === 'PEAK').length : 0;
    const towers = Array.isArray(places) ? places.filter(p => p.type === 'TOWER').length : 0;
    const trees = Array.isArray(places) ? places.filter(p => p.type === 'TREE').length : 0;
    const others = Array.isArray(places) ? places.filter(p => p.type === 'OTHER').length : 0;
    
    // Calculate points
    const placePoints = 
      (peaks * (scoringConfig.placeTypePoints.PEAK || 0)) +
      (towers * (scoringConfig.placeTypePoints.TOWER || 0)) +
      (trees * (scoringConfig.placeTypePoints.TREE || 0)) +
      (others * (scoringConfig.placeTypePoints.OTHER || 0));
    
    const distanceKm = (visit.extraPoints?.distance || 0);
    const distancePoints = distanceKm >= scoringConfig.minDistanceKm 
      ? distanceKm * scoringConfig.pointsPerKm 
      : 0;
    
    const totalPoints = distancePoints + placePoints;
    
    console.log(`Updating visit ${visit.id}:`);
    console.log(`  Distance: ${distanceKm} km → ${distancePoints} pts`);
    console.log(`  Places: ${peaks}P ${towers}T ${trees}Tr ${others}O → ${placePoints} pts`);
    console.log(`  Total: ${totalPoints} pts`);
    
    // Update
    await prisma.visitData.update({
      where: { id: visit.id },
      data: {
        points: totalPoints,
        extraPoints: {
          ...visit.extraPoints,
          peaks,
          towers,
          trees,
          others,
          placePoints,
          distancePoints,
          totalPoints,
          config: scoringConfig.placeTypePoints
        }
      }
    });
  }
  
  console.log('\n✅ Done!');
}

main()
  .catch((e) => console.error('Error:', e))
  .finally(async () => await prisma.$disconnect());
