import FormBuilderClient from "./form-builder-client";
import { AdminPageTemplate } from "@/components/admin/AdminPageTemplate";
import { Sliders } from "lucide-react";

export default function FormularPage() {
  return (
    <AdminPageTemplate
      title="Nastavení formuláře"
      description="Konfigurace bodování a typů návštěv."
      icon="Sliders"
    >
      <FormBuilderClient />
    </AdminPageTemplate>
  );
}
