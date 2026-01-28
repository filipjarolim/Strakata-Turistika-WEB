"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"

export function ThemeToggle() {
    const { setTheme, resolvedTheme } = useTheme()
    const [mounted, setMounted] = React.useState(false)

    React.useEffect(() => {
        setMounted(true)
    }, [])

    const isDark = mounted && resolvedTheme === "dark"

    return (
        <button
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className={cn(
                "relative flex items-center justify-center w-12 h-12 rounded-2xl transition-all duration-200 active:scale-95 overflow-hidden",
                "bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 shadow-sm hover:shadow-md"
            )}
            aria-label="Přepnout téma"
        >
            <div className="relative w-5 h-5">
                <Sun
                    className={cn(
                        "absolute inset-0 w-full h-full text-amber-500 transition-all duration-300 transform",
                        isDark ? "rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100"
                    )}
                />
                <Moon
                    className={cn(
                        "absolute inset-0 w-full h-full text-blue-400 transition-all duration-300 transform",
                        isDark ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-0 opacity-0"
                    )}
                />
            </div>
            {!mounted && <div className="absolute inset-0 bg-gray-50 dark:bg-zinc-900 animate-pulse" />}
        </button>
    )
}
