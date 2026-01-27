import { AdminPageTemplate } from "@/components/admin/AdminPageTemplate";
import { Sliders } from "lucide-react";
import ScoringClient from "./scoring-client";

export default function ScoringPage() {
    return (
        <AdminPageTemplate
            title="Správa bodování"
            description="Centrální konfigurace bodování a typů míst."
            icon="Sliders"
        >
            <ScoringClient />
        </AdminPageTemplate>
    );
}
