import React from 'react';
import CommonPageTemplate from "@/components/structure/CommonPageTemplate";
import { currentRole, currentUser } from "@/lib/auth";
import { GalleryClient } from './gallery-client';
import { db } from '@/lib/db';

const Page = async () => {
    const user = await currentUser();
    const role = await currentRole();

    // Fetch visible images
    const images = await db.image.findMany({
        where: {
            isGalleryVisible: true,
            OR: [
                { visit: { deletedAt: null } },
                { visit: null }, // News images or unlinked
            ]
        },
        include: {
            visit: true,
            news: true
        },
        orderBy: { createdAt: 'desc' }
    });

    // Transform to GalleryImage format
    const formattedImages = images.map(img => ({
        public_id: img.publicId,
        url: img.url,
        title: img.title || img.visit?.visitedPlaces || img.news?.title || "Bez názvu",
        description: img.description || (img.news as any)?.content?.replace(/<[^>]*>?/gm, '').substring(0, 100) || "", // Strip HTML tags and truncate
        location: img.visit?.visitedPlaces || "",
        category: "all",
        created_at: img.createdAt.toISOString(),
        aspectRatio: "square"
    }));

    return (
        <CommonPageTemplate contents={{ complete: true }} currentUser={user} currentRole={role} className="px-3 sm:px-4 md:px-6">
            <GalleryClient initialImages={formattedImages} />
        </CommonPageTemplate>
    );
};

export default Page;
