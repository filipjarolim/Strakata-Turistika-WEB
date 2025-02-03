import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import path from 'path';
import XLSX from 'xlsx';

const prisma = new PrismaClient();
const filePaths = {
    2019: path.resolve("public/vysledky/vysledky2019.xlsx"),
    2021: path.resolve("public/vysledky/vysledky2021.xlsx"),
    2022: path.resolve("public/vysledky/vysledky2022.xlsx"),
    2023: path.resolve("public/vysledky/vysledky2023.xlsx"),
};


console.log("Cesty k souborům:", filePaths);

async function importData() {
    for (const [year, filePath] of Object.entries(filePaths)) {
        console.log(`Import dat pro rok ${year}...`);
        if (!fs.existsSync(filePath)) {
            console.warn(`Soubor pro rok ${year} nenalezen: ${filePath}`);
            continue;
        }

        const workbook = XLSX.readFile(filePath);
        const sheet = workbook.Sheets["data"] || workbook.Sheets["nasbíraná data"];
        if (!sheet) {
            console.warn(`List "data" nebo "nasbíraná data" nenalezen v souboru pro rok ${year}`);
            continue;
        }
        const jsonData = XLSX.utils.sheet_to_json(sheet);

        console.log(`Data ze souboru pro rok ${year}:`);
        console.table(jsonData);

        for (const row of jsonData) {
            const { Datum, "Příjmení a jméno": fullName, "Jméno psa": dogName, Body, ...extra } = row;

            console.log(`Zpracování řádku: ${JSON.stringify(row)}`);

            await prisma.visitData.create({
                data: {
                    visitDate: Datum ? new Date(Datum) : null,
                    fullName: fullName || "",
                    dogName: dogName || null,
                    points: Body || 0,
                    visitedPlaces: extra["Navštívená místa"] || "",
                    dogNotAllowed: extra["Psi nevítáni v místě:"] || null,
                    routeLink: extra["Odkaz na trasu"] || null,
                    year: parseInt(year),
                    extraPoints: extra // Uchová všechny bonusové body pro různé roky jako JSON objekt
                }
            });

            console.log(`Řádek vložen do databáze pro rok ${year}`);
        }
    }

    console.log("Data úspěšně importována!");
}

importData().catch(e => console.error(e)).finally(() => prisma.$disconnect());