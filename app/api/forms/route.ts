import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { currentRole } from '@/lib/auth';
import { UserRole } from '@prisma/client';

export async function GET() {
    try {
        const forms = await db.formConfig.findMany({
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(forms);
    } catch (error) {
        console.error('[FORMS_GET]', error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const role = await currentRole();
        if (role !== UserRole.ADMIN) {
            return new NextResponse("Unauthorized", { status: 403 });
        }

        const body = await req.json();
        const { slug, name, description, definition } = body;

        const form = await db.formConfig.create({
            data: {
                slug,
                name,
                description,
                definition
            }
        });

        return NextResponse.json(form);
    } catch (error) {
        console.error('[FORMS_POST]', error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
