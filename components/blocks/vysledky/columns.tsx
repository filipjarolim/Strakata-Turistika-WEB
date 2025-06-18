import { ColumnDef } from "@tanstack/react-table";
import { VisitData } from "./DataTable";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { cs } from "date-fns/locale";

export const columns: ColumnDef<VisitData>[] = [
    {
    accessorKey: "visitDate",
    header: "Datum",
        cell: ({ row }) => {
      const date = row.getValue("visitDate") as string;
      return date ? format(new Date(date), "d. MMMM yyyy", { locale: cs }) : "-";
        },
    },
    {
    accessorKey: "routeTitle",
    header: "Název trasy",
    cell: ({ row }) => row.getValue("routeTitle") || "-",
  },
  {
    accessorKey: "points",
    header: "Body",
        cell: ({ row }) => {
      const points = row.getValue("points") as number;
      return points || 0;
        },
    },
    {
    accessorKey: "visitedPlaces",
    header: "Navštívená místa",
    cell: ({ row }) => row.getValue("visitedPlaces") || "-",
    },
    {
    accessorKey: "dogNotAllowed",
    header: "Psi zakázáni",
        cell: ({ row }) => {
      const dogNotAllowed = row.getValue("dogNotAllowed") as string;
      return dogNotAllowed === "true" ? "Ano" : "Ne";
    },
    },
    {
    accessorKey: "state",
    header: "Stav",
        cell: ({ row }) => {
      const state = row.getValue("state") as string;
      const variants = {
        'DRAFT': "secondary",
        'PENDING_REVIEW': "outline",
        'APPROVED': "default",
        'REJECTED': "destructive"
      } as const;

      const labels = {
        'DRAFT': "Koncept",
        'PENDING_REVIEW': "Čeká na schválení",
        'APPROVED': "Schváleno",
        'REJECTED': "Zamítnuto"
      };

            return (
        <Badge variant={variants[state as keyof typeof variants]} className="font-medium">
          {labels[state as keyof typeof labels]}
        </Badge>
            );
        },
  }
];