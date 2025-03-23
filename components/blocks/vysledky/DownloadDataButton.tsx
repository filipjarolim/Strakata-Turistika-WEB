import React from 'react';
import { Button } from '@/components/ui/button'; // Assume this is the shadcn button
import { Download } from 'lucide-react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { VisitData } from './DataTable'; // Data type for visits

// Helper function to transform data for cumulative sheet - specific for VisitData
export const transformVisitDataToCumulative = (data: VisitData[]): VisitData[] => {
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

export type DownloadDataButtonProps<TData extends object> = {
    data: TData[];
    year: number;
    filename?: string;
    mainSheetName?: string;
    summarySheetName?: string;
    columnDefinitions?: {
        header: string;
        key: string;
        width?: number;
    }[];
    generateSummarySheet?: boolean;
    transformToSummary?: (data: TData[]) => Record<string, unknown>[];
    summaryColumnDefinitions?: {
        header: string;
        key: string;
        width?: number;
    }[];
};

// Excel download button component
export function DownloadDataButton<TData extends object>({ 
    data, 
    year, 
    filename = `data-export-${year}`,
    mainSheetName = 'Detailed Data',
    summarySheetName = 'Summary Data',
    columnDefinitions,
    generateSummarySheet = false,
    transformToSummary,
    summaryColumnDefinitions
}: DownloadDataButtonProps<TData>) {
    // Default handling for VisitData for backward compatibility
    const isVisitData = data.length > 0 && 'visitDate' in data[0] && 'fullName' in data[0] && 'points' in data[0];
    
    const handleDownload = async () => {
        const workbook = new ExcelJS.Workbook();

        // Set workbook metadata
        workbook.creator = 'Strakataturistika';
        workbook.created = new Date();

        /* ----------- Create Detailed Data Sheet ----------- */
        const detailedSheet = workbook.addWorksheet(mainSheetName, {
            properties: { tabColor: { argb: 'FF4CAF50' } }, // Green Tab
        });

        // Title and description in the header
        detailedSheet.mergeCells('A1:H1');
        const mainHeader = detailedSheet.getCell('A1');
        mainHeader.value = `${mainSheetName} - ${year}`;
        applyCellStyle(mainHeader, { fontSize: 16, bold: true, alignment: { horizontal: 'center' }, background: 'FF4CAF50' });

        detailedSheet.mergeCells('A2:H2');
        const subHeader = detailedSheet.getCell('A2');
        subHeader.value = 'This sheet contains detailed information.';
        applyCellStyle(subHeader, { fontSize: 12, alignment: { horizontal: 'center' }, background: 'FF81C784' }); // Light green

        // Define and use column definitions based on data type
        let headers: string[] = [];
        let dataColumns: { width: number }[] = [];
        
        if (isVisitData && !columnDefinitions) {
            // Default for VisitData for backward compatibility
            headers = [
                'ID',
                'Datum návštěvy',
                'Jméno',
                'Jméno psa',
                'Body',
                'Navštívená místa',
                'Pes nepovolen',
                'Odkaz na trasu',
            ];
            
            dataColumns = [
                { width: 10 }, // ID
                { width: 20 }, // Datum návštěvy (Visit Date)
                { width: 25 }, // Jméno (Name)
                { width: 25 }, // Jméno psa (Dog Name)
                { width: 10 }, // Body (Points)
                { width: 50 }, // Navštívená místa (Visited Places)
                { width: 20 }, // Pes nepovolen (Dog Not Allowed)
                { width: 35 }, // Odkaz na trasu (Route Link)
            ];
        } else if (columnDefinitions) {
            headers = columnDefinitions.map(col => col.header);
            dataColumns = columnDefinitions.map(col => ({ width: col.width || 20 }));
        } else {
            // Generate headers from data properties
            if (data.length > 0) {
                const firstItem = data[0];
                headers = Object.keys(firstItem as object);
                dataColumns = headers.map(() => ({ width: 20 }));
            }
        }

        detailedSheet.addRow(headers).eachCell((cell) => {
            applyCellStyle(cell, {
                bold: true,
                alignment: { horizontal: 'center' },
                background: 'FF4CAF50', // Green
                color: 'FFFFFFFF', // White text
            });
        });

        // Set column widths
        detailedSheet.columns = dataColumns;

        // Add data under the headers
        if (isVisitData && !columnDefinitions) {
            // Default for VisitData for backward compatibility
            (data as unknown as VisitData[]).forEach((entry) => {
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
        } else if (columnDefinitions) {
            data.forEach((entry: TData) => {
                const rowData = columnDefinitions.map(col => {
                    const value = entry[col.key as keyof TData];
                    return value !== undefined && value !== null ? value : 'N/A';
                });
                detailedSheet.addRow(rowData);
            });
        } else {
            // Generic data handling
            data.forEach((entry: TData) => {
                const rowData = Object.values(entry);
                detailedSheet.addRow(rowData);
            });
        }

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

        /* ----------- Create Summary/Cumulative Data Sheet if needed ----------- */
        if (generateSummarySheet && (transformToSummary || isVisitData)) {
            const summarySheet = workbook.addWorksheet(summarySheetName, {
                properties: { tabColor: { argb: 'FF689F38' } }, // Darker Green Tab
            });

            // Title and description in the header
            summarySheet.mergeCells('A1:C1');
            const cMainHeader = summarySheet.getCell('A1');
            cMainHeader.value = `${summarySheetName} - ${year}`;
            applyCellStyle(cMainHeader, { fontSize: 16, bold: true, alignment: { horizontal: 'center' }, background: 'FF81C784' });

            summarySheet.mergeCells('A2:C2');
            const cSubHeader = summarySheet.getCell('A2');
            cSubHeader.value = 'This sheet contains summarized information.';
            applyCellStyle(cSubHeader, { fontSize: 12, alignment: { horizontal: 'center' }, background: 'FFDCEDC8' });

            // Define column headers for summary sheet
            let summaryHeaders: string[] = [];
            let summaryColumns: { width: number }[] = [];
            
            if (isVisitData && !summaryColumnDefinitions) {
                // Default for VisitData
                summaryHeaders = ['Jméno', 'Celkové Body', 'Navštívená místa'];
                summaryColumns = [
                    { width: 25 }, // Jméno (Name)
                    { width: 15 }, // Celkové Body (Total Points)
                    { width: 50 }, // Navštívená místa (Visited Places)
                ];
            } else if (summaryColumnDefinitions) {
                summaryHeaders = summaryColumnDefinitions.map(col => col.header);
                summaryColumns = summaryColumnDefinitions.map(col => ({ width: col.width || 20 }));
            }

            summarySheet.addRow(summaryHeaders).eachCell((cell) => {
                applyCellStyle(cell, {
                    bold: true,
                    alignment: { horizontal: 'center' },
                    background: 'FF689F38', // Dark green
                    color: 'FFFFFFFF', // White text
                });
            });

            // Set column widths
            summarySheet.columns = summaryColumns;

            // Add cumulative data under the headers
            if (isVisitData && !transformToSummary && !summaryColumnDefinitions) {
                // Default for VisitData
                transformVisitDataToCumulative(data as unknown as VisitData[]).forEach((entry) => {
                    summarySheet.addRow([
                        entry.fullName,
                        entry.points,
                        entry.visitedPlaces,
                    ]);
                });
            } else if (transformToSummary) {
                const summaryData = transformToSummary(data);
                
                if (summaryColumnDefinitions) {
                    summaryData.forEach((entry: Record<string, unknown>) => {
                        const rowData = summaryColumnDefinitions.map(col => {
                            const value = entry[col.key];
                            return value !== undefined && value !== null ? value : 'N/A';
                        });
                        summarySheet.addRow(rowData);
                    });
                } else {
                    summaryData.forEach((entry: Record<string, unknown>) => {
                        const rowData = Object.values(entry);
                        summarySheet.addRow(rowData);
                    });
                }
            }

            // Apply alternating row background colors
            summarySheet.eachRow((row, rowNumber) => {
                if (rowNumber > 3) {
                    row.eachCell((cell) => {
                        applyCellStyle(cell, {
                            background: rowNumber % 2 === 0 ? 'FFF1F8E9' : 'FFFFFFFF', // Light green for even rows
                            alignment: { vertical: 'middle' },
                        });
                    });
                }
            });
        }

        /* ----------- Download the Excel File ----------- */
        const buffer = await workbook.xlsx.writeBuffer();
        saveAs(new Blob([buffer]), `${filename}.xlsx`);
    };

    return (
        <Button
            onClick={handleDownload}
            className="text-white bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 active:scale-95 px-4 py-2 rounded-lg shadow-md flex items-center gap-2 transition-all duration-150">
            <Download className="h-5 w-5" /> <span className="font-semibold">Stáhnout Data</span>
        </Button>
    );
}