import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { ResultsClient } from "./ResultsClient";

export default async function ResultsPage({
  params,
}: {
  params: { rok: string };
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/prihlaseni");
  }

  const year = parseInt(params.rok);
  if (isNaN(year)) {
    redirect("/vysledky");
  }

  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/user/results?year=${year}`, {
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch results");
  }

  const data = await response.json();

  return <ResultsClient data={data} year={year} />;
}