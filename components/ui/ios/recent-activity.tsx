"use client";
import React from "react";
import { cn } from "@/lib/utils";
import { MapPin, Calendar, Award, Clock } from "lucide-react";
import { format } from "date-fns";
import { cs } from "date-fns/locale";
import { useRouter } from "next/navigation";

interface RecentVisit {
  id: string;
  routeTitle?: string;
  points: number;
  state: string;
  createdAt?: Date;
  year: number;
}

interface IOSRecentActivityProps {
  visits: RecentVisit[];
  className?: string;
}

export const IOSRecentActivity = ({ visits, className }: IOSRecentActivityProps) => {
  const router = useRouter();

  const getStateColor = (state: string) => {
    switch (state) {
      case 'APPROVED':
        return 'text-green-600 bg-green-100/50 border-green-200/50';
      case 'PENDING_REVIEW':
        return 'text-amber-600 bg-amber-100/50 border-amber-200/50';
      case 'DRAFT':
        return 'text-gray-600 bg-gray-100/50 border-gray-200/50';
      case 'REJECTED':
        return 'text-red-600 bg-red-100/50 border-red-200/50';
      default:
        return 'text-gray-600 bg-gray-100/50 border-gray-200/50';
    }
  };

  const getStateText = (state: string) => {
    switch (state) {
      case 'APPROVED':
        return 'Schváleno';
      case 'PENDING_REVIEW':
        return 'Čeká na schválení';
      case 'DRAFT':
        return 'Koncept';
      case 'REJECTED':
        return 'Zamítnuto';
      default:
        return state;
    }
  };

  const handleVisitClick = (visit: RecentVisit) => {
    router.push(`/vysledky/${visit.year}/${visit.id}`);
  };

  if (visits.length === 0) {
    return (
      <div className={cn(
        "p-8 text-center rounded-3xl bg-gray-50/50 border border-gray-200/50 backdrop-blur-sm",
        className
      )}>
        <div className="p-4 rounded-2xl bg-gray-100/50 w-fit mx-auto mb-4">
          <MapPin className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Žádné návštěvy</h3>
        <p className="text-sm text-gray-500">Zatím jste nenavštívili žádné místa</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {visits.map((visit, index) => (
        <div
          key={visit.id}
          onClick={() => handleVisitClick(visit)}
          className={cn(
            "p-5 rounded-2xl bg-white/90 backdrop-blur-xl border border-gray-200/50 shadow-lg",
            "transition-all duration-300 hover:shadow-lg hover:scale-[1.002] transform",
            "cursor-pointer"
          )}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-xl bg-blue-100/50">
                  <MapPin className="w-4 h-4 text-blue-600 flex-shrink-0" />
                </div>
                <h4 className="text-sm font-semibold text-gray-900 truncate">
                  {visit.routeTitle || `Návštěva ${index + 1}`}
                </h4>
              </div>
              
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <div className="flex items-center gap-2">
                  <Calendar className="w-3 h-3" />
                  <span>{visit.year}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="w-3 h-3" />
                  <span>{visit.points} bodů</span>
                </div>
                {visit.createdAt && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-3 h-3" />
                    <span>{format(new Date(visit.createdAt), 'd.M.yyyy', { locale: cs })}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium border",
              getStateColor(visit.state)
            )}>
              {getStateText(visit.state)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}; 