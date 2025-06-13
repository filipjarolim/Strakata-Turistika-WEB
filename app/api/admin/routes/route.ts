import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { currentRole } from '@/lib/auth';
import { UserRole } from '@prisma/client';

interface RouteRequest {
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
  };
}

export async function GET() {
  try {
    const role = await currentRole();
    if (role !== UserRole.ADMIN) {
      return new NextResponse('Unauthorized', { status: 403 });
    }

    // Fetch all routes and filter in memory
    const routes = await db.visitData.findMany({
      orderBy: {
        visitDate: 'desc'
      },
      select: {
        id: true,
        fullName: true,
        visitDate: true,
        year: true,
        routeLink: true,
        extraPoints: true
      }
    });

    // Filter routes that haven't been approved yet
    const unapprovedRoutes = routes.filter(route => {
      try {
        const extraPoints = route.extraPoints as {
          isApproved?: boolean;
        };
        return extraPoints?.isApproved === false;
      } catch {
        return false;
      }
    });

    return NextResponse.json(unapprovedRoutes);
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