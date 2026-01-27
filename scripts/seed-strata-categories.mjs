import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const categories = [
    { name: 'SKALNÍ_ÚTVAR', label: 'Skalní útvar', icon: 'Mountain', order: 1 },
    { name: 'ROZHLEDNA', label: 'Rozhledna / Vyhlídka', icon: 'Binoculars', order: 2 },
    { name: 'HRAD_ZÁMEK', label: 'Hrad / Zámek / Zřícenina', icon: 'Castle', order: 3 },
    { name: 'CÍRKEVNÍ_PAMÁTKA', label: 'Církevní památka', icon: 'Church', order: 4 },
    { name: 'LIDOVÁ_ARCHITEKTURA', label: 'Lidová architektura', icon: 'Home', order: 5 },
    { name: 'TECHNICKÁ_PAMÁTKA', label: 'Technická památka', icon: 'Settings', order: 6 },
    { name: 'MUZEUM_GALERIE', label: 'Muzeum / Galerie', icon: 'Image', order: 7 },
    { name: 'JESKYNĚ_DŮL', label: 'Jeskyně / Důl', icon: 'Gem', order: 8 },
    { name: 'VODOPÁD', label: 'Vodopád', icon: 'Waves', order: 9 },
    { name: 'PRŮLOM_SOUTĚSKA', label: 'Průlom / Soutěska', icon: 'Tractor', order: 10 },
    { name: 'PRATY_STROM', label: 'Památný strom', icon: 'TreeDeciduous', order: 11 },
    { name: 'STUDÁNKA_PRAMEN', label: 'Studánka / Pramen', icon: 'Droplets', order: 12 },
    { name: 'RAŠELINIŠTĚ', label: 'Rašeliniště', icon: 'Leaf', order: 13 },
    { name: 'NAUČNÁ_STEZKA', label: 'Naučná stezka', icon: 'Footprints', order: 14 },
    { name: 'MĚSTSKÁ_PAMÁTKOVÁ_REZERVACE', label: 'Městská rezervace', icon: 'Building2', order: 15 },
    { name: 'POMNÍK_PAMÁTNÍK', label: 'Pomník / Památník', icon: 'Milestone', order: 16 },
    { name: 'VODNÍ_PLOCHA', label: 'Rybník / Přehrada', icon: 'Ship', order: 17 },
    { name: 'VYHLÍDKOVÉ_MÍSTO', label: 'Vyhlídkové místo', icon: 'Eye', order: 18 },
    { name: 'NÁRODNÍ_PARK', label: 'Národní park', icon: 'Map', order: 19 },
    { name: 'OSTATNÍ', label: 'Ostatní přírodní zajímavost', icon: 'Sprout', order: 20 },
];

async function main() {
    console.log('🌱 Seeding StrataCategories...');

    for (const cat of categories) {
        await prisma.strataCategory.upsert({
            where: { name: cat.name },
            update: { label: cat.label, icon: cat.icon, order: cat.order },
            create: cat,
        });
        console.log(`✅ Category "${cat.name}" seeded.`);
    }

    console.log('✨ Seeding complete!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
