import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { checkFreeCategoryAvailability } from '@/lib/free-category-utils';

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const status = await checkFreeCategoryAvailability(session.user.id);
        return NextResponse.json(status);
    } catch (error) {
        console.error('[FREE_AVAILABILITY_ERROR]', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
