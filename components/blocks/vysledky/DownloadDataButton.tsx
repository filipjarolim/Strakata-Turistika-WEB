import React from 'react';
import { Button } from '@/components/ui/button'; // Assume this is the shadcn button
import { Download } from 'lucide-react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { VisitData } from './DataTable'; // Data type for visits

// Helper function to transform data for cumulative sheet
const transformToCumulativeData = (data: VisitData[]): VisitData[] => {
    const cumulativeDataMap = new Map<string, VisitData>();

    data.forEach((entry) => {
        const existingRecord = cumulativeDataMap.get(entry.fullName);

        if (existingRecord) {
            existingRecord.points += entry.points;
            existingRecord.visitedPlaces += `, ${entry.visitedPlaces}`;
        } else {
            cumulativeDataMap.set(entry.fullName, { ...entry });
        }
    });

    return Array.from(cumulativeDataMap.values());
};

// Helper for consistent cell styling
const applyCellStyle = (
    cell: ExcelJS.Cell,
    options: { fontSize?: number; bold?: boolean; alignment?: Partial<ExcelJS.Alignment>; color?: string; background?: string }
) => {
    if (options.fontSize || options.bold) {
        cell.font = { size: options.fontSize || 11, bold: options.bold || false, color: { argb: options.color || 'FF000000' } };
    }
    if (options.alignment) {
        cell.alignment = options.alignment;
    }
    if (options.background) {
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: options.background },
        };
    }
};

// Excel download button component
export const DownloadDataButton: React.FC<{ data: VisitData[]; year: number }> = ({ data, year }) => {
    const handleDownload = async () => {
        const workbook = new ExcelJS.Workbook();

        // Set workbook metadata
        workbook.creator = 'Strakataturistika';
        workbook.created = new Date();

        /* ----------- Create Detailed Data Sheet ----------- */
        const detailedSheet = workbook.addWorksheet('Detailní Data', {
            properties: { tabColor: { argb: 'FF4CAF50' } }, // Green Tab
        });

        // Title and description in the header
        detailedSheet.mergeCells('A1:H1');
        const mainHeader = detailedSheet.getCell('A1');
        mainHeader.value = `Detailní Výsledky Návštěv pro rok ${year}`;
        applyCellStyle(mainHeader, { fontSize: 16, bold: true, alignment: { horizontal: 'center' }, background: 'FF4CAF50' });

        detailedSheet.mergeCells('A2:H2');
        const subHeader = detailedSheet.getCell('A2');
        subHeader.value = 'Tento list obsahuje podrobné informace o každé návštěvě.';
        applyCellStyle(subHeader, { fontSize: 12, alignment: { horizontal: 'center' }, background: 'FF81C784' }); // Light green

        // Define column headers (IN CZECH) and keys
        const headers = [
            'ID',
            'Datum návštěvy',
            'Jméno',
            'Jméno psa',
            'Body',
            'Navštívená místa',
            'Pes nepovolen',
            'Odkaz na trasu',
        ];
        detailedSheet.addRow(headers).eachCell((cell) => {
            applyCellStyle(cell, {
                bold: true,
                alignment: { horizontal: 'center' },
                background: 'FF4CAF50', // Green
                color: 'FFFFFFFF', // White text
            });
        });

        // Set column widths to make sure all content fits
        detailedSheet.columns = [
            { width: 10 }, // ID
            { width: 20 }, // Datum návštěvy (Visit Date)
            { width: 25 }, // Jméno (Name)
            { width: 25 }, // Jméno psa (Dog Name)
            { width: 10 }, // Body (Points)
            { width: 50 }, // Navštívená místa (Visited Places)
            { width: 20 }, // Pes nepovolen (Dog Not Allowed)
            { width: 35 }, // Odkaz na trasu (Route Link)
        ];

        // Add data under the headers
        data.forEach((entry) => {
            detailedSheet.addRow([
                entry.id,
                entry.visitDate || 'N/A',
                entry.fullName,
                entry.dogName || 'N/A',
                entry.points,
                entry.visitedPlaces,
                entry.dogNotAllowed || 'Ne',
                entry.routeLink || 'N/A',
            ]);
        });

        // Apply alternating row background colors for better readability
        detailedSheet.eachRow((row, rowNumber) => {
            if (rowNumber > 3) {
                row.eachCell((cell) => {
                    applyCellStyle(cell, {
                        background: rowNumber % 2 === 0 ? 'FFDCEDC8' : 'FFFFFFFF', // Light green for even rows
                        alignment: { vertical: 'middle' },
                    });
                });
            }
        });

        /* ----------- Create Cumulative Data Sheet ----------- */
        const cumulativeSheet = workbook.addWorksheet('Kumulativní Data', {
            properties: { tabColor: { argb: 'FF689F38' } }, // Darker Green Tab
        });

        // Title and description in the header
        cumulativeSheet.mergeCells('A1:C1');
        const cMainHeader = cumulativeSheet.getCell('A1');
        cMainHeader.value = `Kumulativní Výsledky Návštěv pro rok ${year}`;
        applyCellStyle(cMainHeader, { fontSize: 16, bold: true, alignment: { horizontal: 'center' }, background: 'FF81C784' });

        cumulativeSheet.mergeCells('A2:C2');
        const cSubHeader = cumulativeSheet.getCell('A2');
        cSubHeader.value = 'Tento list obsahuje souhrnné informace o návštěvách každého účastníka.';
        applyCellStyle(cSubHeader, { fontSize: 12, alignment: { horizontal: 'center' }, background: 'FFDCEDC8' });

        // Define column headers for cumulative sheet (IN CZECH)
        const cumulativeHeaders = ['Jméno', 'Celkové Body', 'Navštívená místa'];
        cumulativeSheet.addRow(cumulativeHeaders).eachCell((cell) => {
            applyCellStyle(cell, {
                bold: true,
                alignment: { horizontal: 'center' },
                background: 'FF689F38', // Dark green
                color: 'FFFFFFFF', // White text
            });
        });

        // Set column widths to make sure all content fits
        cumulativeSheet.columns = [
            { width: 25 }, // Jméno (Name)
            { width: 15 }, // Celkové Body (Total Points)
            { width: 50 }, // Navštívená místa (Visited Places)
        ];

        // Add cumulative data under the headers
        transformToCumulativeData(data).forEach((entry) => {
            cumulativeSheet.addRow([
                entry.fullName,
                entry.points,
                entry.visitedPlaces,
            ]);
        });

        // Apply alternating row background colors
        cumulativeSheet.eachRow((row, rowNumber) => {
            if (rowNumber > 3) {
                row.eachCell((cell) => {
                    applyCellStyle(cell, {
                        background: rowNumber % 2 === 0 ? 'FFF1F8E9' : 'FFFFFFFF', // Light green for even rows
                        alignment: { vertical: 'middle' },
                    });
                });
            }
        });

        /* ----------- Download the Excel File ----------- */
        const buffer = await workbook.xlsx.writeBuffer();
        saveAs(new Blob([buffer]), `strakataturistika_vysledky_${year}.xlsx`);
    };

    return (
        <Button
            onClick={handleDownload}
            className="text-white bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 active:scale-95 px-4 py-2 rounded-lg shadow-md flex items-center gap-2 transition-all duration-150">
            <Download className="h-5 w-5" /> <span className="font-semibold">Stáhnout Data</span>
        </Button>
    );
};