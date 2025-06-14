'use client';

import React from 'react';
import { DataTable, columns, transformDataToAggregated, VisitData } from "@/components/blocks/vysledky/DataTable";

interface ResultsClientProps {
  data: VisitData[];
  year: number;
}

export function ResultsClient({ data, year }: ResultsClientProps) {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Výsledky {year}</h1>
      <DataTable
        data={data}
        columns={columns}
        year={year}
        primarySortColumn="points"
        primarySortDesc={true}
        transformToAggregatedView={transformDataToAggregated}
        enableDownload={true}
        enableAggregatedView={true}
        aggregatedViewLabel="Agregovaný přehled"
        detailedViewLabel="Detailní přehled"
        enableColumnVisibility={true}
        enableSearch={true}
        excludedColumnsInAggregatedView={["routeLink"]}
        mainSheetName="Data"
        summarySheetName="Souhrn"
        generateSummarySheet={true}
        filename={`vysledky-${year}`}
        loading={false}
        emptyStateMessage="Žádná data k zobrazení"
      />
    </div>
  );
} 