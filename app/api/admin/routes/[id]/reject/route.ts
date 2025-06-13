import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { currentRole } from '@/lib/auth';
import { UserRole } from '@prisma/client';

interface RejectRequest {
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
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body: RejectRequest = await req.json();
    const { id } = params;
    const route = await db.visitData.findUnique({
      where: { id }
    });

    if (!route) {
      return NextResponse.json(
        { message: 'Route not found' },
        { status: 404 }
      );
    }

    const updatedRoute = await db.visitData.update({
      where: { id },
      data: {
        extraPoints: {
          ...body.extraPoints,
          isApproved: false
        }
      }
    });

    return NextResponse.json(updatedRoute);
  } catch (error) {
    console.error('[REJECT_ROUTE_ERROR]', error);
    return NextResponse.json(
      { message: 'Failed to reject route.' },
      { status: 500 }
    );
  }
} 