"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Search, LayoutGrid, List } from "lucide-react";
import { cn } from "@/lib/utils";

interface NewsFilterProps {
    onSearchChange: (query: string) => void;
    onViewChange?: (view: "grid" | "list") => void;
    className?: string;
}

export const NewsFilter = ({ onSearchChange, onViewChange, className }: NewsFilterProps) => {
    const [search, setSearch] = useState("");
    const [view, setView] = useState<"grid" | "list">("grid");

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            onSearchChange(search);
        }, 500);
        return () => clearTimeout(timer);
    }, [search, onSearchChange]);

    return (
        <div className={cn(
            "flex flex-col sm:flex-row gap-4 items-center justify-between p-4 rounded-3xl border transition-all duration-300 mb-8",
            "bg-white/80 dark:bg-black/40 border-gray-100 dark:border-white/10 backdrop-blur-md",
            className
        )}>
            {/* Search Input */}
            <div className="relative w-full sm:w-72 md:w-96 group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 group-focus-within:text-blue-500 transition-colors" />
                <Input
                    placeholder="Hledat v aktualitách..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className={cn(
                        "pl-10 h-11 rounded-2xl border-none transition-all",
                        "bg-gray-100 dark:bg-white/5 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500",
                        "focus-visible:ring-2 focus-visible:ring-blue-500/50"
                    )}
                />
            </div>

            {/* Controls (View Toggle) */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                {onViewChange && (
                    <div className="flex items-center p-1 rounded-xl bg-gray-100 dark:bg-white/5 border border-transparent dark:border-white/5">
                        <button
                            onClick={() => { setView("grid"); onViewChange("grid"); }}
                            className={cn(
                                "p-2 rounded-lg transition-all",
                                view === "grid"
                                    ? "bg-white dark:bg-white/10 text-blue-600 dark:text-white shadow-sm"
                                    : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                            )}
                        >
                            <LayoutGrid className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => { setView("list"); onViewChange("list"); }}
                            className={cn(
                                "p-2 rounded-lg transition-all",
                                view === "list"
                                    ? "bg-white dark:bg-white/10 text-blue-600 dark:text-white shadow-sm"
                                    : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                            )}
                        >
                            <List className="w-5 h-5" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

