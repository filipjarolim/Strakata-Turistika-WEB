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
  Clock,
  BarChart,
  TrendingUp,
  Camera
} from 'lucide-react';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';
import { cn } from "@/lib/utils";
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

    // Special rendering for CustomRoute (Strakatá Cesta)
    if (collection === 'CustomRoute') {
      const title = record.title ? String(record.title) : 'Nepojmenovaná trasa';
      const status = typeof record.status === 'string' ? record.status : null;
      const createdAt = record.createdAt ? String(record.createdAt) : null;
      const creatorId = record.creatorId ? String(record.creatorId) : null;
      const minDistanceKm = record.minDistanceKm ? Number(record.minDistanceKm) : null;
      const isSelected = selectedIds.has(record.id);

      return (
        <motion.div
          key={record.id}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`border rounded-2xl overflow-hidden transition-all ${isSelected
            ? 'ring-1 ring-amber-500 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20'
            : 'bg-white/60 dark:bg-black/20 backdrop-blur-md border-gray-200/50 dark:border-white/10'
            }`}
        >
          <div className="p-4 sm:p-5 flex flex-col sm:flex-row gap-4">
            <div className="flex-1 flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={(checked) => handleSelectRecord(record.id, checked as boolean)}
                  className="border-gray-300 dark:border-white/20"
                />
                <h3 className="font-bold text-gray-900 dark:text-white text-lg">{title}</h3>
                {status && (
                  <Badge
                    variant="outline"
                    className={`text-[10px] font-black uppercase tracking-widest border-0 ${status === 'APPROVED' ? 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400' :
                      status === 'PENDING_REVIEW' ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400' :
                        status === 'REJECTED' ? 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400' : 'bg-gray-100 dark:bg-gray-500/20 text-gray-700 dark:text-gray-400'
                      }`}
                  >
                    {status}
                  </Badge>
                )}
              </div>

              <div className="flex flex-wrap gap-4 text-xs text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-amber-500" />
                  ID Autora: <code className="bg-gray-100 dark:bg-white/5 px-1 rounded">{creatorId?.slice(0, 8)}...</code>
                </span>
                {minDistanceKm && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-blue-500" />
                    Min. Vzdálenost: <strong>{minDistanceKm} km</strong>
                  </span>
                )}
                {createdAt && (
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    Vytvořeno: {format(new Date(createdAt), "d. MMMM yyyy", { locale: cs })}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {status === 'PENDING_REVIEW' && (
                <div className="flex gap-2 mr-2">
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      // Implementation of approval for CustomRoute could be separate or shared
                      // For now let's assume unified API if possible or implement direct fetch
                      setProcessingAction(record.id);
                      fetch(`/api/admin/CustomRoute/${record.id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ status: 'APPROVED' })
                      }).then(() => actions.reloadForCurrentFilters())
                        .finally(() => setProcessingAction(null));
                    }}
                    disabled={processingAction === record.id}
                    className="h-9 bg-green-600 hover:bg-green-700 text-white font-bold text-xs rounded-xl px-4 gap-2"
                  >
                    {processingAction === record.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                    Schválit
                  </Button>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      const reason = prompt("Důvod zamítnutí:");
                      if (!reason) return;
                      setProcessingAction(record.id);
                      fetch(`/api/admin/CustomRoute/${record.id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ status: 'REJECTED', rejectionReason: reason })
                      }).then(() => actions.reloadForCurrentFilters())
                        .finally(() => setProcessingAction(null));
                    }}
                    disabled={processingAction === record.id}
                    variant="outline"
                    className="h-9 border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 font-bold text-xs rounded-xl px-4 gap-2"
                  >
                    <X className="h-3.5 w-3.5" />
                    Zamítnout
                  </Button>
                </div>
              )}
              <Link href={`/admin/CustomRoute/${record.id}`}>
                <Button variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5">
                  <Edit className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      );
    }

    // Special rendering for VisitData
    if (collection === 'VisitData') {
      const recordState = typeof record.state === 'string' ? record.state : null;
      const routeTitle = record.routeTitle ? String(record.routeTitle) : 'Nepojmenovaná návštěva';
      const routeDescription = record.routeDescription ? String(record.routeDescription) : null;
      const points = record.points ? Number(record.points) : 0;
      const year = record.year ? String(record.year) : null;
      const dogNotAllowed = record.dogNotAllowed === true || record.dogNotAllowed === 'true';
      const visitedPlaces = record.visitedPlaces;
      const visitDate = record.visitDate ? String(record.visitDate) : null;
      const rejectionReason = record.rejectionReason ? String(record.rejectionReason) : null;
      const route = record.route;
      const photos = Array.isArray(record.photos) ? record.photos as Array<{ url: string; title?: string }> : null;
      const dogName = record.dogName ? String(record.dogName) : null;
      const userId = record.userId ? String(record.userId) : null;
      const isSelected = selectedIds.has(record.id);

      const routeData = normalizeRouteData(route);
      const isMapExpanded = expandedMap.has(record.id);

      // Parse visited places
      let visitedPlacesArray: string[] = [];
      if (Array.isArray(visitedPlaces)) visitedPlacesArray = visitedPlaces;
      else if (typeof visitedPlaces === 'string') {
        try { visitedPlacesArray = JSON.parse(visitedPlaces); if (!Array.isArray(visitedPlacesArray)) visitedPlacesArray = []; }
        catch { visitedPlacesArray = visitedPlaces.split(',').map(p => p.trim()).filter(Boolean); }
      }

      const toggleMapExpand = (e: React.MouseEvent) => {
        e.stopPropagation();
        setExpandedMap(prev => {
          const newSet = new Set(prev);
          if (newSet.has(record.id)) newSet.delete(record.id);
          else newSet.add(record.id);
          return newSet;
        });
      };

      return (
        <motion.div
          key={record.id}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`border rounded-[2.5rem] overflow-hidden transition-all ${isSelected
            ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-500/5 border-blue-200 dark:border-blue-500/20 shadow-lg'
            : 'bg-white/80 dark:bg-zinc-900/50 backdrop-blur-xl border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 shadow-sm'
            }`}
        >
          <div className="flex flex-col">
            {/* Map Section */}
            {routeData && routeData.length > 0 && (
              <div className="relative w-full bg-zinc-100 dark:bg-black/40 group" style={{ height: isMapExpanded ? '450px' : '220px' }}>
                <DynamicGpxEditor
                  onSave={() => { }}
                  initialTrack={routeData}
                  readOnly={true}
                  hideControls={['editMode', 'undo', 'redo', 'add', 'delete', 'simplify', 'fullscreen']}
                />
                <button
                  onClick={toggleMapExpand}
                  className="absolute bottom-4 right-4 z-10 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl p-2.5 shadow-xl transition-all hover:scale-110 active:scale-95 text-zinc-600 dark:text-zinc-300"
                >
                  {isMapExpanded ? <Minimize2 className="h-5 w-5" /> : <Expand className="h-5 w-5" />}
                </button>
                <div className="absolute top-4 left-4 z-10">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={(checked) => handleSelectRecord(record.id, checked as boolean)}
                    className="w-6 h-6 border-white/50 bg-black/20 backdrop-blur-xl rounded-lg"
                  />
                </div>
              </div>
            )}

            <div className="p-5 sm:p-7 space-y-6">
              {/* Header */}
              <div className="flex justify-between items-start gap-4">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest bg-zinc-100 dark:bg-white/5 text-zinc-500 border-none px-2 py-0.5">
                      {String(record.id).slice(-6)}
                    </Badge>
                    <Badge
                      className={cn(
                        "text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border-none shadow-sm",
                        recordState === 'APPROVED' ? "bg-emerald-500 text-white" :
                          recordState === 'PENDING_REVIEW' ? "bg-amber-500 text-white" :
                            recordState === 'REJECTED' ? "bg-rose-500 text-white" : "bg-zinc-500 text-white"
                      )}
                    >
                      {recordState === 'APPROVED' ? 'Schváleno' : recordState === 'PENDING_REVIEW' ? 'Ke schválení' : recordState === 'REJECTED' ? 'Zamítnuto' : recordState}
                    </Badge>
                  </div>
                  <h3 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight leading-tight">{routeTitle}</h3>
                  <div className="flex flex-wrap items-center gap-4 pt-1">
                    {userId && (
                      <Link href={`/admin/User/${userId}`} className="flex items-center gap-2 group">
                        <div className="h-6 w-6 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center">
                          <User className="h-3 w-3 text-zinc-500" />
                        </div>
                        <span className="text-xs font-bold text-zinc-500 group-hover:text-blue-500 transition-colors">
                          {dogName ? `${dogName} (${String(userId).slice(0, 4)})` : `Uživatel ${String(userId).slice(0, 6)}`}
                        </span>
                      </Link>
                    )}
                    {visitDate && (
                      <div className="flex items-center gap-2 text-zinc-400">
                        <Calendar className="h-3.5 w-3.5" />
                        <span className="text-xs font-bold">{format(new Date(visitDate), "d. MMMM yyyy", { locale: cs })}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {recordState === 'PENDING_REVIEW' && (
                    <div className="flex gap-2">
                      <Button
                        onClick={(e) => handleApprove(record.id, e)}
                        disabled={processingAction === record.id}
                        className="h-10 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl px-4 shadow-lg shadow-emerald-500/20 active:scale-95"
                      >
                        {processingAction === record.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
                        <span className="text-xs font-black uppercase tracking-widest hidden sm:inline">Schválit</span>
                      </Button>
                      <Button
                        onClick={(e) => handleReject(record.id, e)}
                        disabled={processingAction === record.id}
                        className="h-10 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl px-4 shadow-lg shadow-rose-500/20 active:scale-95"
                      >
                        <X className="h-4 w-4 mr-2" />
                        <span className="text-xs font-black uppercase tracking-widest hidden sm:inline">Zamítnout</span>
                      </Button>
                    </div>
                  )}
                  <Link href={`/admin/${collection}/${record.id}`}>
                    <Button variant="outline" className="h-10 w-10 p-0 rounded-2xl bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 transition-all active:scale-95">
                      <Edit className="h-4 w-4 text-zinc-500" />
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Quick Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-3xl bg-zinc-50 dark:bg-white/5 border border-zinc-100 dark:border-white/5 flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-zinc-400 mb-1">
                    <Award className="h-4 w-4 text-amber-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Body</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-zinc-900 dark:text-white">{points.toFixed(1)}</span>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase">PTS</span>
                  </div>
                </div>

                <div className="p-4 rounded-3xl bg-zinc-50 dark:bg-white/5 border border-zinc-100 dark:border-white/5 flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-zinc-400 mb-1">
                    <MapPin className="h-4 w-4 text-blue-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Místa</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-zinc-900 dark:text-white">{visitedPlacesArray.length}</span>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase">NAV</span>
                  </div>
                </div>

                {photos && (
                  <div className="p-4 rounded-3xl bg-zinc-50 dark:bg-white/5 border border-zinc-100 dark:border-white/5 flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-zinc-400 mb-1">
                      <Camera className="h-4 w-4 text-purple-500" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Fotky</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-black text-zinc-900 dark:text-white">{photos.length}</span>
                      <span className="text-[10px] font-bold text-zinc-400 uppercase">IMG</span>
                    </div>
                  </div>
                )}

                <div className="p-4 rounded-3xl bg-zinc-50 dark:bg-white/5 border border-zinc-100 dark:border-white/5 flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-zinc-400 mb-1">
                    {dogNotAllowed ? <X className="h-4 w-4 text-rose-500" /> : <Check className="h-4 w-4 text-emerald-500" />}
                    <span className="text-[10px] font-black uppercase tracking-widest">Psi</span>
                  </div>
                  <span className={cn("text-xs font-black uppercase tracking-tighter", dogNotAllowed ? "text-rose-500" : "text-emerald-500")}>
                    {dogNotAllowed ? "ZAKÁZÁNO" : "POVOLENO"}
                  </span>
                </div>
              </div>

              {/* Photos Preview */}
              {photos && photos.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  {photos.map((photo, i) => (
                    <div
                      key={i}
                      onClick={(e) => { e.stopPropagation(); setSelectedPhoto(photo); }}
                      className="relative h-20 w-20 flex-shrink-0 rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 cursor-pointer hover:scale-105 transition-transform"
                    >
                      <Image src={photo.url} alt={photo.title || "Photo"} fill className="object-cover" />
                    </div>
                  ))}
                </div>
              )}

              {/* Rejection Reason */}
              {rejectionReason && (
                <div className="p-4 rounded-3xl bg-rose-50 dark:bg-rose-500/5 border border-rose-100 dark:border-rose-500/10">
                  <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 mb-1">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Důvod zamítnutí</span>
                  </div>
                  <p className="text-sm text-rose-700 dark:text-rose-300 font-medium">{rejectionReason}</p>
                </div>
              )}

              {/* Actions & Meta */}
              <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-white/5">
                <div className="flex gap-4">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Export ID</span>
                    <span className="text-xs font-mono text-zinc-500">{record.id}</span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Implementation of recalculate for this specific visit
                    setProcessingAction(record.id);
                    fetch('/api/admin/recalculate-points', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ visitId: record.id })
                    }).then(() => actions.reloadForCurrentFilters())
                      .finally(() => setProcessingAction(null));
                  }}
                  className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 hover:bg-blue-500/5 rounded-xl h-9"
                >
                  <TrendingUp className="h-3.5 w-3.5 mr-2" />
                  Přepočítat body
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      );
    }

    // Special rendering for User
    if (collection === 'User') {
      const name = record.name ? String(record.name) : 'Nepojmenovaný uživatel';
      const email = record.email ? String(record.email) : null;
      const role = record.role ? String(record.role) : null;
      const createdAt = record.createdAt ? String(record.createdAt) : null;
      const image = record.image ? String(record.image) : null;
      const isSelected = selectedIds.has(record.id);

      return (
        <motion.div
          key={record.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`border rounded-2xl p-4 transition-all ${isSelected
            ? 'ring-1 ring-blue-500 bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20'
            : 'bg-white/60 dark:bg-black/20 backdrop-blur-md border-gray-200/50 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20'
            }`}
        >
          <div className="flex items-center gap-4">
            <Checkbox
              checked={isSelected}
              onCheckedChange={(checked) => handleSelectRecord(record.id, checked as boolean)}
              className="border-gray-300 dark:border-white/20"
            />

            <div className="relative h-12 w-12 rounded-full overflow-hidden bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 flex-shrink-0">
              {image ? (
                <Image src={image} alt={name} fill className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <User className="h-6 w-6" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-gray-900 dark:text-white truncate">{name}</h3>
                {role && (
                  <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest bg-blue-50 dark:bg-blue-500/10 text-blue-600 border-blue-200 dark:border-blue-500/20">
                    {role}
                  </Badge>
                )}
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-xs text-gray-500 dark:text-gray-400">
                {email && <span className="truncate">{email}</span>}
                {createdAt && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {format(new Date(createdAt), "d. MMMM yyyy", { locale: cs })}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link href={`/vysledky/${new Date().getFullYear()}/uzivatel/${record.id}`}>
                <Button variant="outline" size="sm" className="h-9 rounded-xl border-indigo-200 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 font-bold text-xs gap-2">
                  <BarChart className="h-3.5 w-3.5" />
                  Statistiky
                </Button>
              </Link>
              <Link href={`/admin/${collection}/${record.id}`}>
                <Button variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400">
                  <Edit className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      );
    }

    // Default fallback rendering
    const isSelected = selectedIds.has(record.id);

    return (
      <motion.div
        key={record.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`border rounded-2xl p-4 transition-all ${isSelected
          ? 'ring-1 ring-blue-500 bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20'
          : 'bg-white/60 dark:bg-black/20 backdrop-blur-md border-gray-200/50 dark:border-white/10'
          }`}
      >
        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Checkbox
                checked={isSelected}
                onCheckedChange={(checked) => handleSelectRecord(record.id, checked as boolean)}
                className="border-gray-300 dark:border-white/20"
              />
              <Badge variant="outline" className="text-xs font-mono text-gray-500 border-gray-200 dark:border-white/10">
                {record.id}
              </Badge>
            </div>
            <Link href={`/admin/${collection}/${record.id}`}>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg text-gray-400">
                <Edit className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {Object.entries(record)
              .filter(([key]) => !['id', 'createdAt', 'updatedAt', 'userId'].includes(key))
              .slice(0, 6)
              .map(([key, value]) => (
                <div key={key} className="space-y-0.5">
                  <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider font-mono">{key}</div>
                  <div className="text-xs text-gray-700 dark:text-gray-300 font-medium truncate">
                    {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                  </div>
                </div>
              ))}
          </div>
        </div>
      </motion.div>
    );
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
