import React from 'react';
import { Button } from '@/components/ui/button'; // Assume this is the shadcn button
import { Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { VisitData } from './DataTable'; // To fetch the data type

type DownloadDataButtonProps = {
    data: VisitData[]; // The data to export
    year: number; // The year to include in the file name
};

export const DownloadDataButton: React.FC<DownloadDataButtonProps> = ({ data, year }) => {
    const handleDownload = () => {
        // Map the table data to include Czech translations
        const mappedData = data.map((row) => ({
            'ID': row.id,
            'Datum návštěvy': row.visitDate || 'N/A',
            'Jméno': row.fullName,
            'Jméno psa': row.dogName || 'N/A',
            'Body': row.points,
            'Navštívená místa': row.visitedPlaces,
            'Pes nepovolen': row.dogNotAllowed || 'Ne',
            'Odkaz na trasu': row.routeLink || 'N/A',
            'Rok': row.year,
        }));

        // Create our content rows (title and description)
        const headerContent = [
            ['Výsledky Návštěv'], // Title
            [`Soubor obsahuje data o návštěvách pro rok ${year}.`], // Description
            [], // Empty line
        ];

        // Append the header content above the data
        const worksheet = XLSX.utils.aoa_to_sheet(headerContent); // Convert header array to worksheet
        XLSX.utils.sheet_add_json(worksheet, mappedData, { origin: -1 }); // Append JSON data starting after the existing rows

        // Adjust the column widths for better legibility
        worksheet['!cols'] = [
            { wpx: 60 }, // ID
            { wpx: 120 }, // Datum návštěvy
            { wpx: 150 }, // Jméno
            { wpx: 150 }, // Jméno psa
            { wpx: 80 }, // Body
            { wpx: 200 }, // Navštívená místa
            { wpx: 120 }, // Pes nepovolen
            { wpx: 200 }, // Odkaz na trasu
            { wpx: 80 }, // Rok
        ];

        // Merging cells for title and description
        worksheet['!merges'] = [
            { s: { r: 0, c: 0 }, e: { r: 0, c: 8 } }, // Merge the first row (title)
            { s: { r: 1, c: 0 }, e: { r: 1, c: 8 } }, // Merge the second row (description)
        ];

        // Create a new workbook and append the sheet
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');

        // Generate the dynamic file name: strakataturistika_vysledky_{rok}.xlsx
        const fileName = `strakataturistika_vysledky_${year}.xlsx`;

        // Write the file and download it
        XLSX.writeFile(workbook, fileName);
    };

    return (
        <Button onClick={handleDownload} className="bg-green-500 text-white hover:bg-green-600">
            <Download className="mr-2 h-4 w-4" /> Stáhnout data
        </Button>
    );
};