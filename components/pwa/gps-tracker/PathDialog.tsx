'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Route } from "lucide-react"
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

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

interface PathDialogProps {
  positions: [number, number][];
  className?: string;
}

const PathDialog: React.FC<PathDialogProps> = ({ positions, className = '' }) => {
  const startPositionIcon = L.icon({
    iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzODQgNTEyIj48cGF0aCBmaWxsPSIjNGFkZTgwIiBkPSJNMTkyIDk2YzE3LjcgMCAzMi0xNC4zIDMyLTMycy0xNC4zLTMyLTMyLTMyLTMyIDE0LjMtMzIgMzIgMTQuMyAzMiAzMiAzMnptMCA2NCAzMi0zMiA2NCA2NHY4NmMwIDE0LTkgMjYtMjAgMzRsLTUyLTUyaC0zMEwxMTIgNTAwYy0xMS4xLTcuOC0yMC01MC0yMC02NHYtODZsNjQtNjQgMzYgMzZ6Ii8+PHBhdGggZmlsbD0id2hpdGUiIGQ9Ik0xOTIgNDE0aDMydjMySDE5MnYtMzJ6Ii8+PHBhdGggZmlsbD0id2hpdGUiIGQ9Ik0yMTQgMjI1YzQuMSAwIDcuOCAyLjYgOS4zIDYuNWwxNS44IDQwLjljLjUgMS4zLjggMi42LjggNGwuMiAzMy44YzAgOC44LTcuMiAxNi0xNiAxNmgtMzJjLTguOCAwLTE2LTcuMi0xNi0xNmwtLjItMzMuOGMwLTEuNC4zLTIuNy43LTRsMTUuOC00MC45YzEuNS0zLjkgNS4yLTYuNSA5LjMtNi41aDE4LjR6Ii8+PC9zdmc+',
    iconSize: [32, 42],
    iconAnchor: [16, 42],
    popupAnchor: [0, -42],
  });

  const endPositionIcon = L.icon({
    iconUrl: '/icons/dog_emoji.png',
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
  });

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className={className}>
          <Route className="w-5 h-5 mr-2" />
          Show Complete Path
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl h-[80vh]">
        <DialogHeader>
          <DialogTitle>Complete Path</DialogTitle>
        </DialogHeader>
        <div className="h-[calc(80vh-4rem)]">
          {positions.length > 0 && (
            <MapContainerWrapper
              center={positions[0]}
              zoom={16}
              className="w-full h-full rounded-lg"
              attributionControl={false}
              zoomControl={true}
            >
              <TileLayerWrapper 
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
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
                  icon={endPositionIcon} 
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
            </MapContainerWrapper>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PathDialog; 