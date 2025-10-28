'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, useMap, CircleMarker } from 'react-leaflet';
import L, { Control } from 'leaflet';
import 'leaflet/dist/leaflet.css';

import { Plus, Trash2, RotateCcw, RotateCw, EyeOff, Eye, MapPin, Maximize2, X, Pencil, Play, Flag } from 'lucide-react';
import simplify from 'simplify-js';

import { cn } from '@/lib/utils';
import { renderToString } from 'react-dom/server';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';

// Maximum number of points to display on the map (now dynamic)
function getMaxViewPointsForTrack(points: TrackPoint[]): number {
  const { distance } = calculateRouteStats(points);
  const pointsForDistance = Math.round(distance * 10); // 10km = 100 points
  return Math.max(30, Math.min(500, pointsForDistance));
}

const IOS_MAP_CONTROLS_STYLE = {
  iconSize: 'h-4 w-4', // Tailwind classes for icon size (default) - smaller
  iconSizeSm: 'h-5 w-5', // Tailwind classes for icon size (sm screens) - smaller
  controlSize: 'w-7 h-7', // Button size (default) - smaller
  controlSizeSm: 'w-9 h-9', // Button size (sm screens) - smaller
  barPaddingX: 'px-2 sm:px-3',
  barPaddingY: 'py-1.5',
  barGap: 'gap-1.5 sm:gap-2',
  barBorderRadius: 'rounded-2xl',
  barShadow: 'shadow-xl',
  barBorder: 'border border-black/40',
  barBg: 'bg-black/50 backdrop-blur-xl',
};

const GPX_EDITOR_MAP_STYLE = {
  markerRadius: 9, // px
  markerBorder: 3, // px
  markerColor: '#2563eb', // blue
  markerBorderColor: '#fff',
  markerSelectedRadius: 13,
  markerSelectedColor: '#1e3a8a', // darker blue
  markerStartWidth: 48,
  markerStartHeight: 32,
  markerFinishWidth: 56,
  markerFinishHeight: 32,
  markerStartColor: '#22c55e', // green
  markerFinishColor: '#ef4444', // red
  markerStartFontSize: 13,
  markerFinishFontSize: 13,
  markerIconColor: '#fff',
  polylineColor: '#2563eb',
  polylineWeight: 6, // thicker trail
  polylineOpacity: 0.7,
};

// Fix for default marker icons in Leaflet with Next.js
const DefaultIcon = L.icon({
  iconUrl: '/images/marker-icon.svg',
  iconRetinaUrl: '/images/marker-icon-2x.svg',
  shadowUrl: '/images/marker-shadow.svg',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface TrackPoint {
  lat: number;
  lng: number;
  ele?: number;
}

interface GpxEditorProps {
  onSave: (track: TrackPoint[]) => void;
  initialTrack?: TrackPoint[];
  readOnly?: boolean;
  hideControls?: string[];
}

// 1. Add a drag threshold for point dragging
const DRAG_THRESHOLD_PX = 5;

function IOSMapControls({
  onAddPoint, onDeletePoint, onUndo, onRedo, canUndo, canRedo, canDelete, onSimplify, onHidePoints, hidePoints, onZoomToSelected, canZoomToSelected, editMode, onToggleEditMode, onToggleFullscreen, isFullscreen, readOnly, hideControls, routeStats, mapRef, selectedSegment, draggingIdx
}: {
  onAddPoint: () => void;
  onDeletePoint: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  canDelete: boolean;
  onSimplify: () => void;
  onHidePoints: () => void;
  hidePoints: boolean;
  onZoomToSelected: () => void;
  canZoomToSelected: boolean;
  editMode: boolean;
  onToggleEditMode: () => void;
  onToggleFullscreen: () => void;
  isFullscreen: boolean;
  readOnly?: boolean;
  hideControls?: string[];
  routeStats: { distance: number; elevationGain: number; numPoints: number };
  mapRef: React.RefObject<L.Map | null>;
  selectedSegment: [number, number] | null;
  draggingIdx: number | null;
}) {
  // Helper for tooltips
  const Control = ({ onClick, disabled, icon, label, id }: { onClick: () => void; disabled?: boolean; icon: React.ReactNode; label: string; id: string }) => {
    if (hideControls?.includes(id)) return null;
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={onClick}
            disabled={disabled}
            className={cn(
              'rounded-full flex items-center justify-center bg-black/40 backdrop-blur-xl shadow-lg border border-black/50 transition hover:bg-black/60 active:scale-95 cursor-pointer text-white',
              IOS_MAP_CONTROLS_STYLE.controlSize,
              IOS_MAP_CONTROLS_STYLE.controlSizeSm,
              disabled && 'opacity-30 cursor-not-allowed'
            )}
            style={{ boxShadow: '0 4px 16px 0 rgba(0,0,0,0.2)' }}
          >
            {icon}
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="z-[3000]">
          {label === 'Close' ? 'Zavřít' :
           label === 'Enlarge' ? 'Zvětšit' :
           label === 'Edit' ? 'Upravit' :
           label === 'View' ? 'Zobrazit' :
           label === 'Undo' ? 'Zpět' :
           label === 'Redo' ? 'Vpřed' :
           label === 'Add' ? 'Přidat' :
           label === 'Delete' ? 'Smazat' :
           label === 'Simplify' ? 'Zjednodušit' :
           label === 'Show' ? 'Zobrazit body' :
           label === 'Hide' ? 'Skrýt body' :
           label === 'Zoom' ? 'Přiblížit' :
           label}
        </TooltipContent>
      </Tooltip>
    );
  };

  // Add mouse enter/leave handlers to disable/enable map dragging
  const handleMouseEnter = () => {
    if (mapRef.current) mapRef.current.dragging.disable();
  };
  const handleMouseLeave = () => {
    if (mapRef.current && draggingIdx === null) mapRef.current.dragging.enable();
  };

  return (
    <TooltipProvider>
      <div
        className={cn(
          'w-full flex items-center justify-between',
          IOS_MAP_CONTROLS_STYLE.barBg,
          IOS_MAP_CONTROLS_STYLE.barBorderRadius,
          IOS_MAP_CONTROLS_STYLE.barShadow,
          IOS_MAP_CONTROLS_STYLE.barBorder,
          IOS_MAP_CONTROLS_STYLE.barPaddingX,
          IOS_MAP_CONTROLS_STYLE.barPaddingY,
          IOS_MAP_CONTROLS_STYLE.barGap,
          'max-w-full select-none'
        )}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Controls: left-aligned, horizontal row, responsive size */}
        <div className={cn('flex flex-row flex-wrap items-center', IOS_MAP_CONTROLS_STYLE.barGap)}>
          <Control onClick={onToggleFullscreen} icon={isFullscreen ? <X className={cn(IOS_MAP_CONTROLS_STYLE.iconSize, IOS_MAP_CONTROLS_STYLE.iconSizeSm)} /> : <Maximize2 className={cn(IOS_MAP_CONTROLS_STYLE.iconSize, IOS_MAP_CONTROLS_STYLE.iconSizeSm)} />} label={isFullscreen ? 'Zavřít' : 'Zvětšit'} id="fullscreen" />
          {/* Edit mode: Pencil icon from lucide-react */}
          {!readOnly && <Control onClick={onToggleEditMode} icon={<Pencil className={cn(IOS_MAP_CONTROLS_STYLE.iconSize, IOS_MAP_CONTROLS_STYLE.iconSizeSm)} />} label={editMode ? 'Upravit' : 'Zobrazit'} id="editMode" />}
          {!readOnly && <Control onClick={onUndo} disabled={!canUndo || !editMode} icon={<RotateCcw className={cn(IOS_MAP_CONTROLS_STYLE.iconSize, IOS_MAP_CONTROLS_STYLE.iconSizeSm)} />} label="Zpět" id="undo" />}
          {!readOnly && <Control onClick={onRedo} disabled={!canRedo || !editMode} icon={<RotateCw className={cn(IOS_MAP_CONTROLS_STYLE.iconSize, IOS_MAP_CONTROLS_STYLE.iconSizeSm)} />} label="Znovu" id="redo" />}
          {!readOnly && <Control onClick={onAddPoint} disabled={!editMode || !selectedSegment} icon={<Plus className={cn(IOS_MAP_CONTROLS_STYLE.iconSize, IOS_MAP_CONTROLS_STYLE.iconSizeSm)} />} label="Přidat" id="add" />}
          {!readOnly && <Control onClick={onDeletePoint} disabled={!canDelete || !editMode} icon={<Trash2 className={cn(IOS_MAP_CONTROLS_STYLE.iconSize, IOS_MAP_CONTROLS_STYLE.iconSizeSm)} />} label="Smazat" id="delete" />}
          {!readOnly && <Control onClick={onSimplify} disabled={!editMode} icon={<span className="font-bold text-lg">S</span>} label="Zjednodušit" id="simplify" />}
          <Control onClick={onHidePoints} icon={hidePoints ? <EyeOff className={cn(IOS_MAP_CONTROLS_STYLE.iconSize, IOS_MAP_CONTROLS_STYLE.iconSizeSm)} /> : <Eye className={cn(IOS_MAP_CONTROLS_STYLE.iconSize, IOS_MAP_CONTROLS_STYLE.iconSizeSm)} />} label={hidePoints ? 'Zobrazit' : 'Skrýt'} id="hidePoints" />
          <Control onClick={onZoomToSelected} disabled={!canZoomToSelected} icon={<MapPin className={cn(IOS_MAP_CONTROLS_STYLE.iconSize, IOS_MAP_CONTROLS_STYLE.iconSizeSm)} />} label="Přiblížit" id="zoom" />
        </div>
        {/* Stats: right-aligned */}
        <div className="flex flex-col items-end text-xs sm:text-sm px-2 select-none">
          <div className="flex items-center gap-2">
            <span className="text-gray-600">Vzdálenost:</span>
            <span className="font-medium">{routeStats.distance.toFixed(2)} km</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-600">Body:</span>
            <span className="font-medium">{routeStats.numPoints}</span>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

function FitBoundsOnPoints({ points }: { points: { lat: number; lng: number }[] }) {
  const map = useMap();
  const prevCount = useRef(points.length);
  useEffect(() => {
    // Only fit bounds on mount or when number of points changes
    if (points.length > 1 && points.length !== prevCount.current) {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [40, 40] });
      prevCount.current = points.length;
    } else if (points.length === 1 && points.length !== prevCount.current) {
      map.setView(points[0], 15);
      prevCount.current = points.length;
    }
  }, [points.length, map, points]);
  return null;
}

// Optimize point downsampling with better algorithm
function evenlyDownsamplePointsWithIndex(points: TrackPoint[], maxPoints: number): { point: TrackPoint; originalIdx: number }[] {
  if (points.length <= maxPoints) return points.map((p, i) => ({ point: p, originalIdx: i }));
  
  // Use Douglas-Peucker algorithm for better downsampling
  const simplified = simplify(points.map(p => ({ x: p.lat, y: p.lng })), 0.0001, true);
  
  // Map back to original points and indices
  const result: { point: TrackPoint; originalIdx: number }[] = [];
  const used = new Set<number>();
  
  // Always include first and last points
  result.push({ point: points[0], originalIdx: 0 });
  used.add(0);
  
  // Add simplified points
  for (const p of simplified) {
    // Find closest original point
    let minDist = Infinity;
    let closestIdx = -1;
    
    for (let i = 0; i < points.length; i++) {
      if (used.has(i)) continue;
      const dist = Math.pow(points[i].lat - p.x, 2) + Math.pow(points[i].lng - p.y, 2);
      if (dist < minDist) {
        minDist = dist;
        closestIdx = i;
      }
    }
    
    if (closestIdx !== -1) {
      result.push({ point: points[closestIdx], originalIdx: closestIdx });
      used.add(closestIdx);
    }
  }
  
  // Always include last point
  if (!used.has(points.length - 1)) {
    result.push({ point: points[points.length - 1], originalIdx: points.length - 1 });
  }
  
  return result;
}

// Add debounce utility
function debounce<T extends (...args: unknown[]) => unknown>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

interface CircleMarkerProps {
  center: [number, number];
  radius: number;
  pathOptions: Record<string, unknown>;
  eventHandlers: Record<string, unknown>;
  className?: string;
}

// Add memoized marker component
const MemoizedCircleMarker = React.memo(function MemoizedCircleMarker({ center, radius, pathOptions, eventHandlers, className }: CircleMarkerProps) {
  return (
    <CircleMarker
      center={center}
      radius={radius}
      pathOptions={pathOptions}
      eventHandlers={eventHandlers}
      className={className}
    />
  );
});

interface PolylineProps {
  positions: [number, number][];
  pathOptions: Record<string, unknown>;
  eventHandlers: Record<string, unknown>;
}

// Add memoized polyline component
const MemoizedPolyline = React.memo(function MemoizedPolyline({ positions, pathOptions, eventHandlers }: PolylineProps) {
  return (
    <Polyline
      positions={positions}
      pathOptions={pathOptions}
      eventHandlers={eventHandlers}
    />
  );
});

// Helper function to convert TrackPoint to Leaflet coordinates
const toLeafletCoords = (point: TrackPoint): [number, number] => [point.lat, point.lng];

// SVG Map Pin component (blue border, no margin)
function MapPinSVG({ selected }: { selected?: boolean }) {
  return (
    <svg width={selected ? 32 : 24} height={selected ? 32 : 24} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block' }}>
      <g filter={selected ? "url(#shadow)" : undefined}>
        <path
          d="M12 2C7.58 2 4 5.58 4 10c0 4.42 4.5 9.54 7.13 12.36a1 1 0 0 0 1.47 0C15.5 19.54 20 14.42 20 10c0-4.42-3.58-8-8-8z"
          fill={selected ? '#2563eb' : '#fff'}
          stroke="#2563eb"
          strokeWidth={selected ? 2 : 2}
        />
        <circle cx="12" cy="10" r="4" fill={selected ? '#fff' : '#2563eb'} stroke="#2563eb" strokeWidth={selected ? 2 : 2} />
      </g>
      {selected && (
        <defs>
          <filter id="shadow" x="-2" y="-2" width="28" height="28" filterUnits="userSpaceOnUse">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#2563eb" floodOpacity="0.3" />
          </filter>
        </defs>
      )}
    </svg>
  );
}

// Add utility functions for calculations
function calculateDistance(point1: TrackPoint, point2: TrackPoint): number {
  const R = 6371; // Earth's radius in km
  const dLat = (point2.lat - point1.lat) * Math.PI / 180;
  const dLon = (point2.lng - point1.lng) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function calculateElevationGain(points: TrackPoint[]): number {
  let totalGain = 0;
  for (let i = 1; i < points.length; i++) {
    const ele1 = points[i-1].ele || 0;
    const ele2 = points[i].ele || 0;
    const diff = ele2 - ele1;
    if (diff > 0) {
      totalGain += diff;
    }
  }
  return totalGain;
}

function calculateRouteStats(points: TrackPoint[]): { distance: number; elevationGain: number; numPoints: number } {
  if (points.length < 2) return { distance: 0, elevationGain: 0, numPoints: 0 };
  
  let totalDistance = 0;
  for (let i = 1; i < points.length; i++) {
    totalDistance += calculateDistance(points[i-1], points[i]);
  }
  
  const elevationGain = calculateElevationGain(points);
  
  return {
    distance: totalDistance,
    elevationGain,
    numPoints: points.length
  };
}

// Add a style object for user-select none
const GPX_EDITOR_USER_SELECT_NONE = {
  userSelect: 'none' as const,
};

// Helper to trim a segment by a given radius in meters (approximate)
function trimSegmentEnds(
  p1: { lat: number; lng: number },
  p2: { lat: number; lng: number },
  trimMeters: number
): [{ lat: number; lng: number }, { lat: number; lng: number }] {
  // Use simple linear interpolation for small distances
  const toRad = (deg: number) => deg * Math.PI / 180;
  const R = 6371000; // Earth radius in meters
  const lat1 = toRad(p1.lat), lng1 = toRad(p1.lng);
  const lat2 = toRad(p2.lat), lng2 = toRad(p2.lng);
  const dLat = lat2 - lat1, dLng = lng2 - lng1;
  const dist = Math.sqrt(dLat * dLat + dLng * dLng) * R;
  if (dist === 0) return [p1, p2];
  const trimFrac = trimMeters / dist;
  const interp = (a: number, b: number, f: number) => a + (b - a) * f;
  return [
    {
      lat: interp(p1.lat, p2.lat, trimFrac),
      lng: interp(p1.lng, p2.lng, trimFrac)
    },
    {
      lat: interp(p2.lat, p1.lat, trimFrac),
      lng: interp(p2.lng, p1.lng, trimFrac)
    }
  ];
}

// For start/finish markers, use fixed width/height and set iconAnchor to center
const START_FINISH_MARKER_WIDTH = 80;
const START_FINISH_MARKER_HEIGHT = 32;

export default function GpxEditor({ onSave, initialTrack = [], readOnly = false, hideControls = [] }: GpxEditorProps) {
  // Calculate max view points based on initial track distance
  const maxViewPoints = getMaxViewPointsForTrack(initialTrack);
  const [points, setPoints] = useState<TrackPoint[]>(() => {
    if (initialTrack.length > maxViewPoints) {
      return evenlyDownsamplePointsWithIndex(initialTrack, maxViewPoints).map(d => d.point);
    }
    return initialTrack;
  });
  const [history, setHistory] = useState<TrackPoint[][]>([initialTrack]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [selectedPoint, setSelectedPoint] = useState<number | null>(null);
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);
  const [draggingLatLng, setDraggingLatLng] = useState<{ lat: number; lng: number } | null>(null);
  const [hidePoints, setHidePoints] = useState(false);
  const [editMode, setEditMode] = useState(!readOnly);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSimplified, setIsSimplified] = useState(false);
  const [originalPoints, setOriginalPoints] = useState<TrackPoint[]>([]);
  const [routeStats, setRouteStats] = useState({ distance: 0, elevationGain: 0, numPoints: 0 });
  const mapRef = useRef<L.Map | null>(null);
  const [selectedSegment, setSelectedSegment] = useState<[number, number] | null>(null);

  const addToHistory = useCallback((newPoints: TrackPoint[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newPoints);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  // Memoize display points calculation
  const displayPoints = React.useMemo(() => {
    if (editMode) {
      if (points.length > maxViewPoints) {
        return evenlyDownsamplePointsWithIndex(points, maxViewPoints).map(d => d.point);
      }
      return points;
    }
    return evenlyDownsamplePointsWithIndex(points, maxViewPoints).map(d => d.point);
  }, [points, editMode, maxViewPoints]);

  // Debounce map interactions
  const debouncedHandleMouseMove = useCallback(
    (e: L.LeafletMouseEvent) => {
      if (draggingIdx !== null && draggingLatLng) {
        requestAnimationFrame(() => {
          const newPoints = [...points];
          newPoints[draggingIdx] = { lat: e.latlng.lat, lng: e.latlng.lng };
          setPoints(newPoints);
        });
      }
    },
    [draggingIdx, draggingLatLng, points]
  );

  const handleMouseMove = useCallback((e: L.LeafletMouseEvent) => {
    if (draggingIdx !== null && draggingLatLng) {
      const newPoints = [...points];
      newPoints[draggingIdx] = { lat: e.latlng.lat, lng: e.latlng.lng };
      setPoints(newPoints);
    }
  }, [draggingIdx, draggingLatLng, points]);

  const handleMouseUp = useCallback((e: L.LeafletMouseEvent) => {
    if (draggingIdx !== null) {
      const newPoints = [...points];
      newPoints[draggingIdx] = { lat: e.latlng.lat, lng: e.latlng.lng };
      setPoints(newPoints);
      addToHistory(newPoints);
      setDraggingIdx(null);
      setDraggingLatLng(null);
    }
  }, [draggingIdx, points, addToHistory]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (draggingIdx !== null) {
      map.on('mousemove', handleMouseMove);
      map.on('mouseup', handleMouseUp);
    }

    return () => {
      map.off('mousemove', handleMouseMove);
      map.off('mouseup', handleMouseUp);
    };
  }, [draggingIdx, draggingLatLng, points, handleMouseMove, handleMouseUp, addToHistory]);

  const addPoint = () => {
    if (selectedSegment && points.length > 1) {
      // Insert at midpoint of selected segment
      const [i1, i2] = selectedSegment;
      const p1 = points[i1];
      const p2 = points[i2];
      const mid = {
        lat: (p1.lat + p2.lat) / 2,
        lng: (p1.lng + p2.lng) / 2,
      };
      const newPoints = [...points];
      newPoints.splice(i2, 0, mid);
      setPoints(newPoints);
      addToHistory(newPoints);
      setSelectedPoint(i2); // select the new point
      setSelectedSegment(null);
    } else if (mapRef.current) {
      const center = mapRef.current.getCenter();
      const newPoints = [...points, { lat: center.lat, lng: center.lng }];
      setPoints(newPoints);
      addToHistory(newPoints);
    }
  };

  const deletePoint = () => {
    if (selectedPoint !== null) {
      const newPoints = points.filter((_, index) => index !== selectedPoint);
      setPoints(newPoints);
      setSelectedPoint(null);
      addToHistory(newPoints);
    }
  };

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setPoints(history[historyIndex - 1]);
      setSelectedPoint(null);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setPoints(history[historyIndex + 1]);
      setSelectedPoint(null);
    }
  };

  const handleMarkerClick = useCallback((index: number) => {
    setSelectedPoint(index);
    setSelectedSegment(null);
  }, []);

  const handleMapClick = (e: L.LeafletMouseEvent) => {
    const newPoints = [...points, { lat: e.latlng.lat, lng: e.latlng.lng }];
    setPoints(newPoints);
    addToHistory(newPoints);
  };

  // Simplify track using simplify-js
  const simplifyTrack = () => {
    if (points.length < 3) return;
    
    if (isSimplified) {
      // Restore original points
      setPoints(originalPoints);
      addToHistory(originalPoints);
      setIsSimplified(false);
    } else {
      // Save original points and simplify
      setOriginalPoints(points);
      const simplified = simplify(points.map(p => ({ x: p.lat, y: p.lng })), 0.0005, true).map(p => ({ lat: p.x, lng: p.y }));
      setPoints(simplified);
      addToHistory(simplified);
      setIsSimplified(true);
    }
    setSelectedPoint(null);
  };

  // Hide points toggle
  const toggleHidePoints = () => setHidePoints(h => !h);

  // Zoom to selected point
  const zoomToSelected = () => {
    if (selectedPoint !== null && mapRef.current) {
      mapRef.current.setView(points[selectedPoint], 16);
    }
  };

  // Only allow editing in edit mode
  const canEdit = editMode && !readOnly;

  // Fullscreen handler
  useEffect(() => {
    if (!isFullscreen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsFullscreen(false);
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isFullscreen]);

  // Fix Leaflet tiles when fullscreen toggles
  useEffect(() => {
    if (!mapRef.current) return;
    setTimeout(() => {
      mapRef.current?.invalidateSize();
    }, 350);
  }, [isFullscreen]);

  // Overlay click to close fullscreen
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && isFullscreen) setIsFullscreen(false);
  };

  // Update stats when points change
  useEffect(() => {
    const stats = calculateRouteStats(points);
    setRouteStats({ ...stats, numPoints: points.length });
  }, [points]);

  const handleSave = () => {
    onSave(points);
  };

  // Optimize marker rendering with virtualization
  const renderMarkers = React.useCallback(() => {
    if (hidePoints) return null;
    
    return displayPoints.map((point, index) => {
      const isSelected = index === selectedPoint;
      const isSegmentEnd = selectedSegment && (index === selectedSegment[0] || index === selectedSegment[1]);
      const isStartPoint = index === 0;
      const isEndPoint = index === displayPoints.length - 1;
      const label = `Point ${index + 1}`;

      // Special handling for start/end points
      if (isStartPoint || isEndPoint) {
        return (
          <Marker
            key={index}
            position={toLeafletCoords(point)}
            draggable={canEdit}
            icon={L.divIcon({
              className: 'custom-marker',
              html: renderToString(
                <div className={cn(
                  'flex items-center justify-center rounded-full bg-white shadow-lg border-2',
                  isStartPoint ? 'border-green-500' : 'border-red-500',
                  isSelected ? 'scale-125 transition-transform' : ''
                )}>
                  {isStartPoint ? (
                    <Play className="h-6 w-6 text-green-500" />
                  ) : (
                    <Flag className="h-6 w-6 text-red-500" />
                  )}
                </div>
              ),
              iconSize: [24, 24],
              iconAnchor: [12, 12]
            })}
            eventHandlers={canEdit ? {
              click: () => handleMarkerClick(index),
              dragend: (e) => {
                const marker = e.target;
                const position = marker.getLatLng();
                const newPoints = [...points];
                newPoints[index] = { lat: position.lat, lng: position.lng };
                setPoints(newPoints);
                addToHistory(newPoints);
              }
            } : {}}
          />
        );
      }

      return (
        <CircleMarker
          key={index}
          center={toLeafletCoords(point)}
          radius={isSelected || isSegmentEnd ? 8 : 6}
          pathOptions={{
            color: '#fff',
            weight: 2,
            fillColor: isSelected || isSegmentEnd ? '#1e40af' : '#3b82f6',
            fillOpacity: 1,
          }}
          eventHandlers={canEdit ? {
            click: () => handleMarkerClick(index),
            mousedown: (e: L.LeafletMouseEvent) => {
              if (mapRef.current) mapRef.current.dragging.disable();
              const startX = e.originalEvent.clientX;
              const startY = e.originalEvent.clientY;
              let moved = false;
              const onMove = (moveEvent: MouseEvent) => {
                if (!moved && (Math.abs(moveEvent.clientX - startX) > DRAG_THRESHOLD_PX || Math.abs(moveEvent.clientY - startY) > DRAG_THRESHOLD_PX)) {
                  setDraggingIdx(index);
                  setDraggingLatLng(point);
                  moved = true;
                }
              };
              const onUp = () => {
                window.removeEventListener('mousemove', onMove);
                window.removeEventListener('mouseup', onUp);
                if (mapRef.current && draggingIdx === null) mapRef.current.dragging.enable();
              };
              window.addEventListener('mousemove', onMove);
              window.addEventListener('mouseup', onUp);
              e.originalEvent.preventDefault();
              e.originalEvent.stopPropagation();
            }
          } : {
            click: () => handleMarkerClick(index)
          }}
          className={cn(
            'transition-all duration-200',
            isSelected && 'scale-125'
          )}
        />
      );
    });
  }, [displayPoints, selectedPoint, draggingIdx, selectedSegment, canEdit, points, addToHistory, handleMarkerClick, mapRef, hidePoints]);

  return (
    <TooltipProvider>
      <div className={cn('relative w-full h-full', isFullscreen && 'fixed inset-0 z-[2000] bg-black/70 flex items-center justify-center')} onClick={handleOverlayClick}>
        <div className={cn('w-full h-full', isFullscreen && 'max-w-6xl max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex items-center justify-center')}>
          <MapContainer
            center={displayPoints[0] || [50.0755, 14.4378]}
            zoom={13}
            minZoom={10}
            style={{ height: '100%', width: '100%', ...GPX_EDITOR_USER_SELECT_NONE }}
            ref={mapRef}
            className="rounded-lg border select-none"
            zoomControl={false}
            attributionControl={false}
            preferCanvas={true}
          >
            <TileLayer
              url={`https://api.maptiler.com/maps/outdoor-v2/256/{z}/{x}/{y}.png?key=a5w3EO45npvzNFzD6VoD`}
              eventHandlers={canEdit ? { click: handleMapClick } : undefined}
            />
           
            {/* Only fit bounds on initial load or explicit zoom, not on every change */}
            {/* <FitBoundsOnPoints points={displayPoints} /> */}
            <Polyline
              positions={displayPoints.map(toLeafletCoords)}
              pathOptions={{ color: GPX_EDITOR_MAP_STYLE.polylineColor, weight: GPX_EDITOR_MAP_STYLE.polylineWeight, opacity: GPX_EDITOR_MAP_STYLE.polylineOpacity }}
              eventHandlers={{
                click: (e: L.LeafletMouseEvent) => {
                  if (displayPoints.length < 2 || !mapRef.current) return;
                  const map = mapRef.current;
                  const clickPoint = map.latLngToLayerPoint(e.latlng);
                  let minDist = Infinity;
                  let segIdx: [number, number] | null = null;
                  for (let i = 0; i < displayPoints.length - 1; i++) {
                    const p1 = map.latLngToLayerPoint(L.latLng(displayPoints[i].lat, displayPoints[i].lng));
                    const p2 = map.latLngToLayerPoint(L.latLng(displayPoints[i + 1].lat, displayPoints[i + 1].lng));
                    // Use Leaflet's pointToSegmentDistance
                    const dist = L.LineUtil.pointToSegmentDistance(clickPoint, p1, p2);
                    if (dist < minDist) {
                      minDist = dist;
                      segIdx = [i, i + 1];
                    }
                  }
                  // Only select if close enough (e.g., < 15px)
                  if (minDist < 15) {
                    setSelectedSegment(segIdx);
                    setSelectedPoint(null);
                  } else {
                    setSelectedSegment(null);
                  }
                }
              }}
            />
            {/* Highlighted segment (rendered before points so points overlay it) */}
            {selectedSegment && (() => {
              const [i1, i2] = selectedSegment;
              const p1 = displayPoints[i1];
              const p2 = displayPoints[i2];
              const trimmed = trimSegmentEnds(p1, p2, 10);
              return (
                <MemoizedPolyline
                  positions={trimmed.map(toLeafletCoords)}
                  pathOptions={{ 
                    color: GPX_EDITOR_MAP_STYLE.markerSelectedColor, 
                    weight: GPX_EDITOR_MAP_STYLE.polylineWeight + 2, 
                    opacity: 0.9, 
                    lineCap: 'round',
                    zIndex: 400 // Lower than points (1000)
                  }}
                  eventHandlers={{
                    click: (e: L.LeafletMouseEvent) => {
                      if (displayPoints.length < 2 || !mapRef.current) return;
                      const map = mapRef.current;
                      const clickPoint = map.latLngToLayerPoint(e.latlng);
                      let minDist = Infinity;
                      let segIdx: [number, number] | null = null;
                      for (let i = 0; i < displayPoints.length - 1; i++) {
                        const p1 = map.latLngToLayerPoint(L.latLng(displayPoints[i].lat, displayPoints[i].lng));
                        const p2 = map.latLngToLayerPoint(L.latLng(displayPoints[i + 1].lat, displayPoints[i + 1].lng));
                        const dist = L.LineUtil.pointToSegmentDistance(clickPoint, p1, p2);
                        if (dist < minDist) {
                          minDist = dist;
                          segIdx = [i, i + 1];
                        }
                      }
                      if (minDist < 15) {
                        setSelectedSegment(segIdx);
                        setSelectedPoint(null);
                      } else {
                        setSelectedSegment(null);
                      }
                    }
                  }}
                />
              );
            })()}
            {/* Points rendered last with higher z-index */}
            <div style={{ zIndex: 1000 }}>
              {renderMarkers()}
            </div>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-[1000] w-full flex justify-center px-1">
              <IOSMapControls
                onAddPoint={addPoint}
                onDeletePoint={deletePoint}
                onUndo={undo}
                onRedo={redo}
                canUndo={historyIndex > 0}
                canRedo={historyIndex < history.length - 1}
                canDelete={selectedPoint !== null}
                onSimplify={simplifyTrack}
                onHidePoints={toggleHidePoints}
                hidePoints={hidePoints}
                onZoomToSelected={zoomToSelected}
                canZoomToSelected={selectedPoint !== null}
                editMode={editMode}
                onToggleEditMode={() => setEditMode(e => !e)}
                onToggleFullscreen={() => setIsFullscreen(f => !f)}
                isFullscreen={isFullscreen}
                readOnly={readOnly}
                hideControls={hideControls}
                routeStats={routeStats}
                mapRef={mapRef}
                selectedSegment={selectedSegment}
                draggingIdx={draggingIdx}
              />
            </div>
            <div className="absolute top-2 right-2 z-[1100] bg-white/80 rounded-lg px-3 py-1 text-xs text-gray-700 shadow select-none pointer-events-auto">
  &copy; <a href="https://www.maptiler.com/copyright/" target="_blank" rel="noopener noreferrer">MapTiler</a>, 
  &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors,
  <a href="https://leafletjs.com/" target="_blank" rel="noopener noreferrer">Leaflet</a>
</div>

          </MapContainer>
        </div>
      </div>
    </TooltipProvider>
  );
}