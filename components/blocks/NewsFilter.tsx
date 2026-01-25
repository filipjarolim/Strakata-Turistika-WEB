"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Search, Filter, LayoutGrid, List } from "lucide-react";
import { IOSButton } from "@/components/ui/ios/button";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/use-debounce";
// Assuming use-debounce hook exists, or I will implement simple timeout

interface NewsFilterProps {
    onSearchChange: (query: string) => void;
    onViewChange?: (view: "grid" | "list") => void; // Optional if we implement view toggle
    variant?: "light" | "dark";
    className?: string;
}

export const NewsFilter = ({ onSearchChange, onViewChange, variant = "light", className }: NewsFilterProps) => {
    const [search, setSearch] = useState("");
    const [view, setView] = useState<"grid" | "list">("grid");
    const isDark = variant === "dark";

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            onSearchChange(search);
        }, 500);
        return () => clearTimeout(timer);
    }, [search, onSearchChange]);

    return (
        <div className={cn(
            "flex flex-col sm:flex-row gap-4 items-center justify-between p-4 rounded-2xl border backdrop-blur-md mb-8",
            isDark ? "bg-black/40 border-white/10" : "bg-white/80 border-gray-200/50",
            className
        )}>
            {/* Search Input */}
            <div className="relative w-full sm:w-72 md:w-96">
                <Search className={cn(
                    "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4",
                    isDark ? "text-gray-400" : "text-gray-500"
                )} />
                <Input
                    placeholder="Hledat v aktualitách..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className={cn(
                        "pl-10 h-10 rounded-xl border-0 ring-offset-0 focus-visible:ring-2 transition-all",
                        isDark
                            ? "bg-white/10 text-white placeholder:text-gray-400 focus-visible:ring-blue-500/50"
                            : "bg-gray-100 text-gray-900 placeholder:text-gray-500 focus-visible:ring-blue-500/30"
                    )}
                />
            </div>

            {/* Controls (View Toggle / Filter) */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                {onViewChange && (
                    <div className={cn(
                        "flex items-center p-1 rounded-lg border",
                        isDark ? "bg-white/5 border-white/5" : "bg-gray-100 border-gray-200"
                    )}>
                        <button
                            onClick={() => { setView("grid"); onViewChange("grid"); }}
                            className={cn(
                                "p-1.5 rounded-md transition-all",
                                view === "grid"
                                    ? (isDark ? "bg-white/20 text-white shadow-sm" : "bg-white text-gray-900 shadow-sm")
                                    : (isDark ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-gray-900")
                            )}
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => { setView("list"); onViewChange("list"); }}
                            className={cn(
                                "p-1.5 rounded-md transition-all",
                                view === "list"
                                    ? (isDark ? "bg-white/20 text-white shadow-sm" : "bg-white text-gray-900 shadow-sm")
                                    : (isDark ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-gray-900")
                            )}
                        >
                            <List className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
