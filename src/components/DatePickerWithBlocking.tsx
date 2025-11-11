'use client';

import React, { useState, useEffect } from 'react';

interface DateRange {
  startDate: string;
  endDate: string;
  statusId: number;
  statusName: string;
}

interface DatePickerWithBlockingProps {
  toolId: number;
  onDateChange: (startDate: Date | null, endDate: Date | null) => void;
  onPriceChange?: (totalPrice: number, days: number) => void;
  toolPrice?: number;
  className?: string;
}

const DatePickerWithBlocking: React.FC<DatePickerWithBlockingProps> = ({
  toolId,
  onDateChange,
  onPriceChange,
  toolPrice = 0,
  className = ''
}) => {
  const [blockedDates, setBlockedDates] = useState<DateRange[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStartDate, setSelectedStartDate] = useState<Date | null>(null);
  const [selectedEndDate, setSelectedEndDate] = useState<Date | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    fetchBlockedDates();
  }, [toolId]);

  const fetchBlockedDates = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/tools/${toolId}/blocked-dates`);
      if (response.ok) {
        const data = await response.json();
        setBlockedDates(data.blockedDates || []);
      }
    } catch (error) {
      console.error('Failed to fetch blocked dates:', error);
    } finally {
      setLoading(false);
    }
  };

  const isDateBlocked = (date: Date): boolean => {
    const dateStr = date.toISOString().split('T')[0];
    
    return blockedDates.some(blocked => {
      const startDate = new Date(blocked.startDate).toISOString().split('T')[0];
      const endDate = new Date(blocked.endDate).toISOString().split('T')[0];
      return dateStr >= startDate && dateStr <= endDate;
    });
  };

  const getDateClassName = (date: Date): string => {
    const baseClasses = "w-8 h-8 flex items-center justify-center text-sm rounded transition-colors";
    const today = new Date();
    const isPast = date < new Date(today.toDateString());
    
    if (isPast) {
      return `${baseClasses} bg-gray-100 text-gray-400 cursor-not-allowed`;
    }
    
    if (isDateBlocked(date)) {
      return `${baseClasses} bg-red-500 text-white cursor-not-allowed font-medium`;
    }
    
    if (selectedStartDate && selectedEndDate) {
      const dateStr = date.toISOString().split('T')[0];
      const startStr = selectedStartDate.toISOString().split('T')[0];
      const endStr = selectedEndDate.toISOString().split('T')[0];
      
      if (dateStr >= startStr && dateStr <= endStr) {
        return `${baseClasses} bg-blue-500 text-white cursor-pointer`;
      }
    }
    
    if (selectedStartDate && date.getTime() === selectedStartDate.getTime()) {
      return `${baseClasses} bg-blue-600 text-white font-bold cursor-pointer`;
    }
    
    if (selectedEndDate && date.getTime() === selectedEndDate.getTime()) {
      return `${baseClasses} bg-blue-600 text-white font-bold cursor-pointer`;
    }
    
    return `${baseClasses} text-gray-700 hover:bg-blue-50 cursor-pointer`;
  };

  const calculatePrice = (startDate: Date, endDate: Date) => {
    const timeDiff = endDate.getTime() - startDate.getTime();
    const days = Math.ceil(timeDiff / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end dates
    const totalPrice = days * toolPrice;
    return { days, totalPrice };
  };

  const handleDateClick = (date: Date) => {
    if (isDateBlocked(date)) {
      return; // Don't allow selection of blocked dates
    }

    if (!selectedStartDate || (selectedStartDate && selectedEndDate)) {
      // Start new selection
      setSelectedStartDate(date);
      setSelectedEndDate(null);
      onDateChange(date, null);
      if (onPriceChange) {
        onPriceChange(0, 0); // Reset price when starting new selection
      }
    } else if (selectedStartDate && !selectedEndDate) {
      // Complete selection
      let finalStartDate = selectedStartDate;
      let finalEndDate = date;
      
      if (date < selectedStartDate) {
        // If clicked date is before start date, swap them
        finalStartDate = date;
        finalEndDate = selectedStartDate;
      }
      
      setSelectedStartDate(finalStartDate);
      setSelectedEndDate(finalEndDate);
      onDateChange(finalStartDate, finalEndDate);
      
      // Calculate and notify price
      if (onPriceChange) {
        const { days, totalPrice } = calculatePrice(finalStartDate, finalEndDate);
        onPriceChange(totalPrice, days);
      }
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      if (direction === 'prev') {
        newMonth.setMonth(prev.getMonth() - 1);
      } else {
        newMonth.setMonth(prev.getMonth() + 1);
      }
      return newMonth;
    });
  };

  const generateCalendarDays = () => {
    const today = new Date();
    const month = currentMonth.getMonth();
    const year = currentMonth.getFullYear();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="w-8 h-8"></div>);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const isBlocked = isDateBlocked(date);
      const isPast = date < new Date(today.toDateString());
      
      days.push(
        <div
          key={day}
          className={getDateClassName(date)}
          onClick={() => !isPast && !isBlocked && handleDateClick(date)}
          title={isBlocked ? 'Date réservée' : isPast ? 'Date passée' : ''}
        >
          {day}
        </div>
      );
    }
    
    return days;
  };

  const getMonthName = (date: Date) => {
    return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className={`p-4 ${className}`}>
        <div className="text-center text-gray-500">Chargement des dates disponibles...</div>
      </div>
    );
  }

  return (
    <div className={`p-4 ${className}`}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">Sélectionnez vos dates</h3>
        <div className="text-sm text-gray-600 mb-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <span>Dates réservées</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500 rounded"></div>
              <span>Dates sélectionnées</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-100 rounded"></div>
              <span>Dates passées</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-50 border border-blue-200 rounded"></div>
              <span>Dates disponibles</span>
            </div>
          </div>
        </div>
      </div>

      <div className="border rounded-lg p-4">
        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Mois précédent"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
            {getMonthName(currentMonth)}
          </h3>
          
          <button
            onClick={() => navigateMonth('next')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Mois suivant"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Calendar Header */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'].map(day => (
            <div key={day} className="w-8 h-8 flex items-center justify-center text-sm font-medium text-gray-500">
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-1">
          {generateCalendarDays()}
        </div>
      </div>

      {selectedStartDate && selectedEndDate && (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="text-sm font-medium text-blue-800 mb-2">
            Période sélectionnée : {selectedStartDate.toLocaleDateString('fr-FR')} - {selectedEndDate.toLocaleDateString('fr-FR')}
          </div>
          <div className="flex items-center justify-between">
            <div className="text-xs text-blue-600">
              {Math.ceil((selectedEndDate.getTime() - selectedStartDate.getTime()) / (1000 * 60 * 60 * 24)) + 1} jour(s)
            </div>
            {toolPrice > 0 && (
              <div className="text-right">
                <div className="text-xs text-blue-600">
                  {toolPrice} DT/jour
                </div>
                <div className="text-lg font-bold text-blue-800">
                  {Math.ceil((selectedEndDate.getTime() - selectedStartDate.getTime()) / (1000 * 60 * 60 * 24)) + 1 * toolPrice} DT
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {blockedDates.length > 0 && (
        <div className="mt-4 p-3 bg-red-50 rounded-lg">
          <div className="text-sm font-medium text-red-800 mb-2">Périodes réservées :</div>
          <div className="space-y-1">
            {blockedDates.map((blocked, index) => (
              <div key={index} className="text-xs text-red-600">
                {new Date(blocked.startDate).toLocaleDateString('fr-FR')} - {new Date(blocked.endDate).toLocaleDateString('fr-FR')} 
                <span className="ml-2 px-2 py-1 bg-red-100 text-red-700 rounded text-xs">
                  {blocked.statusName}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DatePickerWithBlocking;
