"use client";

import React, { useState, useEffect } from "react";
import { MoonIcon, SunIcon, ComputerDesktopIcon } from "@heroicons/react/24/outline";
import { useThemeMode } from "@/utils/useThemeMode";

export interface ThemeSelectorProps {
  className?: string;
  variant?: 'dropdown' | 'buttons' | 'toggle';
  showLabels?: boolean;
}

type ThemeOption = 'light' | 'dark' | 'system';

const ThemeSelector: React.FC<ThemeSelectorProps> = ({ 
  className = "", 
  variant = 'toggle',
  showLabels = true 
}) => {
  const { isDarkMode, toDark, toLight, resetToSystem } = useThemeMode();
  const [currentTheme, setCurrentTheme] = useState<ThemeOption>('system');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.theme;
      if (savedTheme === 'dark') {
        setCurrentTheme('dark');
      } else if (savedTheme === 'light') {
        setCurrentTheme('light');
      } else {
        setCurrentTheme('system');
      }
    }
  }, []);

  const handleThemeChange = (theme: ThemeOption) => {
    setCurrentTheme(theme);
    setIsDropdownOpen(false);
    
    switch (theme) {
      case 'dark':
        toDark();
        break;
      case 'light':
        toLight();
        break;
      case 'system':
        resetToSystem();
        break;
    }
  };

  const getCurrentIcon = () => {
    switch (currentTheme) {
      case 'dark':
        return <MoonIcon className="w-5 h-5" />;
      case 'light':
        return <SunIcon className="w-5 h-5" />;
      case 'system':
        return <ComputerDesktopIcon className="w-5 h-5" />;
    }
  };

  const getCurrentLabel = () => {
    switch (currentTheme) {
      case 'dark':
        return 'Sombre';
      case 'light':
        return 'Clair';
      case 'system':
        return 'Système';
    }
  };

  if (variant === 'toggle') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <button
          onClick={() => handleThemeChange(currentTheme === 'light' ? 'dark' : 'light')}
          className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
        >
          {getCurrentIcon()}
        </button>
        {showLabels && (
          <span className="text-sm text-neutral-600 dark:text-neutral-400">
            {getCurrentLabel()}
          </span>
        )}
      </div>
    );
  }

  if (variant === 'buttons') {
    return (
      <div className={`flex gap-2 ${className}`}>
        <button
          onClick={() => handleThemeChange('light')}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
            currentTheme === 'light'
              ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
              : 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
          }`}
        >
          <SunIcon className="w-4 h-4" />
          {showLabels && <span className="text-sm">Clair</span>}
        </button>
        
        <button
          onClick={() => handleThemeChange('dark')}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
            currentTheme === 'dark'
              ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
              : 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
          }`}
        >
          <MoonIcon className="w-4 h-4" />
          {showLabels && <span className="text-sm">Sombre</span>}
        </button>
        
        <button
          onClick={() => handleThemeChange('system')}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
            currentTheme === 'system'
              ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
              : 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
          }`}
        >
          <ComputerDesktopIcon className="w-4 h-4" />
          {showLabels && <span className="text-sm">Système</span>}
        </button>
      </div>
    );
  }

  // Dropdown variant
  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
      >
        {getCurrentIcon()}
        {showLabels && <span className="text-sm">{getCurrentLabel()}</span>}
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {isDropdownOpen && (
        <div className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-neutral-800 rounded-lg shadow-lg border border-neutral-200 dark:border-neutral-700 z-50">
          <button
            onClick={() => handleThemeChange('light')}
            className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors first:rounded-t-lg last:rounded-b-lg"
          >
            <SunIcon className="w-5 h-5" />
            <div>
              <div className="text-sm font-medium">Clair</div>
              <div className="text-xs text-neutral-500">Thème lumineux</div>
            </div>
            {currentTheme === 'light' && (
              <div className="ml-auto w-2 h-2 bg-primary-500 rounded-full" />
            )}
          </button>
          
          <button
            onClick={() => handleThemeChange('dark')}
            className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors first:rounded-t-lg last:rounded-b-lg"
          >
            <MoonIcon className="w-5 h-5" />
            <div>
              <div className="text-sm font-medium">Sombre</div>
              <div className="text-xs text-neutral-500">Thème sombre</div>
            </div>
            {currentTheme === 'dark' && (
              <div className="ml-auto w-2 h-2 bg-primary-500 rounded-full" />
            )}
          </button>
          
          <button
            onClick={() => handleThemeChange('system')}
            className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors first:rounded-t-lg last:rounded-b-lg"
          >
            <ComputerDesktopIcon className="w-5 h-5" />
            <div>
              <div className="text-sm font-medium">Système</div>
              <div className="text-xs text-neutral-500">Utiliser les préférences système</div>
            </div>
            {currentTheme === 'system' && (
              <div className="ml-auto w-2 h-2 bg-primary-500 rounded-full" />
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default ThemeSelector;