import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/auth';

export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { reason, requestedMinDistance } = body;

        if (!reason || !requestedMinDistance) {
            return NextResponse.json({ message: 'Missing fields' }, { status: 400 });
        }

        const exceptionRequest = await db.exceptionRequest.create({
            data: {
                userId: session.user.id,
                reason,
                requestedMinKm: parseFloat(requestedMinDistance),
                status: 'PENDING'
            }
        });

        return NextResponse.json(exceptionRequest);
    } catch (error) {
        console.error('[EXCEPTION_REQUEST_ERROR]', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
