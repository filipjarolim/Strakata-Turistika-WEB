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
          "bg-white/50 backdrop-blur-sm border border-gray-200",
          "text-gray-900 text-sm",
          "cursor-pointer transition-all",
          "hover:bg-white/60",
          "focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        )}
      >
        {selectedDate ? format(selectedDate, 'PPP', { locale: cs }) : 'Vyberte datum'}
      </div>

      {/* Calendar dropdown */}
      {isOpen && (
        <div className={cn(
          "absolute z-50 mt-2 p-4 rounded-2xl shadow-xl",
          "bg-white/80 backdrop-blur-xl border border-gray-200",
          "animate-in fade-in-0 zoom-in-95",
          "w-[320px]"
        )}>
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={handlePrevMonth}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <ChevronLeft className="h-5 w-5 text-gray-600" />
            </button>
            <h2 className="text-sm font-medium text-gray-900">
              {format(currentMonth, 'LLLL yyyy', { locale: cs })}
            </h2>
            <button
              onClick={handleNextMonth}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <ChevronRight className="h-5 w-5 text-gray-600" />
            </button>
          </div>

          {/* Days of week */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'].map((day) => (
              <div
                key={day}
                className="text-center text-xs font-medium text-gray-500 py-1"
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
                    "hover:bg-blue-50",
                    isSelected && "bg-blue-500 text-white hover:bg-blue-600",
                    !isCurrentMonth && "text-gray-300",
                    !isSelected && isCurrentMonth && "text-gray-900"
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