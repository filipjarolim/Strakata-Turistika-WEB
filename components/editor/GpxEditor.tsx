'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, useMap, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import { AlertCircle, Plus, Trash2, RotateCcw, RotateCw, Minus, EyeOff, Eye, MapPin, Maximize2, X } from 'lucide-react';
import simplify from 'simplify-js';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { renderToString } from 'react-dom/server';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';

// Fix for default marker icons in Leaflet with Next.js
const DefaultIcon = L.icon({
  iconUrl: '/images/marker-icon.png',
  iconRetinaUrl: '/images/marker-icon-2x.png',
  shadowUrl: '/images/marker-shadow.png',
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

function IOSMapControls({
  onAddPoint, onDeletePoint, onUndo, onRedo, canUndo, canRedo, canDelete, onSimplify, onHidePoints, hidePoints, onZoomToSelected, canZoomToSelected, editMode, onToggleEditMode, onToggleFullscreen, isFullscreen, readOnly, hideControls
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
}) {
  // Helper for tooltips
  const Control = ({ onClick, disabled, icon, label, id }: { onClick: () => void; disabled?: boolean; icon: React.ReactNode; label: string; id: string }) => {
    if (hideControls?.includes(id)) return null;
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" onClick={onClick} disabled={disabled} className="rounded-full w-8 h-8 sm:w-10 sm:h-10">
            {icon}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top" className="z-[3000]">
          {label}
        </TooltipContent>
      </Tooltip>
    );
  };

  // Special control for Switch (not inside a Button)
  const SwitchControl = ({ checked, onChange, label, id }: { checked: boolean; onChange: () => void; label: string; id: string }) => {
    if (hideControls?.includes(id)) return null;
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10">
            <Switch checked={checked} onCheckedChange={onChange} />
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="z-[3000]">
          {label}
        </TooltipContent>
      </Tooltip>
    );
  };

  return (
    <TooltipProvider>
      <div className="flex flex-nowrap items-center gap-1 bg-white/60 backdrop-blur-md rounded-2xl shadow-2xl px-1 py-1 border border-gray-200 w-full max-w-5xl overflow-x-auto">
        <Control onClick={onToggleFullscreen} icon={isFullscreen ? <X className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />} label={isFullscreen ? 'Close' : 'Enlarge'} id="fullscreen" />
        {!readOnly && <SwitchControl checked={editMode} onChange={onToggleEditMode} label={editMode ? 'Edit' : 'View'} id="editMode" />}
        {!readOnly && <Control onClick={onUndo} disabled={!canUndo || !editMode} icon={<RotateCcw className="h-5 w-5" />} label="Undo" id="undo" />}
        {!readOnly && <Control onClick={onRedo} disabled={!canRedo || !editMode} icon={<RotateCw className="h-5 w-5" />} label="Redo" id="redo" />}
        {!readOnly && <Control onClick={onAddPoint} disabled={!editMode} icon={<Plus className="h-5 w-5" />} label="Add" id="add" />}
        {!readOnly && <Control onClick={onDeletePoint} disabled={!canDelete || !editMode} icon={<Trash2 className="h-5 w-5" />} label="Delete" id="delete" />}
        {!readOnly && <Control onClick={onSimplify} disabled={!editMode} icon={<span className="font-bold text-lg">S</span>} label="Simplify" id="simplify" />}
        <Control onClick={onHidePoints} icon={hidePoints ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />} label={hidePoints ? 'Show' : 'Hide'} id="hidePoints" />
        <Control onClick={onZoomToSelected} disabled={!canZoomToSelected} icon={<MapPin className="h-5 w-5" />} label="Zoom" id="zoom" />
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

// Downsample points and keep mapping to original indices (guarantee unique indices)
function evenlyDownsamplePointsWithIndex(points: TrackPoint[], maxPoints: number): { point: TrackPoint; originalIdx: number }[] {
  if (points.length <= maxPoints) return points.map((p, i) => ({ point: p, originalIdx: i }));
  const result = [];
  const used = new Set<number>();
  for (let i = 0; i < maxPoints; i++) {
    let idx = Math.round(i * (points.length - 1) / (maxPoints - 1));
    // Ensure uniqueness
    while (used.has(idx) && idx < points.length) idx++;
    if (idx >= points.length) idx = points.length - 1;
    used.add(idx);
    result.push({ point: points[idx], originalIdx: idx });
  }
  return result;
}

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

function calculateRouteStats(points: TrackPoint[]): { distance: number; elevationGain: number } {
  if (points.length < 2) return { distance: 0, elevationGain: 0 };
  
  let totalDistance = 0;
  for (let i = 1; i < points.length; i++) {
    totalDistance += calculateDistance(points[i-1], points[i]);
  }
  
  const elevationGain = calculateElevationGain(points);
  
  return {
    distance: totalDistance,
    elevationGain
  };
}

export default function GpxEditor({ onSave, initialTrack = [], readOnly = false, hideControls = [] }: GpxEditorProps) {
  const [points, setPoints] = useState<TrackPoint[]>(initialTrack);
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
  const [routeStats, setRouteStats] = useState({ distance: 0, elevationGain: 0 });
  const mapRef = useRef<L.Map>(null);

  const MAX_VIEW_POINTS = 500;

  const addToHistory = useCallback((newPoints: TrackPoint[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newPoints);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

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
    if (mapRef.current) {
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

  const handleMarkerClick = (index: number) => {
    setSelectedPoint(index);
  };

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

  // Determine which points to display
  let displayPoints: TrackPoint[] = [];
  if (editMode) {
    displayPoints = points;
  } else {
    displayPoints = evenlyDownsamplePointsWithIndex(points, MAX_VIEW_POINTS).map(d => d.point);
  }

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
    setRouteStats(stats);
  }, [points]);

  const handleSave = () => {
    onSave(points);
  };

  return (
    <TooltipProvider>
      <div className={cn('relative w-full h-full', isFullscreen && 'fixed inset-0 z-[2000] bg-black/70 flex items-center justify-center')} onClick={handleOverlayClick}>
        <div className={cn('w-full h-full', isFullscreen && 'max-w-6xl max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex items-center justify-center')}>
          {/* Add route statistics display */}
          <div className="absolute top-4 left-4 z-[1100] bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 p-3">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Route Statistics</h3>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Distance:</span>
                <span className="text-sm font-medium">{routeStats.distance.toFixed(2)} km</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Elevation:</span>
                <span className="text-sm font-medium">{Math.round(routeStats.elevationGain)} m</span>
              </div>
            </div>
          </div>
          <MapContainer
            center={displayPoints[0] || [50.0755, 14.4378]}
            zoom={13}
            minZoom={10}
            style={{ height: '100%', width: '100%' }}
            ref={mapRef}
            className="rounded-lg border"
            zoomControl={false}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              eventHandlers={canEdit ? { click: handleMapClick } : undefined}
            />
            <FitBoundsOnPoints points={displayPoints} />
            <Polyline
              positions={displayPoints}
              pathOptions={{ color: 'blue', weight: 3 }}
            />
            {!hidePoints && displayPoints.map((point, index) => (
              <Tooltip key={index}>
                <TooltipTrigger asChild>
                  <Marker
                    position={point}
                    icon={L.divIcon({
                      className: '',
                      html: `<div style=\"transform: translate(-50%, -100%);\">${renderToString(<MapPinSVG selected={selectedPoint === index} />)}</div>`
                    })}
                    eventHandlers={canEdit ? {
                      click: () => handleMarkerClick(index),
                      mousedown: (e) => {
                        setDraggingIdx(index);
                        setDraggingLatLng(point);
                        e.originalEvent.preventDefault();
                        e.originalEvent.stopPropagation();
                      },
                      dragend: (e) => {
                        const newLatLng = e.target.getLatLng();
                        const newPoints = [...points];
                        newPoints[index] = { lat: newLatLng.lat, lng: newLatLng.lng };
                        setPoints(newPoints);
                        addToHistory(newPoints);
                        setSelectedPoint(index);
                        setDraggingIdx(null);
                        setDraggingLatLng(null);
                      }
                    } : {
                      click: () => handleMarkerClick(index)
                    }}
                    draggable={canEdit}
                  />
                </TooltipTrigger>
                <TooltipContent side="top" className="z-[3000]">
                  {`Point ${index + 1}`}
                </TooltipContent>
              </Tooltip>
            ))}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-[1000] w-fit flex justify-center px-1">
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
              />
            </div>
          </MapContainer>
        </div>
      </div>
    </TooltipProvider>
  );
}
