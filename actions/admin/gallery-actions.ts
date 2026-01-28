"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { cloudinary } from "@/lib/cloudinary";

export async function toggleGalleryVisibility(imageId: string, currentStatus: boolean) {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") return { error: "Unauthorized" };

    try {
        await db.image.update({
            where: { id: imageId },
            data: { isGalleryVisible: !currentStatus }
        });
        revalidatePath("/admin/gallery");
        return { success: true };
    } catch (error) {
        return { error: "Failed to update" };
    }
}

export async function deleteImage(imageId: string, publicId: string) {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") return { error: "Unauthorized" };

    try {
        // 1. Delete from Cloudinary
        if (publicId) {
            await cloudinary.uploader.destroy(publicId);
        }

        // 2. Delete from DB
        await db.image.delete({
            where: { id: imageId }
        });

        revalidatePath("/admin/gallery");
        return { success: true };
    } catch (error) {
        console.error("Delete error:", error);
        return { error: "Failed to delete" };
    }
}
