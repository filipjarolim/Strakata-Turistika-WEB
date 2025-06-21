'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { MapPin } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Dynamically import react-leaflet components
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);

const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);

const Polyline = dynamic(
  () => import('react-leaflet').then((mod) => mod.Polyline),
  { ssr: false }
);

const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);

interface SimpleMapProps {
  trackPoints: { lat: number; lng: number }[];
}

export default function SimpleMap({ trackPoints }: SimpleMapProps) {
  if (trackPoints.length === 0) {
    return (
      <div className="w-full h-full bg-gray-100 rounded-2xl flex items-center justify-center">
        <div className="text-center">
          <MapPin className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500">Start tracking to see your route</p>
        </div>
      </div>
    );
  }

  const center = trackPoints[0] || [50.0755, 14.4378];
  
  return (
    <MapContainer
      center={center}
      zoom={13}
      style={{ height: '100%', width: '100%' }}
      className="rounded-2xl"
      zoomControl={false}
      attributionControl={false}
    >
      <TileLayer
        url="https://api.maptiler.com/maps/outdoor-v2/256/{z}/{x}/{y}.png?key=a5w3EO45npvzNFzD6VoD"
      />
      {trackPoints.length > 1 && (
        <Polyline
          positions={trackPoints}
          pathOptions={{ 
            color: '#2563eb', 
            weight: 4, 
            opacity: 0.8 
          }}
        />
      )}
      {trackPoints.length > 0 && (
        <Marker position={trackPoints[trackPoints.length - 1]} />
      )}
    </MapContainer>
  );
} 