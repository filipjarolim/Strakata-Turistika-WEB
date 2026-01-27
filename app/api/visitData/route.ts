import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { calculatePoints, getDefaultScoringConfig, type Place, type RouteData, type ScoringConfig } from '@/lib/scoring-utils';
import { Prisma } from '@prisma/client';

interface TrackPoint {
  lat: number;
  lng: number;
}

interface Photo {
  url: string;
  public_id: string;
  title: string;
}

interface VisitDataRequest {
  fullName: string;
  routeLink: string;
  visitDate: Date;
  points: number;
  visitedPlaces: string;
  dogNotAllowed: string;
  year: number;
  extraPoints: {
    description: string;
    distance: number;
    totalAscent: number;
    elapsedTime: number;
    averageSpeed: number;
    isApproved: boolean;
    source?: string;
  };
  routeTitle?: string;
  routeDescription?: string;
  route?: TrackPoint[] | string;
  places?: Place[];
  photos?: Photo[];
  userId?: string;
  state?: 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';
  extraData?: Record<string, unknown>; // Dynamic form data
}

// Create a new VisitData record
export async function POST(request: Request) {
  try {
    const body: VisitDataRequest = await request.json();

    // Get places from body
    const places: Place[] = body.places || [];

    // Legacy compatibility: auto-fill visitedPlaces from places names
    const visitedPlaces = places.length > 0
      ? places.map(p => p.name).filter(Boolean).join(', ')
      : body.visitedPlaces || '';

    // Get scoring config
    let scoringConfig: ScoringConfig;
    try {
      const configResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/scoring-config`);
      if (configResponse.ok) {
        scoringConfig = await configResponse.json();
      } else {
        scoringConfig = getDefaultScoringConfig();
      }
    } catch {
      scoringConfig = getDefaultScoringConfig();
    }

    // Parse route data
    const trackPoints = body.route || [];

    // Prepare route data for scoring
    const source = body.extraPoints?.source || 'manual';
    const validSource: 'gps_tracking' | 'gpx_upload' | 'manual' | 'screenshot' =
      ['gps_tracking', 'gpx_upload', 'manual', 'screenshot'].includes(source)
        ? source as 'gps_tracking' | 'gpx_upload' | 'manual' | 'screenshot'
        : 'manual';

    const routeData: RouteData = {
      trackPoints: Array.isArray(trackPoints) ? trackPoints.map((point: TrackPoint) => ({
        latitude: point.lat,
        longitude: point.lng,
      })) : [],
      totalDistance: body.extraPoints?.distance ? body.extraPoints.distance * 1000 : undefined, // Convert km to meters
      duration: body.extraPoints?.elapsedTime ? body.extraPoints.elapsedTime * 60 : undefined, // Convert minutes to seconds
      source: validSource,
    };

    // Calculate points
    const scoringResult = calculatePoints(routeData, places, scoringConfig);

    // Build route object with full structure
    const route = {
      trackPoints: routeData.trackPoints,
      totalDistance: routeData.totalDistance || 0,
      duration: routeData.duration || 0,
      source: routeData.source,
    };

    // Extract userId and create proper relation
    const userId = body.userId;

    const visitData = await db.visitData.create({
      data: {
        routeTitle: body.routeTitle ?? "Untitled Route",
        routeDescription: body.routeDescription,
        visitedPlaces: visitedPlaces, // Legacy compatibility - auto-filled from places
        visitDate: body.visitDate,
        dogNotAllowed: body.dogNotAllowed,
        routeLink: body.routeLink,
        route: route as unknown as Prisma.InputJsonValue,
        places: places as unknown as Prisma.InputJsonValue,
        photos: body.photos as unknown as Prisma.InputJsonValue,
        points: Math.floor(scoringResult.totalPoints), // Round down for integer storage
        year: body.year || new Date().getFullYear(), // Fallback to current year if missing
        extraPoints: scoringResult as unknown as Prisma.InputJsonValue,
        extraData: body.extraData as unknown as Prisma.InputJsonValue,
        state: body.state || 'DRAFT',
        // Prisma relation
        ...(userId && {
          user: {
            connect: { id: userId }
          }
        })
      }
    });
    return NextResponse.json(visitData, { status: 201 });
  } catch (error) {
    console.error('[CREATE_VISITDATA_ERROR]', error);
    return NextResponse.json({ message: 'Failed to create VisitData.' }, { status: 500 });
  }
}

// List all VisitData records (optionally filter by year, user, etc.)
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const year = url.searchParams.get('year');
    const userId = url.searchParams.get('userId');
    const where: { year?: number; userId?: string } = {};
    if (year) where.year = parseInt(year);
    if (userId) where.userId = userId;
    const visitData = await db.visitData.findMany({ where, orderBy: { visitDate: 'desc' } });
    return NextResponse.json(visitData);
  } catch (error) {
    console.error('[GET_VISITDATA_ERROR]', error);
    return NextResponse.json({ message: 'Failed to fetch VisitData.' }, { status: 500 });
  }
} 