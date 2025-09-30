'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Filter, 
  Search,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SimpleFilterState {
  searchQuery?: string;
  showOnlyMyVisits?: boolean;
}

interface SimpleFiltersProps {
  filters: SimpleFilterState;
  onFiltersChange: (filters: SimpleFilterState) => void;
  onClearFilters: () => void;
  isLoading?: boolean;
  className?: string;
  currentUserId?: string;
}

export function SimpleFilters({ 
  filters, 
  onFiltersChange, 
  onClearFilters, 
  isLoading = false,
  className,
  currentUserId
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

  const updateFilter = (key: keyof SimpleFilterState, value: any) => {
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
            onChange={(e) => updateFilter('searchQuery', e.target.value)}
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

      {/* Active Filters Display */}
      {hasActiveFilters() && (
        <div className="flex flex-wrap gap-2">
          {filters.searchQuery && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Search className="h-3 w-3" />
              "{filters.searchQuery}"
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
