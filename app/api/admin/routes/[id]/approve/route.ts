import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { currentRole } from '@/lib/auth';
import { UserRole } from '@prisma/client';

interface ApproveRequest {
  extraPoints: {
    description: string;
    distance: number;
    totalAscent: number;
    elapsedTime: number;
    averageSpeed: number;
    isApproved: boolean;
  };
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const role = await currentRole();
    if (role !== UserRole.ADMIN) {
      return new NextResponse('Unauthorized', { status: 403 });
    }

    const body: ApproveRequest = await req.json();
    const { id } = params;
    const route = await db.visitData.findUnique({
      where: { id }
    });

    if (!route) {
      return NextResponse.json(
        { message: 'Route not found.' },
        { status: 404 }
      );
    }

    // Update the route's approval status in extraPoints
    const updatedRoute = await db.visitData.update({
      where: { id },
      data: {
        extraPoints: {
          ...(route.extraPoints as {
            description?: string;
            distance?: number;
            totalAscent?: number;
            elapsedTime?: number;
            averageSpeed?: number;
            isApproved?: boolean;
          }),
          isApproved: true
        }
      }
    });

    return NextResponse.json(updatedRoute);
  } catch (error) {
    console.error('[APPROVE_ROUTE_ERROR]', error);
    return NextResponse.json(
      { message: 'Failed to approve route.' },
      { status: 500 }
    );
  }
} 