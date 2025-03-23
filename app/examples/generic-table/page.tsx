'use client';

import React, { useState } from 'react';
import { DataTable } from '@/components/blocks/vysledky/DataTable';
import { ColumnDef } from '@tanstack/react-table';
import CommonPageTemplate from '@/components/structure/CommonPageTemplate';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useCurrentRole } from '@/hooks/use-current-role';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ArrowUpDown, Pencil, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// Sample dataset of products
type Product = {
    id: string;
    name: string;
    category: string;
    price: number;
    stock: number;
    rating: number;
    createdAt: string;
};

// Sample data
const sampleProducts: Product[] = [
    {
        id: '1',
        name: 'Smartphone X',
        category: 'Electronics',
        price: 899.99,
        stock: 143,
        rating: 4.5,
        createdAt: '2023-05-12'
    },
    {
        id: '2',
        name: 'Coffee Maker Deluxe',
        category: 'Home Appliances',
        price: 129.99,
        stock: 56,
        rating: 4.8,
        createdAt: '2023-06-23'
    },
    {
        id: '3',
        name: 'Running Shoes Pro',
        category: 'Sports',
        price: 149.99,
        stock: 78,
        rating: 4.3,
        createdAt: '2023-07-14'
    },
    {
        id: '4',
        name: 'Wireless Headphones',
        category: 'Electronics',
        price: 199.99,
        stock: 98,
        rating: 4.7,
        createdAt: '2023-04-30'
    },
    {
        id: '5',
        name: 'Protein Powder',
        category: 'Nutrition',
        price: 39.99,
        stock: 216,
        rating: 4.2,
        createdAt: '2023-08-05'
    },
    {
        id: '6',
        name: 'Laptop Pro',
        category: 'Electronics',
        price: 1299.99,
        stock: 45,
        rating: 4.9,
        createdAt: '2023-06-10'
    },
    {
        id: '7',
        name: 'Fitness Tracker',
        category: 'Wearables',
        price: 89.99,
        stock: 132,
        rating: 4.4,
        createdAt: '2023-07-22'
    },
    {
        id: '8',
        name: 'Blender Ultimate',
        category: 'Home Appliances',
        price: 79.99,
        stock: 64,
        rating: 4.1,
        createdAt: '2023-05-03'
    },
    {
        id: '9',
        name: 'Smart Watch',
        category: 'Wearables',
        price: 249.99,
        stock: 51,
        rating: 4.6,
        createdAt: '2023-04-15'
    },
    {
        id: '10',
        name: 'Bluetooth Speaker',
        category: 'Electronics',
        price: 129.99,
        stock: 87,
        rating: 4.3,
        createdAt: '2023-08-18'
    }
];

// Create column definitions
const productColumns: ColumnDef<Product>[] = [
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
                'Home Appliances': 'bg-green-100 text-green-800 border-green-300',
                'Sports': 'bg-purple-100 text-purple-800 border-purple-300',
                'Nutrition': 'bg-amber-100 text-amber-800 border-amber-300',
                'Wearables': 'bg-pink-100 text-pink-800 border-pink-300'
            };
            
            return (
                <Badge variant="outline" className={`${categoryColors[category] || 'bg-gray-100 text-gray-800 border-gray-300'}`}>
                    {category}
                </Badge>
            );
        }
    },
    {
        accessorKey: 'price',
        header: ({ column }) => (
            <div className="flex items-center space-x-1 justify-end">
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
            const price = parseFloat(row.getValue('price'));
            return <div className="text-right font-medium">${price.toFixed(2)}</div>;
        },
    },
    {
        accessorKey: 'stock',
        header: ({ column }) => (
            <div className="flex items-center space-x-1 justify-end">
                <span>Stock</span>
                <button
                    className="p-0 m-0 h-auto w-auto"
                    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                >
                    <ArrowUpDown className="h-4 w-4" />
                </button>
            </div>
        ),
        cell: ({ row }) => {
            const stock = parseInt(row.getValue('stock'));
            return <div className="text-right font-medium">{stock}</div>;
        },
    },
    {
        accessorKey: 'rating',
        header: ({ column }) => (
            <div className="flex items-center space-x-1 justify-end">
                <span>Rating</span>
                <button
                    className="p-0 m-0 h-auto w-auto"
                    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                >
                    <ArrowUpDown className="h-4 w-4" />
                </button>
            </div>
        ),
        cell: ({ row }) => {
            const rating = parseFloat(row.getValue('rating'));
            return <div className="text-right font-medium">{rating} ★</div>;
        },
    },
    {
        accessorKey: 'createdAt',
        header: ({ column }) => (
            <div className="flex items-center space-x-1">
                <span>Created Date</span>
                <button
                    className="p-0 m-0 h-auto w-auto"
                    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                >
                    <ArrowUpDown className="h-4 w-4" />
                </button>
            </div>
        ),
        cell: ({ row }) => {
            const date = row.getValue('createdAt') as string;
            return new Date(date).toLocaleDateString();
        },
    },
    {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
            return (
                <div className="flex space-x-2">
                    <Button variant="ghost" size="icon">
                        <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                        <Trash className="h-4 w-4" />
                    </Button>
                </div>
            );
        },
    },
];

// Get unique categories for the filter
const uniqueCategories = [...new Set(sampleProducts.map(product => product.category))];

// Define a type for the category summary data
type CategorySummary = {
    category: string; 
    count: number;
    totalValue: number;
    averagePrice: number;
    averageRating: number;
}

// Transform to category view
const transformProductsToCategoryView = (products: Product[]): CategorySummary[] => {
    const categorySummary = new Map<string, CategorySummary>();

    products.forEach(product => {
        const existingCategory = categorySummary.get(product.category);
        
        if (existingCategory) {
            existingCategory.count += 1;
            existingCategory.totalValue += product.price * product.stock;
            existingCategory.averagePrice = 
                (existingCategory.averagePrice * (existingCategory.count - 1) + product.price) / existingCategory.count;
            existingCategory.averageRating = 
                (existingCategory.averageRating * (existingCategory.count - 1) + product.rating) / existingCategory.count;
        } else {
            categorySummary.set(product.category, {
                category: product.category,
                count: 1,
                totalValue: product.price * product.stock,
                averagePrice: product.price,
                averageRating: product.rating
            });
        }
    });

    // Format values properly to avoid NaN display issues
    return Array.from(categorySummary.values()).map(item => ({
        ...item,
        totalValue: Number((item.totalValue).toFixed(2)),
        averagePrice: Number((item.averagePrice).toFixed(2)),
        averageRating: Number((item.averageRating).toFixed(1))
    }));
};

// Create product categories for filter options
const productCategories = uniqueCategories.map(category => ({
    value: category,
    label: category
}));

// Column definitions for summary view
const summaryCategoryColumns = [
    {
        header: "Category",
        key: "category",
        width: 20
    },
    {
        header: "Product Count",
        key: "count", 
        width: 15
    },
    {
        header: "Total Inventory Value",
        key: "totalValue",
        width: 25
    },
    {
        header: "Average Price",
        key: "averagePrice",
        width: 20
    },
    {
        header: "Average Rating",
        key: "averageRating",
        width: 20
    }
];

const GenericTableExamplePage = () => {
    const [products] = useState<Product[]>(sampleProducts);
    const user = useCurrentUser();
    const role = useCurrentRole();

    return (
        <CommonPageTemplate contents={{ complete: true }} currentUser={user} currentRole={role}>
            <div className="text-4xl font-bold mb-4 text-black/70 pt-4">
                Generic DataTable Example
            </div>
            
            <div className="mb-6">
                <p className="text-lg">
                    This example demonstrates the generic DataTable component with:
                </p>
                <ul className="list-disc ml-6 mt-2 mb-4">
                    <li>Product dataset with custom columns</li>
                    <li>Date filtering on the &quot;Created Date&quot; field</li>
                    <li>Price range filtering</li>
                    <li>Category filtering with checkboxes</li>
                    <li>Aggregated view by category</li>
                </ul>
            </div>

            <TooltipProvider>
                <DataTable 
                    data={products} 
                    columns={productColumns}
                    primarySortColumn="rating"
                    primarySortDesc={true}
                    transformToAggregatedView={transformProductsToCategoryView as unknown as (data: Product[]) => Product[]}
                    filterConfig={{
                        dateField: 'createdAt',
                        numberField: 'price',
                        customFilter: (item: Product, filters: Record<string, unknown>) => {
                            // Filter for specific categories
                            if (filters.categories && Array.isArray(filters.categories) && filters.categories.length > 0) {
                                return filters.categories.includes(item.category);
                            }
                            return true;
                        }
                    }}
                    enableDownload={true}
                    enableAggregatedView={true}
                    aggregatedViewLabel="Category View"
                    detailedViewLabel="Product View"
                    enableColumnVisibility={true}
                    enableSearch={true}
                    excludedColumnsInAggregatedView={['createdAt', 'actions']}
                    filename="product-inventory"
                    mainSheetName="Product Inventory"
                    summarySheetName="Category Summary"
                    generateSummarySheet={true}
                    summaryColumnDefinitions={summaryCategoryColumns}
                    customFilterOptions={{
                        label: "Categories",
                        options: productCategories
                    }}
                />
            </TooltipProvider>
        </CommonPageTemplate>
    );
};

export default GenericTableExamplePage; 