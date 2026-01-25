
(async () => {
    try {
        const { PrismaClient } = await import('@prisma/client');
        const prisma = new PrismaClient();
        console.log('Generating News...');

        await prisma.news.create({
            data: {
                title: "Vítejte v nové sekci Aktualit",
                slug: "vitejte-v-novych-aktualitach",
                content: "Toto je první zkušební zpráva v novém systému. Vyzkoušejte filtrování a zobrazení.",
                summary: "Krátké shrnutí pro testovací účely.",
                published: true,
                tags: ["Oznámení", "Update"],
                createdAt: new Date()
            }
        });

        console.log('Done');
    } catch (e) {
        console.error(e);
    }
})();
