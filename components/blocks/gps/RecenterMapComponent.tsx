// RecenterMapComponent.tsx
import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

interface RecenterProps {
  trigger: number;
  center: [number, number] | null;
  zoom: number;
}

const RecenterMapComponent: React.FC<RecenterProps> = ({ trigger, center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, zoom);
  }, [trigger, center, zoom, map]);
  return null;
};

export default RecenterMapComponent;
