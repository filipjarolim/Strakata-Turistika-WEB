import { NextResponse } from 'next/server';

/**
 * Simple health check endpoint for connection testing
 * Returns a 200 OK with the current server time
 */
export function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: Date.now()
  });
}

/**
 * HEAD method for more efficient network status checks
 */
export function HEAD() {
  return new Response(null, {
    status: 200,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Content-Type': 'application/json',
    }
  });
} 