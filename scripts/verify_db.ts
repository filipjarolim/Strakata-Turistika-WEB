import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Verifying Users ---');
    try {
        const users = await prisma.user.findMany({ take: 5 });
        console.log(`Found ${users.length} users.`);
        users.forEach(u => console.log(` - ${u.name} (${u.email})`));
    } catch (e) {
        console.error('Error fetching users:', e);
    }

    console.log('\n--- Verifying FormFields ---');
    try {
        const fields = await prisma.formField.findMany({ take: 5 });
        console.log(`Found ${fields.length} form fields.`);
        fields.forEach(f => console.log(` - ${f.name} (Active: ${f.active})`));
    } catch (e) {
        console.error('Error fetching form fields:', e);
    }

    console.log('\n--- Verifying PlaceTypeConfigs ---');
    try {
        const types = await prisma.placeTypeConfig.findMany({ take: 5 });
        console.log(`Found ${types.length} place types.`);
        types.forEach(t => console.log(` - ${t.name} (Icon: ${t.icon})`));
    } catch (e) {
        console.error('Error fetching place types:', e);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
