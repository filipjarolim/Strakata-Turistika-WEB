import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, FileDown } from 'lucide-react';
import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { VisitData } from './DataTable'; // Data type for visits
import { Column } from '@tanstack/react-table';

// Helper function to transform data for cumulative sheet - specific for VisitData
const transformVisitDataToCumulative = (data: VisitData[]) => {
    const cumulativeData: Record<string, { points: number; visits: number }> = {};
    
    data.forEach(visit => {
        const fullName = visit.id;
        if (!cumulativeData[fullName]) {
            cumulativeData[fullName] = { points: 0, visits: 0 };
        }
        cumulativeData[fullName].points += visit.points;
        cumulativeData[fullName].visits += 1;
    });
    
    // Transform to array sorted by points (desc)
    return Object.entries(cumulativeData).map(([fullName, stats]) => ({
        fullName,
        totalPoints: stats.points,
        totalVisits: stats.visits
    })).sort((a, b) => b.totalPoints - a.totalPoints);
};

// Helper to get a readable column title
const getColumnTitle = (columnId: string): string => {
    const columnMappings: Record<string, string> = {
        visitDate: 'Datum návštěvy',
        fullName: 'Jméno',
        dogName: 'Jméno psa',
        points: 'Body',
        visitedPlaces: 'Navštívená místa',
        dogNotAllowed: 'Psi povoleni',
        routeLink: 'Odkaz na trasu',
        year: 'Rok',
        totalPoints: 'Celkové body',
        totalVisits: 'Celkový počet návštěv'
    };
    
    return columnMappings[columnId] || columnId;
};

export interface DownloadDataButtonProps<TData> {
    data: TData[];
    columns: Column<TData, unknown>[];
    filename?: string;
    mainSheetName?: string;
    summarySheetName?: string;
    generateSummarySheet?: boolean;
    summaryColumnDefinitions?: {
        header: string;
        key: string;
        width?: number;
    }[];
}

export const DownloadDataButton = <TData extends object>({
    data,
    columns,
    filename = "export",
    mainSheetName = "Data",
    summarySheetName = "Summary",
    generateSummarySheet = false,
    summaryColumnDefinitions = [],
}: DownloadDataButtonProps<TData>) => {
    const [isExporting, setIsExporting] = useState(false);
    
    const handleDownload = async () => {
        try {
            setIsExporting(true);
            const workbook = await buildExportData(data);
            
            // Convert to binary and save
            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            saveAs(blob, `${filename}.xlsx`);
        } catch (error) {
            console.error('Export failed:', error);
        } finally {
            setIsExporting(false);
        }
    };
    
    // Helper to apply consistent cell styling
    const applyCellStyle = (cell: ExcelJS.Cell, style: {
        fontSize?: number;
        bold?: boolean;
        alignment?: Partial<ExcelJS.Alignment>;
        background?: string;
    }) => {
        if (style.fontSize) cell.font = { ...(cell.font || {}), size: style.fontSize };
        if (style.bold) cell.font = { ...(cell.font || {}), bold: style.bold };
        if (style.alignment) cell.alignment = style.alignment;
        if (style.background) {
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: style.background }
            };
        }
    };
    
    const buildExportData = async (exportData: TData[]) => {
        // Create a new workbook with default properties
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'Strakáčova Turistika';
        workbook.created = new Date();
        
        /* ----------- Create Main Data Sheet ----------- */
        const detailedSheet = workbook.addWorksheet(mainSheetName, {
            properties: { tabColor: { argb: 'FF4CAF50' } } // Green Tab
        });
        
        // Add header row with merged cells for the title
        detailedSheet.mergeCells('A1:H1');
        const mainHeader = detailedSheet.getCell('A1');
        mainHeader.value = `${mainSheetName} - ${new Date().getFullYear()}`;
        applyCellStyle(mainHeader, { fontSize: 16, bold: true, alignment: { horizontal: 'center' }, background: 'FF4CAF50' });
        
        // Add a space between title and data
        detailedSheet.addRow([]);
        
        // Determine if we're working with VisitData for backward compatibility
        const isVisitData = data.length > 0 && 'visitDate' in data[0] && 'fullName' in data[0] && 'points' in data[0];
        
        // Set up header row based on the data type
        let headers: string[] = [];
        let dataColumns: { width: number }[] = [];
        
        if (isVisitData && columns.length === 0) {
            // Default for VisitData for backward compatibility
            headers = [
                'Datum návštěvy',  // Visit Date
                'Jméno',           // Full Name
                'Jméno psa',       // Dog Name
                'Body',            // Points
                'Navštívená místa', // Visited Places
                'Psi povoleni',    // Dogs Allowed
                'Odkaz na trasu'   // Route Link
            ];
            
            // Configure column widths
            dataColumns = [
                { width: 15 }, // Datum návštěvy (Visit Date)
                { width: 25 }, // Jméno (Full Name)
                { width: 20 }, // Jméno psa (Dog Name)
                { width: 10 }, // Body (Points)
                { width: 30 }, // Navštívená místa (Visited Places)
                { width: 15 }, // Psi povoleni (Dogs Allowed)
                { width: 35 }, // Odkaz na trasu (Route Link)
            ];
        } else if (columns.length > 0) {
            // Use the provided columns
            headers = columns.map(col => getColumnTitle(col.id as string));
            dataColumns = columns.map(col => ({ width: 20 }));
        } else {
            // Generate headers from data properties
            const sampleItem = data[0] || {};
            headers = Object.keys(sampleItem);
            dataColumns = headers.map(() => ({ width: 20 }));
        }
        
        // Add the headers row
        const headerRow = detailedSheet.addRow(headers);
        headerRow.eachCell((cell) => {
            applyCellStyle(cell, { bold: true, alignment: { horizontal: 'center' }, background: 'FFE8F5E9' });
        });
        
        // Set column widths
        dataColumns.forEach((col, index) => {
            const excelColName = String.fromCharCode(65 + index); // A, B, C, etc.
            detailedSheet.getColumn(excelColName).width = col.width;
        });
        
        // Add data under the headers
        if (isVisitData && columns.length === 0) {
            // Default for VisitData for backward compatibility
            (data as unknown as VisitData[]).forEach((entry) => {
                detailedSheet.addRow([
                    entry.visitDate ? new Date(entry.visitDate).toLocaleDateString('cs-CZ') : 'N/A',
                    entry.id,
                    entry.points,
                    entry.visitedPlaces,
                    entry.dogNotAllowed ? 'Ne' : 'Ano',
                    entry.routeLink || 'N/A'
                ]);
            });
        } else if (columns.length > 0) {
            // Use the provided columns for data extraction
            data.forEach((entry: TData) => {
                const rowData = columns.map(col => {
                    const value = entry[col.id as keyof TData];
                    return value !== undefined && value !== null ? value : 'N/A';
                });
                detailedSheet.addRow(rowData);
            });
        } else {
            // Generic handling - just extract all properties
            data.forEach((entry: TData) => {
                const rowData = Object.values(entry);
                detailedSheet.addRow(rowData);
            });
        }
        
        /* ----------- Create Summary/Cumulative Data Sheet if needed ----------- */
        if (generateSummarySheet && (isVisitData || summaryColumnDefinitions.length > 0)) {
            const summarySheet = workbook.addWorksheet(summarySheetName, {
                properties: { tabColor: { argb: 'FF689F38' } }, // Darker Green Tab
            });
            
            // Add header row with merged cells
            summarySheet.mergeCells('A1:C1');
            const cMainHeader = summarySheet.getCell('A1');
            cMainHeader.value = `${summarySheetName} - ${new Date().getFullYear()}`;
            applyCellStyle(cMainHeader, { fontSize: 16, bold: true, alignment: { horizontal: 'center' }, background: 'FF81C784' });
            
            // Add spacing row
            summarySheet.addRow([]);
            
            // Set up cumulative headers and column widths
            let cHeaders: string[] = [];
            let cDataColumns: { width: number }[] = [];
            
            if (isVisitData && !summaryColumnDefinitions.length) {
                // Default for VisitData
                cHeaders = ['Jméno', 'Celkové Body', 'Počet Návštěv'];
                cDataColumns = [
                    { width: 25 }, // Jméno (Name)
                    { width: 15 }, // Celkové Body (Total Points)
                    { width: 15 }, // Počet Návštěv (Visit Count)
                ];
            } else if (summaryColumnDefinitions.length) {
                // Use provided summary column definitions
                cHeaders = summaryColumnDefinitions.map(col => col.header);
                cDataColumns = summaryColumnDefinitions.map(col => ({ width: col.width || 20 }));
            }
            
            // Add the cumulative headers row
            const cHeaderRow = summarySheet.addRow(cHeaders);
            cHeaderRow.eachCell((cell) => {
                applyCellStyle(cell, { bold: true, alignment: { horizontal: 'center' }, background: 'FFE8F5E9' });
            });
            
            // Set column widths for cumulative sheet
            cDataColumns.forEach((col, index) => {
                const excelColName = String.fromCharCode(65 + index); // A, B, C, etc.
                summarySheet.getColumn(excelColName).width = col.width;
            });
            
            // Add cumulative data under the headers
            if (isVisitData && !summaryColumnDefinitions.length) {
                // Default for VisitData
                transformVisitDataToCumulative(data as unknown as VisitData[]).forEach((entry) => {
                    summarySheet.addRow([
                        entry.fullName,
                        entry.totalPoints,
                        entry.totalVisits
                    ]);
                });
            } else if (summaryColumnDefinitions.length) {
                const summaryData = data.map(entry => {
                    const summaryEntry: Record<string, unknown> = {};
                    summaryColumnDefinitions.forEach(col => {
                        const value = entry[col.key as keyof TData];
                        summaryEntry[col.key] = value !== undefined && value !== null ? value : 'N/A';
                    });
                    return summaryEntry;
                });
                
                summaryData.forEach((entry: Record<string, unknown>) => {
                    const rowData = summaryColumnDefinitions.map(col => {
                        const value = entry[col.key];
                        return value !== undefined && value !== null ? value : 'N/A';
                    });
                    summarySheet.addRow(rowData);
                });
            }
        }
        
        return workbook;
    };
    
    return (
        <Button
            variant="outline"
            size="sm"
            disabled={isExporting}
            onClick={handleDownload}
            className="flex items-center gap-2"
        >
            {isExporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
                <FileDown className="h-4 w-4" />
            )}
            <span>Stáhnout</span>
        </Button>
    );
};