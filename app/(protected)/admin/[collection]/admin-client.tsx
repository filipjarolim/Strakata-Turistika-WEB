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
  Database, 
  ArrowUpDown,
  Loader2,
  AlertCircle,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';
import { useAdmin } from '@/hooks/useAdmin';
import { LoadingSkeleton, LoadingSpinner, EmptyState, ErrorState } from '@/components/results/LoadingSkeleton';
import Link from 'next/link';

interface AdminRecord {
  id: string;
  [key: string]: any;
}

export default function AdminClient() {
  const params = useParams();
  const collection = params.collection as string;
  
  const { state, actions } = useAdmin(collection);
  
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
        if (target.isIntersecting && state.hasMore && !state.isLoadingMore) {
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
  }, [state.hasMore, state.isLoadingMore, actions.loadNextPage]);

  // Debug: Log state changes
  useEffect(() => {
    console.log('AdminClient state update:', {
      collection: state.collection,
      recordsCount: state.records.length,
      isLoading: state.isInitialLoading,
      error: state.error
    });
  }, [state.collection, state.records.length, state.isInitialLoading, state.error]);

  // Render individual record item
  const renderRecordItem = (record: AdminRecord) => {
    const keys = Object.keys(record).filter(key => key !== 'id');
    
    // Special rendering for VisitData
    if (collection === 'VisitData') {
      return (
        <motion.div
          key={record.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="border rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow"
        >
          <div className="flex flex-col gap-3">
            {/* Header with ID and actions */}
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs font-mono">
                  {record.id.slice(0, 8)}...
                </Badge>
                {record.state && (
                  <Badge 
                    variant={
                      record.state === 'APPROVED' ? 'default' :
                      record.state === 'PENDING_REVIEW' ? 'secondary' :
                      record.state === 'REJECTED' ? 'destructive' : 'outline'
                    }
                    className="text-xs"
                  >
                    {record.state === 'APPROVED' ? 'Schváleno' :
                     record.state === 'PENDING_REVIEW' ? 'Čeká' :
                     record.state === 'REJECTED' ? 'Zamítnuto' : record.state}
                  </Badge>
                )}
              </div>
              <div className="flex gap-1">
                <Link href={`/admin/${collection}/${record.id}`}>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Eye className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href={`/admin/${collection}/${record.id}/edit`}>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Edit className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* VisitData specific fields */}
            <div className="space-y-2">
              {record.routeTitle && (
                <h3 className="font-semibold text-base sm:text-lg line-clamp-2">
                  {record.routeTitle}
                </h3>
              )}
              
              <div className="flex flex-wrap gap-2 text-sm">
                {record.points && (
                  <Badge variant="default" className="text-xs">
                    {record.points} bodů
                  </Badge>
                )}
                {record.year && (
                  <Badge variant="outline" className="text-xs">
                    {record.year}
                  </Badge>
                )}
                {record.dogNotAllowed === 'true' && (
                  <Badge variant="destructive" className="text-xs">
                    Psi zakázáni
                  </Badge>
                )}
              </div>

              {record.visitedPlaces && (
                <div className="text-sm text-muted-foreground">
                  <span className="font-medium">Místa: </span>
                  <span className="line-clamp-2">{record.visitedPlaces}</span>
                </div>
              )}

              {record.visitDate && (
                <div className="text-xs text-muted-foreground">
                  {format(new Date(record.visitDate), "d. MMM yyyy", { locale: cs })}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      );
    }

    // Default rendering for other collections
    return (
      <motion.div
        key={record.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="border rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow"
      >
        <div className="flex flex-col gap-3">
          {/* Header with ID and actions */}
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs font-mono">
                {record.id.length > 12 ? `${record.id.slice(0, 12)}...` : record.id}
              </Badge>
            </div>
            <div className="flex gap-1">
              <Link href={`/admin/${collection}/${record.id}`}>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Eye className="h-4 w-4" />
                </Button>
              </Link>
              <Link href={`/admin/${collection}/${record.id}/edit`}>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Edit className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Record data */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {keys.slice(0, 6).map((key) => {
              const value = record[key];
              let displayValue = value;
              
              // Format different value types
              if (value === null || value === undefined) {
                displayValue = <span className="text-gray-400 italic">null</span>;
              } else if (typeof value === 'object') {
                displayValue = (
                  <span className="font-mono text-xs bg-gray-100 p-1 rounded">
                    {JSON.stringify(value)}
                  </span>
                );
              } else if (typeof value === 'boolean') {
                displayValue = (
                  <Badge variant={value ? "default" : "secondary"}>
                    {value ? "Ano" : "Ne"}
                  </Badge>
                );
              } else if (key.includes('Date') || key.includes('At')) {
                try {
                  const date = new Date(value);
                  if (!isNaN(date.getTime())) {
                    displayValue = format(date, "d. MMM yyyy", { locale: cs });
                  }
                } catch (e) {
                  displayValue = String(value);
                }
              } else {
                displayValue = String(value);
              }

              return (
                <div key={key} className="space-y-1">
                  <div className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                    {key}
                  </div>
                  <div className="text-sm line-clamp-2">
                    {displayValue}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Show more indicator if there are more fields */}
          {keys.length > 6 && (
            <div className="text-xs text-gray-500">
              +{keys.length - 6} dalších polí
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col gap-3 sm:gap-4">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-start sm:items-center justify-between">
          <div className="min-w-0 flex-1">
            <h1 className="text-lg sm:text-xl font-bold truncate">
              {collection === 'VisitData' ? 'Návštěvy' : 
               collection === 'User' ? 'Uživatelé' :
               collection === 'News' ? 'Aktuality' : collection} Records
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {collection === 'VisitData' ? 'Správa turistických návštěv' :
               collection === 'User' ? 'Správa uživatelských účtů' :
               collection === 'News' ? 'Správa novinek a článků' : 
               `Správa záznamů kolekce ${collection}`}
            </p>
          </div>
          
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={() => actions.changeSort('id', true)}
              className="flex items-center gap-2 flex-1 sm:flex-none"
              size="sm"
            >
              <ArrowUpDown className="h-4 w-4" />
              <span className="hidden sm:inline">Seřadit</span>
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder={
              collection === 'VisitData' ? 'Hledat podle názvu trasy nebo místa...' :
              collection === 'User' ? 'Hledat podle jména nebo emailu...' :
              collection === 'News' ? 'Hledat podle názvu nebo obsahu...' :
              'Hledat v záznamech...'
            }
            value={state.searchQuery}
            onChange={(e) => actions.onSearchChanged(e.target.value)}
            className="pl-10 text-sm"
          />
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
          type="visit" 
        />
      ) : (
        <ScrollArea ref={scrollRef} className="h-[400px] sm:h-[500px] md:h-[600px]">
          <div className="space-y-2 sm:space-y-3">
            <AnimatePresence>
              {state.records.map(renderRecordItem)}
            </AnimatePresence>

            {/* Load More Trigger */}
            {state.hasMore && (
              <div ref={loadMoreRef} className="flex justify-center py-3 sm:py-4">
                {state.isLoadingMore ? (
                  <LoadingSpinner size="sm" text="Načítání..." />
                ) : (
                  <Button variant="outline" onClick={actions.loadNextPage} size="sm">
                    Načíst více
                  </Button>
                )}
              </div>
            )}

            {/* Empty State */}
            {!state.isInitialLoading && state.records.length === 0 && (
              <EmptyState
                title="Žádné záznamy k zobrazení"
                description={
                  state.searchQuery 
                    ? 'Pro váš vyhledávací dotaz nebyly nalezeny žádné záznamy.'
                    : `Kolekce ${collection} neobsahuje žádné záznamy.`
                }
                action={
                  state.searchQuery && (
                    <Button 
                      variant="outline" 
                      onClick={() => actions.onSearchChanged('')}
                      size="sm"
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
