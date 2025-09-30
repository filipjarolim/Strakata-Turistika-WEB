import { useState, useCallback, useRef, useEffect } from 'react';
import { VisitDataWithUser, LeaderboardEntry } from '@/lib/results-utils';

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  totalPages: number;
}

interface ResultsState {
  // Data arrays
  items: VisitDataWithUser[];
  leaders: LeaderboardEntry[];
  
  // Pagination
  page: number;
  limit: number;
  hasMore: boolean;
  
  // Loading states
  isInitialLoading: boolean;
  isLoadingMore: boolean;
  
  // Filters
  selectedSeason: number;
  searchQuery: string;
  sortBy: 'visitDate' | 'points' | 'routeTitle' | 'createdAt';
  sortDescending: boolean;
  
  // UI state
  showLeaderboard: boolean;
  sortLeaderboardByVisits: boolean;
  
  // Error handling
  error: string | null;
}

const ROWS_PER_PAGE = 50;

export function useResults(initialSeason: number) {
  const [state, setState] = useState<ResultsState>({
    items: [],
    leaders: [],
    page: 1,
    limit: ROWS_PER_PAGE,
    hasMore: false,
    isInitialLoading: true,
    isLoadingMore: false,
    selectedSeason: initialSeason,
    searchQuery: '',
    sortBy: 'visitDate',
    sortDescending: true,
    showLeaderboard: false,
    sortLeaderboardByVisits: false,
    error: null
  });

  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);
  const currentPageRef = useRef(1);

  // Load initial page data
  const loadInitialData = useCallback(async (season: number) => {
    setState(prev => ({ ...prev, isLoadingMore: true }));

    try {
      const params = new URLSearchParams({
        page: '1',
        limit: state.limit.toString(),
        state: 'APPROVED',
        sortBy: state.sortBy,
        sortDesc: state.sortDescending.toString()
      });

      if (state.searchQuery) {
        params.append('search', state.searchQuery);
      }

      console.log('Loading initial visits for season:', season, 'page: 1');
      const response = await fetch(`/api/results/visits/${season}?${params}`);
      if (!response.ok) throw new Error('Failed to fetch visit data');
      
      const result: PaginatedResponse<VisitDataWithUser> = await response.json();
      console.log('Received initial visit data:', result);
      
      // Check for duplicates in API response
      const apiDuplicates = result.data.filter((item, index, arr) => 
        arr.findIndex(i => i.id === item.id) !== index
      );
      if (apiDuplicates.length > 0) {
        console.warn('API returned duplicate items in initial load:', apiDuplicates.map(d => d.id));
      }

      // Deduplicate initial data
      const uniqueItems = result.data.filter((item, index, arr) => 
        arr.findIndex(i => i.id === item.id) === index
      );
      
      console.log('Initial data - before deduplication:', result.data.length, 'items');
      console.log('Initial data - after deduplication:', uniqueItems.length, 'items');

      setState(prev => ({
        ...prev,
        items: uniqueItems,
        page: 2, // Next page will be 2
        hasMore: result.hasMore,
        isLoadingMore: false
      }));

      // Reset the ref for next infinite scroll
      currentPageRef.current = 2;
    } catch (error) {
      console.error('Error loading initial data:', error);
      setState(prev => ({ 
        ...prev, 
        isLoadingMore: false,
        error: 'Failed to load initial data'
      }));
    }
  }, [state.limit, state.searchQuery, state.sortBy, state.sortDescending]);

  // Load next page for infinite scroll
  const loadNextPage = useCallback(async () => {
    if (state.isLoadingMore || !state.hasMore) return;

    setState(prev => ({ ...prev, isLoadingMore: true }));

    try {
      const pageToLoad = currentPageRef.current;
      const params = new URLSearchParams({
        page: pageToLoad.toString(),
        limit: state.limit.toString(),
        state: 'APPROVED',
        sortBy: state.sortBy,
        sortDesc: state.sortDescending.toString()
      });

      if (state.searchQuery) {
        params.append('search', state.searchQuery);
      }

      console.log('Loading more visits for season:', state.selectedSeason, 'page:', pageToLoad);
      const response = await fetch(`/api/results/visits/${state.selectedSeason}?${params}`);
      if (!response.ok) throw new Error('Failed to fetch more data');
      
      const result: PaginatedResponse<VisitDataWithUser> = await response.json();
      console.log('Received more visit data:', result);
      
      // Check for duplicates in API response
      const apiDuplicates = result.data.filter((item, index, arr) => 
        arr.findIndex(i => i.id === item.id) !== index
      );
      if (apiDuplicates.length > 0) {
        console.warn('API returned duplicate items:', apiDuplicates.map(d => d.id));
      }

      setState(prev => {
        const newItems = [...prev.items, ...result.data];
        const uniqueItems = newItems.filter((item, index, arr) => 
          arr.findIndex(i => i.id === item.id) === index
        );
        
        console.log('Before deduplication:', newItems.length, 'items');
        console.log('After deduplication:', uniqueItems.length, 'items');
        
        return {
          ...prev,
          items: uniqueItems,
          page: pageToLoad + 1,
          hasMore: result.hasMore,
          isLoadingMore: false
        };
      });

      // Update the ref for next load
      currentPageRef.current = pageToLoad + 1;
    } catch (error) {
      console.error('Error loading more data:', error);
      setState(prev => ({ 
        ...prev, 
        isLoadingMore: false,
        error: 'Failed to load more data'
      }));
    }
  }, [state.isLoadingMore, state.hasMore, state.limit, state.selectedSeason, state.searchQuery, state.sortBy, state.sortDescending]);

  // Load leaderboard data
  const loadLeaderboard = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page: '1',
        limit: '10000', // Load all users
        sortByVisits: state.sortLeaderboardByVisits.toString()
      });

      if (state.searchQuery) {
        params.append('search', state.searchQuery);
      }

      console.log('Loading leaderboard for season:', state.selectedSeason);
      const response = await fetch(`/api/results/leaderboard/${state.selectedSeason}?${params}`);
      if (!response.ok) throw new Error('Failed to fetch leaderboard');
      
      const result: PaginatedResponse<LeaderboardEntry> = await response.json();
      console.log('Received leaderboard data:', result);
      console.log('Leaderboard data length:', result.data.length);

      setState(prev => {
        console.log('Setting leaderboard data, previous leaders count:', prev.leaders.length, 'new leaders count:', result.data.length);
        return {
          ...prev,
          leaders: result.data,
          hasMore: false // Leaderboard loads all at once
        };
      });
    } catch (error) {
      console.error('Error loading leaderboard:', error);
      setState(prev => ({ ...prev, error: 'Failed to load leaderboard' }));
    }
  }, [state.selectedSeason, state.searchQuery, state.sortLeaderboardByVisits]);

  // Reset pagination and reload data
  const reloadForCurrentFilters = useCallback(async () => {
    console.log('Reloading for current filters, showLeaderboard:', state.showLeaderboard);
    console.log('Current leaders count before reload:', state.leaders.length);
    
    // Use functional update to get the current state
    setState(prev => {
      console.log('Clearing data - showLeaderboard:', prev.showLeaderboard, 'clearing leaders:', prev.showLeaderboard);
      return {
        ...prev,
        // Only clear the data for the current view
        items: prev.showLeaderboard ? prev.items : [],
        leaders: prev.showLeaderboard ? [] : prev.leaders,
        page: 1,
        hasMore: true, // Set to true initially to allow first load
        isInitialLoading: true
      };
    });

    // Use the current state value
    const currentShowLeaderboard = state.showLeaderboard;
    if (currentShowLeaderboard) {
      await loadLeaderboard();
    } else {
      await loadInitialData(state.selectedSeason); // Use loadInitialData instead
    }

    setState(prev => ({ ...prev, isInitialLoading: false }));
  }, [state.showLeaderboard, loadLeaderboard, loadInitialData, state.selectedSeason]);

  // Debounced search
  const onSearchChanged = useCallback((query: string) => {
    setState(prev => ({ ...prev, searchQuery: query }));

    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    const timer = setTimeout(() => {
      reloadForCurrentFilters();
    }, 300);

    setDebounceTimer(timer);
  }, [debounceTimer, reloadForCurrentFilters]);

  // Toggle between views
  const toggleView = useCallback(async () => {
    const newShowLeaderboard = !state.showLeaderboard;
    console.log('Toggling view to:', newShowLeaderboard ? 'leaderboard' : 'visits');
    
    setState(prev => ({ 
      ...prev, 
      showLeaderboard: newShowLeaderboard,
      // Clear data for the new view
      items: newShowLeaderboard ? prev.items : [],
      leaders: newShowLeaderboard ? [] : prev.leaders,
      page: 1,
      hasMore: true,
      isInitialLoading: true
    }));
    
    // Load data for the new view
    if (newShowLeaderboard) {
      await loadLeaderboard();
    } else {
      await loadInitialData(state.selectedSeason);
    }
    
    setState(prev => ({ ...prev, isInitialLoading: false }));
  }, [state.showLeaderboard, loadLeaderboard, loadInitialData, state.selectedSeason]);

  // Change sort order
  const changeSort = useCallback((sortBy: 'visitDate' | 'points' | 'routeTitle' | 'createdAt', descending: boolean = true) => {
    setState(prev => ({ ...prev, sortBy, sortDescending: descending }));
    reloadForCurrentFilters();
  }, [reloadForCurrentFilters]);

  // Toggle leaderboard sort
  const toggleLeaderboardSort = useCallback(() => {
    setState(prev => ({ ...prev, sortLeaderboardByVisits: !prev.sortLeaderboardByVisits }));
    reloadForCurrentFilters();
  }, [reloadForCurrentFilters]);

  // Change season
  const changeSeason = useCallback((season: number) => {
    setState(prev => ({ ...prev, selectedSeason: season }));
    reloadForCurrentFilters();
  }, [reloadForCurrentFilters]);

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Cleanup debounce timer
  // Initial load and season change handling
  useEffect(() => {
    console.log('useResults: Initial load for season:', initialSeason);
    // Clear all data first to prevent duplicates
    setState(prev => ({
      ...prev,
      items: [],
      leaders: [],
      page: 1,
      hasMore: false,
      selectedSeason: initialSeason,
      isInitialLoading: true
    }));

    // Reset page ref for new season
    currentPageRef.current = 1;
    
    // Load visits data (default view)
    loadInitialData(initialSeason);
    
    setState(prev => ({ ...prev, isInitialLoading: false }));
  }, [initialSeason]); // Re-run when season changes

  useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [debounceTimer]);

  // Cleanup on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      console.log('useResults: Cleaning up hook for season:', initialSeason);
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, []);

  // Clear all data
  const clearData = useCallback(() => {
    setState(prev => ({
      ...prev,
      items: [],
      leaders: [],
      page: 1,
      hasMore: false
    }));
  }, []);

  return {
    state,
    actions: {
      loadNextPage,
      loadLeaderboard,
      reloadForCurrentFilters,
      onSearchChanged,
      toggleView,
      changeSort,
      toggleLeaderboardSort,
      changeSeason,
      clearError,
      clearData
    }
  };
}
