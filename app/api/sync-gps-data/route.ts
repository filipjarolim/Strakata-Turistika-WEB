import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Here you would typically save the data to your database
    // For now, we'll just log it and return success
    console.log('Received GPS data:', data);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error syncing GPS data:', error);
    return NextResponse.json(
      { error: 'Failed to sync GPS data' },
      { status: 500 }
    );
  }
} 