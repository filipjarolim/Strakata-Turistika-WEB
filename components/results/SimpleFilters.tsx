'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Filter, 
  Search,
  X,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Calendar,
  Award,
  FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SimpleFilterState {
  searchQuery?: string;
  showOnlyMyVisits?: boolean;
  sortBy?: 'visitDate' | 'points' | 'routeTitle';
  sortDescending?: boolean;
}

interface SimpleFiltersProps {
  filters: SimpleFilterState;
  onFiltersChange: (filters: SimpleFilterState) => void;
  onClearFilters: () => void;
  isLoading?: boolean;
  className?: string;
  currentUserId?: string;
  showSort?: boolean;
  onSortChange?: (sortBy: 'visitDate' | 'points' | 'routeTitle', descending: boolean) => void;
}

export function SimpleFilters({ 
  filters, 
  onFiltersChange, 
  onClearFilters, 
  isLoading = false,
  className,
  currentUserId,
  showSort = false,
  onSortChange
}: SimpleFiltersProps) {
  
  const hasActiveFilters = () => {
    return !!(
      filters.searchQuery ||
      filters.showOnlyMyVisits
    );
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.searchQuery) count++;
    if (filters.showOnlyMyVisits) count++;
    return count;
  };

  const updateFilter = (key: keyof SimpleFilterState, value: string | boolean | undefined) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const removeFilter = (filterKey: keyof SimpleFilterState) => {
    const newFilters = { ...filters };
    delete newFilters[filterKey];
    onFiltersChange(newFilters);
  };

  const clearAllFilters = () => {
    onClearFilters();
  };

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {/* Main filter row */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Hledat trasy, místa..."
            value={filters.searchQuery || ''}
            onChange={(e) => {
              updateFilter('searchQuery', e.target.value);
              // Also call onFiltersChange to update parent immediately for better UX
              onFiltersChange({
                ...filters,
                searchQuery: e.target.value
              });
            }}
            className="pl-10"
            disabled={isLoading}
          />
        </div>

        {/* Filter Actions */}
        <div className="flex gap-2">
          {/* My Visits Toggle */}
          {currentUserId && (
            <Button
              variant={filters.showOnlyMyVisits ? "default" : "outline"}
              size="sm"
              onClick={() => updateFilter('showOnlyMyVisits', !filters.showOnlyMyVisits)}
              disabled={isLoading}
            >
              Moje návštěvy
            </Button>
          )}

          {/* Clear Filters */}
          {hasActiveFilters() && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearAllFilters}
              disabled={isLoading}
              className="flex items-center gap-1"
            >
              <X className="h-4 w-4" />
              Vymazat
              {getActiveFilterCount() > 1 && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  {getActiveFilterCount()}
                </Badge>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Sort Buttons */}
      {showSort && onSortChange && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm text-muted-foreground hidden sm:inline">Řadit podle:</span>
          <Button
            variant={filters.sortBy === 'visitDate' ? "default" : "outline"}
            size="sm"
            onClick={() => {
              const isCurrent = filters.sortBy === 'visitDate';
              const descending = isCurrent ? !filters.sortDescending : true;
              onSortChange('visitDate', descending);
            }}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <Calendar className="h-4 w-4" />
            Datum
            {filters.sortBy === 'visitDate' && (filters.sortDescending ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />)}
          </Button>
          <Button
            variant={filters.sortBy === 'points' ? "default" : "outline"}
            size="sm"
            onClick={() => {
              const isCurrent = filters.sortBy === 'points';
              const descending = isCurrent ? !filters.sortDescending : true;
              onSortChange('points', descending);
            }}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <Award className="h-4 w-4" />
            Body
            {filters.sortBy === 'points' && (filters.sortDescending ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />)}
          </Button>
          <Button
            variant={filters.sortBy === 'routeTitle' ? "default" : "outline"}
            size="sm"
            onClick={() => {
              const isCurrent = filters.sortBy === 'routeTitle';
              const descending = isCurrent ? !filters.sortDescending : true;
              onSortChange('routeTitle', descending);
            }}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <FileText className="h-4 w-4" />
            Název
            {filters.sortBy === 'routeTitle' && (filters.sortDescending ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />)}
          </Button>
        </div>
      )}

      {/* Active Filters Display */}
      {hasActiveFilters() && (
        <div className="flex flex-wrap gap-2">
          {filters.searchQuery && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Search className="h-3 w-3" />
              &quot;{filters.searchQuery}&quot;
              <X 
                className="h-3 w-3 cursor-pointer hover:text-red-500" 
                onClick={() => removeFilter('searchQuery')}
              />
            </Badge>
          )}
          {filters.showOnlyMyVisits && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Moje návštěvy
              <X 
                className="h-3 w-3 cursor-pointer hover:text-red-500" 
                onClick={() => removeFilter('showOnlyMyVisits')}
              />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
