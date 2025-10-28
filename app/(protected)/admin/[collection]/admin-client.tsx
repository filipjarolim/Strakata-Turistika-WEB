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
  Trash2,
  MapPin,
  Image as ImageIcon,
  Calendar,
  Award,
  FileText,
  XCircle,
  Check,
  X,
  Expand,
  Minimize2,
  Copy,
  User,
  ExternalLink
} from 'lucide-react';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';
import { useAdmin } from '@/hooks/useAdmin';
import { LoadingSkeleton, LoadingSpinner, EmptyState, ErrorState } from '@/components/results/LoadingSkeleton';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import Image from 'next/image';
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

// Dynamically import GpxEditor to avoid SSR issues
const DynamicGpxEditor = dynamic(
  () => import('@/components/editor/GpxEditor'),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }
);

interface AdminRecord {
  id: string;
  [key: string]: unknown;
}

interface Season {
  id: string;
  year: number;
  name: string;
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
  
  // Photo viewer state
  const [selectedPhoto, setSelectedPhoto] = useState<{ url: string; title?: string } | null>(null);
  
  // Seasons data
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loadingSeasons, setLoadingSeasons] = useState(false);
  
  // Action states
  const [processingAction, setProcessingAction] = useState<string | null>(null);
  
  // Expandable map state
  const [expandedMap, setExpandedMap] = useState<Set<string>>(new Set());
  
  // Copy to clipboard state
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Helper function to normalize route data
  const normalizeRouteData = (route: unknown): Array<{ lat: number; lng: number }> | null => {
    if (!route) return null;

    try {
      let parsed = route;
      
      // Parse string to object/array
      if (typeof route === 'string') {
        const trimmed = route.trim();
        if ((trimmed.startsWith('[') && trimmed.endsWith(']')) || 
            (trimmed.startsWith('{') && trimmed.endsWith('}'))) {
          parsed = JSON.parse(route);
        } else {
          return null;
        }
      }

      // Check if has trackPoints (new format)
      if (typeof parsed === 'object' && parsed !== null && 'trackPoints' in parsed && Array.isArray(parsed.trackPoints)) {
        const trackPoints = parsed.trackPoints as Array<unknown>;
        return trackPoints.map((point: unknown) => {
          const p = point as Record<string, unknown>;
          return {
            lat: (p.latitude || p.lat || 0) as number,
            lng: (p.longitude || p.lng || 0) as number
          };
        }).filter((point: { lat: number; lng: number }) => point.lat && point.lng);
      }

      // Check if it's an array of points
      if (Array.isArray(parsed)) {
        return parsed.map((point: unknown) => {
          const p = point as Record<string, unknown>;
          return {
            lat: (p.latitude || p.lat || 0) as number,
            lng: (p.longitude || p.lng || 0) as number
          };
        }).filter((point: { lat: number; lng: number }) => point.lat && point.lng);
      }

      return null;
    } catch (e) {
      console.error('Failed to normalize route data:', e);
      return null;
    }
  };

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

  // Load seasons for VisitData collection
  useEffect(() => {
    if (collection === 'VisitData') {
      const fetchSeasons = async () => {
        setLoadingSeasons(true);
        try {
          const response = await fetch('/api/admin/Season?limit=100');
          if (response.ok) {
            const data = await response.json();
            setSeasons(data.data || []);
          }
        } catch (error) {
          console.error('Failed to fetch seasons:', error);
        } finally {
          setLoadingSeasons(false);
        }
      };
      fetchSeasons();
    }
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

  // Approve/Reject handlers
  const handleApprove = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setProcessingAction(id);
    try {
      const response = await fetch(`/api/admin/routes/${id}/approve`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to approve route');
      }

      // Reload data
      actions.reloadForCurrentFilters();
    } catch (error) {
      console.error('Error approving route:', error);
      alert('Nepodařilo se schválit trasu');
    } finally {
      setProcessingAction(null);
    }
  };

  const handleReject = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const reason = prompt('Důvod zamítnutí:');
    if (!reason) return;

    setProcessingAction(id);
    try {
      const response = await fetch(`/api/admin/routes/${id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason }),
      });

      if (!response.ok) {
        throw new Error('Failed to reject route');
      }

      // Reload data
      actions.reloadForCurrentFilters();
    } catch (error) {
      console.error('Error rejecting route:', error);
      alert('Nepodařilo se zamítnout trasu');
    } finally {
      setProcessingAction(null);
    }
  };

  const allSelected = state.records.length > 0 && selectedIds.size === state.records.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < state.records.length;

  // Copy to clipboard function
  const handleCopyId = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Render individual record item
  const renderRecordItem = (record: AdminRecord) => {
    const keys = Object.keys(record).filter(key => key !== 'id');
    
    // Special rendering for News
    if (collection === 'News') {
      const title = record.title ? String(record.title) : null;
      const content = record.content ? String(record.content) : null;
      const createdAt = record.createdAt ? String(record.createdAt) : null;
      const images = record.images ? record.images : null;
      const recordState = typeof record.state === 'string' ? record.state : null;
      const isSelected = selectedIds.has(record.id);
      
      const handleCardClick = (e: React.MouseEvent) => {
        const target = e.target as HTMLElement;
        if (
          target.closest('input[type="checkbox"]') ||
          target.closest('button') ||
          target.closest('a[href]')
        ) {
          return;
        }
        window.location.href = `/admin/${collection}/${record.id}`;
      };
      
      return (
        <motion.div
          key={record.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={handleCardClick}
          className={`border rounded-lg p-3 sm:p-4 hover:shadow-md transition-all cursor-pointer ${
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
                {recordState === 'PENDING_REVIEW' && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                      onClick={(e) => handleApprove(record.id, e)}
                      disabled={processingAction === record.id}
                      title="Schválit"
                    >
                      {processingAction === record.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={(e) => handleReject(record.id, e)}
                      disabled={processingAction === record.id}
                      title="Zamítnout"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </>
                )}
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
      const recordState = typeof record.state === 'string' ? record.state : null;
      const routeTitle = record.routeTitle ? String(record.routeTitle) : null;
      const routeDescription = record.routeDescription ? String(record.routeDescription) : null;
      const points = record.points ? Number(record.points) : null;
      const year = record.year ? String(record.year) : null;
      const dogNotAllowed = record.dogNotAllowed === true || record.dogNotAllowed === 'true';
      // Handle visitedPlaces - could be string, array, or object
      const visitedPlaces = record.visitedPlaces 
        ? (typeof record.visitedPlaces === 'object' || Array.isArray(record.visitedPlaces))
          ? record.visitedPlaces
          : String(record.visitedPlaces)
        : null;
      const visitDate = record.visitDate ? String(record.visitDate) : null;
      const rejectionReason = record.rejectionReason ? String(record.rejectionReason) : null;
      // Handle route - could be string, array, or object
      const route = record.route
        ? (typeof record.route === 'object' || Array.isArray(record.route))
          ? record.route
          : String(record.route)
        : null;
      const photos = Array.isArray(record.photos) ? record.photos : null;
      const dogName = record.dogName ? String(record.dogName) : null;
      const userId = record.userId ? String(record.userId) : null;
      const isSelected = selectedIds.has(record.id);
      
      // Parse route data for map
      const routeData = normalizeRouteData(route);

      // Parse visited places if it's JSON
      let visitedPlacesArray: string[] | null = null;
      if (visitedPlaces) {
        try {
          // Check if it's already an array
          if (Array.isArray(visitedPlaces)) {
            visitedPlacesArray = visitedPlaces;
          } else if (typeof visitedPlaces === 'string') {
            try {
              // Check if it's a valid JSON string (starts with [ or {)
              const trimmed = visitedPlaces.trim();
              if ((trimmed.startsWith('[') && trimmed.endsWith(']')) || 
                  (trimmed.startsWith('{') && trimmed.endsWith('}'))) {
                const parsed = JSON.parse(visitedPlaces);
                if (Array.isArray(parsed)) {
                  visitedPlacesArray = parsed;
                } else {
                  // Comma-separated string
                  visitedPlacesArray = visitedPlaces.split(',').map(p => p.trim()).filter(Boolean);
                }
              } else {
                // Invalid JSON string (like "[object Object]") or regular string
                visitedPlacesArray = visitedPlaces.split(',').map(p => p.trim()).filter(Boolean);
              }
            } catch {
              // Comma-separated string
              visitedPlacesArray = visitedPlaces.split(',').map(p => p.trim()).filter(Boolean);
            }
          }
        } catch (e) {
          console.error('Failed to parse visited places:', e);
        }
      }
      
      const toggleMapExpand = (e: React.MouseEvent) => {
        e.stopPropagation();
        setExpandedMap(prev => {
          const newSet = new Set(prev);
          if (newSet.has(record.id)) {
            newSet.delete(record.id);
          } else {
            newSet.add(record.id);
          }
          return newSet;
        });
      };

      const isMapExpanded = expandedMap.has(record.id);
      
      const handleCardClick = (e: React.MouseEvent) => {
        // Don't navigate if clicking on interactive elements
        const target = e.target as HTMLElement;
        if (
          target.closest('input[type="checkbox"]') ||
          target.closest('button') ||
          target.closest('a[href]')
        ) {
          return;
        }
        // Navigate to detail page
        window.location.href = `/admin/${collection}/${record.id}`;
      };

      return (
        <motion.div
          key={record.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={handleCardClick}
          className={`border rounded-lg overflow-hidden hover:shadow-lg transition-all cursor-pointer ${
            isSelected ? 'ring-2 ring-blue-500 bg-blue-50/50' : ''
          }`}
        >
          <div className="flex flex-col gap-0">
            {/* Map Preview - Full Width with Expand */}
            {routeData && routeData.length > 0 && (
              <div className="relative w-full bg-gray-100" style={{ height: isMapExpanded ? '400px' : '200px' }}>
                <DynamicGpxEditor
                  onSave={() => {}}
                  initialTrack={routeData}
                  readOnly={true}
                  hideControls={['editMode', 'undo', 'redo', 'add', 'delete', 'simplify', 'fullscreen']}
                />
                <button
                  onClick={toggleMapExpand}
                  className="absolute top-2 right-2 z-10 bg-white/90 hover:bg-white border border-gray-300 rounded-lg p-2 shadow-sm transition-all"
                  title={isMapExpanded ? "Zmenšit" : "Zvětšit"}
                >
                  {isMapExpanded ? (
                    <Minimize2 className="h-4 w-4 text-gray-700" />
                  ) : (
                    <Expand className="h-4 w-4 text-gray-700" />
                  )}
                </button>
              </div>
            )}

            {/* Content */}
            <div className="p-3 sm:p-4 space-y-3">
              {/* Header with checkbox, ID and actions */}
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2 flex-wrap">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={(checked) => handleSelectRecord(record.id, checked as boolean)}
                  />
                <Badge variant="outline" className="text-xs font-mono">
                  {String(record.id).slice(0, 8)}...
                </Badge>
                {recordState && (
                  <Badge 
                    variant={
                      recordState === 'APPROVED' ? 'default' :
                      recordState === 'PENDING_REVIEW' ? 'secondary' :
                      recordState === 'REJECTED' ? 'destructive' : 'outline'
                    }
                    className="text-xs"
                  >
                    {recordState === 'APPROVED' ? 'Schváleno' :
                     recordState === 'PENDING_REVIEW' ? 'Čeká' :
                     recordState === 'REJECTED' ? 'Zamítnuto' : recordState}
                  </Badge>
                )}
              </div>
              <div className="flex gap-1">
                {recordState === 'PENDING_REVIEW' && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                      onClick={(e) => handleApprove(record.id, e)}
                      disabled={processingAction === record.id}
                      title="Schválit"
                    >
                      {processingAction === record.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={(e) => handleReject(record.id, e)}
                      disabled={processingAction === record.id}
                      title="Zamítnout"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </>
                )}
                <Link href={`/admin/${collection}/${record.id}`}>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Edit className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Title */}
              {routeTitle && (
                <div className="space-y-1">
                  <h3 className="font-semibold text-base sm:text-lg line-clamp-2">
                    {routeTitle}
                  </h3>
                  {(dogName || userId) && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {dogName && (
                        <span className="flex items-center gap-1">
                          🐕 {dogName}
                        </span>
                      )}
                      {userId && (
                        <div className="flex items-center gap-1">
                          <Badge 
                            variant="outline" 
                            className="text-xs font-mono cursor-pointer hover:bg-gray-100 group flex items-center gap-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.location.href = `/admin/User/${userId}`;
                            }}
                          >
                            <User className="h-3 w-3" />
                            {String(userId).slice(0, 8)}...
                            <ExternalLink className="h-2.5 w-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </Badge>
                          <button
                            onClick={(e) => handleCopyId(String(userId), e)}
                            className="p-1 hover:bg-gray-200 rounded transition-colors"
                            title="Kopírovat ID"
                          >
                            {copiedId === String(userId) ? (
                              <Check className="h-3 w-3 text-green-600" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Description */}
              {routeDescription && (
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <FileText className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <p className="line-clamp-2">{routeDescription}</p>
                </div>
              )}
              
              {/* Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {points !== null && (
                  <div className="flex items-center gap-2 p-2 bg-gradient-to-br from-yellow-50 to-amber-50 border border-yellow-200 rounded-lg">
                    <Award className="h-5 w-5 text-yellow-600" />
                    <div>
                      <div className="text-xs text-yellow-600 font-medium">Body</div>
                      <div className="text-sm font-bold text-yellow-700">{points}</div>
                    </div>
                  </div>
                )}
                {year && (
                  <div className="flex items-center gap-2 p-2 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    <div>
                      <div className="text-xs text-blue-600 font-medium">Sezóna</div>
                      <div className="text-sm font-bold text-blue-700">{year}</div>
                    </div>
                  </div>
                )}
                {visitDate && (
                  <div className="flex items-center gap-2 p-2 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg">
                    <Calendar className="h-5 w-5 text-green-600" />
                    <div>
                      <div className="text-xs text-green-600 font-medium">Datum návštěvy</div>
                      <div className="text-xs font-bold text-green-700">
                        {(() => {
                          try {
                            const date = new Date(visitDate);
                            if (isNaN(date.getTime())) {
                              return visitDate;
                            }
                            return format(date, "d. MMM", { locale: cs });
                          } catch {
                            return visitDate;
                          }
                        })()}
                      </div>
                    </div>
                  </div>
                )}
                {dogNotAllowed && (
                  <div className="flex items-center gap-2 p-2 bg-gradient-to-br from-red-50 to-rose-50 border border-red-200 rounded-lg">
                    <X className="h-5 w-5 text-red-600" />
                    <div>
                      <div className="text-xs text-red-600 font-medium">Psi</div>
                      <div className="text-sm font-bold text-red-700">Zakázáni</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Visited Places */}
              {visitedPlacesArray && visitedPlacesArray.length > 0 && (
                <div className="space-y-2 p-3 bg-purple-50/50 border border-purple-200 rounded-lg">
                  <div className="flex items-center gap-2 text-sm font-semibold text-purple-700">
                    <MapPin className="h-4 w-4" />
                    <span>Návštěv míst ({visitedPlacesArray.length})</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {visitedPlacesArray.slice(0, 8).map((place, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs bg-white border-purple-200 text-purple-700 hover:bg-purple-50">
                        {place}
                      </Badge>
                    ))}
                    {visitedPlacesArray.length > 8 && (
                      <Badge variant="outline" className="text-xs bg-purple-100 border-purple-300 text-purple-700">
                        +{visitedPlacesArray.length - 8} dalších
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Photos */}
              {photos && photos.length > 0 && (
                <div className="space-y-2 p-3 bg-pink-50/50 border border-pink-200 rounded-lg">
                  <div className="flex items-center gap-2 text-sm font-semibold text-pink-700">
                    <ImageIcon className="h-4 w-4" />
                    <span>Fotografie ({photos.length})</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {photos.slice(0, 8).map((photo: { url?: string; title?: string }, idx: number) => {
                      if (!photo.url) return null;
                      return (
                        <button
                          key={idx}
                          onClick={() => setSelectedPhoto({ url: photo.url || '', title: photo.title })}
                          className="aspect-square rounded-lg overflow-hidden bg-gray-100 relative hover:ring-2 hover:ring-blue-500 transition-all cursor-pointer"
                        >
                          <Image
                            src={photo.url}
                            alt={photo.title || `Photo ${idx + 1}`}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 33vw, 25vw"
                          />
                        </button>
                      );
                    })}
                    {photos.length > 8 && (
                      <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center text-sm text-muted-foreground">
                        +{photos.length - 8}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Rejection Reason */}
              {recordState === 'REJECTED' && rejectionReason && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertTitle>Důvod zamítnutí</AlertTitle>
                  <AlertDescription className="text-sm">
                    {rejectionReason}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>
        </motion.div>
      );
    }

    // Default rendering for other collections
    const isSelected = selectedIds.has(record.id);
    
    const handleCardClick = (e: React.MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.closest('input[type="checkbox"]') ||
        target.closest('button') ||
        target.closest('a[href]')
      ) {
        return;
      }
      window.location.href = `/admin/${collection}/${record.id}`;
    };
    
    return (
      <motion.div
        key={record.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={handleCardClick}
        className={`border rounded-lg p-3 sm:p-4 hover:shadow-md transition-all cursor-pointer ${
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
              } else if (key === 'route') {
                // Special handling for route - show as map
                const routeData = normalizeRouteData(value);
                
                if (routeData && routeData.length > 0) {
                  displayValue = (
                    <div className="w-full h-32 rounded-lg overflow-hidden border border-gray-200">
                      <DynamicGpxEditor
                        onSave={() => {}}
                        initialTrack={routeData}
                        readOnly={true}
                        hideControls={['editMode', 'undo', 'redo', 'add', 'delete', 'simplify', 'fullscreen', 'zoom']}
                      />
                    </div>
                  );
                } else {
                  displayValue = <span className="text-gray-400 text-xs">Bez trasy</span>;
                }
              } else if (key === 'state' && typeof value === 'string') {
                // Special handling for state values
                const stateVariant = 
                  value === 'APPROVED' ? 'default' :
                  value === 'PENDING_REVIEW' ? 'secondary' :
                  value === 'REJECTED' ? 'destructive' :
                  value === 'DRAFT' ? 'outline' : 'secondary';
                
                const stateLabel = 
                  value === 'APPROVED' ? '✅ Schváleno' :
                  value === 'PENDING_REVIEW' ? '🕒 Čeká' :
                  value === 'REJECTED' ? '❌ Zamítnuto' :
                  value === 'DRAFT' ? '📝 Koncept' : value;

                displayValue = (
                  <Badge variant={stateVariant} className="text-xs">
                    {stateLabel}
                  </Badge>
                );
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
               collection === 'News' ? 'Aktuality' : collection}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {collection === 'VisitData' ? 'Správa turistických návštěv' :
               collection === 'User' ? 'Správa uživatelských účtů' :
               collection === 'News' ? 'Správa novinek a článků' : 
               `Správa záznamů kolekce ${collection}`}
            </p>
          </div>
          
          <div className="flex gap-2">
            {selectedIds.size > 0 && (
              <Button
                variant="destructive"
                onClick={() => setShowDeleteDialog(true)}
                className="flex items-center gap-2"
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

        {/* Search, Sort and Filters */}
        <div className="flex flex-col gap-3">
          <div className="flex gap-2">
            <div className="relative flex-1 transition-all duration-200">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 transition-colors duration-200" />
              <Input
                placeholder="Hledat..."
                value={state.searchQuery}
                onChange={(e) => actions.onSearchChanged(e.target.value)}
                className="pl-10 transition-all duration-200 focus:scale-[1.01] focus:shadow-sm focus:border-blue-500"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => {
                const currentDesc = state.sortDescending;
                actions.changeSort('id', !currentDesc);
              }}
              size="sm"
              className="min-w-[120px]"
            >
              <ArrowUpDown className="h-4 w-4 mr-2" />
              {state.sortDescending ? '↓ Novější' : '↑ Starší'}
            </Button>
          </div>
          
          {/* Filters for VisitData */}
          {collection === 'VisitData' && (
            <div className="flex flex-wrap gap-2">
              <select
                value={state.stateFilter}
                onChange={(e) => actions.changeStateFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">Všechny stavy</option>
                <option value="PENDING_REVIEW">🕒 Čeká</option>
                <option value="APPROVED">✅ Schváleno</option>
                <option value="REJECTED">❌ Zamítnuto</option>
                <option value="DRAFT">📝 Koncept</option>
              </select>
              
              <select
                value={state.seasonFilter}
                onChange={(e) => actions.changeSeasonFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                disabled={loadingSeasons}
              >
                <option value="">Všechny sezóny</option>
                {seasons.map((season) => (
                  <option key={season.id} value={season.id}>
                    {season.name || `Sezóna ${season.year}`}
                  </option>
                ))}
              </select>
            </div>
          )}
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

      {/* Photo Viewer Dialog */}
      <AlertDialog open={!!selectedPhoto} onOpenChange={(open) => !open && setSelectedPhoto(null)}>
        <AlertDialogContent className="max-w-4xl">
          <AlertDialogHeader>
            <AlertDialogTitle>{selectedPhoto?.title || 'Fotografie'}</AlertDialogTitle>
          </AlertDialogHeader>
          {selectedPhoto && (
            <div className="relative w-full aspect-video">
              <Image
                src={selectedPhoto.url}
                alt={selectedPhoto.title || 'Photo'}
                fill
                className="object-contain"
                sizes="(max-width: 1024px) 90vw, 896px"
              />
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedPhoto(null)}>Zavřít</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
