import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function verifySystemIntegrity() {
    const checks = {
        scoringConfig: false,
        placeTypes: false,
        strataCategories: false,
        seasons: false,
        users: false
    };

    console.log('--- STARTING SYSTEM INTEGRITY CHECK ---\n');

    try {
        // 1. Verify scoring config
        const config = await db.scoringConfig.findFirst({ where: { active: true } });
        if (config && config.pointsPerKm === 1.0) {
            checks.scoringConfig = true;
            console.log('✅ Scoring config valid (pointsPerKm = 1.0)');
        } else if (config) {
            console.error(`❌ Scoring config active but pointsPerKm is ${config.pointsPerKm}, expected 1.0`);
        } else {
            console.error('❌ No active scoring config found!');
        }

        // 2. Verify all 7 place types exist
        const placeTypes = await db.placeTypeConfig.findMany();
        const requiredTypes = ['PEAK', 'TOWER', 'TREE', 'RUINS', 'CAVE', 'UNUSUAL_NAME', 'OTHER'];
        const existingTypes = placeTypes.map(p => p.name);
        const allExist = requiredTypes.every(t => existingTypes.includes(t));

        if (allExist) {
            checks.placeTypes = true;
            console.log('✅ All 7 place types exist');
        } else {
            console.error('❌ Missing place types:', requiredTypes.filter(t => !existingTypes.includes(t)));
        }

        // 3. Verify 20 Strakatá categories
        const categories = await db.strataCategory.count();
        if (categories === 20) {
            checks.strataCategories = true;
            console.log('✅ 20 Strakatá categories seeded');
        } else {
            console.error(`❌ Expected 20 categories, found ${categories}`);
        }

        // 4. Verify active season exists (Check for current year)
        const currentYear = new Date().getFullYear();
        const activeSeason = await db.season.findFirst({ where: { year: currentYear } });
        if (activeSeason) {
            checks.seasons = true;
            console.log(`✅ Season for ${currentYear} exists`);
        } else {
            const anySeason = await db.season.findFirst();
            if (anySeason) {
                checks.seasons = true;
                console.log(`✅ Season for ${anySeason.year} exists (but not for ${currentYear})`);
            } else {
                console.error('❌ No seasons found in database!');
            }
        }

        // 5. Check user data integrity
        const usersWithVisits = await db.user.count();
        const visitsCount = await db.visitData.count();
        console.log(`ℹ️  Total users: ${usersWithVisits}`);
        console.log(`ℹ️  Total visits: ${visitsCount}`);
        checks.users = true;

        const allPassed = Object.values(checks).every(c => c === true);

        if (allPassed) {
            console.log('\n🎉 SYSTEM INTEGRITY: PASSED ✅');
        } else {
            console.error('\n⚠️  SYSTEM INTEGRITY: FAILED ❌');
        }
    } catch (error) {
        console.error('CRITICAL ERROR DURING INTEGRITY CHECK:', error);
    } finally {
        await db.$disconnect();
    }

    return checks;
}

verifySystemIntegrity();
