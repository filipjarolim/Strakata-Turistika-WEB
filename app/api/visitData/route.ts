import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

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
  };
}

// Create a new VisitData record
export async function POST(request: Request) {
  try {
    const body: VisitDataRequest = await request.json();
    const visitData = await db.visitData.create({ data: body });
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