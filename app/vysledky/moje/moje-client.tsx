"use client";

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { VisitDataWithUser } from '@/lib/results-utils';
import { VisitDetailSheet } from '@/components/results/VisitDetailSheet';
import { VisitCard } from '@/components/results/VisitCard'; // New Shared Component
import { motion, AnimatePresence } from 'framer-motion';
import {
  Loader2,
  AlertCircle,
  Search,
  Calendar,
  User,
  Dog,
  Map as MapIcon
} from 'lucide-react';
import { cn } from "@/lib/utils";

// Reusing Glass Button logic
interface GlassButtonProps {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
  icon?: React.ElementType;
  className?: string;
  disabled?: boolean;
}

const GlassButton = ({ active, children, onClick, icon: Icon, className, disabled }: GlassButtonProps) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={cn(
      "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 border disabled:opacity-50 disabled:cursor-not-allowed",
      active
        ? "bg-gray-900 text-white border-gray-900 dark:bg-white dark:text-black dark:border-white shadow-lg"
        : "bg-white/50 text-gray-500 border-black/5 hover:bg-black/5 hover:text-black dark:bg-white/5 dark:text-gray-400 dark:border-white/10 dark:hover:bg-white/10 dark:hover:text-white",
      className
    )}
  >
    {Icon && <Icon className="w-4 h-4" />}
    {children}
  </button>
);

export default function MojeClient() {
  const { data: session } = useSession();

  // State
  const [allYears, setAllYears] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [visits, setVisits] = useState<VisitDataWithUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState<VisitDataWithUser | null>(null);

  // Fetch Years
  useEffect(() => {
    fetch('/api/seasons')
      .then(res => res.json())
      .then(data => {
        const sorted = [...data].sort((a: number, b: number) => b - a);
        setAllYears(sorted);
        if (sorted.length > 0 && !sorted.includes(selectedYear)) {
          setSelectedYear(sorted[0]);
        }
      })
      .catch(err => console.error(err));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch User Visits when Year Changes
  useEffect(() => {
    if (!session?.user?.id) return;

    setIsLoading(true);
    // Fetch all user visits for the season (limit 100 should be enough for one user)
    fetch(`/api/results/visits/${selectedYear}?userId=${session.user.id}&limit=100&state=APPROVED`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch visits');
        return res.json();
      })
      .then(resData => {
        // API returns PaginatedResponse { data: [...] }
        setVisits(resData.data || []);
      })
      .catch(err => {
        console.error(err);
        setError("Nepodařilo se načíst vaše výlety.");
      })
      .finally(() => setIsLoading(false));
  }, [selectedYear, session?.user?.id]);

  if (!session) {
    return <div className="p-10 text-center text-gray-500">Pro zobrazení výsledků se musíte přihlásit.</div>;
  }

  const totalPoints = visits.reduce((sum, item) => sum + (item.points || 0), 0);

  return (
    <div>
      {/* Controls */}
      <div className="bg-white/80 dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-3xl p-4 mb-8 flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-center shadow-sm">
        {/* Year Selector */}
        <div className="flex flex-wrap gap-2">
          {allYears.map(y => (
            <GlassButton
              key={y}
              active={selectedYear === y}
              onClick={() => setSelectedYear(y)}
            >
              {y}
            </GlassButton>
          ))}
        </div>

        {/* Stats Summary */}
        <div className="flex items-center gap-6 divide-x divide-gray-200 dark:divide-white/10 bg-gray-50 dark:bg-black/20 px-6 py-3 rounded-2xl border border-gray-200 dark:border-white/5">
          <div className="pr-2">
            <div className="text-xs text-gray-500 uppercase font-bold">Výlety</div>
            <div className="text-xl font-black text-gray-900 dark:text-white">{visits.length}</div>
          </div>
          <div className="pl-6">
            <div className="text-xs text-gray-500 uppercase font-bold">Celkem Body</div>
            <div className="text-xl font-black text-blue-600 dark:text-blue-400">
              {totalPoints}
            </div>
          </div>
        </div>
      </div>

      {/* List / Grid */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center text-gray-500">
          <Loader2 className="w-10 h-10 animate-spin mb-4 text-blue-500" />
          <p>Načítám vaše výsledky...</p>
        </div>
      ) : (
        <div className="min-h-[400px]">
          <AnimatePresence mode="popLayout">
            {visits.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {visits.map(visit => (
                  <VisitCard
                    key={visit.id}
                    visit={visit}
                    onClick={() => { setSelectedVisit(visit); setSheetOpen(true); }}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-gray-50 dark:bg-white/5 rounded-3xl border border-gray-200 dark:border-white/10">
                <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Žádné výsledky</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  V roce {selectedYear} nemáte žádné zapsané výlety.
                </p>
              </div>
            )}
          </AnimatePresence>
        </div>
      )}

      <VisitDetailSheet
        visit={selectedVisit}
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
      />
    </div>
  );
}
