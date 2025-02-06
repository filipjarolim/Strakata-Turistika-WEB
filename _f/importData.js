import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import path from "path";
import XLSX from "xlsx";

const prisma = new PrismaClient();

const filePaths = {
    2019: path.resolve("public/vysledky/vysledky2019.xlsx"),
};

console.log("Cesty k souborům:", filePaths);

// Column mapping for flexibility
const columnMappings = {
    visitDate: ["Datum", "Datum navštívení", "Date"],
    fullName: ["Příjmení a jméno", "Full Name"],
    dogName: ["Jméno psa", "Volací jméno psa", "Dog Name"],
    points: ["Body", "Score"],
    visitedPlaces: ["Navštívená místa", "Visited Places"],
    dogNotAllowed: ["Psi nevítáni v místě:", "Dogs Not Allowed"],
    routeLink: ["Odkaz na trasu", "Route Link"],
};

function getMappedValue(row, columnNames) {
    for (const columnName of columnNames) {
        if (row[columnName] !== undefined) {
            return row[columnName];
        }
    }
    return null; // Default to null if none of the mappings match
}

function parseExcelDate(value) {
    // Check if the value is an Excel-formatted date as a number
    if (typeof value === "number") {
        const parsedDate = XLSX.SSF.parse_date_code(value);
        if (parsedDate) {
            // Construct JavaScript Date object from parsed date
            return new Date(parsedDate.y, parsedDate.m - 1, parsedDate.d);
        }
    } else if (typeof value === "string") {
        // If it's a string (e.g., "01.09.2019"), attempt to parse it normally
        const [day, month, year] = value.split(".");
        return new Date(year, month - 1, day);
    }
    return null; // Return null if parsing fails
}

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
            console.log(`Zpracování řádku: ${JSON.stringify(row)}`);

            // Map the values using the column mappings
            const visitDateRaw = getMappedValue(row, columnMappings.visitDate);
            const visitDate = parseExcelDate(visitDateRaw); // Parse the Excel date format
            const fullName = getMappedValue(row, columnMappings.fullName);
            const dogName = getMappedValue(row, columnMappings.dogName);
            const points = getMappedValue(row, columnMappings.points);
            const visitedPlaces = getMappedValue(row, columnMappings.visitedPlaces);
            const dogNotAllowed = getMappedValue(row, columnMappings.dogNotAllowed);
            const routeLink = getMappedValue(row, columnMappings.routeLink);

            // Skip rows where the `fullName` field or other mandatory fields are missing or empty
            if (!fullName || fullName.trim() === "") {
                console.warn(`Řádek přeskočen kvůli chybějícím nebo prázdným povinným datům: ${JSON.stringify(row)}`);
                continue;
            }

            // Insert the row into the database if the required fields are present
            await prisma.visitData.create({
                data: {
                    visitDate: visitDate || null,
                    fullName: fullName.trim(),
                    dogName: dogName ? dogName.trim() : null,
                    points: points || 0,
                    visitedPlaces: visitedPlaces || "",
                    dogNotAllowed: dogNotAllowed || null,
                    routeLink: routeLink || null,
                    year: parseInt(year),
                    extraPoints: row, // Save any remaining unmapped properties
                },
            });

            console.log(`Řádek vložen do databáze pro rok ${year}`);
        }
    }

    console.log("Data úspěšně importována!");
}

importData()
    .catch((e) => console.error(e))
    .finally(() => prisma.$disconnect());