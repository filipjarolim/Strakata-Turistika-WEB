import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { currentRole } from '@/lib/auth';
import { UserRole, VisitState } from '@prisma/client';

interface RouteRequest {
  routeTitle: string;
  routeDescription: string;
  routeLink: string;
  visitDate: Date;
  points: number;
  visitedPlaces: string;
  dogNotAllowed: string;
  year: number;
  state: VisitState;
  extraPoints: {
    description: string;
    distance: number;
    totalAscent: number;
    elapsedTime: number;
    averageSpeed: number;
  };
}

export async function GET() {
  try {
    const role = await currentRole();
    if (role !== UserRole.ADMIN) {
      return new NextResponse('Unauthorized', { status: 403 });
    }

    // Fetch only routes that need review (PENDING_REVIEW state)
    const routes = await db.visitData.findMany({
      where: {
        state: VisitState.PENDING_REVIEW
      },
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        id: true,
        routeTitle: true,
        routeDescription: true,
        visitDate: true,
        year: true,
        routeLink: true,
        state: true,
        extraPoints: true,
        createdAt: true
      }
    });

    return NextResponse.json(routes);
  } catch (error) {
    console.error('[GET_ADMIN_ROUTES_ERROR]', error);
    return NextResponse.json(
      { message: 'Failed to fetch routes.' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body: RouteRequest = await req.json();
    // ... existing code ...
  } catch (error) {
    console.error('[POST_ADMIN_ROUTES_ERROR]', error);
    return NextResponse.json(
      { message: 'Failed to create route.' },
      { status: 500 }
    );
  }
} 