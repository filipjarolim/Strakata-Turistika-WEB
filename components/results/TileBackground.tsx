
import React, { useMemo } from 'react';
import Image from 'next/image';

interface TileBackgroundProps {
    trackPoints: { latitude: number; longitude: number }[];
    zoom?: number;
    className?: string; // Additional classes for positioning/opacity
    opacity?: number; // explicit opacity override if needed
}

// Convert Lat/Lon to Tile X/Y
const long2tile = (lon: number, zoom: number) => {
    return (Math.floor((lon + 180) / 360 * Math.pow(2, zoom)));
}

const lat2tile = (lat: number, zoom: number) => {
    return (Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom)));
}

export const TileBackground: React.FC<TileBackgroundProps> = ({ trackPoints, zoom = 12, className }) => {
    const center = useMemo(() => {
        if (!trackPoints.length) return null;
        let minLat = 90, maxLat = -90, minLon = 180, maxLon = -180;

        // Simple bounding box center, usually good enough for a single tile preview
        trackPoints.forEach(p => {
            if (p.latitude < minLat) minLat = p.latitude;
            if (p.latitude > maxLat) maxLat = p.latitude;
            if (p.longitude < minLon) minLon = p.longitude;
            if (p.longitude > maxLon) maxLon = p.longitude;
        });

        return {
            lat: (minLat + maxLat) / 2,
            lon: (minLon + maxLon) / 2
        };
    }, [trackPoints]);

    if (!center) return null;

    const x = long2tile(center.lon, zoom);
    const y = lat2tile(center.lat, zoom);

    // Use OpenStreetMap standard tile server (free, requires attribution which we can add globally or just use subtly)
    // Or cartodb-basemaps for prettier light tiles (Positron) which look better as background
    // CartoDB Positron: https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png
    const tileUrl = `https://a.basemaps.cartocdn.com/light_all/${zoom}/${x}/${y}.png`;

    return (
        <div className={`absolute inset-0 pointer-events-none select-none z-0 ${className}`}>
            <Image
                src={tileUrl}
                alt=""
                fill
                className="object-cover"
                unoptimized // Allow external URL without next.config.js modification if possible, or just standard img
            />
            {/* Helper text/attribution if needed, but for small knob probably not critical yet, good practice */}
        </div>
    );
};
