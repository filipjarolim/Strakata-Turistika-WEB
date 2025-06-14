import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    // Get the current authenticated user
    const user = await currentUser();
    
    // If no user is authenticated, return an error
    if (!user) {
      return NextResponse.json(
        { message: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }

    const { 
      season, 
      image, 
      distance, 
      elapsedTime, 
      averageSpeed, 
      fullName,
      maxSpeed,
      totalAscent,
      totalDescent
    } = await request.json();

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

    // Use the authenticated user's name or fallback to the provided fullName
    const displayName = user.name || fullName || "Anonymous User";

    // Create a new VisitData record.
    // Set visitDate to the current date and use the provided fullName.
    // Store the userId in the extraPoints JSON object as a temporary solution
    const track = await db.visitData.create({
      data: {
        visitDate: new Date(),
        visitedPlaces: "ahoj",     // Placeholder value.
        points: 0,
        routeLink: image,          // Captured image data.
        year: season,
        routeTitle: "Track " + new Date().toLocaleDateString(), // Add a default title
        route: "", // Add empty route field
        extraPoints: {
          // Store the track data
          distance: parseFloat(distance),
          elapsedTime: parseInt(elapsedTime),
          averageSpeed: parseFloat(averageSpeed),
          maxSpeed: maxSpeed ? parseFloat(maxSpeed) : undefined,
          totalAscent: totalAscent ? parseFloat(totalAscent) : undefined, 
          totalDescent: totalDescent ? parseFloat(totalDescent) : undefined,
          // Store the user ID as a temporary solution
          userId: user.id
        },
        // Connect to the season
        season: {
          connect: { id: seasonRecord.id },
        }
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
