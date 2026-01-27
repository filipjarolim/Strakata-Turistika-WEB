import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { calculatePoints, getDefaultScoringConfig, type Place, type RouteData, type ScoringConfig } from '@/lib/scoring-utils';
import { Prisma } from '@prisma/client';
import { validateVisitSubmission, validateActivityType } from '@/lib/validation-utils';
import { checkFreeCategoryAvailability, recordFreeCategoryUsage } from '@/lib/free-category-utils';
import { validateProximityToPath } from '@/lib/trail-validation';
import { checkCategoryAvailability, recordCategoryUsage } from '@/lib/strata-trasa-utils';

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
  activityType?: string;
  isFreeCategory?: boolean;
  freeCategoryIcon?: string;
  strataCategoryId?: string;
  strataCategoryIcon?: string;
}

// Create a new VisitData record
export async function POST(request: Request) {
  try {
    const body: VisitDataRequest = await request.json();

    // 1. Validations
    const dateValidation = validateVisitSubmission({
      visitDate: body.visitDate,
    });

    if (!dateValidation.valid) {
      return NextResponse.json({ message: dateValidation.error }, { status: 400 });
    }

    const activityValidation = validateActivityType(body.activityType);
    if (!activityValidation.valid) {
      return NextResponse.json({ message: activityValidation.error }, { status: 400 });
    }

    // 2. Category Checks
    const userId = body.userId;

    // 2a. Free Category Check
    if (body.isFreeCategory && userId) {
      const status = await checkFreeCategoryAvailability(userId);
      if (!status.available) {
        return NextResponse.json({
          message: 'Tento týden jste již využili svou volnou kategorii. Další je k dispozici od příštího pondělí.'
        }, { status: 400 });
      }
    }

    // 2b. Strakatá Trasa Check
    let categoryPoints = 0;
    let isFirstInCategory = false;
    if (body.strataCategoryId && userId) {
      const status = await checkCategoryAvailability(userId, body.strataCategoryId);
      if (!status.available) {
        return NextResponse.json({ message: status.message }, { status: 400 });
      }
      isFirstInCategory = !!status.isFirstThisMonth;
      categoryPoints = isFirstInCategory ? 2 : 1;
    }

    // Get places from body
    const places: Place[] = body.places || [];

    // Legacy compatibility: auto-fill visitedPlaces from places names
    const visitedPlaces = places.length > 0
      ? places.map(p => p.name).filter(Boolean).join(', ')
      : body.visitedPlaces || '';

    // Get scoring config directly from DB
    let scoringConfig: ScoringConfig;
    const dbConfig = await db.scoringConfig.findFirst({
      where: { active: true }
    });

    if (dbConfig) {
      scoringConfig = {
        pointsPerKm: dbConfig.pointsPerKm,
        minDistanceKm: dbConfig.minDistanceKm,
        requireAtLeastOnePlace: dbConfig.requireAtLeastOnePlace,
        placeTypePoints: dbConfig.placeTypePoints as Record<string, number>
      };
    } else {
      scoringConfig = getDefaultScoringConfig();
    }

    // Parse route data
    const trackPoints = body.route || [];

    // Prepare route data for scoring
    const source = body.extraPoints?.source || 'manual';
    const validSource =
      ['gps_tracking', 'gpx_upload', 'manual', 'screenshot'].includes(source)
        ? source as RouteData['source']
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

    // Add Category specific points
    if (body.isFreeCategory) {
      scoringResult.totalPoints += 1;
    } else if (body.strataCategoryId) {
      scoringResult.totalPoints += categoryPoints;
    }

    // 3. Proximity Check
    const proximityResults = places.map(place => {
      if (!place.lat && !place.lng) return null;
      if (!routeData.trackPoints || routeData.trackPoints.length === 0) return null;

      return validateProximityToPath(
        { lat: place.lat!, lng: place.lng! },
        routeData.trackPoints.map(p => ({ lat: p.latitude, lng: p.longitude })),
        100 // 100m limit
      );
    }).filter(Boolean);

    const hasProximityError = proximityResults.some(r => r && !r.valid);

    // Add proximity data to scoringResult for admin review
    const extendedResult = {
      ...scoringResult,
      proximityResults,
      hasProximityError
    };

    // Build route object with full structure
    const route = {
      trackPoints: routeData.trackPoints,
      totalDistance: routeData.totalDistance || 0,
      duration: routeData.duration || 0,
      source: routeData.source,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const createData: any = {
      routeTitle: body.routeTitle ?? "Untitled Route",
      routeDescription: body.routeDescription,
      visitedPlaces: visitedPlaces,
      visitDate: body.visitDate,
      dogNotAllowed: body.dogNotAllowed,
      routeLink: body.routeLink,
      route: route as unknown as Prisma.InputJsonValue,
      places: places as unknown as Prisma.InputJsonValue,
      photos: body.photos as unknown as Prisma.InputJsonValue,
      points: Math.floor(scoringResult.totalPoints),
      year: body.year || new Date().getFullYear(),
      extraPoints: extendedResult as unknown as Prisma.InputJsonValue,
      extraData: body.extraData as unknown as Prisma.InputJsonValue,
      state: hasProximityError ? 'PENDING_REVIEW' : (body.state || 'DRAFT'),
      activityType: body.activityType || 'WALKING',
      isFreeCategory: body.isFreeCategory || false,
      freeCategoryIcon: body.freeCategoryIcon,
      strataCategoryId: body.strataCategoryId || null,
      strataCategoryIcon: body.strataCategoryIcon || null,
      ...(userId && {
        user: { connect: { id: userId } }
      })
    };

    const visitData = await db.visitData.create({
      data: createData
    });

    // 4. Record usage after success
    if (body.isFreeCategory && userId) {
      await recordFreeCategoryUsage(userId, visitData.id);
    }

    if (body.strataCategoryId && userId) {
      await recordCategoryUsage(userId, body.strataCategoryId, visitData.id);
    }

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