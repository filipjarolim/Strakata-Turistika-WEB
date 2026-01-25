"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy,
  List,
  Award,
  Users,
  Loader2,
  AlertCircle,
  Map as MapIcon,
  Calendar,
  User,
  Dog,
  Search,
  Filter
} from "lucide-react";
import { format } from "date-fns";
import { cs } from "date-fns/locale";
import { useResults } from "@/hooks/useResults";
import { useSession } from "next-auth/react";
import { VisitDataWithUser, LeaderboardEntry } from "@/lib/results-utils";
import { VisitDetailSheet } from "@/components/results/VisitDetailSheet";
import { VisitCard } from "@/components/results/VisitCard";
import { cn } from "@/lib/utils";

// COMPONENTS
// We define some local components for the new design to keep it self-contained
// or we can move them out later.

const GlassButton = ({ active, children, onClick, icon: Icon, className }: any) => (
  <button
    onClick={onClick}
    className={cn(
      "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 border",
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

const RankBadge = ({ rank }: { rank: number }) => {
  if (rank === 1) return <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-600 shadow-lg shadow-yellow-500/30 flex items-center justify-center text-black font-black text-sm">1</div>;
  if (rank === 2) return <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-300 to-gray-500 shadow-lg shadow-gray-500/30 flex items-center justify-center text-black font-black text-sm">2</div>;
  if (rank === 3) return <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-300 to-orange-600 shadow-lg shadow-orange-500/30 flex items-center justify-center text-black font-black text-sm">3</div>;
  return <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/10 border border-gray-200 dark:border-white/10 flex items-center justify-center text-gray-500 dark:text-gray-400 font-bold text-sm">{rank}</div>;
};

export default function ResultsClient() {
  const params = useParams();
  const year = parseInt(params.rok as string);
  const { data: session } = useSession();

  // State
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState<VisitDataWithUser | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const { state, actions } = useResults(year);

  // Filter Logic Integration
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setSearchQuery(q);
    actions.onSearchChanged(q);
  };

  // Infinite Scroll
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !state.showLeaderboard && state.hasMore && !state.isLoadingMore) {
        actions.loadNextPage();
      }
    }, { threshold: 0.1 });
    if (loadMoreRef.current) observerRef.current.observe(loadMoreRef.current);
    return () => observerRef.current?.disconnect();
  }, [state.showLeaderboard, state.hasMore, state.isLoadingMore, actions]);

  const renderVisitCard = (visit: VisitDataWithUser) => {
    const hasRoute = visit.route && visit.route.trackPoints?.length > 0;
    return (
      <motion.div
        key={visit.id}
        layout
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ y: -5, scale: 1.02 }}
        onClick={() => { setSelectedVisit(visit); setSheetOpen(true); }}
        className="group relative bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:border-blue-500/30 dark:hover:border-blue-500/30 rounded-3xl overflow-hidden cursor-pointer backdrop-blur-sm transition-all duration-300 shadow-sm hover:shadow-xl dark:shadow-none hover:bg-gray-50 dark:hover:bg-white/10"
      >
        {/* Preview / Map Area */}
        <div className="h-40 w-full relative bg-gray-100 dark:bg-black/40 flex items-center justify-center overflow-hidden">
          {hasRoute ? (
            // Map Background with Route Line
            <div className="w-full h-full relative group-hover:opacity-100 transition-opacity">
              <TileBackground trackPoints={visit.route!.trackPoints} className="opacity-50 grayscale dark:invert dark:opacity-30" zoom={11} />
              <div className="absolute inset-0 p-4 opacity-90">
                <RoutePreviewSVG trackPoints={visit.route!.trackPoints} color="#3B82F6" strokeWidth={3} />
              </div>
            </div>
          ) : (
            <div className="relative w-full h-full">
              <Image
                src="/images/no-preview.png"
                alt=""
                fill
                className="object-cover opacity-80"
                unoptimized
                priority
              />
            </div>
          )}
          {/* Overlay Badges */}
          <div className="absolute top-3 left-3 px-2 py-1 bg-white/90 dark:bg-black/60 backdrop-blur rounded-lg text-xs font-medium text-gray-700 dark:text-gray-300 border border-black/5 dark:border-white/10 flex items-center gap-1.5 shadow-sm">
            <Calendar className="w-3 h-3" />
            {visit.visitDate ? format(new Date(visit.visitDate), "d.M.", { locale: cs }) : "?"}
          </div>
          <div className="absolute top-3 right-3 px-2 py-1 bg-green-100 dark:bg-green-500/20 border border-green-200 dark:border-green-500/30 text-green-700 dark:text-green-300 rounded-lg text-xs font-bold shadow-sm">
            {visit.points} b
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          <h3 className="font-bold text-gray-900 dark:text-white mb-1 line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {visit.routeTitle || "Neznámá trasa"}
          </h3>

          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
            <User className="w-3 h-3" />
            {visit.displayName}
            {visit.user?.dogName && (
              <>
                <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
                <Dog className="w-3 h-3" />
                {visit.user.dogName}
              </>
            )}
          </div>

          {/* Places Tags */}
          <div className="flex flex-wrap gap-1.5">
            {visit.visitedPlaces.split(',').slice(0, 3).map((p, i) => (
              <span key={i} className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-white/5 text-[10px] text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-white/5">
                {p.trim()}
              </span>
            ))}
            {visit.visitedPlaces.split(',').length > 3 && (
              <span className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-white/5 text-[10px] text-gray-600 dark:text-gray-400">+</span>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  const renderLeaderboardRow = (entry: LeaderboardEntry, idx: number) => {
    const isTop3 = idx < 3;
    return (
      <motion.div
        key={entry.userId}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: idx * 0.05 }}
        className={cn(
          "relative flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 group shadow-sm hover:shadow-md dark:shadow-none",
          isTop3
            ? "bg-gradient-to-r from-yellow-50/50 to-white dark:from-white/10 dark:to-transparent border-yellow-200 dark:border-white/20 hover:border-yellow-400 dark:hover:border-white/40"
            : "bg-white dark:bg-white/5 border-gray-100 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/10 hover:border-gray-300 dark:hover:border-white/10"
        )}
      >
        {/* Rank & User */}
        <div className="flex items-center gap-4 sm:gap-6">
          <RankBadge rank={idx + 1} />

          <div className="flex items-center gap-3">
            {/* Avatar Placeholder */}
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-500/20 dark:to-purple-500/20 border border-white dark:border-white/10 flex items-center justify-center shadow-sm">
              <span className="font-bold text-blue-600 dark:text-blue-300">{entry.userName.charAt(0)}</span>
            </div>
            <div>
              <h3 className={cn("font-bold text-base sm:text-lg leading-none mb-1", isTop3 ? "text-gray-900 dark:text-white" : "text-gray-700 dark:text-gray-300")}>
                {entry.userName}
              </h3>
              {entry.dogName && (
                <p className="text-xs text-gray-500 dark:text-gray-500 flex items-center gap-1.5 ">
                  <Dog className="w-3 h-3" />
                  {entry.dogName}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-6 sm:gap-12 text-right">
          <div className="hidden sm:block">
            <p className="text-gray-400 dark:text-gray-500 text-xs uppercase tracking-wider font-semibold mb-0.5">Návštěvy</p>
            <p className="text-xl font-bold text-gray-700 dark:text-gray-300">{entry.visitsCount}</p>
          </div>
          <div>
            <p className="text-blue-600 dark:text-blue-500 text-xs uppercase tracking-wider font-semibold mb-0.5">Body</p>
            <p className="text-2xl font-black text-gray-900 dark:text-white drop-shadow-sm dark:drop-shadow-[0_0_10px_rgba(59,130,246,0.3)]">
              {entry.totalPoints}
            </p>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Control Bar */}
      <div className="bg-white/80 dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-3xl p-3 sm:p-4 flex flex-col md:flex-row gap-4 justify-between items-center sticky top-20 sm:top-24 z-30 shadow-xl shadow-black/5 dark:shadow-none transition-all duration-300">
        {/* View Toggles */}
        <div className="flex gap-2 bg-gray-100 dark:bg-black/20 p-1 rounded-xl w-full md:w-auto">
          <button
            onClick={state.showLeaderboard ? actions.toggleView : undefined}
            className={cn("flex-1 px-4 py-2 sm:py-2.5 rounded-lg text-sm font-bold transition-all", !state.showLeaderboard ? "bg-white dark:bg-blue-600 text-black dark:text-white shadow-md dark:shadow-none" : "text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white")}
          >
            Prohlížet Výlety
          </button>
          <button
            onClick={!state.showLeaderboard ? actions.toggleView : undefined}
            className={cn("flex-1 px-4 py-2 sm:py-2.5 rounded-lg text-sm font-bold transition-all", state.showLeaderboard ? "bg-white dark:bg-purple-600 text-black dark:text-white shadow-md dark:shadow-none" : "text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white")}
          >
            Žebříčky
          </button>
        </div>

        {/* Search & Filter */}
        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative flex-1 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 group-focus-within:text-blue-500 transition-colors" />
            <input
              type="text"
              placeholder="Hledat..."
              value={searchQuery}
              onChange={handleSearch}
              className="w-full md:w-64 bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 rounded-xl py-2 sm:py-2.5 pl-10 pr-4 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500/50 transition-colors"
            />
          </div>
          {/* Sort Toggle for Leaderboard */}
          {state.showLeaderboard && (
            <button
              onClick={actions.toggleLeaderboardSort}
              className="px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors"
              title="Seřadit"
            >
              {state.sortLeaderboardByVisits ? <List className="w-5 h-5" /> : <Award className="w-5 h-5" />}
            </button>
          )}
        </div>
      </div>

      {/* Error */}
      {state.error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-200 flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          {state.error}
        </div>
      )}

      {/* Content */}
      {state.isInitialLoading ? (
        <div className="py-20 flex flex-col items-center justify-center text-gray-500">
          <Loader2 className="w-10 h-10 animate-spin mb-4 text-blue-500" />
          <p>Načítám data...</p>
        </div>
      ) : (
        <div className="min-h-[400px]">
          <AnimatePresence mode="wait">
            {state.showLeaderboard ? (
              <motion.div
                key="leaderboard"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4 max-w-4xl mx-auto"
              >
                {state.leaders.length === 0 ? (
                  <div className="text-center py-20 text-gray-500">Žádné výsledky v žebříčku</div>
                ) : (
                  state.leaders.map((entry, idx) => renderLeaderboardRow(entry, idx))
                )}
              </motion.div>
            ) : (
              <motion.div
                key="list"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6"
              >
                {state.items.length === 0 ? (
                  <div className="col-span-full text-center py-20 text-gray-500">Žádné výlety nenalezeny</div>
                ) : (
                  <>
                    {state.items.map((visit) => (
                      <VisitCard
                        key={visit.id}
                        visit={visit}
                        onClick={() => { setSelectedVisit(visit); setSheetOpen(true); }}
                      />
                    ))}
                    {/* Sentinel for Load More */}
                    {!state.showLeaderboard && state.hasMore && (
                      <div ref={loadMoreRef} className="col-span-full py-10 flex justify-center opacity-50">
                        <Loader2 className="w-6 h-6 animate-spin" />
                      </div>
                    )}
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Detail Sheet */}
      <VisitDetailSheet
        visit={selectedVisit}
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
      />
    </div>
  );
}
