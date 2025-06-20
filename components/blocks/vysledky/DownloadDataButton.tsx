'use client';

import React, { useState } from 'react';
import { IOSButton } from '@/components/ui/ios/button';
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

interface DownloadDataButtonProps<TData> {
    data: TData[];
    columns: Column<TData>[];
    filename?: string;
    sheetName?: string;
    includeHeaders?: boolean;
    includeCumulativeSheet?: boolean;
    className?: string;
}

export const DownloadDataButton = <TData extends VisitData>({
    data,
    columns,
    filename = 'data',
    sheetName = 'Data',
    includeHeaders = true,
    includeCumulativeSheet = true,
    className
}: DownloadDataButtonProps<TData>) => {
    const [isExporting, setIsExporting] = useState(false);
    
    const handleDownload = async () => {
        try {
            setIsExporting(true);

            // Create a new workbook
        const workbook = new ExcelJS.Workbook();

            // Add the main data sheet
            const worksheet = workbook.addWorksheet(sheetName);
        
            // Add headers if requested
            if (includeHeaders) {
                worksheet.addRow(
                    columns
                        .filter(col => col.getIsVisible())
                        .map(col => col.columnDef.header?.toString() || col.id)
                );
            }

            // Add data rows
            data.forEach(row => {
                const rowData = columns
                    .filter(col => col.getIsVisible())
                    .map(col => {
                        const value = col.accessorFn?.(row, 0);
                        if (value instanceof Date) {
                            return value.toLocaleDateString('cs-CZ');
                        }
                        return value;
                    });
                worksheet.addRow(rowData);
            });

            // Style the worksheet
            worksheet.columns.forEach(column => {
                column.width = 15;
            });

            // Add cumulative sheet if requested
            if (includeCumulativeSheet) {
                const cumulativeSheet = workbook.addWorksheet('Souhrn');
                const cumulativeData = transformVisitDataToCumulative(data);
            
                // Add headers
                cumulativeSheet.addRow(['Jméno', 'Celkem bodů', 'Počet návštěv']);

                // Add data
                cumulativeData.forEach(row => {
                    cumulativeSheet.addRow([row.fullName, row.totalPoints, row.totalVisits]);
            });
            
                // Style the cumulative sheet
                cumulativeSheet.columns.forEach(column => {
                    column.width = 15;
            });
            }

            // Generate buffer
            const buffer = await workbook.xlsx.writeBuffer();

            // Save file
            saveAs(
                new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
                `${filename}.xlsx`
            );
        } catch (error) {
            console.error('Error exporting data:', error);
        } finally {
            setIsExporting(false);
        }
    };
    
    return (
        <IOSButton
            variant="outline"
            size="sm"
            disabled={isExporting}
            onClick={handleDownload}
            icon={isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
            className={className}
        >
            Stáhnout
        </IOSButton>
    );
};