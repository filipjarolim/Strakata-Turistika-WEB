'use client';

import React, { useEffect, useRef } from 'react';
import { VisitDataWithUser } from '@/lib/results-utils';
import 'leaflet/dist/leaflet.css';

interface VisitDetailMapProps {
  visit: VisitDataWithUser & { route?: RouteData };
}

interface RouteData {
  trackPoints?: Array<{
    latitude?: number;
    longitude?: number;
    lat?: number;
    lng?: number;
    [0]?: number;
    [1]?: number;
  }>;
}

export default function VisitDetailMap({ visit }: VisitDetailMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [isClient, setIsClient] = React.useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!mapRef.current || !isClient) return;

    // Cleanup previous map
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const route = visit.route as RouteData;
    
    // Load Leaflet dynamically
    import('leaflet').then((L) => {
      if (!mapRef.current) return;

      // Show placeholder if no route data or track points
      if (!route?.trackPoints || route.trackPoints.length === 0) {
        console.log('VisitDetailMap - No track points found, route:', route);
        
        // Still initialize map with default view
        const map = L.default.map(mapRef.current, {
          center: [49.8175, 15.4730], // Center of Czech Republic
          zoom: 8
        });
        
        L.default.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19
        }).addTo(map);
        
        // Add message marker
        L.default.marker([49.8175, 15.4730], {
          icon: L.default.divIcon({
            className: 'custom-div-icon',
            html: `<div style="background-color: #fee; color: #c33; padding: 8px; border-radius: 5px; white-space: nowrap;">Trasa není k dispozici</div>`,
            iconSize: [200, 40],
            iconAnchor: [100, 20]
          })
        }).addTo(map);
        
        return;
      }

      // Initialize map with default center in Czech Republic
      const map = L.default.map(mapRef.current, {
        center: [49.8175, 15.4730], // Center of Czech Republic
        zoom: 8
      });
      
      mapInstanceRef.current = map;

      // Add tile layer
      L.default.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(map);

      // Parse track points and create polyline
      const trackPoints = Array.isArray(route.trackPoints) ? route.trackPoints : [];
      
      if (trackPoints.length > 0) {
        const latlngs = trackPoints.map((point) => {
          // Handle different point formats
          if (point.latitude && point.longitude) {
            return [point.latitude, point.longitude] as [number, number];
          } else if (point.lat && point.lng) {
            return [point.lat, point.lng] as [number, number];
          } else if (Array.isArray(point) && point.length >= 2) {
            return [point[0] as number, point[1] as number] as [number, number];
          }
          return null;
        }).filter((item): item is [number, number] => item !== null);

        if (latlngs.length > 0) {
          // Add polyline
          const polyline = L.default.polyline(latlngs, {
            color: '#3b82f6',
            weight: 4,
            opacity: 0.8
          }).addTo(map);

          // Fit bounds to polyline
          map.fitBounds(polyline.getBounds(), { padding: [20, 20] });

          // Add start marker
          L.default.marker(latlngs[0], {
            icon: L.default.icon({
              iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
              iconSize: [25, 41],
              iconAnchor: [12, 41],
              popupAnchor: [1, -34]
            })
          }).bindPopup('Začátek trasy').addTo(map);

          // Add end marker
          L.default.marker(latlngs[latlngs.length - 1], {
            icon: L.default.icon({
              iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
              iconSize: [25, 41],
              iconAnchor: [12, 41],
              popupAnchor: [1, -34]
            })
          }).bindPopup('Konec trasy').addTo(map);
        }
      }
    }).catch((error) => {
      console.error('Error loading map:', error);
      if (mapRef.current) {
        mapRef.current.innerHTML = `
          <div style="display: flex; align-items: center; justify-content: center; height: 100%; background: #fee; color: #c33; font-size: 14px;">
            Chyba načítání mapy
          </div>
        `;
      }
    });

    // Cleanup on unmount
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [visit, isClient]);

  return <div ref={mapRef} className="w-full h-full" />;
}
