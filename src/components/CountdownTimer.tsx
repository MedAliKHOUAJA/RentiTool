'use client';

import React, { useState, useEffect } from 'react';

interface CountdownTimerProps {
  targetDate: string; // ISO string
  onExpired?: () => void;
  className?: string;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({ 
  targetDate, 
  onExpired, 
  className = '' 
}) => {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    total: number;
  } | null>(null);

  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const target = new Date(targetDate).getTime();
      const difference = target - now;

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        return {
          days,
          hours,
          minutes,
          seconds,
          total: difference
        };
      } else {
        setIsExpired(true);
        if (onExpired) {
          onExpired();
        }
        return null;
      }
    };

    // Calculate immediately
    setTimeLeft(calculateTimeLeft());

    // Update every second
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate, onExpired]);

  if (isExpired) {
    return (
      <div className={`${className}`}>
        <div className="inline-flex items-center gap-2 px-3 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <span className="text-red-500 text-sm">⚠️</span>
          <span className="text-red-600 dark:text-red-400 text-sm font-medium">Temps écoulé</span>
        </div>
      </div>
    );
  }

  if (!timeLeft) {
    return (
      <div className={`text-gray-500 ${className}`}>
        ⏳ Calcul en cours...
      </div>
    );
  }

  const formatTime = (value: number, label: string) => {
    return `${value} ${label}${value > 1 ? 's' : ''}`;
  };

  const isUrgent = timeLeft.days === 0 && timeLeft.hours < 24;
  const isVeryUrgent = timeLeft.days === 0 && timeLeft.hours < 6;

  return (
    <div className={`${className}`}>
      <div className={`inline-flex items-center gap-3 px-4 py-2 rounded-lg border ${
        isVeryUrgent ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800" : 
        isUrgent ? "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800" : 
        "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
      }`}>
        <div className="flex items-center gap-2">
          <span className={`text-sm ${
            isVeryUrgent ? "text-red-500" : isUrgent ? "text-orange-500" : "text-blue-500"
          }`}>
            {isVeryUrgent ? "🚨" : isUrgent ? "⚠️" : "⏰"}
          </span>
          <span className={`text-sm font-medium ${
            isVeryUrgent ? "text-red-600 dark:text-red-400" : 
            isUrgent ? "text-orange-600 dark:text-orange-400" : 
            "text-blue-600 dark:text-blue-400"
          }`}>
            {isVeryUrgent ? "URGENT" : isUrgent ? "Bientôt" : "Récupération"}
          </span>
        </div>
        
        <div className="flex items-center gap-2 text-sm">
          {timeLeft.days > 0 && (
            <span className={`px-2 py-1 rounded text-xs font-bold ${
              isVeryUrgent ? "bg-red-100 text-red-700 dark:bg-red-800 dark:text-red-200" : 
              isUrgent ? "bg-orange-100 text-orange-700 dark:bg-orange-800 dark:text-orange-200" : 
              "bg-blue-100 text-blue-700 dark:bg-blue-800 dark:text-blue-200"
            }`}>
              {timeLeft.days}j
            </span>
          )}
          <span className={`px-2 py-1 rounded text-xs font-bold ${
            isVeryUrgent ? "bg-red-100 text-red-700 dark:bg-red-800 dark:text-red-200" : 
            isUrgent ? "bg-orange-100 text-orange-700 dark:bg-orange-800 dark:text-orange-200" : 
            "bg-blue-100 text-blue-700 dark:bg-blue-800 dark:text-blue-200"
          }`}>
            {timeLeft.hours}h
          </span>
          <span className={`px-2 py-1 rounded text-xs font-bold ${
            isVeryUrgent ? "bg-red-100 text-red-700 dark:bg-red-800 dark:text-red-200" : 
            isUrgent ? "bg-orange-100 text-orange-700 dark:bg-orange-800 dark:text-orange-200" : 
            "bg-blue-100 text-blue-700 dark:bg-blue-800 dark:text-blue-200"
          }`}>
            {timeLeft.minutes}m
          </span>
          <span className={`px-2 py-1 rounded text-xs font-bold ${
            isVeryUrgent ? "bg-red-100 text-red-700 dark:bg-red-800 dark:text-red-200" : 
            isUrgent ? "bg-orange-100 text-orange-700 dark:bg-orange-800 dark:text-orange-200" : 
            "bg-blue-100 text-blue-700 dark:bg-blue-800 dark:text-blue-200"
          }`}>
            {timeLeft.seconds}s
          </span>
        </div>
      </div>
    </div>
  );
};

export default CountdownTimer;
