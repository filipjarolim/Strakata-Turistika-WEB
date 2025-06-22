'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, useMap, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Navigation, Play, Pause } from 'lucide-react'; 
import { cn } from '@/lib/utils';

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

interface GPSPosition {
  latitude: number;
  longitude: number;
  altitude?: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
  timestamp: number;
}

interface GPSMapProps {
  trackPoints: { lat: number; lng: number }[];
  isTracking: boolean;
  isPaused: boolean;
  currentPosition: GPSPosition | null;
}

const GPS_MAP_STYLE = {
  polylineColor: '#2563eb',
  polylineWeight: 4,
  polylineOpacity: 0.8,
  currentPositionColor: '#ef4444',
  currentPositionRadius: 8,
  startMarkerColor: '#22c55e',
  finishMarkerColor: '#ef4444',
  accuracyCircleColor: '#3b82f6',
  accuracyCircleOpacity: 0.2,
};

// Component to fit bounds on track points
function FitBoundsOnTrack({ trackPoints }: { trackPoints: { lat: number; lng: number }[] }) {
  const map = useMap();
  const prevCount = useRef(trackPoints.length);
  
  useEffect(() => {
    if (trackPoints.length > 1 && trackPoints.length !== prevCount.current) {
      const bounds = L.latLngBounds(trackPoints);
      map.fitBounds(bounds, { padding: [40, 40] });
      prevCount.current = trackPoints.length;
    } else if (trackPoints.length === 1 && trackPoints.length !== prevCount.current) {
      map.setView(trackPoints[0], 15);
      prevCount.current = trackPoints.length;
    }
  }, [trackPoints.length, map, trackPoints]);
  
  return null;
}

// Component to follow current position
function FollowCurrentPosition({ currentPosition, isTracking }: { currentPosition: GPSPosition | null; isTracking: boolean }) {
  const map = useMap();
  
  useEffect(() => {
    if (currentPosition && isTracking) {
      map.setView([currentPosition.latitude, currentPosition.longitude], 16);
    }
  }, [currentPosition?.latitude, currentPosition?.longitude, isTracking, map]);
  
  return null;
}

// Start marker component
function StartMarker({ position }: { position: { lat: number; lng: number } }) {
  return (
    <Marker
      position={position}
      icon={L.divIcon({
        className: 'custom-start-marker',
        html: `
          <div class="flex items-center justify-center w-12 h-8 bg-green-500 text-white rounded-full shadow-lg border-2 border-white">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd" />
            </svg>
          </div>
        `,
        iconSize: [48, 32],
        iconAnchor: [24, 16]
      })}
    />
  );
}

// Current position marker component
function CurrentPositionMarker({ position, accuracy, isPaused }: { position: GPSPosition; accuracy?: number; isPaused: boolean }) {
  return (
    <>
      {/* Accuracy circle */}
      {accuracy && (
        <CircleMarker
          center={[position.latitude, position.longitude]}
          radius={accuracy * 1000} // Convert to meters
          pathOptions={{
            color: GPS_MAP_STYLE.accuracyCircleColor,
            fillColor: GPS_MAP_STYLE.accuracyCircleColor,
            fillOpacity: GPS_MAP_STYLE.accuracyCircleOpacity,
            weight: 1
          }}
        />
      )}
      
      {/* Current position marker */}
      <CircleMarker
        center={[position.latitude, position.longitude]}
        radius={GPS_MAP_STYLE.currentPositionRadius}
        pathOptions={{
          color: '#fff',
          weight: 2,
          fillColor: isPaused ? '#f59e0b' : GPS_MAP_STYLE.currentPositionColor,
          fillOpacity: 1,
        }}
      />
      
      {/* Direction indicator if heading is available */}
      {position.heading && (
        <Marker
          position={[position.latitude, position.longitude]}
          icon={L.divIcon({
            className: 'custom-direction-marker',
            html: `
              <div class="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[16px] border-b-white transform rotate-${Math.round(position.heading)} shadow-sm"></div>
            `,
            iconSize: [16, 16],
            iconAnchor: [8, 8]
          })}
        />
      )}
    </>
  );
}

// Status indicator component
function StatusIndicator({ isTracking, isPaused }: { isTracking: boolean; isPaused: boolean }) {
  if (!isTracking) return null;
  
  return (
    <div className="absolute top-4 left-4 z-20 bg-white/90 backdrop-blur-sm rounded-full px-3 py-2 shadow-lg border border-white/40">
      <div className="flex items-center gap-2">
        {isPaused ? (
          <>
            <Pause className="h-4 w-4 text-amber-500" />
            <span className="text-sm font-medium text-gray-700">Paused</span>
          </>
        ) : (
          <>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium text-gray-700">Tracking</span>
          </>
        )}
      </div>
    </div>
  );
}

export default function GPSMap({ trackPoints, isTracking, isPaused, currentPosition }: GPSMapProps) {
  const [mapCenter, setMapCenter] = useState<[number, number]>([50.0755, 14.4378]); // Prague default
  const mapRef = useRef<L.Map | null>(null);

  // Update map center when we get the first position
  useEffect(() => {
    if (trackPoints.length > 0) {
      setMapCenter([trackPoints[0].lat, trackPoints[0].lng]);
    } else if (currentPosition) {
      setMapCenter([currentPosition.latitude, currentPosition.longitude]);
    }
  }, [trackPoints, currentPosition]);

  // Handle map ready
  const handleMapReady = useCallback((map: L.Map) => {
    mapRef.current = map;
    
    // Disable zoom control on mobile for better UX
    if (window.innerWidth < 768) {
      map.zoomControl.remove();
    }
  }, []);

  if (trackPoints.length === 0 && !currentPosition) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <MapPin className="h-12 w-12 text-blue-400 mb-3" />
          <p className="text-sm text-gray-600 font-medium">Start tracking to see your route</p>
          <p className="text-xs text-gray-500 mt-1">Your GPS track will appear here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative">
      <MapContainer
        center={mapCenter}
        zoom={15}
        minZoom={10}
        maxZoom={18}
        style={{ height: '100%', width: '100%' }}
        className="rounded-lg"
        zoomControl={false}
        attributionControl={false}
        preferCanvas={true}
        ref={handleMapReady}
      >
        <TileLayer
          url={`https://api.maptiler.com/maps/outdoor-v2/256/{z}/{x}/{y}.png?key=a5w3EO45npvzNFzD6VoD`}
          attribution='&copy; <a href="https://www.maptiler.com/copyright/">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        {/* Track polyline */}
        {trackPoints.length > 1 && (
          <Polyline
            positions={trackPoints}
            pathOptions={{
              color: GPS_MAP_STYLE.polylineColor,
              weight: GPS_MAP_STYLE.polylineWeight,
              opacity: GPS_MAP_STYLE.polylineOpacity,
              lineCap: 'round',
              lineJoin: 'round'
            }}
          />
        )}
        
        {/* Start marker */}
        {trackPoints.length > 0 && (
          <StartMarker position={trackPoints[0]} />
        )}
        
        {/* Current position marker */}
        {currentPosition && (
          <CurrentPositionMarker 
            position={currentPosition} 
            accuracy={currentPosition.accuracy}
            isPaused={isPaused}
          />
        )}
        
        {/* Auto-fit bounds */}
        <FitBoundsOnTrack trackPoints={trackPoints} />
        
        {/* Follow current position when tracking */}
        {currentPosition && (
          <FollowCurrentPosition currentPosition={currentPosition} isTracking={isTracking} />
        )}
      </MapContainer>
      
      {/* Status indicator */}
      <StatusIndicator isTracking={isTracking} isPaused={isPaused} />
      
      {/* Track info overlay */}
      {trackPoints.length > 0 && (
        <div className="absolute bottom-4 left-4 z-20 bg-white/90 backdrop-blur-sm rounded-2xl px-4 py-3 shadow-lg border border-white/40">
          <div className="flex items-center gap-2 mb-1">
            <Navigation className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-gray-700">Track Info</span>
          </div>
          <div className="text-xs text-gray-600">
            <div>Points: {trackPoints.length}</div>
            {trackPoints.length > 1 && (
              <div>Distance: {calculateTrackDistance(trackPoints).toFixed(2)} km</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Helper function to calculate track distance
function calculateTrackDistance(points: { lat: number; lng: number }[]): number {
  if (points.length < 2) return 0;
  
  let totalDistance = 0;
  for (let i = 1; i < points.length; i++) {
    totalDistance += calculateDistance(points[i-1], points[i]);
  }
  
  return totalDistance;
}

// Helper function to calculate distance between two points
function calculateDistance(point1: { lat: number; lng: number }, point2: { lat: number; lng: number }): number {
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