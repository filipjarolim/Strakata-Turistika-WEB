import { currentRole } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";
import DebugClient from "./debug-client";

export default async function DebugPage() {
  const role = await currentRole();

  if (role !== UserRole.ADMIN) {
    redirect("/");
  }

  return <DebugClient />;
}
