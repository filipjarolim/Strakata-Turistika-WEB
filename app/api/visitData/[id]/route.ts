import { NextResponse } from 'next/server';
import { Prisma, UserRole, VisitState } from '@prisma/client';
import { db } from '@/lib/db';
import { currentRole } from '@/lib/auth';
import { calculatePoints, getDefaultScoringConfig, type Place, type RouteData, type ScoringConfig } from '@/lib/scoring-utils';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const visitData = await db.visitData.findUnique({ where: { id } });
    if (!visitData) {
      return NextResponse.json({ message: 'VisitData not found.' }, { status: 404 });
    }
    return NextResponse.json(visitData);
  } catch (error) {
    console.error('[GET_VISITDATA_ONE_ERROR]', error);
    return NextResponse.json({ message: 'Failed to fetch VisitData.' }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { id } = params;



    // Get existing record to preserve data if not updating
    const existingRecord = await db.visitData.findUnique({ where: { id } });
    if (!existingRecord) {
      return NextResponse.json({ message: 'VisitData not found.' }, { status: 404 });
    }

    // Parse the route data from string back to array if updating routeLink
    let trackPoints: Array<{ latitude?: number; lat?: number; longitude?: number; lng?: number }> = [];
    if (body.routeLink) {
      trackPoints = JSON.parse(body.routeLink);
    } else if (existingRecord.route) {
      const routeData = typeof existingRecord.route === 'string'
        ? JSON.parse(existingRecord.route)
        : existingRecord.route;
      if (routeData.trackPoints) {
        trackPoints = routeData.trackPoints;
      }
    }

    // Get places from body or existing record
    const places: Place[] = body.places || existingRecord.places || [];

    // Legacy compatibility: auto-fill visitedPlaces from places names
    const visitedPlaces = places.length > 0
      ? places.map((p: Place) => p.name || String(p)).filter(Boolean).join(', ')
      : body.visitedPlaces || existingRecord.visitedPlaces || '';

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

    // Calculate points if we have places or routeLink
    let scoringResult = null;
    if (body.places !== undefined || body.routeLink !== undefined) {
      const routeData: RouteData = {
        trackPoints: trackPoints.map((point) => ({
          latitude: point.latitude || point.lat || 0,
          longitude: point.longitude || point.lng || 0,
        })),
        totalDistance: body.extraPoints?.distance ? body.extraPoints.distance * 1000 : undefined,
        duration: body.extraPoints?.elapsedTime ? body.extraPoints.elapsedTime * 60 : undefined,
        source: body.extraPoints?.source || 'gpx_upload',
      };

      scoringResult = calculatePoints(routeData, places, scoringConfig);
    }

    // Build route object with full structure
    const route = body.routeLink ? {
      trackPoints: trackPoints.map((point) => ({
        latitude: point.latitude || point.lat || 0,
        longitude: point.longitude || point.lng || 0,
      })),
      totalDistance: body.extraPoints?.distance ? body.extraPoints.distance * 1000 : 0,
      duration: body.extraPoints?.elapsedTime ? body.extraPoints.elapsedTime * 60 : 0,
      source: body.extraPoints?.source || 'gpx_upload',
    } : null;

    const visitData = await db.visitData.update({
      where: { id },
      data: {
        ...(body.visitDate && { visitDate: new Date(body.visitDate) }),
        ...(body.routeTitle !== undefined && { routeTitle: body.routeTitle }),
        ...(body.routeDescription !== undefined && { routeDescription: body.routeDescription }),
        ...(body.dogNotAllowed !== undefined && { dogNotAllowed: body.dogNotAllowed }),
        ...(visitedPlaces && { visitedPlaces }),
        ...(body.routeLink !== undefined && { routeLink: body.routeLink }),
        ...(route && { route: route as unknown as Prisma.InputJsonValue }),
        ...(body.visitDate && { year: new Date(body.visitDate).getFullYear() }),
        ...(body.photos !== undefined && { photos: body.photos as unknown as Prisma.InputJsonValue }),
        ...(body.places !== undefined && { places: places as unknown as Prisma.InputJsonValue }),
        ...(body.extraData !== undefined && { extraData: body.extraData as unknown as Prisma.InputJsonValue }),
        ...(body.state && { state: body.state as VisitState }),
        ...(scoringResult && {
          points: Math.floor(scoringResult.totalPoints),
          extraPoints: scoringResult as unknown as Prisma.InputJsonValue
        })
      }
    });

    return NextResponse.json(visitData);
  } catch (error) {
    console.error('Error updating visitData:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Error updating visit data' }),
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.visitData.delete({ where: { id } });
    return NextResponse.json({ message: 'VisitData deleted.' });
  } catch (error) {
    console.error('[DELETE_VISITDATA_ERROR]', error);
    return NextResponse.json({ message: 'Failed to delete VisitData.' }, { status: 500 });
  }
} 