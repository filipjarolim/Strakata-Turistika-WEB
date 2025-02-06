import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import path from 'path';
import XLSX from 'xlsx';

const prisma = new PrismaClient();

const filePaths = {
    2022: path.resolve('public/vysledky/vysledky2022.xlsx'),
    2023: path.resolve('public/vysledky/vysledky2023.xlsx'),
};

console.log('Cesty k souborům:', filePaths);

// Column mapping
const columnMappings = {
    visitDate: ['Datum', 'Datum navštívení', 'Date'],
    fullName: ['Příjmení a jméno', 'Full Name'],
    dogName: ['Jméno psa', 'Volací jméno psa', 'Dog Name'],
    points: ['Body', 'Score'],
    visitedPlaces: ['Navštívená místa', 'Visited Places'],
    dogNotAllowed: ['Psi nevítáni v místě:', 'Dogs Not Allowed'],
    routeLink: ['Odkaz na trasu', 'Route Link'],
};

function getMappedValue(row, columnNames) {
    for (const columnName of columnNames) {
        if (row[columnName] !== undefined) {
            return row[columnName];
        }
    }
    return null;
}

function parseExcelDate(value) {
    if (typeof value === 'number') {
        const parsedDate = XLSX.SSF.parse_date_code(value);
        if (parsedDate) {
            return new Date(parsedDate.y, parsedDate.m - 1, parsedDate.d);
        }
    } else if (typeof value === 'string') {
        const [day, month, year] = value.split('.');
        return new Date(year, month - 1, day);
    }
    return null;
}

async function importData() {
    for (const [year, filePath] of Object.entries(filePaths)) {
        console.log(`Importing data for year ${year}...`);

        if (!fs.existsSync(filePath)) {
            console.warn(`File not found for year ${year}: ${filePath}`);
            continue;
        }

        const workbook = XLSX.readFile(filePath);
        const sheet = workbook.Sheets['data'] || workbook.Sheets['nasbíraná data'];
        if (!sheet) {
            console.warn(`Sheet "data" or "nasbíraná data" not found for year ${year}`);
            continue;
        }

        const jsonData = XLSX.utils.sheet_to_json(sheet);

        console.log(`Data from file for year ${year}:`);
        console.table(jsonData);

        // Ensure a Season exists for the year
        const yearInt = parseInt(year, 10);
        let season = await prisma.season.findUnique({ where: { year: yearInt } });
        if (!season) {
            season = await prisma.season.create({
                data: { year: yearInt },
            });
            console.log(`Created new season for year ${year}`);
        }

        for (const row of jsonData) {
            console.log(`Processing row: ${JSON.stringify(row)}`);

            const visitDateRaw = getMappedValue(row, columnMappings.visitDate);
            const visitDate = parseExcelDate(visitDateRaw);
            const fullName = getMappedValue(row, columnMappings.fullName);
            const dogName = getMappedValue(row, columnMappings.dogName);
            const points = getMappedValue(row, columnMappings.points);
            const visitedPlaces = getMappedValue(row, columnMappings.visitedPlaces);
            const dogNotAllowed = getMappedValue(row, columnMappings.dogNotAllowed);
            const routeLink = getMappedValue(row, columnMappings.routeLink);

            // Skip rows without required data
            if (!fullName || fullName.trim() === '') {
                console.warn(`Skipping row due to missing required data: ${JSON.stringify(row)}`);
                continue;
            }

            // Insert the VisitData and associate it with the Season
            await prisma.visitData.create({
                data: {
                    visitDate: visitDate || null,
                    fullName: fullName.trim(),
                    dogName: dogName ? dogName.trim() : null,
                    points: points || 0,
                    visitedPlaces: visitedPlaces || '',
                    dogNotAllowed: dogNotAllowed || null,
                    routeLink: routeLink || null,
                    year: yearInt,
                    seasonId: season.id, // Associate with the season
                    extraPoints: row,
                },
            });

            console.log(`Inserted row into database for year ${year}`);
        }
    }

    console.log('Data imported successfully!');
}

importData()
    .catch((e) => console.error(e))
    .finally(() => prisma.$disconnect());