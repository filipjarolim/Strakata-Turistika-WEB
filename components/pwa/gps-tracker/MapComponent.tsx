'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useMap } from 'react-leaflet';
import { MapComponentProps } from './types';

const MapContainerWrapper = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);

const TileLayerWrapper = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);

const PolylineWrapper = dynamic(
  () => import('react-leaflet').then((mod) => mod.Polyline),
  { ssr: false }
);

const MarkerWrapper = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);

const RecenterMapComponent: React.FC<{
  trigger: number;
  center: [number, number] | null;
  zoom: number;
}> = ({ trigger, center, zoom }) => {
  const map = useMap();
  React.useEffect(() => {
    if (center) {
      map.setView(center, zoom);
    }
  }, [trigger, center, zoom, map]);
  return null;
};

// Map constants
const ZOOM_LEVEL = 16;
const TILE_LAYER_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const SATELLITE_LAYER_URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
const SATELLITE_ATTRIBUTION = 'Tiles &copy; Esri';

// Map icons
const currentPositionIcon = L.icon({
  iconUrl: '/icons/dog_emoji.png',
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40],
});

const startPositionIcon = L.icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzODQgNTEyIj48cGF0aCBmaWxsPSIjNGFkZTgwIiBkPSJNMTkyIDk2YzE3LjcgMCAzMi0xNC4zIDMyLTMycy0xNC4zLTMyLTMyLTMyLTMyIDE0LjMtMzIgMzIgMTQuMyAzMiAzMiAzMnptMCA2NCAzMi0zMiA2NCA2NHY4NmMwIDE0LTkgMjYtMjAgMzRsLTUyLTUyaC0zMEwxMTIgNTAwYy0xMS4xLTcuOC0yMC01MC0yMC02NHYtODZsNjQtNjQgMzYgMzZ6Ii8+PHBhdGggZmlsbD0id2hpdGUiIGQ9Ik0xOTIgNDE0aDMydjMySDE5MnYtMzJ6Ii8+PHBhdGggZmlsbD0id2hpdGUiIGQ9Ik0yMTQgMjI1YzQuMSAwIDcuOCAyLjYgOS4zIDYuNWwxNS44IDQwLjljLjUgMS4zLjggMi42LjggNGwuMiAzMy44YzAgOC44LTcuMiAxNi0xNiAxNmgtMzJjLTguOCAwLTE2LTcuMi0xNi0xNmwtLjItMzMuOGMwLTEuNC4zLTIuNy43LTRsMTUuOC00MC45YzEuNS0zLjkgNS4yLTYuNSA5LjMtNi41aDE4LjR6Ii8+PC9zdmc+',
  iconSize: [32, 42],
  iconAnchor: [16, 42],
  popupAnchor: [0, -42],
});

const MapComponent: React.FC<MapComponentProps> = ({
  mapCenter,
  positions,
  mapType,
  mapContainerRef,
  loading,
  className,
  recenterTrigger = 0,
}) => {
  return (
    <div 
      id="mapContainer" 
      ref={mapContainerRef} 
      className={`flex-grow w-full relative ${className}`} 
      aria-label="Map"
    >
      {!loading && mapCenter && (
        <MapContainerWrapper
          center={mapCenter}
          zoom={ZOOM_LEVEL}
          className="w-full h-full z-[1] rounded-lg shadow-lg"
          attributionControl={false}
          zoomControl={false}
        >
          {mapType === 'standard' ? (
            <TileLayerWrapper 
              attribution={SATELLITE_ATTRIBUTION} 
              url={TILE_LAYER_URL}
            />
          ) : (
            <TileLayerWrapper 
              attribution={SATELLITE_ATTRIBUTION} 
              url={SATELLITE_LAYER_URL}
            />
          )}
          {positions.length > 0 && (
            <MarkerWrapper 
              position={positions[0]} 
              icon={startPositionIcon} 
              zIndexOffset={1000}
            />
          )}
          {positions.length > 0 && (
            <MarkerWrapper 
              position={positions[positions.length - 1]} 
              icon={currentPositionIcon} 
              zIndexOffset={1000}
            />
          )}
          {positions.length > 1 && (
            <PolylineWrapper 
              positions={positions} 
              color="#007aff" 
              weight={5} 
              opacity={0.8}
            />
          )}
          <RecenterMapComponent trigger={recenterTrigger} center={mapCenter} zoom={ZOOM_LEVEL} />
        </MapContainerWrapper>
      )}
    </div>
  );
};

export default MapComponent; 