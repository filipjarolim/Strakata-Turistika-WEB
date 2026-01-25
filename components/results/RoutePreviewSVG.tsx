import React, { useMemo } from 'react';

interface RoutePreviewSVGProps {
    trackPoints: { latitude: number; longitude: number }[];
    color?: string;
    strokeWidth?: number;
    className?: string;
}

export function RoutePreviewSVG({
    trackPoints,
    color = "#4CAF50",
    strokeWidth = 3,
    className = ""
}: RoutePreviewSVGProps) {

    const { points, viewBox } = useMemo(() => {
        if (!trackPoints || trackPoints.length === 0) {
            return { points: "", viewBox: "0 0 100 100" };
        }

        // Calculate bounding box
        let minLat = Infinity;
        let maxLat = -Infinity;
        let minLon = Infinity;
        let maxLon = -Infinity;

        trackPoints.forEach(p => {
            minLat = Math.min(minLat, p.latitude);
            maxLat = Math.max(maxLat, p.latitude);
            minLon = Math.min(minLon, p.longitude);
            maxLon = Math.max(maxLon, p.longitude);
        });

        // Add padding (5%)
        const latSpan = maxLat - minLat;
        const lonSpan = maxLon - minLon;
        const paddingLat = latSpan * 0.1;
        const paddingLon = lonSpan * 0.1;

        // ViewBox coordinates (using longitude as x, latitude as y)
        // Note: SVG y-axis is top-down, Latitude is bottom-up (North is positive)
        // So distinct from standard mapping, we might need to invert Y if we want strict map orientation
        // But for a simple line shape, relative standard mapping is usually:
        // x = (lon - minLon)
        // y = (maxLat - lat)  <-- Invert Y so North is Up

        const width = 200;
        const height = 150;

        // Normalize points to fit in 200x150 box roughly, maintaining aspect ratio?
        // Actually simpler to just use specific ViewBox matching the geo coordinates
        // SVG viewBox="min-x min-y width height"

        // We will transform coordinates to valid SVG coordinate space (0..100)
        // X: 0..100 maps to minLon..maxLon
        // Y: 0..100 maps to maxLat..minLat (inverted)

        // Actually, let's use the geo coords directly in polyline and set viewBox to encompass them
        // But we need to invert Y axis for latitude to appear correct (North Up)
        // SVG default is Y increases downwards. Latitude increases Upwards.
        // So we need to map lat to -lat or similar?
        // Easier manual projection:
        // x = (p.longitude - minLon) / (maxLon - minLon) * 100
        // y = (maxLat - p.latitude) / (maxLat - minLat) * 100  <-- (1 - normalized_lat)

        const svgPoints = trackPoints.map(p => {
            const x = lonSpan === 0 ? 50 : ((p.longitude - minLon) / lonSpan) * 100;
            const y = latSpan === 0 ? 50 : ((maxLat - p.latitude) / latSpan) * 100;
            return `${x},${y}`;
        }).join(" ");

        return {
            points: svgPoints,
            viewBox: "0 0 100 100"
        };

    }, [trackPoints]);

    if (!trackPoints || trackPoints.length < 2) {
        return (
            <div className={`flex items-center justify-center bg-gray-100 text-gray-400 text-xs ${className}`}>
                No Preview
            </div>
        )
    }

    return (
        <svg
            viewBox={viewBox}
            className={`w-full h-full ${className}`}
            preserveAspectRatio="xMidYMid meet"
        >
            <polyline
                points={points}
                fill="none"
                stroke={color}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
            // Vector checking: 3px stroke in 100x100 space is thick.
            // We might want `vector-effect="non-scaling-stroke"` if we scaled up, 
            // but here we are working in 0..100 space, so 3 is 3% of view.
            // That's reasonable.
            />
        </svg>
    );
}
