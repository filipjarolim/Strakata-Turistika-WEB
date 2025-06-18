import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { currentRole } from '@/lib/auth';
import { UserRole, VisitState } from '@prisma/client';

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

    console.log('Updating visitData:', { id, body });

    // Parse the route data from string back to array
    const route = body.routeLink ? JSON.parse(body.routeLink) : [];

    const visitData = await db.visitData.update({
      where: { id },
      data: {
        visitDate: new Date(body.visitDate),
        routeTitle: body.routeTitle,
        routeDescription: body.routeDescription,
        dogNotAllowed: body.dogNotAllowed,
        visitedPlaces: body.visitedPlaces,
        routeLink: body.routeLink,
        route: route,
        year: new Date(body.visitDate).getFullYear(),
        photos: body.photos,
        extraPoints: body.extraPoints
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