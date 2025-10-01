/**
 * Custom hook for managing news data with caching and error handling
 */

import { useState, useEffect, useCallback } from 'react';
import { NewsItem, CreateNewsData, UpdateNewsData } from '@/lib/news-service';
import { toast } from 'sonner';

interface UseNewsOptions {
  autoFetch?: boolean;
  page?: number;
  limit?: number;
  search?: string;
}

interface UseNewsReturn {
  news: NewsItem[];
  isLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null;
  fetchNews: (params?: Partial<UseNewsOptions>) => Promise<void>;
  createNews: (data: CreateNewsData) => Promise<NewsItem | null>;
  updateNews: (id: string, data: UpdateNewsData) => Promise<NewsItem | null>;
  deleteNews: (id: string) => Promise<boolean>;
  refetch: () => Promise<void>;
}

export function useNews(options: UseNewsOptions = {}): UseNewsReturn {
  const {
    autoFetch = true,
    page = 1,
    limit = 20,
    search
  } = options;

  const [news, setNews] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<UseNewsReturn['pagination']>(null);

  const fetchNews = useCallback(async (params: Partial<UseNewsOptions> = {}) => {
    try {
      setIsLoading(true);
      setError(null);

      const queryParams = new URLSearchParams();
      queryParams.append('page', String(params.page || page));
      queryParams.append('limit', String(params.limit || limit));
      if (params.search || search) {
        queryParams.append('search', params.search || search || '');
      }

      const response = await fetch(`/api/news?${queryParams.toString()}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.data) {
        setNews(data.data);
        setPagination(data.pagination || null);
      } else {
        // Fallback for old format
        setNews(Array.isArray(data) ? data : []);
        setPagination(null);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch news';
      setError(errorMessage);
      console.error('Error fetching news:', err);
      toast.error('Nepodařilo se načíst aktuality');
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, search]);

  const createNews = useCallback(async (data: CreateNewsData): Promise<NewsItem | null> => {
    try {
      const response = await fetch('/api/news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error: ${response.status}`);
      }

      const result = await response.json();
      const newNews = result.success ? result.data : result;
      
      // Refresh the list
      await fetchNews();
      
      toast.success('Aktualita byla vytvořena');
      return newNews;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create news';
      console.error('Error creating news:', err);
      
      if (errorMessage.includes('Unauthorized')) {
        toast.error('Nemáte oprávnění k této akci');
      } else if (errorMessage.includes('Validation failed')) {
        toast.error('Chyba ve formuláři: ' + errorMessage);
      } else {
        toast.error(errorMessage);
      }
      
      return null;
    }
  }, [fetchNews]);

  const updateNews = useCallback(async (id: string, data: UpdateNewsData): Promise<NewsItem | null> => {
    try {
      const response = await fetch(`/api/news/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error: ${response.status}`);
      }

      const result = await response.json();
      const updatedNews = result.success ? result.data : result;
      
      // Update the local state
      setNews(prev => prev.map(item => item.id === id ? updatedNews : item));
      
      toast.success('Aktualita byla aktualizována');
      return updatedNews;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update news';
      console.error('Error updating news:', err);
      
      if (errorMessage.includes('Unauthorized')) {
        toast.error('Nemáte oprávnění k této akci');
      } else if (errorMessage.includes('Validation failed')) {
        toast.error('Chyba ve formuláři: ' + errorMessage);
      } else {
        toast.error(errorMessage);
      }
      
      return null;
    }
  }, []);

  const deleteNews = useCallback(async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/news/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error: ${response.status}`);
      }

      // Update the local state
      setNews(prev => prev.filter(item => item.id !== id));
      
      toast.success('Aktualita byla smazána');
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete news';
      console.error('Error deleting news:', err);
      
      if (errorMessage.includes('Unauthorized')) {
        toast.error('Nemáte oprávnění k této akci');
      } else {
        toast.error(errorMessage);
      }
      
      return false;
    }
  }, []);

  const refetch = useCallback(async () => {
    await fetchNews();
  }, [fetchNews]);

  // Auto-fetch on mount and when dependencies change
  useEffect(() => {
    if (autoFetch) {
      fetchNews();
    }
  }, [autoFetch, fetchNews]);

  return {
    news,
    isLoading,
    error,
    pagination,
    fetchNews,
    createNews,
    updateNews,
    deleteNews,
    refetch,
  };
}
