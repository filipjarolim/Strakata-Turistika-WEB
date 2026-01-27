'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  ArrowUpDown,
  Loader2,
  AlertCircle,
  Edit,
  Trash2,
  MapPin,
  Calendar,
  Award,
  FileText,
  Check,
  X,
  Expand,
  Minimize2,
  Copy,
  User,
  ExternalLink,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';
import { useAdmin } from '@/hooks/useAdmin';
import { LoadingSkeleton, EmptyState, LoadingSpinner } from '@/components/results/LoadingSkeleton';
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
      <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-white/5">
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

  // Stats data
  const [visitStats, setVisitStats] = useState<{ total: number; pending: number; approved: number; rejected: number } | null>(null);

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
      fetchSeasons();
    }
  }, [collection]);

  // Load Stats for VisitData
  useEffect(() => {
    if (collection === 'VisitData') {
      fetch('/api/admin/stats')
        .then(res => res.json())
        .then(data => setVisitStats({
          total: data.total || 0,
          pending: data.pending || 0,
          approved: data.approved || 0,
          rejected: data.rejected || 0
        }))
        .catch(err => console.error("Failed to load stats", err));
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
          className={`border rounded-2xl p-3 sm:p-4 transition-all cursor-pointer ${isSelected
            ? 'ring-1 ring-blue-500 bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20'
            : 'bg-white/60 dark:bg-black/20 backdrop-blur-md border-gray-200/50 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 hover:bg-white dark:hover:bg-white/5'
            }`}
        >
          <div className="flex flex-col gap-3">
            {/* Header with checkbox, ID and actions */}
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={(checked) => handleSelectRecord(record.id, checked as boolean)}
                  className="border-gray-300 dark:border-white/20 data-[state=checked]:bg-blue-600"
                />
                <Badge variant="outline" className="text-xs font-mono border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400">
                  {String(record.id).slice(0, 8)}...
                </Badge>
              </div>
              <div className="flex gap-1">
                {recordState === 'PENDING_REVIEW' && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 hover:bg-green-100 dark:hover:bg-green-500/20"
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
                      className="h-8 w-8 p-0 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-100 dark:hover:bg-red-500/20"
                      onClick={(e) => handleReject(record.id, e)}
                      disabled={processingAction === record.id}
                      title="Zamítnout"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </>
                )}
                <Link href={`/admin/${collection}/${record.id}`}>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10">
                    <Edit className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* News specific fields */}
            <div className="space-y-2">
              {title && (
                <h3 className="font-bold text-base sm:text-lg line-clamp-2 text-gray-900 dark:text-white">
                  {title}
                </h3>
              )}

              {content && (
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="line-clamp-3">{content.replace(/<[^>]*>/g, '')}</span>
                </div>
              )}

              {createdAt && (
                <div className="text-xs text-gray-500">
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
                <Badge variant="secondary" className="text-xs bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 border-0">
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
          // Check if it's an array
          if (Array.isArray(visitedPlaces)) {
            visitedPlacesArray = visitedPlaces;
          } else if (typeof visitedPlaces === 'string') {
            try {
              const trimmed = visitedPlaces.trim();
              if ((trimmed.startsWith('[') && trimmed.endsWith(']')) ||
                (trimmed.startsWith('{') && trimmed.endsWith('}'))) {
                const parsed = JSON.parse(visitedPlaces);
                if (Array.isArray(parsed)) {
                  visitedPlacesArray = parsed;
                } else {
                  visitedPlacesArray = visitedPlaces.split(',').map(p => p.trim()).filter(Boolean);
                }
              } else {
                visitedPlacesArray = visitedPlaces.split(',').map(p => p.trim()).filter(Boolean);
              }
            } catch {
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
          className={`border rounded-2xl overflow-hidden transition-all cursor-pointer ${isSelected
            ? 'ring-1 ring-blue-500 bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20'
            : 'bg-white/60 dark:bg-black/20 backdrop-blur-md border-gray-200/50 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 hover:bg-white dark:hover:bg-white/5'
            }`}
        >
          <div className="flex flex-col gap-0">
            {/* Map Preview - Full Width with Expand */}
            {routeData && routeData.length > 0 && (
              <div className="relative w-full bg-gray-100 dark:bg-black/40 border-b border-gray-200 dark:border-white/10" style={{ height: isMapExpanded ? '400px' : '200px' }}>
                <DynamicGpxEditor
                  onSave={() => { }}
                  initialTrack={routeData}
                  readOnly={true}
                  hideControls={['editMode', 'undo', 'redo', 'add', 'delete', 'simplify', 'fullscreen']}
                />
                <button
                  onClick={toggleMapExpand}
                  className="absolute top-2 right-2 z-10 bg-white/80 dark:bg-black/50 hover:bg-white dark:hover:bg-black/70 border border-gray-200 dark:border-white/20 rounded-lg p-2 backdrop-blur-sm transition-all text-gray-700 dark:text-white"
                  title={isMapExpanded ? "Zmenšit" : "Zvětšit"}
                >
                  {isMapExpanded ? (
                    <Minimize2 className="h-4 w-4" />
                  ) : (
                    <Expand className="h-4 w-4" />
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
                    className="border-gray-300 dark:border-white/20 data-[state=checked]:bg-blue-600"
                  />
                  <Badge variant="outline" className="text-xs font-mono border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400">
                    {String(record.id).slice(0, 8)}...
                  </Badge>
                  {recordState && (
                    <Badge
                      variant="outline"
                      className={`text-xs border-0 ${recordState === 'APPROVED' ? 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400' :
                        recordState === 'PENDING_REVIEW' ? 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400' :
                          recordState === 'REJECTED' ? 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400' : 'bg-gray-100 dark:bg-gray-500/20 text-gray-700 dark:text-gray-400'
                        }`}
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
                        className="h-8 w-8 p-0 text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 hover:bg-green-100 dark:hover:bg-green-500/20"
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
                        className="h-8 w-8 p-0 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-100 dark:hover:bg-red-500/20"
                        onClick={(e) => handleReject(record.id, e)}
                        disabled={processingAction === record.id}
                        title="Zamítnout"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                  <Link href={`/admin/${collection}/${record.id}`}>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Title */}
              {routeTitle && (
                <div className="space-y-1">
                  <h3 className="font-bold text-base sm:text-lg line-clamp-2 text-gray-900 dark:text-white">
                    {routeTitle}
                  </h3>
                  {(dogName || userId) && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      {dogName && (
                        <span className="flex items-center gap-1">
                          🐕 {dogName}
                        </span>
                      )}
                      {userId && (
                        <div className="flex items-center gap-1">
                          <Badge
                            variant="outline"
                            className="text-xs font-mono cursor-pointer hover:bg-gray-100 dark:hover:bg-white/5 border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 group flex items-center gap-1"
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
                            className="p-1 hover:bg-gray-100 dark:hover:bg-white/10 rounded transition-colors text-gray-500 dark:text-gray-400"
                            title="Kopírovat ID"
                          >
                            {copiedId === String(userId) ? (
                              <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
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
                <div className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <FileText className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <p className="line-clamp-2">{routeDescription}</p>
                </div>
              )}

              {/* Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {points !== null && (
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      const newPoints = prompt("Zadejte nový počet bodů:", String(points));
                      if (newPoints !== null && !isNaN(parseFloat(newPoints))) {
                        setProcessingAction(record.id);
                        fetch(`/api/admin/VisitData/${record.id}`, {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ points: parseFloat(newPoints) })
                        })
                          .then(res => {
                            if (!res.ok) throw new Error('Failed to update points');
                            actions.reloadForCurrentFilters();
                          })
                          .catch(err => {
                            console.error(err);
                            alert("Nepodařilo se upravit body.");
                          })
                          .finally(() => setProcessingAction(null));
                      }
                    }}
                    className="flex items-center gap-2 p-2 bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-500/10 dark:to-amber-500/10 border border-yellow-200 dark:border-yellow-500/20 rounded-lg cursor-pointer hover:bg-yellow-100 dark:hover:bg-yellow-500/20 transition-colors"
                    title="Klikněte pro úpravu bodů"
                  >
                    <Award className="h-5 w-5 text-yellow-600 dark:text-yellow-500" />
                    <div>
                      <div className="text-xs text-yellow-600 dark:text-yellow-500 font-medium">Body (Upravit)</div>
                      <div className="text-sm font-bold text-yellow-700 dark:text-yellow-400">{points}</div>
                    </div>
                  </div>
                )}
                {year && (
                  <div className="flex items-center gap-2 p-2 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-500/10 dark:to-indigo-500/10 border border-blue-200 dark:border-blue-500/20 rounded-lg">
                    <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-500" />
                    <div>
                      <div className="text-xs text-blue-600 dark:text-blue-500 font-medium">Sezóna</div>
                      <div className="text-sm font-bold text-blue-700 dark:text-blue-400">{year}</div>
                    </div>
                  </div>
                )}
                {visitDate && (
                  <div className="flex items-center gap-2 p-2 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-500/10 dark:to-emerald-500/10 border border-green-200 dark:border-green-500/20 rounded-lg">
                    <Calendar className="h-5 w-5 text-green-600 dark:text-green-500" />
                    <div>
                      <div className="text-xs text-green-600 dark:text-green-500 font-medium">Datum návštěvy</div>
                      <div className="text-xs font-bold text-green-700 dark:text-green-400">
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
                  <div className="flex items-center gap-2 p-2 bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-500/10 dark:to-rose-500/10 border border-red-200 dark:border-red-500/20 rounded-lg">
                    <X className="h-5 w-5 text-red-600 dark:text-red-500" />
                    <div>
                      <div className="text-xs text-red-600 dark:text-red-500 font-medium">Psi</div>
                      <div className="text-sm font-bold text-red-700 dark:text-red-400">Zakázáni</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Visited Places */}
              {visitedPlacesArray && visitedPlacesArray.length > 0 && (
                <div className="space-y-2 p-3 bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20 rounded-lg">
                  <div className="flex items-center gap-2 text-sm font-semibold text-purple-600 dark:text-purple-400">
                    <MapPin className="h-4 w-4" />
                    <span>Návštěv míst ({visitedPlacesArray.length})</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {visitedPlacesArray.slice(0, 8).map((place, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs bg-white dark:bg-black/40 border-purple-200 dark:border-purple-500/30 text-purple-600 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-500/20">
                        {place}
                      </Badge>
                    ))}
                    {visitedPlacesArray.length > 8 && (
                      <Badge variant="outline" className="text-xs bg-purple-100 dark:bg-purple-500/20 border-purple-300 dark:border-purple-500/30 text-purple-700 dark:text-purple-300">
                        +{visitedPlacesArray.length - 8} dalších
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      );
    }

    // Default fallback rendering... (You can add standard format here if needed)
    return null;
  };

  return (
    <div className="space-y-4 sm:space-y-6">

      {/* Stats for VisitData */}
      {collection === 'VisitData' && visitStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-6">
          {[
            { label: "Celkem", value: visitStats.total, color: "text-blue-600 dark:text-blue-400", bgColor: "bg-blue-500/5", icon: MapPin },
            { label: "Čekající", value: visitStats.pending, color: "text-amber-600 dark:text-amber-400", bgColor: "bg-amber-500/5", icon: Clock },
            { label: "Schváleno", value: visitStats.approved, color: "text-emerald-600 dark:text-emerald-400", bgColor: "bg-emerald-500/5", icon: Check },
            { label: "Zamítnuto", value: visitStats.rejected, color: "text-rose-600 dark:text-rose-400", bgColor: "bg-rose-500/5", icon: AlertCircle },
          ].map((stat, i) => (
            <div key={i} className="group relative">
              <div className="relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 flex flex-col items-start transition-all duration-300 hover:border-zinc-300 dark:hover:border-zinc-700 shadow-sm">
                <div className={`p-2 rounded-xl mb-4 ${stat.bgColor}`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">{stat.label}</span>
                <span className={`text-2xl font-black tracking-tight ${stat.color}`}>
                  {new Intl.NumberFormat('cs-CZ').format(stat.value)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Header Controls */}
      <div className="flex flex-col gap-3 sm:gap-4">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-start sm:items-center justify-between">
          <div className="min-w-0 flex-1">
            <h1 className="text-lg sm:text-xl font-bold truncate text-gray-900 dark:text-white">
              {collection === 'VisitData' ? 'Návštěvy' :
                collection === 'User' ? 'Uživatelé' :
                  collection === 'News' ? 'Aktuality' : collection}
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
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
                className="flex items-center gap-2 bg-red-100 dark:bg-red-600/20 text-red-600 dark:text-red-500 hover:bg-red-200 dark:hover:bg-red-600/30 border border-red-200 dark:border-red-500/20"
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
          <div className="flex items-center gap-2 p-2 bg-white/60 dark:bg-white/5 border border-gray-200/50 dark:border-white/10 rounded-lg">
            <Checkbox
              checked={allSelected}
              onCheckedChange={handleSelectAll}
              className={`border-gray-300 dark:border-white/20 data-[state=checked]:bg-blue-600 ${someSelected ? 'data-[state=checked]:bg-blue-500' : ''}`}
            />
            <span className="text-sm text-gray-500 dark:text-gray-400">
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
                className="pl-10 bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder:text-gray-400 transition-all duration-200 focus:scale-[1.01] focus:shadow-sm focus:border-blue-500 focus:bg-white dark:focus:bg-white/10"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => {
                const currentDesc = state.sortDescending;
                actions.changeSort('id', !currentDesc);
              }}
              size="sm"
              className="min-w-[120px] bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white"
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
                className="px-3 py-2 border border-gray-200 dark:border-white/10 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-black/40 text-gray-700 dark:text-gray-300"
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
                className="px-3 py-2 border border-gray-200 dark:border-white/10 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-black/40 text-gray-700 dark:text-gray-300"
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
        <Alert variant="destructive" className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-900/50 text-red-800 dark:text-red-200">
          <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
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
        <ScrollArea ref={scrollRef} className="h-[400px] sm:h-[500px] md:h-[600px] rounded-xl border border-gray-200/50 dark:border-white/10 bg-white/40 dark:bg-black/20">
          <div className="space-y-2 sm:space-y-3 p-4">
            <AnimatePresence>
              {state.records.map(renderRecordItem)}
            </AnimatePresence>

            {/* Load More Trigger */}
            {state.hasMore && (
              <div ref={loadMoreRef} className="flex justify-center py-3 sm:py-4">
                {state.isLoadingMore ? (
                  <LoadingSpinner size="sm" text="Načítání..." />
                ) : (
                  <Button variant="outline" onClick={actions.loadNextPage} size="sm" className="bg-white/60 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white dark:hover:bg-white/10">
                    Načíst více
                  </Button>
                )}
              </div>
            )}

            {/* Empty State */}
            {!state.isInitialLoading && state.records.length === 0 && (
              <div className="flex flex-col items-center justify-center p-8 text-center bg-transparent">
                <div className="p-4 rounded-full bg-gray-100 dark:bg-white/5 mb-4">
                  <Search className="h-8 w-8 text-gray-400 dark:text-gray-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-300">Žádné záznamy k zobrazení</h3>
                <p className="text-sm text-gray-500 mt-2 max-w-sm">
                  {state.searchQuery
                    ? 'Pro váš vyhledávací dotaz nebyly nalezeny žádné záznamy.'
                    : `Kolekce ${collection} neobsahuje žádné záznamy.`}
                </p>
                {state.searchQuery && (
                  <Button
                    variant="outline"
                    onClick={() => actions.onSearchChanged('')}
                    size="sm"
                    className="mt-4 bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white"
                  >
                    Vymazat vyhledávání
                  </Button>
                )}
              </div>
            )}
          </div>
        </ScrollArea>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-white dark:bg-black/90 dark:border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-900 dark:text-white">Opravdu chcete smazat?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-500 dark:text-gray-400">
              Chystáte se trvale smazat {selectedIds.size} {selectedIds.size === 1 ? 'záznam' : selectedIds.size < 5 ? 'záznamy' : 'záznamů'} z databáze.
              Tuto akci nelze vrátit zpět.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting} className="bg-white dark:bg-transparent border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white">Zrušit</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
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
        <AlertDialogContent className="max-w-4xl bg-white dark:bg-black/95 dark:border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-900 dark:text-white">{selectedPhoto?.title || 'Fotografie'}</AlertDialogTitle>
          </AlertDialogHeader>
          {selectedPhoto && (
            <div className="relative w-full aspect-video bg-gray-100 dark:bg-black/50 rounded-lg overflow-hidden">
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
            <AlertDialogCancel onClick={() => setSelectedPhoto(null)} className="dark:bg-white/10 border-0 dark:text-white dark:hover:bg-white/20">Zavřít</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
