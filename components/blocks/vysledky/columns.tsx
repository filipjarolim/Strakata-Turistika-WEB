import { ColumnDef } from "@tanstack/react-table";
import { VisitData } from "./DataTable";
import { IOSBadge } from "@/components/ui/ios/badge";
import { format } from "date-fns";
import { cs } from "date-fns/locale";
import Link from "next/link";
import { ArrowUpRight, MapPin, Dog } from "lucide-react";

export const columns: ColumnDef<VisitData>[] = [
    {
        id: "visitDate",
        accessorKey: "visitDate",
        header: "Datum",
        cell: ({ row }) => {
            const date = row.getValue("visitDate") as string;
            return date ? format(new Date(date), "d. MMMM yyyy", { locale: cs }) : "-";
        },
    },
    {
        id: "routeTitle",
        accessorKey: "routeTitle",
        header: "Název trasy",
        cell: ({ row }) => (
            <Link 
                href={`/vysledky/${row.original.year}/${row.original.id}`}
                className="text-primary hover:underline inline-flex items-center gap-1"
            >
                {row.getValue("routeTitle") || "-"}
                <ArrowUpRight className="h-4 w-4" />
            </Link>
        ),
    },
    {
        id: "points",
        accessorKey: "points",
        header: "Body",
        cell: ({ row }) => {
            const points = row.getValue("points") as number;
            return (
                <IOSBadge
                    label={`${points || 0} bodů`}
                    bgColor="bg-blue-100"
                    textColor="text-blue-900"
                    borderColor="border-blue-200"
                />
            );
        },
    },
    {
        id: "visitedPlaces",
        accessorKey: "visitedPlaces",
        header: "Navštívená místa",
        cell: ({ row }) => {
            const places = ((row.getValue("visitedPlaces") as string) || "").split(",").map(p => p.trim()).filter(Boolean);
            return (
                <div className="flex flex-wrap gap-1">
                    {places.length > 0 ? places.map((place, index) => (
                        <IOSBadge
                            key={index}
                            label={place}
                            icon={<MapPin className="h-3 w-3" />}
                            bgColor="bg-gray-100"
                            textColor="text-gray-900"
                            borderColor="border-gray-200"
                        />
                    )) : "-"}
                </div>
            );
        },
    },
    {
        id: "dogNotAllowed",
        accessorKey: "dogNotAllowed",
        header: "Psi zakázáni",
        cell: ({ row }) => {
            const dogNotAllowed = row.getValue("dogNotAllowed") as string;
            return (
                <IOSBadge
                    label={dogNotAllowed === "true" ? "Ano" : "Ne"}
                    icon={<Dog className="h-3 w-3" />}
                    bgColor={dogNotAllowed === "true" ? "bg-red-100" : "bg-green-100"}
                    textColor={dogNotAllowed === "true" ? "text-red-900" : "text-green-900"}
                    borderColor={dogNotAllowed === "true" ? "border-red-200" : "border-green-200"}
                />
            );
        },
    },
    {
        id: "state",
        accessorKey: "state",
        header: "Stav",
        cell: ({ row }) => {
            const state = row.getValue("state") as string;
            const variants = {
                'DRAFT': {
                    bg: "bg-gray-100",
                    text: "text-gray-900",
                    border: "border-gray-200",
                    label: "Koncept"
                },
                'PENDING_REVIEW': {
                    bg: "bg-yellow-100",
                    text: "text-yellow-900",
                    border: "border-yellow-200",
                    label: "Čeká na schválení"
                },
                'APPROVED': {
                    bg: "bg-green-100",
                    text: "text-green-900",
                    border: "border-green-200",
                    label: "Schváleno"
                },
                'REJECTED': {
                    bg: "bg-red-100",
                    text: "text-red-900",
                    border: "border-red-200",
                    label: "Zamítnuto"
                }
            };

            const variant = variants[state as keyof typeof variants] || variants.DRAFT;

            return (
                <IOSBadge
                    label={variant.label}
                    bgColor={variant.bg}
                    textColor={variant.text}
                    borderColor={variant.border}
                />
            );
        },
    }
];