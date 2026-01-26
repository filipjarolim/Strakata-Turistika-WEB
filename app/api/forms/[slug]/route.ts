import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { currentRole } from '@/lib/auth';
import { UserRole } from '@prisma/client';

export async function GET(
    req: Request,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const slug = (await params).slug;
        const form = await db.formConfig.findUnique({
            where: { slug }
        });

        if (!form) {
            return new NextResponse("Form not found", { status: 404 });
        }

        return NextResponse.json(form);
    } catch (error) {
        console.error('[FORM_GET]', error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function PUT(
    req: Request,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const role = await currentRole();
        if (role !== UserRole.ADMIN) {
            return new NextResponse("Unauthorized", { status: 403 });
        }

        const slug = (await params).slug;
        const body = await req.json();
        const { definition, name, description } = body;

        const form = await db.formConfig.update({
            where: { slug },
            data: {
                definition,
                name,
                description
            }
        });

        return NextResponse.json(form);
    } catch (error) {
        console.error('[FORM_PUT]', error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
