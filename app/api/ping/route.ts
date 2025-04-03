import { NextRequest, NextResponse } from 'next/server';

/**
 * Simple API endpoint to check if the server is reachable
 * Used by the service worker to determine if the client is online
 * @returns Simple 200 OK response with timestamp
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    ok: true, 
    timestamp: Date.now() 
  }, { 
    status: 200,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    } 
  });
}

/**
 * HEAD request handler for lightweight connectivity checks
 * @returns Empty 200 OK response
 */
export async function HEAD(request: NextRequest) {
  return new NextResponse(null, { 
    status: 200,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    } 
  });
} 