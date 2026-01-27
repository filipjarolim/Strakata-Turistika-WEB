"use server";

import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function deleteVisit(visitId: string) {
    const user = await currentUser();

    if (!user || !user.id) {
        return { error: "Neautorizován" };
    }

    try {
        const existingVisit = await db.visitData.findUnique({
            where: { id: visitId },
        });

        if (!existingVisit) {
            return { error: "Záznam nenalezen" };
        }

        if (existingVisit.userId !== user.id && user.role !== "ADMIN") {
            return { error: "Nemáte oprávnění smazat tento záznam" };
        }

        await db.visitData.delete({
            where: { id: visitId },
        });

        revalidatePath("/auth/profil");
        revalidatePath("/vysledky");
        return { success: "Záznam smazán" };
    } catch (error) {
        console.error("Delete visit error:", error);
        return { error: "Chyba při mazání záznamu" };
    }
}

export async function updateVisit(visitId: string, data: { visitDate: Date }) {
    const user = await currentUser();

    if (!user || !user.id) {
        return { error: "Neautorizován" };
    }

    try {
        const existingVisit = await db.visitData.findUnique({
            where: { id: visitId },
        });

        if (!existingVisit) {
            return { error: "Záznam nenalezen" };
        }

        if (existingVisit.userId !== user.id && user.role !== "ADMIN") {
            return { error: "Nemáte oprávnění upravit tento záznam" };
        }

        await db.visitData.update({
            where: { id: visitId },
            data: {
                visitDate: data.visitDate.toISOString(), // Stored as nullable Json/Date string
            },
        });

        revalidatePath("/auth/profil");
        revalidatePath(`/vysledky/${existingVisit.year}/${visitId}`);
        return { success: "Záznam aktualizován" };
    } catch (error) {
        console.error("Update visit error:", error);
        return { error: "Chyba při aktualizaci záznamu" };
    }
}
