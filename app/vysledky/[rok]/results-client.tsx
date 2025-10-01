'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Trophy, 
  List, 
  Award, 
  Users,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';
import { useResults } from '@/hooks/useResults';
import { useSession } from 'next-auth/react';
import { SimpleFilters, SimpleFilterState } from '@/components/results/SimpleFilters';
import { VisitDataWithUser, LeaderboardEntry } from '@/lib/results-utils';
import { LoadingSkeleton, LoadingSpinner, EmptyState, ErrorState } from '@/components/results/LoadingSkeleton';

export default function ResultsClient() {
  const params = useParams();
  const year = parseInt(params.rok as string);
  
  const { data: session } = useSession();
  const [simpleFilters, setSimpleFilters] = useState<SimpleFilterState>({});
  
  const { state, actions } = useResults(year);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);


  // Setup infinite scroll
  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        if (target.isIntersecting && !state.showLeaderboard && state.hasMore && !state.isLoadingMore) {
          actions.loadNextPage();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [state.showLeaderboard, state.hasMore, state.isLoadingMore, actions]);

  // Initial load - let the hook handle this
  useEffect(() => {
    console.log('ResultsClient: Component mounted for year:', year);
    // Don't call reloadForCurrentFilters here - let the hook handle initial load
  }, [year]);

  // Debug: Log state changes
  useEffect(() => {
    console.log('ResultsClient state update:', {
      showLeaderboard: state.showLeaderboard,
      itemsCount: state.items.length,
      leadersCount: state.leaders.length,
      isLoading: state.isInitialLoading,
      error: state.error
    });
  }, [state.showLeaderboard, state.items.length, state.leaders.length, state.isInitialLoading, state.error]);

  // Handle filter changes by updating the hook's internal state
  const handleFiltersChange = useCallback((newFilters: SimpleFilterState) => {
    setSimpleFilters(newFilters);
    // Update search query in the hook
    actions.onSearchChanged(newFilters.searchQuery || '');
    // TODO: Handle showOnlyMyVisits filter - we'll need to add this to the hook
  }, [actions]);

  // Render individual visit item
  const renderVisitItem = (item: VisitDataWithUser) => {
    console.log('Rendering item with ID:', item.id, 'at index:', state.items.findIndex(i => i.id === item.id));
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

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Výsledky {year}</h1>
            <p className="text-sm sm:text-base text-gray-600">
              {state.showLeaderboard ? 'Žebříček uživatelů' : 'Seznam návštěv'}
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
          <AlertTitle>Chyba</AlertTitle>
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
                state.leaders.map((leader, index) => renderLeaderboardItem(leader, index))
              ) : (
                state.items.map(renderVisitItem)
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
              state.showLeaderboard ? state.leaders.length === 0 : state.items.length === 0
            ) && (
              <EmptyState
                title="Žádná data k zobrazení"
                description={
                  state.searchQuery 
                    ? 'Pro váš vyhledávací dotaz nebyly nalezeny žádné výsledky.'
                    : 'Pro tuto sezónu nejsou k dispozici žádná data.'
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
