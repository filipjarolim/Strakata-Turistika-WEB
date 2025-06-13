import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

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
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await request.json();
    
    // Move description to extraPoints
    const { description, ...restData } = data;
    const updatedData = {
      ...restData,
      extraPoints: {
        ...(data.extraPoints || {}),
        description: description || ''
      }
    };

    const updated = await db.visitData.update({
      where: { id },
      data: updatedData
    });
    return NextResponse.json(updated);
  } catch (error) {
    console.error('[UPDATE_VISITDATA_ERROR]', error);
    return NextResponse.json({ message: 'Failed to update VisitData.' }, { status: 500 });
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