import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const rules = await db.rules.findFirst({
      where: {
        id: "pravidla"
      }
    });

    return NextResponse.json({ content: rules?.content || "<p>Načítání obsahu...</p>" });
  } catch (error) {
    console.error('Error fetching rules:', error);
    return NextResponse.json({ error: 'Failed to fetch rules' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { content } = await request.json();

    const rules = await db.rules.upsert({
      where: { id: "pravidla" },
      update: { content },
      create: { id: "pravidla", content }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving rules:', error);
    return NextResponse.json({ error: 'Failed to save rules' }, { status: 500 });
  }
} 