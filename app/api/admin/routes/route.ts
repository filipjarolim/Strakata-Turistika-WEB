import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { currentRole } from "@/lib/auth";
import { UserRole } from "@prisma/client";

export async function GET() {
  try {
    const role = await currentRole();
    if (role !== UserRole.ADMIN) {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    const routes = await db.customRoute.findMany({
      where: {
        status: 'PENDING_REVIEW'
      },
      include: {
        creator: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(routes);
  } catch (error) {
    console.error("[ROUTES_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const role = await currentRole();
    if (role !== UserRole.ADMIN) {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    const body = await req.json();
    const { id, action } = body;

    if (!id || !['approve', 'reject'].includes(action)) {
      return new NextResponse("Invalid data", { status: 400 });
    }

    const status = action === 'approve' ? 'APPROVED' : 'REJECTED';

    const route = await db.customRoute.update({
      where: { id },
      data: { status }
    });

    // Grant points to creator if approved
    if (status === 'APPROVED') {
      await db.visitData.create({
        data: {
          userId: route.creatorId,
          points: 2.0, // 2 points for creation
          visitedPlaces: "Vytvoření Strakaté trasy: " + route.title,
          state: 'APPROVED',
          year: new Date().getFullYear(),
          extraPoints: { type: 'ROUTE_CREATION_BONUS' },
          extraData: { routeId: route.id }
        }
      });
    }

    return NextResponse.json(route);
  } catch (error) {
    console.error("[ROUTES_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}