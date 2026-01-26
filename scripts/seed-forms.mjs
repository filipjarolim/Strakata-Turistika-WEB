import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEFAULT_FORMS = [
    {
        slug: 'gpx-upload',
        name: 'GPX Upload',
        description: 'Plnohodnotný import trasy s mapou a analýzou bodů.',
        definition: {
            steps: [
                {
                    id: 'upload',
                    title: 'Nahrát GPX',
                    fields: [
                        { id: 'f_gpx', name: 'gpx', label: 'Soubor s trasou', type: 'gpx_upload', required: true, order: 1 },
                        { id: 'f_title', name: 'route_title', label: 'Název trasy', type: 'title_input', required: true, order: 2 },
                        { id: 'f_desc', name: 'route_desc', label: 'Popis trasy (nepovinné)', type: 'description_input', order: 3 },
                        { id: 'f_map_preview', name: 'map', label: 'Náhled trasy', type: 'map_preview', order: 4 }
                    ]
                },
                {
                    id: 'edit',
                    title: 'Detaily a Body',
                    fields: [
                        { id: 'f_map', name: 'map', label: 'Mapa trasy', type: 'map_preview', order: 1 },
                        { id: 'f_title_edit', name: 'route_title', label: 'Název trasy', type: 'title_input', required: true, order: 2 },
                        { id: 'f_desc_edit', name: 'route_desc', label: 'Popis trasy', type: 'description_input', order: 3 },
                        { id: 'f_date', name: 'visit_date', label: 'Datum absolvování', type: 'calendar', required: true, order: 4 },
                        { id: 'f_dog', name: 'dog_not_allowed', label: 'Zákaz vstupu se psy', type: 'dog_switch', order: 5 },
                        {
                            id: 'f_diff', name: 'difficulty', label: 'Náročnost terénu', type: 'select', required: true, options: [
                                { label: 'Lehká', value: 'easy' },
                                { label: 'Střední', value: 'medium' },
                                { label: 'Těžká', value: 'hard' }
                            ], order: 6
                        },
                        { id: 'f_photos', name: 'photos', label: 'Fotografie', type: 'image_upload', order: 7 },
                        { id: 'f_places', name: 'places', label: 'Bodovaná místa', type: 'places_manager', order: 8 }
                    ]
                },
                {
                    id: 'finish',
                    title: 'Hotovo!',
                    fields: [
                        { id: 'f_summary', name: 'summary', label: 'Souhrn bodování', type: 'route_summary', order: 1 }
                    ]
                }
            ]
        }
    },
    {
        slug: 'screenshot-upload',
        name: 'Screenshot Upload',
        description: 'Ruční záznam podložený fotografií z jiné aplikace.',
        definition: {
            steps: [
                {
                    id: 'upload', title: 'Nahrát Screenshot', fields: [
                        { id: 'f_photos_up', name: 'photos', label: 'Nahrát screenshoty', type: 'image_upload', order: 1 },
                        { id: 'f_title_s_up', name: 'route_title', label: 'Název trasy', type: 'title_input', required: true, order: 2 },
                        { id: 'f_desc_s_up', name: 'route_desc', label: 'Popis trasy', type: 'description_input', order: 3 }
                    ]
                },
                {
                    id: 'edit',
                    title: 'Doplnění statistik',
                    fields: [
                        { id: 'f_title_s', name: 'route_title', label: 'Název trasy', type: 'title_input', required: true, order: 1 },
                        { id: 'f_date_s', name: 'visit_date', label: 'Datum absolvování', type: 'calendar', required: true, order: 2 },
                        { id: 'f_photos_s', name: 'photos', label: 'Fotografický důkaz', type: 'image_upload', order: 3 },
                        { id: 'f_places_s', name: 'places', label: 'Bodovaná místa', type: 'places_manager', order: 4 }
                    ]
                },
                { id: 'finish', title: 'Hotovo!', fields: [{ id: 'f_summary_s', name: 'summary', type: 'route_summary', order: 1 }] }
            ]
        }
    }
];

async function main() {
    console.log('Seeding MASTER ULTIMATE Form Configs with Step 1 widgets...');
    for (const form of DEFAULT_FORMS) {
        await prisma.formConfig.upsert({
            where: { slug: form.slug },
            update: {
                name: form.name,
                description: form.description,
                definition: form.definition
            },
            create: {
                slug: form.slug,
                name: form.name,
                description: form.description,
                definition: form.definition
            }
        });
        console.log(`Upserted ${form.slug} with ${form.definition.steps.length} steps.`);
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
