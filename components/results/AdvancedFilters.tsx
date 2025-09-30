'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Filter, 
  X, 
  Calendar as CalendarIcon,
  Minus,
  Plus,
  Search,
  Award,
  MapPin
} from 'lucide-react';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export interface FilterState {
  // Date filters
  dateRange?: {
    from?: Date;
    to?: Date;
  };
  
  // Points range
  pointsRange?: {
    min?: number;
    max?: number;
  };
  
  // Distance range
  distanceRange?: {
    min?: number;
    max?: number;
  };
  
  // User filter
  userId?: string;
  
  // Dog restrictions
  dogRestrictions?: 'all' | 'allowed' | 'not_allowed';
  
  // Route type
  routeType?: 'all' | 'with_route' | 'without_route';
  
  // Search query
  searchQuery?: string;
}

interface AdvancedFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onClearFilters: () => void;
  isLoading?: boolean;
  className?: string;
}

export function AdvancedFilters({ 
  filters, 
  onFiltersChange, 
  onClearFilters, 
  isLoading = false,
  className 
}: AdvancedFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempFilters, setTempFilters] = useState<FilterState>(filters);

  const hasActiveFilters = () => {
    return !!(
      filters.dateRange?.from || 
      filters.dateRange?.to ||
      filters.pointsRange?.min ||
      filters.pointsRange?.max ||
      filters.distanceRange?.min ||
      filters.distanceRange?.max ||
      filters.userId ||
      filters.dogRestrictions !== 'all' ||
      filters.routeType !== 'all' ||
      filters.searchQuery
    );
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.dateRange?.from || filters.dateRange?.to) count++;
    if (filters.pointsRange?.min || filters.pointsRange?.max) count++;
    if (filters.distanceRange?.min || filters.distanceRange?.max) count++;
    if (filters.userId) count++;
    if (filters.dogRestrictions !== 'all') count++;
    if (filters.routeType !== 'all') count++;
    if (filters.searchQuery) count++;
    return count;
  };

  const applyFilters = () => {
    onFiltersChange(tempFilters);
    setIsOpen(false);
  };

  const resetFilters = () => {
    setTempFilters({});
    onFiltersChange({});
    setIsOpen(false);
  };

  const updateTempFilter = (
    key: keyof FilterState, 
    value: string | number | undefined | { min?: number; max?: number } | { from?: Date; to?: Date }
  ) => {
    setTempFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const updatePointsRange = (type: 'min' | 'max', value: string) => {
    const numValue = value ? parseInt(value) : undefined;
    updateTempFilter('pointsRange', {
      ...tempFilters.pointsRange,
      [type]: numValue
    });
  };

  const updateDistanceRange = (type: 'min' | 'max', value: string) => {
    const numValue = value ? parseFloat(value) : undefined;
    updateTempFilter('distanceRange', {
      ...tempFilters.distanceRange,
      [type]: numValue
    });
  };

  const removeFilter = (filterKey: keyof FilterState) => {
    const newFilters = { ...tempFilters };
    delete newFilters[filterKey];
    setTempFilters(newFilters);
    onFiltersChange(newFilters);
  };

  return (
    <div className={cn("relative", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            disabled={isLoading}
          >
            <Filter className="h-4 w-4" />
            Filtry
            {getActiveFilterCount() > 0 && (
              <Badge variant="secondary" className="ml-1">
                {getActiveFilterCount()}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        
        <PopoverContent className="w-96 p-0" align="end">
          <Card className="border-0 shadow-none">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Pokročilé filtry</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Search Query */}
              <div className="space-y-2">
                <Label htmlFor="search">Vyhledávání</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="search"
                    placeholder="Název trasy, místo..."
                    value={tempFilters.searchQuery || ''}
                    onChange={(e) => updateTempFilter('searchQuery', e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Date Range */}
              <div className="space-y-2">
                <Label>Datum návštěvy</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "justify-start text-left font-normal",
                          !tempFilters.dateRange?.from && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {tempFilters.dateRange?.from ? (
                          format(tempFilters.dateRange.from, "d. MMM", { locale: cs })
                        ) : (
                          "Od data"
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={tempFilters.dateRange?.from}
                        onSelect={(date) => updateTempFilter('dateRange', {
                          ...tempFilters.dateRange,
                          from: date
                        })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "justify-start text-left font-normal",
                          !tempFilters.dateRange?.to && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {tempFilters.dateRange?.to ? (
                          format(tempFilters.dateRange.to, "d. MMM", { locale: cs })
                        ) : (
                          "Do data"
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={tempFilters.dateRange?.to}
                        onSelect={(date) => updateTempFilter('dateRange', {
                          ...tempFilters.dateRange,
                          to: date
                        })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Points Range */}
              <div className="space-y-2">
                <Label>Rozsah bodů</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="minPoints" className="text-xs text-muted-foreground">
                      Minimálně
                    </Label>
                    <Input
                      id="minPoints"
                      type="number"
                      placeholder="0"
                      value={tempFilters.pointsRange?.min || ''}
                      onChange={(e) => updatePointsRange('min', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="maxPoints" className="text-xs text-muted-foreground">
                      Maximálně
                    </Label>
                    <Input
                      id="maxPoints"
                      type="number"
                      placeholder="100"
                      value={tempFilters.pointsRange?.max || ''}
                      onChange={(e) => updatePointsRange('max', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Distance Range */}
              <div className="space-y-2">
                <Label>Vzdálenost (km)</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="minDistance" className="text-xs text-muted-foreground">
                      Minimálně
                    </Label>
                    <Input
                      id="minDistance"
                      type="number"
                      step="0.1"
                      placeholder="0.0"
                      value={tempFilters.distanceRange?.min || ''}
                      onChange={(e) => updateDistanceRange('min', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="maxDistance" className="text-xs text-muted-foreground">
                      Maximálně
                    </Label>
                    <Input
                      id="maxDistance"
                      type="number"
                      step="0.1"
                      placeholder="50.0"
                      value={tempFilters.distanceRange?.max || ''}
                      onChange={(e) => updateDistanceRange('max', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Dog Restrictions */}
              <div className="space-y-2">
                <Label>Omezení pro psy</Label>
                <Select
                  value={tempFilters.dogRestrictions || 'all'}
                  onValueChange={(value) => updateTempFilter('dogRestrictions', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Vyberte omezení" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Všechny</SelectItem>
                    <SelectItem value="allowed">Psi povoleni</SelectItem>
                    <SelectItem value="not_allowed">Psi zakázáni</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Route Type */}
              <div className="space-y-2">
                <Label>Typ trasy</Label>
                <Select
                  value={tempFilters.routeType || 'all'}
                  onValueChange={(value) => updateTempFilter('routeType', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Vyberte typ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Všechny</SelectItem>
                    <SelectItem value="with_route">S trasou</SelectItem>
                    <SelectItem value="without_route">Bez trasy</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Active Filters Display */}
              {hasActiveFilters() && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Aktivní filtry:</Label>
                  <div className="flex flex-wrap gap-2">
                    {filters.dateRange?.from && (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        Od: {format(filters.dateRange.from, "d. MMM", { locale: cs })}
                        <X 
                          className="h-3 w-3 cursor-pointer" 
                          onClick={() => removeFilter('dateRange')}
                        />
                      </Badge>
                    )}
                    {filters.dateRange?.to && (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        Do: {format(filters.dateRange.to, "d. MMM", { locale: cs })}
                        <X 
                          className="h-3 w-3 cursor-pointer" 
                          onClick={() => removeFilter('dateRange')}
                        />
                      </Badge>
                    )}
                    {(filters.pointsRange?.min || filters.pointsRange?.max) && (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        Body: {filters.pointsRange.min || 0} - {filters.pointsRange.max || '∞'}
                        <X 
                          className="h-3 w-3 cursor-pointer" 
                          onClick={() => removeFilter('pointsRange')}
                        />
                      </Badge>
                    )}
                    {filters.dogRestrictions !== 'all' && (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        Psi: {filters.dogRestrictions === 'allowed' ? 'Povoleni' : 'Zakázáni'}
                        <X 
                          className="h-3 w-3 cursor-pointer" 
                          onClick={() => removeFilter('dogRestrictions')}
                        />
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4">
                <Button 
                  onClick={applyFilters} 
                  className="flex-1"
                  disabled={isLoading}
                >
                  Aplikovat filtry
                </Button>
                <Button 
                  variant="outline" 
                  onClick={resetFilters}
                  disabled={isLoading}
                >
                  Vymazat
                </Button>
              </div>
            </CardContent>
          </Card>
        </PopoverContent>
      </Popover>
    </div>
  );
}
