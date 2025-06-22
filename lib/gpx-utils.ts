/**
 * GPX utilities for converting GPS tracking data to GPX format
 */

export interface GPSPosition {
  latitude: number;
  longitude: number;
  altitude?: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
  timestamp: number;
}

export interface TrackingSession {
  id: string;
  startTime: number;
  endTime?: number;
  positions: GPSPosition[];
  totalDistance: number;
  totalTime: number;
  averageSpeed: number;
  maxSpeed: number;
  totalAscent: number;
  totalDescent: number;
  isActive: boolean;
  isPaused: boolean;
  lastUpdate: number;
  elapsedTime?: number;
  pauseDuration?: number;
}

/**
 * Convert GPS positions to GPX format
 */
export function convertToGPX(session: TrackingSession, routeName: string = 'GPS Track'): string {
  const { positions, startTime, endTime } = session;
  
  if (positions.length === 0) {
    throw new Error('No GPS positions to convert');
  }

  const startDate = new Date(startTime);
  const endDate = endTime ? new Date(endTime) : new Date();
  
  const gpxHeader = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Strakatá Turistika GPS Tracker" xmlns="http://www.topografix.com/GPX/1/1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd">
  <metadata>
    <name>${escapeXml(routeName)}</name>
    <time>${startDate.toISOString()}</time>
    <bounds minlat="${Math.min(...positions.map(p => p.latitude))}" minlon="${Math.min(...positions.map(p => p.longitude))}" maxlat="${Math.max(...positions.map(p => p.latitude))}" maxlon="${Math.max(...positions.map(p => p.longitude))}"/>
  </metadata>
  <trk>
    <name>${escapeXml(routeName)}</name>
    <trkseg>`;

  const trackPoints = positions.map(pos => {
    const time = new Date(pos.timestamp);
    let gpxPoint = `    <trkpt lat="${pos.latitude}" lon="${pos.longitude}">`;
    
    if (pos.altitude !== undefined) {
      gpxPoint += `\n      <ele>${pos.altitude}</ele>`;
    }
    
    if (pos.speed !== undefined) {
      gpxPoint += `\n      <speed>${pos.speed}</speed>`;
    }
    
    gpxPoint += `\n      <time>${time.toISOString()}</time>`;
    gpxPoint += `\n    </trkpt>`;
    
    return gpxPoint;
  }).join('\n');

  const gpxFooter = `
    </trkseg>
  </trk>
</gpx>`;

  return gpxHeader + '\n' + trackPoints + gpxFooter;
}

/**
 * Escape XML special characters
 */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Download GPX file
 */
export function downloadGPX(gpxContent: string, filename: string): void {
  const blob = new Blob([gpxContent], { type: 'application/gpx+xml' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Convert GPS positions to track points for the GPX editor
 */
export function convertToTrackPoints(positions: GPSPosition[]): { lat: number; lng: number }[] {
  return positions.map(pos => ({
    lat: pos.latitude,
    lng: pos.longitude
  }));
} 