'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay } from 'date-fns';
import { cs } from 'date-fns/locale';

interface IOSCalendarProps {
  selectedDate: Date | null;
  onDateChange: (date: Date) => void;
  dark?: boolean;
  className?: string;
}

export const IOSCalendar = ({
  selectedDate,
  onDateChange,
  className,
  dark
}: IOSCalendarProps) => {
  const [currentMonth, setCurrentMonth] = useState(selectedDate || new Date());
  const [isOpen, setIsOpen] = useState(false);

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth)
  });

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  return (
    <div className={cn("relative", isOpen && "z-[100]", className)}>
      {/* Input display */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full px-4 py-2 rounded-xl",
          dark ? "bg-black/40 backdrop-blur-sm border-white/30 text-white hover:bg-black/50 hover:border-white/40" : "bg-white border-gray-200 text-gray-900 hover:bg-gray-50 hover:border-blue-500/50",
          "border text-sm font-medium",
          "cursor-pointer transition-all",
          "focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        )}
      >
        {selectedDate ? format(selectedDate, 'PPP', { locale: cs }) : 'Vyberte datum'}
      </div>

      {/* Calendar dropdown */}
      {isOpen && (
        <div className={cn(
          "absolute z-[9999] mt-2 p-4 rounded-3xl shadow-2xl",
          dark ? "bg-zinc-900/95 backdrop-blur-2xl border border-white/20" : "bg-white/95 backdrop-blur-2xl border border-gray-100",
          "animate-in fade-in-0 zoom-in-95 duration-200",
          "w-[320px] left-0 sm:left-auto sm:right-0"
        )}>
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={handlePrevMonth}
              className={cn("p-2 rounded-full transition-colors", dark ? "hover:bg-white/10" : "hover:bg-gray-100")}
            >
              <ChevronLeft className={cn("h-5 w-5", dark ? "text-white" : "text-gray-900")} />
            </button>
            <h2 className={cn("text-sm font-medium", dark ? "text-white" : "text-gray-900")}>
              {format(currentMonth, 'LLLL yyyy', { locale: cs })}
            </h2>
            <button
              onClick={handleNextMonth}
              className={cn("p-2 rounded-full transition-colors", dark ? "hover:bg-white/10" : "hover:bg-gray-100")}
            >
              <ChevronRight className={cn("h-5 w-5", dark ? "text-white" : "text-gray-900")} />
            </button>
          </div>

          {/* Days of week */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'].map((day) => (
              <div
                key={day}
                className={cn("text-center text-xs font-medium py-1", dark ? "text-white/60" : "text-gray-400")}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: startOfMonth(currentMonth).getDay() - 1 }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}
            {days.map((day, dayIdx) => {
              const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
              const isCurrentMonth = isSameMonth(day, currentMonth);

              return (
                <button
                  key={dayIdx}
                  onClick={() => {
                    onDateChange(day);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "aspect-square rounded-full flex items-center justify-center text-sm transition-all",
                    dark ? "hover:bg-white/10" : "hover:bg-gray-100",
                    isSelected && "bg-blue-500 text-white hover:bg-blue-600",
                    !isCurrentMonth && (dark ? "text-white/30" : "text-gray-300"),
                    !isSelected && isCurrentMonth && (dark ? "text-white" : "text-gray-900")
                  )}
                >
                  {format(day, 'd')}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}; 