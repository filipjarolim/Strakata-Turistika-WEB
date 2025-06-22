'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, useMap, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Navigation, Play, Pause, Crosshair } from 'lucide-react'; 
import { cn } from '@/lib/utils';
import { IOSToggleSwitch } from '@/components/ui/ios/toggle-switch';

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
  followPosition?: boolean;
  onFollowPositionChange?: (follow: boolean) => void;
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
function FollowCurrentPosition({ currentPosition, isTracking, followPosition }: { 
  currentPosition: GPSPosition | null; 
  isTracking: boolean;
  followPosition: boolean;
}) {
  const map = useMap();
  
  useEffect(() => {
    if (currentPosition && isTracking && followPosition) {
      map.setView([currentPosition.latitude, currentPosition.longitude], 16);
    }
  }, [currentPosition, isTracking, followPosition, map]);
  
  return null;
}

// Component to get user location on load
function GetUserLocation({ onLocationFound }: { onLocationFound: (position: GPSPosition) => void }) {
  const map = useMap();
  const hasRequestedLocation = useRef(false);
  
  useEffect(() => {
    if (!hasRequestedLocation.current && navigator.geolocation) {
      hasRequestedLocation.current = true;
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userPosition: GPSPosition = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            altitude: position.coords.altitude || undefined,
            accuracy: position.coords.accuracy,
            speed: position.coords.speed || undefined,
            heading: position.coords.heading || undefined,
            timestamp: position.timestamp
          };
          
          // Jump to user location
          map.setView([userPosition.latitude, userPosition.longitude], 16);
          onLocationFound(userPosition);
        },
        (error) => {
          console.log('Could not get user location:', error.message);
          // Fallback to default location (Prague)
          map.setView([50.0755, 14.4378], 10);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    }
  }, [map, onLocationFound]);
  
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
      {/* Accuracy circle - only show if accuracy is reasonable and not too large */}
      {accuracy && accuracy < 100 && (
        <CircleMarker
          center={[position.latitude, position.longitude]}
          radius={Math.min(accuracy * 10, 50)} // Much smaller radius, max 50px
          pathOptions={{
            color: GPS_MAP_STYLE.accuracyCircleColor,
            fillColor: GPS_MAP_STYLE.accuracyCircleColor,
            fillOpacity: 0.05, // Much more transparent
            weight: 1,
            opacity: 0.3
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

// Follow position toggle component
function FollowPositionToggle({ 
  followPosition, 
  onFollowPositionChange 
}: { 
  followPosition: boolean; 
  onFollowPositionChange: (follow: boolean) => void;
}) {
  return (
    <div className="absolute top-4 right-4 z-[9999] bg-white/95 backdrop-blur-xl rounded-2xl px-3 py-2 shadow-xl border border-white/50 pointer-events-auto">
      <div className="flex items-center gap-2">
        <Crosshair className={cn("w-4 h-4", followPosition ? "text-blue-600" : "text-gray-400")} />
        <IOSToggleSwitch
          checked={followPosition}
          onCheckedChange={onFollowPositionChange}
          size="sm"
        />
      </div>
    </div>
  );
}

export default function GPSMap({ 
  trackPoints, 
  isTracking, 
  isPaused, 
  currentPosition,
  followPosition = true,
  onFollowPositionChange
}: GPSMapProps) {
  const [mapCenter, setMapCenter] = useState<[number, number]>([50.0755, 14.4378]); // Prague default
  const [userLocation, setUserLocation] = useState<GPSPosition | null>(null);
  const mapRef = useRef<L.Map | null>(null);

  // Update map center when we get the first position
  useEffect(() => {
    if (trackPoints.length > 0) {
      setMapCenter([trackPoints[0].lat, trackPoints[0].lng]);
    } else if (currentPosition) {
      setMapCenter([currentPosition.latitude, currentPosition.longitude]);
    } else if (userLocation) {
      setMapCenter([userLocation.latitude, userLocation.longitude]);
    }
  }, [trackPoints, currentPosition, userLocation]);

  // Handle map ready
  const handleMapReady = useCallback((map: L.Map) => {
    mapRef.current = map;
    
    // Disable zoom control on mobile for better UX
    if (window.innerWidth < 768) {
      map.zoomControl.remove();
    }
  }, []);

  // Handle user location found
  const handleLocationFound = useCallback((position: GPSPosition) => {
    setUserLocation(position);
  }, []);

  if (trackPoints.length === 0 && !currentPosition && !userLocation) {
    return (
      <div className="w-full h-full bg-white flex items-center justify-center">
        <div className="text-center">
          <MapPin className="h-12 w-12 text-blue-400 mb-3" />
          <p className="text-sm text-gray-600 font-medium">Getting your location...</p>
          <p className="text-xs text-gray-500 mt-1">Please allow location access</p>
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
        
        {/* Get user location on load */}
        <GetUserLocation onLocationFound={handleLocationFound} />
        
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
        
        {/* User location marker (when not tracking) */}
        {!isTracking && userLocation && !currentPosition && (
          <CurrentPositionMarker 
            position={userLocation} 
            accuracy={userLocation.accuracy}
            isPaused={false}
          />
        )}
        
        {/* Auto-fit bounds */}
        <FitBoundsOnTrack trackPoints={trackPoints} />
        
        {/* Follow current position when tracking */}
        {currentPosition && (
          <FollowCurrentPosition 
            currentPosition={currentPosition} 
            isTracking={isTracking} 
            followPosition={followPosition}
          />
        )}
      </MapContainer>
      
      {/* Follow position toggle */}
      {onFollowPositionChange && (
        <FollowPositionToggle 
          followPosition={followPosition} 
          onFollowPositionChange={onFollowPositionChange}
        />
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