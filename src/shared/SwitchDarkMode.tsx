"use client";

import React, { useState, useEffect } from "react";
import { MoonIcon } from "@heroicons/react/24/solid";
import { SunIcon } from "@heroicons/react/24/outline";
import { useThemeMode } from "@/utils/useThemeMode";

export interface SwitchDarkModeProps {
  className?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const SwitchDarkMode: React.FC<SwitchDarkModeProps> = ({ 
  className = "", 
  showLabel = false,
  size = 'md' 
}) => {
  const { _toogleDarkMode, isDarkMode, resetToSystem } = useThemeMode();
  const [isAnimating, setIsAnimating] = useState(false);

  const sizeClasses = {
    sm: 'w-10 h-10 text-xl',
    md: 'w-12 h-12 text-2xl',
    lg: 'w-14 h-14 text-3xl'
  };

  const iconSizes = {
    sm: 'w-5 h-5',
    md: 'w-7 h-7',
    lg: 'w-8 h-8'
  };

  const handleClick = () => {
    setIsAnimating(true);
    _toogleDarkMode();
    setTimeout(() => setIsAnimating(false), 300);
  };

  const getThemeLabel = () => {
    if (isDarkMode) return "Mode sombre activé";
    return "Mode clair activé";
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleClick}
        className={`
          self-center ${sizeClasses[size]} rounded-full 
          text-neutral-700 dark:text-neutral-300 
          hover:bg-neutral-100 dark:hover:bg-neutral-800 
          focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 
          dark:focus:ring-offset-neutral-900
          flex items-center justify-center 
          transition-all duration-300 ease-in-out
          transform hover:scale-110 active:scale-95
          ${isAnimating ? 'rotate-180' : ''}
          ${className}
        `}
        title={getThemeLabel()}
        aria-label={getThemeLabel()}
      >
        <span className="sr-only">{getThemeLabel()}</span>
        {isDarkMode ? (
          <MoonIcon className={`${iconSizes[size]} transition-transform duration-300`} aria-hidden="true" />
        ) : (
          <SunIcon className={`${iconSizes[size]} transition-transform duration-300`} aria-hidden="true" />
        )}
      </button>
      
      {showLabel && (
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
            {isDarkMode ? 'Mode Sombre' : 'Mode Clair'}
          </span>
          <button
            onClick={resetToSystem}
            className="text-xs text-neutral-500 dark:text-neutral-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
          >
            Réinitialiser
          </button>
        </div>
      )}
    </div>
  );
};

export default SwitchDarkMode;
