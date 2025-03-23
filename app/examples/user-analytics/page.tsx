'use client';

import React, { useState } from 'react';
import { DataTable } from '@/components/blocks/vysledky/DataTable';
import { ColumnDef } from '@tanstack/react-table';
import CommonPageTemplate from '@/components/structure/CommonPageTemplate';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useCurrentRole } from '@/hooks/use-current-role';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ArrowUpDown, CheckCircle, XCircle, Activity, User, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// User analytics data type
type UserAnalytics = {
    id: string;
    username: string;
    email: string;
    registrationDate: string;
    lastLoginDate: string;
    sessionsCount: number;
    avgSessionDuration: number; // in minutes
    isActive: boolean;
    userType: 'free' | 'premium' | 'admin';
    region: string;
    conversions: number;
    engagement: number; // 0-100 score
};

// Sample user analytics data
const sampleUserAnalytics: UserAnalytics[] = [
    {
        id: '1',
        username: 'johndoe',
        email: 'john.doe@example.com',
        registrationDate: '2023-01-15',
        lastLoginDate: '2023-08-25',
        sessionsCount: 187,
        avgSessionDuration: 23.5,
        isActive: true,
        userType: 'premium',
        region: 'North America',
        conversions: 12,
        engagement: 87
    },
    {
        id: '2',
        username: 'janedoe',
        email: 'jane.doe@example.com',
        registrationDate: '2023-02-21',
        lastLoginDate: '2023-08-20',
        sessionsCount: 134,
        avgSessionDuration: 18.2,
        isActive: true,
        userType: 'premium',
        region: 'Europe',
        conversions: 8,
        engagement: 72
    },
    {
        id: '3',
        username: 'mikebrown',
        email: 'mike.brown@example.com',
        registrationDate: '2023-03-10',
        lastLoginDate: '2023-08-15',
        sessionsCount: 56,
        avgSessionDuration: 12.7,
        isActive: false,
        userType: 'free',
        region: 'Asia',
        conversions: 2,
        engagement: 45
    },
    {
        id: '4',
        username: 'sarahsmith',
        email: 'sarah.smith@example.com',
        registrationDate: '2023-04-05',
        lastLoginDate: '2023-08-22',
        sessionsCount: 98,
        avgSessionDuration: 15.3,
        isActive: true,
        userType: 'free',
        region: 'Europe',
        conversions: 5,
        engagement: 67
    },
    {
        id: '5',
        username: 'adminuser',
        email: 'admin@example.com',
        registrationDate: '2022-11-01',
        lastLoginDate: '2023-08-25',
        sessionsCount: 432,
        avgSessionDuration: 45.8,
        isActive: true,
        userType: 'admin',
        region: 'North America',
        conversions: 0,
        engagement: 95
    },
    {
        id: '6',
        username: 'robert_jackson',
        email: 'robert.j@example.com',
        registrationDate: '2023-05-12',
        lastLoginDate: '2023-08-10',
        sessionsCount: 42,
        avgSessionDuration: 9.6,
        isActive: false,
        userType: 'free',
        region: 'South America',
        conversions: 0,
        engagement: 32
    },
    {
        id: '7',
        username: 'emily_wong',
        email: 'emily.w@example.com',
        registrationDate: '2023-06-23',
        lastLoginDate: '2023-08-23',
        sessionsCount: 75,
        avgSessionDuration: 27.4,
        isActive: true,
        userType: 'premium',
        region: 'Asia',
        conversions: 9,
        engagement: 82
    },
    {
        id: '8',
        username: 'carlos_rodriguez',
        email: 'carlos.r@example.com',
        registrationDate: '2023-02-15',
        lastLoginDate: '2023-07-30',
        sessionsCount: 118,
        avgSessionDuration: 21.3,
        isActive: true,
        userType: 'premium',
        region: 'South America',
        conversions: 7,
        engagement: 78
    },
    {
        id: '9',
        username: 'alex_moore',
        email: 'alex.m@example.com',
        registrationDate: '2023-07-18',
        lastLoginDate: '2023-08-24',
        sessionsCount: 23,
        avgSessionDuration: 14.2,
        isActive: true,
        userType: 'free',
        region: 'Europe',
        conversions: 1,
        engagement: 56
    },
    {
        id: '10',
        username: 'superadmin',
        email: 'superadmin@example.com',
        registrationDate: '2022-10-05',
        lastLoginDate: '2023-08-26',
        sessionsCount: 512,
        avgSessionDuration: 52.7,
        isActive: true,
        userType: 'admin',
        region: 'North America',
        conversions: 0,
        engagement: 98
    }
];

// Get unique regions for the filter
const uniqueRegions = [...new Set(sampleUserAnalytics.map(user => user.region))];
const regionFilterOptions = uniqueRegions.map(region => ({
    value: region,
    label: region
}));

// Create user types for filter options
const userTypeFilterOptions = [
    { value: 'free', label: 'Free' },
    { value: 'premium', label: 'Premium' },
    { value: 'admin', label: 'Admin' }
];

// Column definitions for user analytics
const userAnalyticsColumns: ColumnDef<UserAnalytics>[] = [
    {
        accessorKey: 'username',
        header: ({ column }) => (
            <div className="flex items-center space-x-1">
                <User className="h-4 w-4 mr-1" />
                <span>Username</span>
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
        accessorKey: 'email',
        header: "Email",
    },
    {
        accessorKey: 'userType',
        header: ({ column }) => (
            <div className="flex items-center space-x-1">
                <span>User Type</span>
                <button
                    className="p-0 m-0 h-auto w-auto"
                    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                >
                    <ArrowUpDown className="h-4 w-4" />
                </button>
            </div>
        ),
        cell: ({ row }) => {
            const userType = row.getValue('userType') as string;
            const typeColors: Record<string, string> = {
                'premium': 'bg-amber-100 text-amber-800 border-amber-300',
                'free': 'bg-blue-100 text-blue-800 border-blue-300',
                'admin': 'bg-purple-100 text-purple-800 border-purple-300'
            };
            
            return (
                <Badge variant="outline" className={`${typeColors[userType] || ''}`}>
                    {userType.charAt(0).toUpperCase() + userType.slice(1)}
                </Badge>
            );
        }
    },
    {
        accessorKey: 'region',
        header: ({ column }) => (
            <div className="flex items-center space-x-1">
                <span>Region</span>
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
        accessorKey: 'registrationDate',
        header: "Registration Date",
        cell: ({ row }) => {
            const date = row.getValue('registrationDate') as string;
            return new Date(date).toLocaleDateString();
        },
    },
    {
        accessorKey: 'lastLoginDate',
        header: "Last Login",
        cell: ({ row }) => {
            const date = row.getValue('lastLoginDate') as string;
            return new Date(date).toLocaleDateString();
        },
    },
    {
        accessorKey: 'sessionsCount',
        header: ({ column }) => (
            <div className="flex items-center space-x-1 justify-end">
                <span>Sessions</span>
                <button
                    className="p-0 m-0 h-auto w-auto"
                    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                >
                    <ArrowUpDown className="h-4 w-4" />
                </button>
            </div>
        ),
        cell: ({ row }) => {
            return <div className="text-right">{row.getValue('sessionsCount')}</div>;
        },
    },
    {
        accessorKey: 'avgSessionDuration',
        header: ({ column }) => (
            <div className="flex items-center space-x-1 justify-end">
                <span>Avg. Session</span>
                <button
                    className="p-0 m-0 h-auto w-auto"
                    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                >
                    <ArrowUpDown className="h-4 w-4" />
                </button>
            </div>
        ),
        cell: ({ row }) => {
            const duration = row.getValue('avgSessionDuration') as number;
            return <div className="text-right">{duration.toFixed(1)} min</div>;
        },
    },
    {
        accessorKey: 'engagement',
        header: ({ column }) => (
            <div className="flex items-center space-x-1 justify-end">
                <Activity className="h-4 w-4 mr-1" />
                <span>Engagement</span>
                <button
                    className="p-0 m-0 h-auto w-auto"
                    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                >
                    <ArrowUpDown className="h-4 w-4" />
                </button>
            </div>
        ),
        cell: ({ row }) => {
            const engagement = row.getValue('engagement') as number;
            const getColor = () => {
                if (engagement >= 80) return 'bg-green-500';
                if (engagement >= 50) return 'bg-yellow-500';
                return 'bg-red-500';
            };
            
            return (
                <div className="flex items-center justify-end">
                    <span className="mr-2">{engagement}%</span>
                    <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                            className={`h-full ${getColor()}`}
                            style={{ width: `${engagement}%` }}
                        />
                    </div>
                </div>
            );
        },
    },
    {
        accessorKey: 'isActive',
        header: "Status",
        cell: ({ row }) => {
            const isActive = row.getValue('isActive') as boolean;
            
            return isActive ? (
                <div className="flex items-center text-green-600">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    <span>Active</span>
                </div>
            ) : (
                <div className="flex items-center text-red-600">
                    <XCircle className="h-4 w-4 mr-1" />
                    <span>Inactive</span>
                </div>
            );
        },
    },
];

// Transform to region view for aggregation
const transformToRegionView = (users: UserAnalytics[]): any[] => {
    const regionSummary = new Map<string, { 
        region: string, 
        userCount: number, 
        activeUsers: number,
        premiumUsers: number,
        avgEngagement: number,
        totalSessions: number,
        avgSessionDuration: number
    }>();

    users.forEach(user => {
        const existing = regionSummary.get(user.region);
        
        if (existing) {
            existing.userCount += 1;
            existing.activeUsers += user.isActive ? 1 : 0;
            existing.premiumUsers += user.userType === 'premium' ? 1 : 0;
            existing.totalSessions += user.sessionsCount;
            existing.avgEngagement = (existing.avgEngagement * (existing.userCount - 1) + user.engagement) / existing.userCount;
            existing.avgSessionDuration = (existing.avgSessionDuration * (existing.userCount - 1) + user.avgSessionDuration) / existing.userCount;
        } else {
            regionSummary.set(user.region, {
                region: user.region,
                userCount: 1,
                activeUsers: user.isActive ? 1 : 0,
                premiumUsers: user.userType === 'premium' ? 1 : 0,
                avgEngagement: user.engagement,
                totalSessions: user.sessionsCount,
                avgSessionDuration: user.avgSessionDuration
            });
        }
    });

    // Format values to avoid NaN display issues
    return Array.from(regionSummary.values()).map(item => ({
        ...item,
        avgEngagement: Number(item.avgEngagement.toFixed(1)),
        avgSessionDuration: Number(item.avgSessionDuration.toFixed(1)),
        activePercentage: Number(((item.activeUsers / item.userCount) * 100).toFixed(1)),
        premiumPercentage: Number(((item.premiumUsers / item.userCount) * 100).toFixed(1)),
    }));
};

// Column definitions for region summary
const regionSummaryColumns = [
    {
        header: "Region",
        key: "region",
        width: 20
    },
    {
        header: "User Count",
        key: "userCount", 
        width: 15
    },
    {
        header: "Active Users",
        key: "activeUsers",
        width: 15
    },
    {
        header: "Active %",
        key: "activePercentage",
        width: 15
    },
    {
        header: "Premium Users",
        key: "premiumUsers",
        width: 15
    },
    {
        header: "Premium %",
        key: "premiumPercentage",
        width: 15
    },
    {
        header: "Avg. Engagement",
        key: "avgEngagement",
        width: 20
    },
    {
        header: "Total Sessions",
        key: "totalSessions",
        width: 20
    },
    {
        header: "Avg. Session Duration",
        key: "avgSessionDuration",
        width: 20
    }
];

const UserAnalyticsPage = () => {
    const [users] = useState<UserAnalytics[]>(sampleUserAnalytics);
    const user = useCurrentUser();
    const role = useCurrentRole();

    return (
        <CommonPageTemplate contents={{ complete: true }} currentUser={user} currentRole={role}>
            <div className="text-4xl font-bold mb-4 text-black/70 pt-4">
                User Analytics Dashboard
            </div>
            
            <div className="mb-6">
                <p className="text-lg text-gray-600">
                    This example demonstrates the generic DataTable component for user analytics data.
                </p>
            </div>

            <TooltipProvider>
                <DataTable 
                    data={users} 
                    columns={userAnalyticsColumns}
                    primarySortColumn="engagement"
                    primarySortDesc={true}
                    transformToAggregatedView={transformToRegionView}
                    filterConfig={{
                        dateField: 'registrationDate',
                        numberField: 'engagement',
                        customFilter: (item: UserAnalytics, filters: Record<string, any>) => {
                            // Filter for regions
                            if (filters.categories?.length > 0) {
                                return filters.categories.includes(item.region);
                            }
                            return true;
                        }
                    }}
                    enableDownload={true}
                    enableAggregatedView={true}
                    aggregatedViewLabel="Region View"
                    detailedViewLabel="User View"
                    enableColumnVisibility={true}
                    enableSearch={true}
                    excludedColumnsInAggregatedView={['email', 'username', 'registrationDate', 'lastLoginDate']}
                    filename="user-analytics"
                    mainSheetName="User Analytics"
                    summarySheetName="Region Summary"
                    generateSummarySheet={true}
                    summaryColumnDefinitions={regionSummaryColumns}
                    customFilterOptions={{
                        label: "Regions",
                        options: regionFilterOptions
                    }}
                />
            </TooltipProvider>
        </CommonPageTemplate>
    );
};

export default UserAnalyticsPage; 