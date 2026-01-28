import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { cloudinary } from "@/lib/cloudinary";

export async function GET() {
    try {
        const session = await auth();
        if (session?.user?.role !== "ADMIN") {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // Fetch usage stats from Cloudinary API
        const result = await cloudinary.api.usage();

        // The result from usage() typically looks like:
        // {
        //   plan: 'Free',
        //   last_updated: '2023-10-27',
        //   transformations: { usage: 123, credits_usage: 0.12, limit: 25000, used_percent: 0.49 },
        //   objects: { usage: 456, limit: 25000, used_percent: 1.82 },
        //   bandwidth: { usage: 12345678, limit: 26843545600, used_percent: 0.04 },
        //   storage: { usage: 98765432, limit: 10737418240, used_percent: 0.91 },
        //   credits: { usage: 1.23, limit: 25, used_percent: 4.92 }
        // }

        return NextResponse.json(result);
    } catch (error) {
        console.error("[CLOUDINARY_STATS_ERROR]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
