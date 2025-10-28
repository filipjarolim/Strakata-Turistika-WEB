import { currentRole } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";
import FormularClient from "./formular-client";

export default async function FormularPage() {
  const role = await currentRole();

  if (role !== UserRole.ADMIN) {
    redirect("/");
  }

  return <FormularClient />;
}

