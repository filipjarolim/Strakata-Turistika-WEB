import { useState, useCallback, useRef, useEffect } from 'react';

interface AdminRecord {
  id: string;
  [key: string]: any;
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  totalPages: number;
}

interface AdminState {
  // Data arrays
  records: AdminRecord[];
  
  // Pagination
  page: number;
  limit: number;
  hasMore: boolean;
  
  // Loading states
  isInitialLoading: boolean;
  isLoadingMore: boolean;
  
  // Filters
  collection: string;
  searchQuery: string;
  sortBy: string;
  sortDescending: boolean;
  seasonFilter: string;
  stateFilter: string;
  
  // Error handling
  error: string | null;
}

const ROWS_PER_PAGE = 50;

export function useAdmin(initialCollection: string) {
  const [state, setState] = useState<AdminState>({
    records: [],
    page: 1,
    limit: ROWS_PER_PAGE,
    hasMore: false,
    isInitialLoading: true,
    isLoadingMore: false,
    collection: initialCollection,
    searchQuery: '',
    sortBy: 'id',
    sortDescending: true,
    seasonFilter: '',
    stateFilter: initialCollection === 'VisitData' ? 'PENDING_REVIEW' : '', // Default to PENDING_REVIEW for VisitData
    error: null
  });

  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);
  const currentPageRef = useRef(1);

  // Load initial page data
  const loadInitialData = useCallback(async (collection: string) => {
    setState(prev => ({ ...prev, isInitialLoading: true }));

    try {
      const params = new URLSearchParams({
        page: '1',
        limit: state.limit.toString(),
        sortBy: state.sortBy,
        sortDesc: state.sortDescending.toString()
      });

      if (state.searchQuery) {
        params.append('search', state.searchQuery);
      }

      if (state.seasonFilter) {
        params.append('season', state.seasonFilter);
      }

      if (state.stateFilter) {
        params.append('state', state.stateFilter);
      }

      console.log('Loading initial records for collection:', collection, 'page: 1');
      const response = await fetch(`/api/admin/${collection}?${params}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch records: ${response.status} - ${errorText}`);
      }
      
      const result: PaginatedResponse<AdminRecord> = await response.json();
      console.log('Received initial admin data:', result);
      
      // Deduplicate data
      const uniqueRecords = result.data.filter((record, index, arr) => 
        arr.findIndex(r => r.id === record.id) === index
      );
      
      console.log('Initial data - before deduplication:', result.data.length, 'records');
      console.log('Initial data - after deduplication:', uniqueRecords.length, 'records');

      setState(prev => ({
        ...prev,
        records: uniqueRecords,
        page: 2, // Next page will be 2
        hasMore: result.hasMore,
        isInitialLoading: false
      }));

      // Reset the ref for next infinite scroll
      currentPageRef.current = 2;
    } catch (error) {
      console.error('Error loading initial admin data:', error);
      setState(prev => ({ 
        ...prev, 
        isInitialLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load initial data'
      }));
    }
  }, [state.limit, state.searchQuery, state.sortBy, state.sortDescending, state.seasonFilter, state.stateFilter]);

  // Load next page for infinite scroll
  const loadNextPage = useCallback(async () => {
    if (state.isLoadingMore || !state.hasMore) return;

    setState(prev => ({ ...prev, isLoadingMore: true }));

    try {
      const pageToLoad = currentPageRef.current;
      const params = new URLSearchParams({
        page: pageToLoad.toString(),
        limit: state.limit.toString(),
        sortBy: state.sortBy,
        sortDesc: state.sortDescending.toString()
      });

      if (state.searchQuery) {
        params.append('search', state.searchQuery);
      }

      if (state.seasonFilter) {
        params.append('season', state.seasonFilter);
      }

      if (state.stateFilter) {
        params.append('state', state.stateFilter);
      }

      console.log('Loading more records for collection:', state.collection, 'page:', pageToLoad);
      const response = await fetch(`/api/admin/${state.collection}?${params}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch more data: ${response.status} - ${errorText}`);
      }
      
      const result: PaginatedResponse<AdminRecord> = await response.json();
      console.log('Received more admin data:', result);
      
      setState(prev => {
        const newRecords = [...prev.records, ...result.data];
        const uniqueRecords = newRecords.filter((record, index, arr) => 
          arr.findIndex(r => r.id === record.id) === index
        );
        
        console.log('Before deduplication:', newRecords.length, 'records');
        console.log('After deduplication:', uniqueRecords.length, 'records');
        
        return {
          ...prev,
          records: uniqueRecords,
          page: pageToLoad + 1,
          hasMore: result.hasMore,
          isLoadingMore: false
        };
      });

      // Update the ref for next load
      currentPageRef.current = pageToLoad + 1;
    } catch (error) {
      console.error('Error loading more admin data:', error);
      setState(prev => ({ 
        ...prev, 
        isLoadingMore: false,
        error: error instanceof Error ? error.message : 'Failed to load more data'
      }));
    }
  }, [state.isLoadingMore, state.hasMore, state.limit, state.collection, state.searchQuery, state.sortBy, state.sortDescending, state.seasonFilter, state.stateFilter]);

  // Reset pagination and reload data
  const reloadForCurrentFilters = useCallback(async () => {
    console.log('Reloading admin data for current filters');
    
    setState(prev => ({
      ...prev,
      records: [],
      page: 1,
      hasMore: true,
      isInitialLoading: true
    }));

    // Reset page ref for new load
    currentPageRef.current = 1;
    
    await loadInitialData(state.collection);
    
    setState(prev => ({ ...prev, isInitialLoading: false }));
  }, [state.collection, loadInitialData]);

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

  // Change sort order
  const changeSort = useCallback((sortBy: string, descending: boolean = true) => {
    console.log('Changing sort to:', sortBy, descending);
    setState(prev => ({ ...prev, sortBy, sortDescending: descending }));
    reloadForCurrentFilters();
  }, [reloadForCurrentFilters]);

  // Change collection
  const changeCollection = useCallback((collection: string) => {
    setState(prev => ({ ...prev, collection }));
    reloadForCurrentFilters();
  }, [reloadForCurrentFilters]);

  // Change season filter
  const changeSeasonFilter = useCallback((seasonId: string) => {
    setState(prev => ({ ...prev, seasonFilter: seasonId }));
    reloadForCurrentFilters();
  }, [reloadForCurrentFilters]);

  // Change state filter
  const changeStateFilter = useCallback((stateValue: string) => {
    setState(prev => ({ ...prev, stateFilter: stateValue }));
    reloadForCurrentFilters();
  }, [reloadForCurrentFilters]);

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Cleanup debounce timer
  useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [debounceTimer]);

  // Initial load and collection change handling
  useEffect(() => {
    console.log('useAdmin: Initial load for collection:', initialCollection);
    
    setState(prev => ({
      ...prev,
      records: [],
      page: 1,
      hasMore: false,
      collection: initialCollection,
      isInitialLoading: true
    }));

    // Reset page ref for new collection
    currentPageRef.current = 1;
    
    // Load data
    loadInitialData(initialCollection);
    
    setState(prev => ({ ...prev, isInitialLoading: false }));
  }, [initialCollection, loadInitialData]);

  // Cleanup on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      console.log('useAdmin: Cleaning up hook for collection:', initialCollection);
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, []);

  // Clear all data
  const clearData = useCallback(() => {
    setState(prev => ({
      ...prev,
      records: [],
      page: 1,
      hasMore: false
    }));
  }, []);

  return {
    state,
    actions: {
      loadNextPage,
      reloadForCurrentFilters,
      onSearchChanged,
      changeSort,
      changeCollection,
      changeSeasonFilter,
      changeStateFilter,
      clearError,
      clearData
    }
  };
}

