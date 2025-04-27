import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

interface TrackingDebugProps {
  positions: Array<{ lat: number; lng: number; time: number; speed?: number }>;
}

const TrackingDebug: React.FC<TrackingDebugProps> = ({ positions }) => {
  return (
    <Card className="fixed bottom-4 right-4 w-80 h-64 bg-white/90 backdrop-blur-sm z-50">
      <CardContent className="p-2">
        <h3 className="text-sm font-semibold mb-2">Tracking Data</h3>
        <ScrollArea className="h-48">
          <div className="space-y-1">
            {positions.map((pos, index) => (
              <div key={index} className="text-xs p-1 bg-gray-50 rounded">
                <div>Time: {new Date(pos.time).toLocaleTimeString()}</div>
                <div>Lat: {pos.lat.toFixed(6)}</div>
                <div>Lng: {pos.lng.toFixed(6)}</div>
                {pos.speed !== undefined && (
                  <div>Speed: {pos.speed.toFixed(1)} km/h</div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default TrackingDebug; 