import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { currentRole } from '@/lib/auth';
import { UserRole, VisitState } from '@prisma/client';

interface RejectRequest {
  rejectionReason: string;
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
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
    const { id } = await params;
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
        state: VisitState.REJECTED,
        rejectionReason: body.rejectionReason
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