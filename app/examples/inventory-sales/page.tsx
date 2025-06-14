'use client';

import React, { useState } from 'react';
import { DataTable } from '@/components/blocks/vysledky/DataTable';
import { ColumnDef } from '@tanstack/react-table';
import CommonPageTemplate from '@/components/structure/CommonPageTemplate';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useCurrentRole } from '@/hooks/use-current-role';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ArrowUpDown, TrendingUp, TrendingDown, Package, DollarSign, Store, BarChart3 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// Inventory item data type
type InventoryItem = {
    id: string;
    sku: string;
    name: string;
    category: string;
    stockLevel: number;
    reorderPoint: number;
    unitCost: number;
    retailPrice: number;
    supplier: string;
    lastRestocked: string;
    salesLast30Days: number;
    profitMargin: number;
    location: string;
};

// Sample inventory data
const sampleInventoryData: InventoryItem[] = [
    {
        id: '1',
        sku: 'ECO-001',
        name: 'Eco-friendly Water Bottle',
        category: 'Kitchen',
        stockLevel: 145,
        reorderPoint: 50,
        unitCost: 8.50,
        retailPrice: 24.99,
        supplier: 'EcoGoods Inc.',
        lastRestocked: '2023-08-10',
        salesLast30Days: 67,
        profitMargin: 66,
        location: 'Warehouse A'
    },
    {
        id: '2',
        sku: 'TECH-056',
        name: 'Wireless Earbuds',
        category: 'Electronics',
        stockLevel: 82,
        reorderPoint: 30,
        unitCost: 35.20,
        retailPrice: 89.99,
        supplier: 'TechSupply Co.',
        lastRestocked: '2023-08-05',
        salesLast30Days: 124,
        profitMargin: 61,
        location: 'Warehouse B'
    },
    {
        id: '3',
        sku: 'HOME-112',
        name: 'Scented Candle Set',
        category: 'Home Decor',
        stockLevel: 210,
        reorderPoint: 100,
        unitCost: 12.75,
        retailPrice: 29.99,
        supplier: 'HomeEssentials Ltd.',
        lastRestocked: '2023-08-15',
        salesLast30Days: 86,
        profitMargin: 57,
        location: 'Warehouse A'
    },
    {
        id: '4',
        sku: 'APP-234',
        name: 'Cotton T-Shirt',
        category: 'Apparel',
        stockLevel: 324,
        reorderPoint: 150,
        unitCost: 6.20,
        retailPrice: 19.99,
        supplier: 'FashionWholesale Inc.',
        lastRestocked: '2023-08-20',
        salesLast30Days: 178,
        profitMargin: 69,
        location: 'Warehouse C'
    },
    {
        id: '5',
        sku: 'TECH-078',
        name: 'Smart Watch',
        category: 'Electronics',
        stockLevel: 42,
        reorderPoint: 25,
        unitCost: 125.00,
        retailPrice: 299.99,
        supplier: 'TechSupply Co.',
        lastRestocked: '2023-07-28',
        salesLast30Days: 53,
        profitMargin: 58,
        location: 'Warehouse B'
    },
    {
        id: '6',
        sku: 'BEAUTY-045',
        name: 'Moisturizing Face Cream',
        category: 'Beauty',
        stockLevel: 98,
        reorderPoint: 45,
        unitCost: 18.30,
        retailPrice: 42.99,
        supplier: 'BeautyCare Co.',
        lastRestocked: '2023-08-08',
        salesLast30Days: 62,
        profitMargin: 57,
        location: 'Warehouse A'
    },
    {
        id: '7',
        sku: 'FOOD-123',
        name: 'Organic Coffee Beans',
        category: 'Food',
        stockLevel: 63,
        reorderPoint: 40,
        unitCost: 10.50,
        retailPrice: 22.99,
        supplier: 'OrganicFoods Ltd.',
        lastRestocked: '2023-08-12',
        salesLast30Days: 89,
        profitMargin: 54,
        location: 'Warehouse C'
    },
    {
        id: '8',
        sku: 'HOME-156',
        name: 'Throw Pillow Set',
        category: 'Home Decor',
        stockLevel: 87,
        reorderPoint: 40,
        unitCost: 22.45,
        retailPrice: 49.99,
        supplier: 'HomeEssentials Ltd.',
        lastRestocked: '2023-08-02',
        salesLast30Days: 42,
        profitMargin: 55,
        location: 'Warehouse A'
    },
    {
        id: '9',
        sku: 'TECH-102',
        name: 'Bluetooth Speaker',
        category: 'Electronics',
        stockLevel: 58,
        reorderPoint: 35,
        unitCost: 45.30,
        retailPrice: 119.99,
        supplier: 'TechSupply Co.',
        lastRestocked: '2023-07-25',
        salesLast30Days: 71,
        profitMargin: 62,
        location: 'Warehouse B'
    },
    {
        id: '10',
        sku: 'KIDS-078',
        name: 'Educational Puzzle Set',
        category: 'Kids',
        stockLevel: 112,
        reorderPoint: 60,
        unitCost: 15.75,
        retailPrice: 34.99,
        supplier: 'KidsPlay Inc.',
        lastRestocked: '2023-08-18',
        salesLast30Days: 58,
        profitMargin: 55,
        location: 'Warehouse C'
    }
];

// Get unique categories for filtering
const uniqueCategories = [...new Set(sampleInventoryData.map(item => item.category))];
const categoryFilterOptions = uniqueCategories.map(category => ({
    value: category,
    label: category
}));

// Column definitions for inventory data
const inventoryColumns: ColumnDef<InventoryItem>[] = [
    {
        accessorKey: 'sku',
        header: "SKU",
    },
    {
        accessorKey: 'name',
        header: ({ column }) => (
            <div className="flex items-center space-x-1">
                <span>Product Name</span>
                <button
                    className="p-0 m-0 h-auto w-auto"
                    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                >
                    <ArrowUpDown className="h-4 w-4" />
                </button>
            </div>
        ),
    },
    {
        accessorKey: 'category',
        header: ({ column }) => (
            <div className="flex items-center space-x-1">
                <span>Category</span>
                <button
                    className="p-0 m-0 h-auto w-auto"
                    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                >
                    <ArrowUpDown className="h-4 w-4" />
                </button>
            </div>
        ),
        cell: ({ row }) => {
            const category = row.getValue('category') as string;
            const categoryColors: Record<string, string> = {
                'Electronics': 'bg-blue-100 text-blue-800 border-blue-300',
                'Kitchen': 'bg-green-100 text-green-800 border-green-300',
                'Home Decor': 'bg-amber-100 text-amber-800 border-amber-300',
                'Apparel': 'bg-purple-100 text-purple-800 border-purple-300',
                'Beauty': 'bg-pink-100 text-pink-800 border-pink-300',
                'Food': 'bg-yellow-100 text-yellow-800 border-yellow-300',
                'Kids': 'bg-indigo-100 text-indigo-800 border-indigo-300'
            };
            
            return (
                <Badge variant="outline" className={`${categoryColors[category] || ''}`}>
                    {category}
                </Badge>
            );
        }
    },
    {
        accessorKey: 'stockLevel',
        header: ({ column }) => (
            <div className="flex items-center space-x-1 justify-end">
                <Package className="h-4 w-4 mr-1" />
                <span>Stock Level</span>
                <button
                    className="p-0 m-0 h-auto w-auto"
                    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                >
                    <ArrowUpDown className="h-4 w-4" />
                </button>
            </div>
        ),
        cell: ({ row }) => {
            const stockLevel = row.getValue('stockLevel') as number;
            const reorderPoint = row.original.reorderPoint;
            
            let stockClass = 'text-green-600';
            if (stockLevel <= reorderPoint) {
                stockClass = 'text-red-600 font-bold';
            } else if (stockLevel <= reorderPoint * 1.5) {
                stockClass = 'text-amber-600';
            }
            
            return <div className={`text-right ${stockClass}`}>{stockLevel}</div>;
        },
    },
    {
        accessorKey: 'retailPrice',
        header: ({ column }) => (
            <div className="flex items-center space-x-1 justify-end">
                <DollarSign className="h-4 w-4 mr-1" />
                <span>Price</span>
                <button
                    className="p-0 m-0 h-auto w-auto"
                    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                >
                    <ArrowUpDown className="h-4 w-4" />
                </button>
            </div>
        ),
        cell: ({ row }) => {
            const price = row.getValue('retailPrice') as number;
            return <div className="text-right">${price.toFixed(2)}</div>;
        },
    },
    {
        accessorKey: 'salesLast30Days',
        header: ({ column }) => (
            <div className="flex items-center space-x-1 justify-end">
                <BarChart3 className="h-4 w-4 mr-1" />
                <span>30-Day Sales</span>
                <button
                    className="p-0 m-0 h-auto w-auto"
                    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                >
                    <ArrowUpDown className="h-4 w-4" />
                </button>
            </div>
        ),
        cell: ({ row }) => {
            return <div className="text-right">{row.getValue('salesLast30Days')}</div>;
        },
    },
    {
        accessorKey: 'profitMargin',
        header: ({ column }) => (
            <div className="flex items-center space-x-1 justify-end">
                <span>Profit Margin</span>
                <button
                    className="p-0 m-0 h-auto w-auto"
                    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                >
                    <ArrowUpDown className="h-4 w-4" />
                </button>
            </div>
        ),
        cell: ({ row }) => {
            const margin = row.getValue('profitMargin') as number;
            const marginIcon = margin > 60 ? 
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" /> : 
                <TrendingDown className="h-4 w-4 text-amber-500 mr-1" />;
            
            return (
                <div className="text-right flex items-center justify-end">
                    {marginIcon}
                    <span>{margin}%</span>
                </div>
            );
        },
    },
    {
        accessorKey: 'lastRestocked',
        header: "Last Restocked",
        cell: ({ row }) => {
            const date = row.getValue('lastRestocked') as string;
            return new Date(date).toLocaleDateString();
        },
    },
    {
        accessorKey: 'supplier',
        header: "Supplier",
    },
    {
        accessorKey: 'location',
        header: ({ column }) => (
            <div className="flex items-center space-x-1">
                <Store className="h-4 w-4 mr-1" />
                <span>Location</span>
                <button
                    className="p-0 m-0 h-auto w-auto"
                    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                >
                    <ArrowUpDown className="h-4 w-4" />
                </button>
            </div>
        ),
    }
];

// Define a type for the category summary
type CategorySummary = {
    category: string;
    itemCount: number;
    totalStock: number;
    averagePrice: number;
    totalSales: number;
    averageMargin: number;
    totalValue: number;
};

// Define AggregatedVisitData type locally
type AggregatedVisitData = {
    year: number;
    totalPoints: number;
    visitCount: number;
    visitedPlaces: Set<string>;
    averagePoints: number;
    lastVisit: Date;
    category: string;
    dogNotAllowed: Set<string>;
    routeTitles: Set<string>;
};

// Update the transformation function
const transformToAggregatedView = (items: InventoryItem[]): AggregatedVisitData[] => {
    return items.map(item => ({
        year: new Date(item.lastRestocked).getFullYear(),
        totalPoints: item.stockLevel,
        visitCount: item.salesLast30Days,
        visitedPlaces: new Set([item.category]),
        averagePoints: item.stockLevel / item.salesLast30Days,
        lastVisit: new Date(item.lastRestocked),
        category: item.category,
        dogNotAllowed: new Set(),
        routeTitles: new Set([item.name]),
    }));
};

// Column definitions for category summary
const categorySummaryColumns = [
    {
        header: "Category",
        key: "category",
        width: 20
    },
    {
        header: "Item Count",
        key: "itemCount", 
        width: 15
    },
    {
        header: "Total Stock",
        key: "totalStock",
        width: 15
    },
    {
        header: "Avg. Price",
        key: "averagePrice",
        width: 15
    },
    {
        header: "Avg. Margin",
        key: "averageMargin",
        width: 15
    },
    {
        header: "30-Day Sales",
        key: "totalSales",
        width: 15
    },
    {
        header: "Total Inventory Value",
        key: "totalValue",
        width: 25
    }
];

const InventorySalesPage = () => {
    const [inventory] = useState<InventoryItem[]>(sampleInventoryData);
    const user = useCurrentUser();
    const role = useCurrentRole();

    return (
        <CommonPageTemplate contents={{ complete: true }} currentUser={user} currentRole={role}>
            <div className="text-4xl font-bold mb-4 text-black/70 pt-4">
                Inventory & Sales Dashboard
            </div>
            
            <div className="mb-6">
                <p className="text-lg text-gray-600">
                    This example demonstrates the generic DataTable component for inventory and sales data.
                </p>
            </div>

            <TooltipProvider>
                <DataTable 
                    data={inventory} 
                    columns={inventoryColumns}
                    primarySortColumn="salesLast30Days"
                    primarySortDesc={true}
                    transformToAggregatedView={transformToAggregatedView}
                    filterConfig={{
                        dateField: 'lastRestocked',
                        numberField: 'stockLevel',
                        customFilter: (item: InventoryItem, filters: Record<string, unknown>) => {
                            // Filter for categories
                            if (filters.categories && 
                                Array.isArray(filters.categories) && 
                                filters.categories.length > 0) {
                                return filters.categories.includes(item.category);
                            }
                            return true;
                        }
                    }}
                    enableDownload={true}
                    enableAggregatedView={true}
                    aggregatedViewLabel="Category Summary"
                    detailedViewLabel="Product Details"
                    enableColumnVisibility={true}
                    enableSearch={true}
                    excludedColumnsInAggregatedView={['sku', 'name', 'stockLevel', 'lastRestocked', 'supplier', 'location']}
                    filename="inventory-data"
                    mainSheetName="Inventory"
                    summarySheetName="Category Summary"
                    generateSummarySheet={true}
                />
            </TooltipProvider>
        </CommonPageTemplate>
    );
};

export default InventorySalesPage; 