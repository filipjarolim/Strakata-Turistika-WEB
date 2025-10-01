'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useResults } from '@/hooks/useResults';
import { SimpleFilters, SimpleFilterState } from '@/components/results/SimpleFilters';
import { LoadingSkeleton, LoadingSpinner, EmptyState, ErrorState } from '@/components/results/LoadingSkeleton';
import { VisitDataWithUser, LeaderboardEntry } from '@/lib/results-utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { List, Trophy, Search, Users, Award, AlertCircle, AlertTriangle, ExternalLink, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';
import Link from 'next/link';

export default function MojeClient() {
  const { data: session } = useSession();
  const [simpleFilters, setSimpleFilters] = useState<SimpleFilterState>({});
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
        const response = await fetch('/api/results/seasons');
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

  const filteredLeaders = state.leaders.filter(leader => 
    leader.userId === session?.user?.id ||
    leader.userName === session?.user?.name
  );

  // Handle filter changes by updating the hook's internal state
  const handleFiltersChange = useCallback((newFilters: SimpleFilterState) => {
    setSimpleFilters(newFilters);
    // Update search query in the hook
    actions.onSearchChanged(newFilters.searchQuery || '');
    // TODO: Handle showOnlyMyVisits filter - we'll need to add this to the hook
  }, [actions]);

  // Render individual visit item
  const renderVisitItem = (item: VisitDataWithUser) => {
    return (
    <motion.div
      key={item.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="border rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow"
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

  // Render leaderboard item
  const renderLeaderboardItem = (item: LeaderboardEntry, index: number) => (
    <motion.div
      key={item.userId}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 border rounded-lg hover:shadow-md transition-shadow gap-3"
    >
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-primary text-primary-foreground text-xs sm:text-sm font-bold">
          {index + 1}
        </div>
        <div>
          <h3 className="font-semibold text-sm sm:text-base">{item.userName}</h3>
          {item.dogName && (
            <p className="text-xs sm:text-sm text-gray-600">{item.dogName}</p>
          )}
        </div>
      </div>
      
      <div className="flex flex-row sm:flex-col sm:text-right justify-between sm:justify-start">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="text-center">
            <p className="text-base sm:text-lg font-bold text-green-600">{item.totalPoints}</p>
            <p className="text-xs text-gray-500">bodů</p>
          </div>
          <div className="text-center">
            <p className="text-base sm:text-lg font-bold text-blue-600">{item.visitsCount}</p>
            <p className="text-xs text-gray-500">návštěv</p>
          </div>
        </div>
        {item.lastVisitDate && (
          <p className="text-xs text-gray-500 mt-1">
            Poslední: {format(new Date(item.lastVisitDate), "d. MMM", { locale: cs })}
          </p>
        )}
      </div>
    </motion.div>
  );

  // Set up intersection observer for infinite scrolling
  useEffect(() => {
    if (!loadMoreRef.current || state.showLeaderboard) return;
    
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
  }, [state.showLeaderboard, state.hasMore, state.isLoadingMore, actions]);

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
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Moje výsledky</h1>
            <p className="text-sm sm:text-base text-gray-600">
              {state.showLeaderboard ? 'Mé umístění v žebříčku' : 'Mé návštěvy'}
            </p>
          </div>
          
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              variant={state.showLeaderboard ? "outline" : "default"}
              onClick={actions.toggleView}
              className="flex items-center gap-2 flex-1 sm:flex-none"
              size="sm"
            >
              <List className="h-4 w-4" />
              <span className="hidden sm:inline">Návštěvy</span>
              <span className="sm:hidden">Návštěvy</span>
            </Button>
            <Button
              variant={state.showLeaderboard ? "default" : "outline"}
              onClick={actions.toggleView}
              className="flex items-center gap-2 flex-1 sm:flex-none"
              size="sm"
            >
              <Trophy className="h-4 w-4" />
              <span className="hidden sm:inline">Žebříček</span>
              <span className="sm:hidden">Žebříček</span>
            </Button>
          </div>
        </div>

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
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Hledat podle názvu trasy nebo místa..."
              value={state.searchQuery}
              onChange={(e) => actions.onSearchChanged(e.target.value)}
              className="pl-10 text-sm sm:text-base"
            />
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2">
            <SimpleFilters
              filters={simpleFilters}
              onFiltersChange={handleFiltersChange}
              onClearFilters={() => handleFiltersChange({})}
              isLoading={state.isInitialLoading || state.isLoadingMore}
              currentUserId={session?.user?.id}
            />
            
            {state.showLeaderboard && (
              <Button
                variant="outline"
                onClick={actions.toggleLeaderboardSort}
                className="flex items-center gap-2 text-sm"
                size="sm"
              >
                <Award className="h-4 w-4" />
                {state.sortLeaderboardByVisits ? 'Podle návštěv' : 'Podle bodů'}
              </Button>
            )}
          </div>
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
          type={state.showLeaderboard ? 'leaderboard' : 'visit'} 
        />
      ) : (
        <ScrollArea ref={scrollRef} className="h-[500px] sm:h-[600px]">
          <div className="space-y-3 sm:space-y-4">
            <AnimatePresence>
              {state.showLeaderboard ? (
                filteredLeaders.map((leader, index) => renderLeaderboardItem(leader, index))
              ) : (
                filteredItems.map(renderVisitItem)
              )}
            </AnimatePresence>

            {/* Load More Trigger */}
            {!state.showLeaderboard && state.hasMore && (
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
            {!state.isInitialLoading && (
              state.showLeaderboard ? filteredLeaders.length === 0 : filteredItems.length === 0
            ) && (
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
    </div>
  );
}
