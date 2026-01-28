import { db } from "@/lib/db";
import { AdminPageTemplate } from "@/components/admin/AdminPageTemplate";
import { CloudinaryStatsWidget } from "@/components/admin/CloudinaryStatsWidget";
import { GalleryImageGrid } from "@/components/admin/GalleryImageGrid";
import { Separator } from "@/components/ui/separator";

export default async function GalleryAdminPage() {
    // Fetch all images, ordered by newest first
    const images = await db.image.findMany({
        orderBy: { createdAt: "desc" }
    });

    return (
        <AdminPageTemplate
            title="Galerie & Média"
            description="Správa všech nahraných fotografií a mediálních souborů."
            icon="Database" // Using Database icon as generic media store
        >
            <div className="space-y-8">
                {/* Stats Section */}
                <section>
                    <h2 className="text-lg font-bold mb-4">Využití Cloudinary</h2>
                    <CloudinaryStatsWidget />
                </section>

                <Separator />

                {/* Gallery Grid */}
                <section>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-bold">Fotografie ({images.length})</h2>
                        {/* Potential future filters: Filter by Visit, News, etc. */}
                    </div>

                    <GalleryImageGrid images={images} />
                </section>
            </div>
        </AdminPageTemplate>
    );
}
