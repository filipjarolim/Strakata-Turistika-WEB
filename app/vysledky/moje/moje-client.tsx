'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useResults } from '@/hooks/useResults';
import { SimpleFilters, SimpleFilterState } from '@/components/results/SimpleFilters';
import { LoadingSkeleton, LoadingSpinner, EmptyState, ErrorState } from '@/components/results/LoadingSkeleton';
import { VisitDataWithUser } from '@/lib/results-utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Search, Users, AlertCircle, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';
import Link from 'next/link';
import { VisitDetailSheet } from '@/components/results/VisitDetailSheet';

export default function MojeClient() {
  const { data: session } = useSession();
  const [simpleFilters, setSimpleFilters] = useState<SimpleFilterState>({});
  const [selectedVisit, setSelectedVisit] = useState<VisitDataWithUser | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [allYears, setAllYears] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [loadingYears, setLoadingYears] = useState(true);
  
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Get current year as default
  const currentYear = new Date().getFullYear();
  
  // Use the results hook with current year
  const { state, actions } = useResults(selectedYear || currentYear);

  // Fetch available years
  useEffect(() => {
    const fetchYears = async () => {
      try {
        const response = await fetch('/api/seasons');
        if (response.ok) {
          const years = await response.json();
          setAllYears(years);
        }
      } catch (error) {
        console.error('Failed to fetch years:', error);
      } finally {
        setLoadingYears(false);
      }
    };
    
    fetchYears();
  }, []);

  // Filter data to show only current user's visits
  const filteredItems = state.items.filter(item => 
    item.userId === session?.user?.id || 
    item.displayName === session?.user?.name ||
    item.user?.id === session?.user?.id
  );


  // Handle filter changes by updating the hook's internal state
  const handleFiltersChange = useCallback((newFilters: SimpleFilterState) => {
    setSimpleFilters(newFilters);
    // Update search query in the hook
    actions.onSearchChanged(newFilters.searchQuery || '');
    // TODO: Handle showOnlyMyVisits filter - we'll need to add this to the hook
  }, [actions]);

  // Handle sort changes
  const handleSortChange = useCallback((sortBy: 'visitDate' | 'points' | 'routeTitle', descending: boolean) => {
    actions.changeSort(sortBy, descending);
    setSimpleFilters(prev => ({ ...prev, sortBy, sortDescending: descending }));
  }, [actions]);

  // Handle visit item click
  const handleVisitClick = (item: VisitDataWithUser) => {
    setSelectedVisit(item);
    setSheetOpen(true);
  };

  // Render individual visit item
  const renderVisitItem = (item: VisitDataWithUser) => {
    return (
    <motion.div
      key={item.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className="border rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => handleVisitClick(item)}
    >
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <Badge variant="outline" className="text-xs w-fit">
            {item.visitDate ? format(new Date(item.visitDate), "d. MMM", { locale: cs }) : 'N/A'}
          </Badge>
          <span className="font-medium text-sm sm:text-base">{item.displayName}</span>
        </div>
        <Badge variant="default" className="bg-green-100 text-green-800 w-fit">
          {item.points} bodů
        </Badge>
      </div>
      
      {item.routeTitle && (
        <h3 className="font-semibold text-base sm:text-lg mb-2">{item.routeTitle}</h3>
      )}
      
      <div className="flex flex-wrap gap-1 mb-2">
        {item.visitedPlaces.split(',').slice(0, 3).map((place: string, index: number) => (
          <Badge key={index} variant="secondary" className="text-xs">
            {place.trim()}
          </Badge>
        ))}
        {item.visitedPlaces.split(',').length > 3 && (
          <Badge variant="secondary" className="text-xs">
            +{item.visitedPlaces.split(',').length - 3} dalších
          </Badge>
        )}
      </div>
      
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600">
        {item.user?.dogName && (
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            <span className="hidden sm:inline">{item.user.dogName}</span>
            <span className="sm:hidden">{item.user.dogName}</span>
          </span>
        )}
        {item.dogNotAllowed === 'true' && (
          <Badge variant="destructive" className="text-xs w-fit">
            <span className="hidden sm:inline">Psi zakázáni</span>
            <span className="sm:hidden">Psi nepovoleni</span>
          </Badge>
        )}
        {item.routeLink && (
          <a 
            href={item.routeLink} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
          >
            <ExternalLink className="h-3 w-3" />
            <span className="hidden sm:inline">Zobrazit trasu</span>
            <span className="sm:hidden">Trasa</span>
          </a>
        )}
      </div>
    </motion.div>
    );
  };

  // Set up intersection observer for infinite scrolling
  useEffect(() => {
    if (!loadMoreRef.current) return;
    
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && state.hasMore && !state.isLoadingMore) {
          actions.loadNextPage();
        }
      },
      { threshold: 0.1 }
    );
    
    observerRef.current.observe(loadMoreRef.current);
    
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [state.hasMore, state.isLoadingMore, actions]);

  const handleYearChange = (year: number | null) => {
    setSelectedYear(year);
    if (year) {
      // Reload data for the selected year
      actions.reloadForCurrentFilters();
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col gap-4">
        {/* Year Selector */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex gap-2">
            <Button
              variant={selectedYear === null ? "default" : "outline"}
              onClick={() => handleYearChange(null)}
              size="sm"
              disabled={loadingYears}
            >
              Vše
            </Button>
            {allYears.map(year => (
              <Button
                key={year}
                variant={selectedYear === year ? "default" : "outline"}
                onClick={() => handleYearChange(year)}
                size="sm"
                disabled={loadingYears}
              >
                {year}
              </Button>
            ))}
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col gap-3">
          <SimpleFilters
            filters={{
              ...simpleFilters,
              sortBy: state.sortBy === 'createdAt' ? undefined : state.sortBy,
              sortDescending: state.sortDescending
            }}
            onFiltersChange={handleFiltersChange}
            onClearFilters={() => handleFiltersChange({})}
            isLoading={state.isInitialLoading || state.isLoadingMore}
            currentUserId={session?.user?.id}
            showSort={true}
            onSortChange={handleSortChange}
          />
        </div>
      </div>

      {/* Error State */}
      {state.error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {state.isInitialLoading ? (
        <LoadingSkeleton 
          count={5} 
          type="visit" 
        />
      ) : (
        <ScrollArea ref={scrollRef} className="h-[500px] sm:h-[600px]">
          <div className="space-y-3 sm:space-y-4">
            <AnimatePresence>
              {filteredItems.map(renderVisitItem)}
            </AnimatePresence>

            {/* Load More Trigger */}
            {state.hasMore && (
              <div ref={loadMoreRef} className="flex justify-center py-4">
                {state.isLoadingMore ? (
                  <LoadingSpinner size="sm" text="Načítání dalších výsledků..." />
                ) : (
                  <Button variant="outline" onClick={actions.loadNextPage}>
                    Načíst více
                  </Button>
                )}
              </div>
            )}

            {/* Empty State */}
            {!state.isInitialLoading && filteredItems.length === 0 && (
              <EmptyState
                title="Žádná data k zobrazení"
                description={
                  state.searchQuery 
                    ? 'Pro váš vyhledávací dotaz nebyly nalezeny žádné výsledky.'
                    : 'Nemáte žádné výsledky pro tuto sezónu.'
                }
                action={
                  state.searchQuery && (
                    <Button 
                      variant="outline" 
                      onClick={() => actions.onSearchChanged('')}
                    >
                      Vymazat vyhledávání
                    </Button>
                  )
                }
              />
            )}
          </div>
        </ScrollArea>
      )}

      {/* Visit Detail Sheet */}
      <VisitDetailSheet 
        visit={selectedVisit} 
        open={sheetOpen} 
        onClose={() => setSheetOpen(false)} 
      />
    </div>
  );
}
