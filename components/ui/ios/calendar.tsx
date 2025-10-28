'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay } from 'date-fns';
import { cs } from 'date-fns/locale';

interface IOSCalendarProps {
  selectedDate: Date | null;
  onDateChange: (date: Date) => void;
  className?: string;
}

export const IOSCalendar = ({
  selectedDate,
  onDateChange,
  className
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
    <div className={cn("relative", className)}>
      {/* Input display */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full px-4 py-2 rounded-xl",
          "bg-black/40 backdrop-blur-sm border border-white/30",
          "text-white text-sm font-medium",
          "cursor-pointer transition-all",
          "hover:bg-black/50 hover:border-white/40",
          "focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        )}
      >
        {selectedDate ? format(selectedDate, 'PPP', { locale: cs }) : 'Vyberte datum'}
      </div>

      {/* Calendar dropdown */}
      {isOpen && (
        <div className={cn(
          "absolute z-[9999] mt-2 p-4 rounded-2xl shadow-xl",
          "bg-black/90 backdrop-blur-xl border border-white/30",
          "animate-in fade-in-0 zoom-in-95",
          "w-[320px]"
        )}>
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={handlePrevMonth}
              className="p-2 rounded-full hover:bg-white/10 transition-colors"
            >
              <ChevronLeft className="h-5 w-5 text-white" />
            </button>
            <h2 className="text-sm font-medium text-white">
              {format(currentMonth, 'LLLL yyyy', { locale: cs })}
            </h2>
            <button
              onClick={handleNextMonth}
              className="p-2 rounded-full hover:bg-white/10 transition-colors"
            >
              <ChevronRight className="h-5 w-5 text-white" />
            </button>
          </div>

          {/* Days of week */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'].map((day) => (
              <div
                key={day}
                className="text-center text-xs font-medium text-white/60 py-1"
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
                    "hover:bg-white/10",
                    isSelected && "bg-blue-500 text-white hover:bg-blue-600",
                    !isCurrentMonth && "text-white/30",
                    !isSelected && isCurrentMonth && "text-white"
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