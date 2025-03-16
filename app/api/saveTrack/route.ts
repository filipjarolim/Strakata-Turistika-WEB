import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const { season, image, distance, elapsedTime, averageSpeed, fullName } = await request.json();

    if (!season) {
      return NextResponse.json(
        { message: "Missing required fields." },
        { status: 400 }
      );
    }

    // Check if a Season record exists for the given year.
    let seasonRecord = await db.season.findUnique({
      where: { year: season },
    });

    // If it doesn't exist, create it.
    if (!seasonRecord) {
      seasonRecord = await db.season.create({
        data: { year: season },
      });
    }

    // Create a new VisitData record.
    // Set visitDate to the current date and use the provided fullName.
    const track = await db.visitData.create({
      data: {
        visitDate: new Date(),
        fullName: fullName,        // Now set to the logged user's username.
        visitedPlaces: "ahoj",     // Placeholder value.
        points: 0,
        routeLink: image,          // Captured image data.
        year: season,
        extraPoints: {
          distance: parseFloat(distance),
          elapsedTime: parseInt(elapsedTime),
          averageSpeed: parseFloat(averageSpeed),
        },
        season: {
          connect: { id: seasonRecord.id },
        },
      },
    });

    return NextResponse.json(
      { message: "Track saved successfully.", track },
      { status: 201 }
    );
  } catch (error) {
    console.error("[SAVE_TRACK_ERROR]", error);
    return NextResponse.json(
      { message: "Failed to save track." },
      { status: 500 }
    );
  }
}
