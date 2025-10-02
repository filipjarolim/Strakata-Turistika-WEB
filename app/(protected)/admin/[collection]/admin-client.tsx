'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Database, 
  ArrowUpDown,
  Loader2,
  AlertCircle,
  Edit,
  Trash2
} from 'lucide-react';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';
import { useAdmin } from '@/hooks/useAdmin';
import { LoadingSkeleton, LoadingSpinner, EmptyState, ErrorState } from '@/components/results/LoadingSkeleton';
import Link from 'next/link';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface AdminRecord {
  id: string;
  [key: string]: unknown;
}

export default function AdminClient() {
  const params = useParams();
  const collection = params.collection as string;
  
  const { state, actions } = useAdmin(collection);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  
  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

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
  }, [state.hasMore, state.isLoadingMore, actions]);

  // Debug: Log state changes
  useEffect(() => {
    console.log('AdminClient state update:', {
      collection: state.collection,
      recordsCount: state.records.length,
      isLoading: state.isInitialLoading,
      error: state.error
    });
  }, [state.collection, state.records.length, state.isInitialLoading, state.error]);

  // Clear selection when collection changes
  useEffect(() => {
    setSelectedIds(new Set());
  }, [collection]);

  // Selection handlers
  const handleSelectRecord = (id: string, checked: boolean) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(id);
      } else {
        newSet.delete(id);
      }
      return newSet;
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(state.records.map(r => r.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  // Delete handler
  const handleDelete = async () => {
    if (selectedIds.size === 0) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/${collection}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete records');
      }

      // Reload data after successful deletion
      setSelectedIds(new Set());
      actions.onSearchChanged(state.searchQuery); // Trigger reload
      setShowDeleteDialog(false);
    } catch (error) {
      console.error('Error deleting records:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete records');
    } finally {
      setIsDeleting(false);
    }
  };

  const allSelected = state.records.length > 0 && selectedIds.size === state.records.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < state.records.length;

  // Render individual record item
  const renderRecordItem = (record: AdminRecord) => {
    const keys = Object.keys(record).filter(key => key !== 'id');
    
    // Special rendering for News
    if (collection === 'News') {
      const title = record.title ? String(record.title) : null;
      const content = record.content ? String(record.content) : null;
      const createdAt = record.createdAt ? String(record.createdAt) : null;
      const images = record.images ? record.images : null;
      const isSelected = selectedIds.has(record.id);
      
      return (
        <motion.div
          key={record.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`border rounded-lg p-3 sm:p-4 hover:shadow-md transition-all ${
            isSelected ? 'ring-2 ring-blue-500 bg-blue-50/50' : ''
          }`}
        >
          <div className="flex flex-col gap-3">
            {/* Header with checkbox, ID and actions */}
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={(checked) => handleSelectRecord(record.id, checked as boolean)}
                />
                <Badge variant="outline" className="text-xs font-mono">
                  {String(record.id).slice(0, 8)}...
                </Badge>
              </div>
              <div className="flex gap-1">
                <Link href={`/admin/${collection}/${record.id}`}>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Edit className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* News specific fields */}
            <div className="space-y-2">
              {title && (
                <h3 className="font-semibold text-base sm:text-lg line-clamp-2">
                  {title}
                </h3>
              )}
              
              {content && (
                <div className="text-sm text-muted-foreground">
                  <span className="line-clamp-3">{content.replace(/<[^>]*>/g, '')}</span>
                </div>
              )}

              {createdAt && (
                <div className="text-xs text-muted-foreground">
                  {(() => {
                    try {
                      const date = new Date(createdAt);
                      if (isNaN(date.getTime())) {
                        return createdAt;
                      }
                      return format(date, "d. MMM yyyy 'v' HH:mm", { locale: cs });
                    } catch {
                      return createdAt;
                    }
                  })()}
                </div>
              )}

              {images && Array.isArray(images) && images.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {images.length} obrázk{images.length === 1 ? 'ů' : 'y'}
                </Badge>
              )}
            </div>
          </div>
        </motion.div>
      );
    }
    
    // Special rendering for VisitData
    if (collection === 'VisitData') {
      const state = typeof record.state === 'string' ? record.state : null;
      const routeTitle = record.routeTitle ? String(record.routeTitle) : null;
      const points = record.points ? String(record.points) : null;
      const year = record.year ? String(record.year) : null;
      const dogNotAllowed = record.dogNotAllowed === 'true';
      const visitedPlaces = record.visitedPlaces ? String(record.visitedPlaces) : null;
      const visitDate = record.visitDate ? String(record.visitDate) : null;
      const isSelected = selectedIds.has(record.id);
      
      return (
        <motion.div
          key={record.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`border rounded-lg p-3 sm:p-4 hover:shadow-md transition-all ${
            isSelected ? 'ring-2 ring-blue-500 bg-blue-50/50' : ''
          }`}
        >
          <div className="flex flex-col gap-3">
            {/* Header with checkbox, ID and actions */}
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={(checked) => handleSelectRecord(record.id, checked as boolean)}
                />
                <Badge variant="outline" className="text-xs font-mono">
                  {String(record.id).slice(0, 8)}...
                </Badge>
                {state && (
                  <Badge 
                    variant={
                      state === 'APPROVED' ? 'default' :
                      state === 'PENDING_REVIEW' ? 'secondary' :
                      state === 'REJECTED' ? 'destructive' : 'outline'
                    }
                    className="text-xs"
                  >
                    {state === 'APPROVED' ? 'Schváleno' :
                     state === 'PENDING_REVIEW' ? 'Čeká' :
                     state === 'REJECTED' ? 'Zamítnuto' : state}
                  </Badge>
                )}
              </div>
              <div className="flex gap-1">
                <Link href={`/admin/${collection}/${record.id}`}>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Edit className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* VisitData specific fields */}
            <div className="space-y-2">
              {routeTitle && (
                <h3 className="font-semibold text-base sm:text-lg line-clamp-2">
                  {routeTitle}
                </h3>
              )}
              
              <div className="flex flex-wrap gap-2 text-sm">
                {points && (
                  <Badge variant="default" className="text-xs">
                    {points} bodů
                  </Badge>
                )}
                {year && (
                  <Badge variant="outline" className="text-xs">
                    {year}
                  </Badge>
                )}
                {dogNotAllowed && (
                  <Badge variant="destructive" className="text-xs">
                    Psi zakázáni
                  </Badge>
                )}
              </div>

              {visitedPlaces && (
                <div className="text-sm text-muted-foreground">
                  <span className="font-medium">Místa: </span>
                  <span className="line-clamp-2">{visitedPlaces}</span>
                </div>
              )}

              {visitDate && (
                <div className="text-xs text-muted-foreground">
                  {(() => {
                    try {
                      const date = new Date(visitDate);
                      if (isNaN(date.getTime())) {
                        return visitDate;
                      }
                      return format(date, "d. MMM yyyy", { locale: cs });
                    } catch {
                      return visitDate;
                    }
                  })()}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      );
    }

    // Default rendering for other collections
    const isSelected = selectedIds.has(record.id);
    
    return (
      <motion.div
        key={record.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`border rounded-lg p-3 sm:p-4 hover:shadow-md transition-all ${
          isSelected ? 'ring-2 ring-blue-500 bg-blue-50/50' : ''
        }`}
      >
        <div className="flex flex-col gap-3">
          {/* Header with checkbox, ID and actions */}
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={isSelected}
                onCheckedChange={(checked) => handleSelectRecord(record.id, checked as boolean)}
              />
              <Badge variant="outline" className="text-xs font-mono">
                {String(record.id).length > 12 ? `${String(record.id).slice(0, 12)}...` : String(record.id)}
              </Badge>
            </div>
            <div className="flex gap-1">
              <Link href={`/admin/${collection}/${record.id}`}>
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
              let displayValue: React.ReactNode = null;
              
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
                  const date = new Date(String(value));
                  if (!isNaN(date.getTime())) {
                    displayValue = format(date, "d. MMM yyyy", { locale: cs });
                  } else {
                    displayValue = String(value);
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
            {selectedIds.size > 0 && (
              <Button
                variant="destructive"
                onClick={() => setShowDeleteDialog(true)}
                className="flex items-center gap-2 flex-1 sm:flex-none"
                size="sm"
                disabled={isDeleting}
              >
                <Trash2 className="h-4 w-4" />
                <span>Smazat ({selectedIds.size})</span>
              </Button>
            )}
          </div>
        </div>

        {/* Select All */}
        {state.records.length > 0 && (
          <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
            <Checkbox
              checked={allSelected}
              onCheckedChange={handleSelectAll}
              className={someSelected ? 'data-[state=checked]:bg-blue-500' : ''}
            />
            <span className="text-sm text-muted-foreground">
              {selectedIds.size > 0 
                ? `Vybráno: ${selectedIds.size} z ${state.records.length}`
                : 'Vybrat vše'}
            </span>
          </div>
        )}

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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Opravdu chcete smazat?</AlertDialogTitle>
            <AlertDialogDescription>
              Chystáte se trvale smazat {selectedIds.size} {selectedIds.size === 1 ? 'záznam' : selectedIds.size < 5 ? 'záznamy' : 'záznamů'} z databáze.
              Tuto akci nelze vrátit zpět.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Zrušit</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Mazání...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Smazat
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
