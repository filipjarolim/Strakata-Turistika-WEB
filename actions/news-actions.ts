'use server';

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { currentRole } from "@/lib/auth";

// Define schema inline if not available, or just use 'any' for now since validation is done manually in service usually?
// actually checking schemas file first.

export async function deleteNews(id: string) {
    const role = await currentRole();
    if (role !== "ADMIN") {
        return { error: "Neautorizovaný přístup" };
    }

    try {
        await db.news.delete({
            where: { id },
        });

        revalidatePath("/aktuality");
        revalidatePath("/"); // Homepage might have featured news
        return { success: "Aktualita smazána" };
    } catch (error) {
        console.error("Delete news error:", error);
        return { error: "Nepodařilo se smazat aktualitu" };
    }
}

export async function updateNews(id: string, values: any) {
    const role = await currentRole();
    if (role !== "ADMIN") {
        return { error: "Neautorizovaný přístup" };
    }

    try {
        await db.news.update({
            where: { id },
            data: {
                title: values.title,
                content: values.content,
                summary: values.summary,
                images: values.images,
                published: values.published,
                // Handle date change if requested/provided
                ...(values.createdAt && { createdAt: new Date(values.createdAt) })
            }
        });

        revalidatePath("/aktuality");
        revalidatePath("/");
        return { success: "Aktualita upravena" };
    } catch (error) {
        console.error("Update news error:", error);
        return { error: "Nepodařilo se upravit aktualitu" };
    }
}
