'use client';

import React, { useState, useEffect } from 'react';

interface DateRange {
  startDate: string;
  endDate: string;
  statusId: number;
  statusName: string;
}

interface BlockedDatesDisplayProps {
  toolId: number;
  className?: string;
}

const BlockedDatesDisplay: React.FC<BlockedDatesDisplayProps> = ({
  toolId,
  className = ''
}) => {
  const [blockedDates, setBlockedDates] = useState<DateRange[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <div className={`p-4 ${className}`}>
        <div className="text-center text-gray-500">Chargement des disponibilités...</div>
      </div>
    );
  }

  if (blockedDates.length === 0) {
    return (
      <div className={`p-4 bg-green-50 border border-green-200 rounded-lg ${className}`}>
        <div className="flex items-center gap-2 text-green-800">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span className="font-medium">Disponible</span>
        </div>
        <p className="text-sm text-green-600 mt-1">Cet outil est disponible pour toutes les dates</p>
      </div>
    );
  }

  return (
    <div className={`p-4 bg-amber-50 border border-amber-200 rounded-lg ${className}`}>
      <div className="flex items-center gap-2 text-amber-800 mb-3">
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        <span className="font-medium">Périodes réservées</span>
      </div>
      
      <div className="space-y-2">
        {blockedDates.map((blocked, index) => (
          <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-400 rounded-full"></div>
              <span className="text-sm font-medium">
                {new Date(blocked.startDate).toLocaleDateString('fr-FR')} - {new Date(blocked.endDate).toLocaleDateString('fr-FR')}
              </span>
            </div>
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              blocked.statusId === 1 
                ? 'bg-yellow-100 text-yellow-800' 
                : 'bg-green-100 text-green-800'
            }`}>
              {blocked.statusName}
            </span>
          </div>
        ))}
      </div>
      
      <div className="mt-3 text-xs text-amber-600">
        <p>💡 Les dates en rouge ne sont pas disponibles pour la réservation</p>
      </div>
    </div>
  );
};

export default BlockedDatesDisplay;
