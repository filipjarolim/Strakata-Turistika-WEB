import { db } from "@/lib/db";
import { NewsClient } from "./news-client";
import { currentRole } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";
import { AdminPageTemplate } from "@/components/admin/AdminPageTemplate";
import { FileText } from "lucide-react";

export default async function NewsAdminPage() {
    const role = await currentRole();
    if (role !== UserRole.ADMIN) {
        redirect("/");
    }

    const news = await db.news.findMany({
        orderBy: { createdAt: "desc" },
        include: { author: { select: { name: true, image: true } } }
    });

    return (
        <AdminPageTemplate
            title="Správa aktualit"
            description="Vytvářejte a upravujte novinky pro uživatele."
            icon="FileText"
        >
            <NewsClient initialNews={news} />
        </AdminPageTemplate>
    );
}
