import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { currentRole } from '@/lib/auth';
import { UserRole, VisitState } from '@prisma/client';

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const role = await currentRole();
    if (role !== UserRole.ADMIN) {
      return new NextResponse('Unauthorized', { status: 403 });
    }

    const { id } = await params;
    const route = await db.visitData.findUnique({
      where: { id }
    });

    if (!route) {
      return NextResponse.json(
        { message: 'Route not found.' },
        { status: 404 }
      );
    }

    // Update the route's state to APPROVED
    const updatedRoute = await db.visitData.update({
      where: { id },
      data: {
        state: VisitState.APPROVED
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