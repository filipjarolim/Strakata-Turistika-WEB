import { NextResponse } from 'next/server';
import { TrackData } from '@/components/pwa/gps-tracker/types';

export async function POST(request: Request) {
  try {
    const tracks: TrackData[] = await request.json();
    
    // Here you would typically save the tracks to your database
    // For now, we'll just log them
    console.log('Received tracks for syncing:', tracks);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error syncing GPS data:', error);
    return NextResponse.json(
      { error: 'Failed to sync GPS data' },
      { status: 500 }
    );
  }
} 