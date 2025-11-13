import { useEffect, useCallback } from "react";
import { createGlobalState } from "react-hooks-global-state";

const initialState = { isDarkmode: false };
const { useGlobalState } = createGlobalState(initialState);

export const useThemeMode = () => {
  const [isDarkMode, setIsDarkMode] = useGlobalState("isDarkmode");

  useEffect(() => {
    // Détecter la préférence système
    const detectSystemTheme = () => {
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
      return 'light';
    };

    // Appliquer le thème sauvegardé ou le thème système par défaut
    // Utiliser un petit délai pour éviter les problèmes d'hydratation
    const timeoutId = setTimeout(() => {
      const savedTheme = localStorage.theme;
      const themeToApply = savedTheme || detectSystemTheme();
      
      if (themeToApply === "dark") {
        toDark();
      } else {
        toLight();
      }
    }, 0); // Délais minimal pour s'assurer que le DOM est prêt

    // Écouter les changements de préférence système
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      if (!localStorage.theme) { // Ne pas écraser la préférence utilisateur
        if (e.matches) {
          toDark();
        } else {
          toLight();
        }
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
      clearTimeout(timeoutId); // Nettoyer le timeout
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toDark = useCallback(() => {
    setIsDarkMode(true);
    const root = document.documentElement;
    if (!root) return;
    
    // Ajouter une transition fluide
    root.style.transition = 'background-color 0.3s ease, color 0.3s ease';
    
    if (!root.classList.contains("dark")) {
      root.classList.add("dark");
    }
    
    localStorage.theme = "dark";
    
    // Mettre à jour les métadonnées du thème
    updateThemeMetadata('dark');
  }, [setIsDarkMode]);

  const toLight = useCallback(() => {
    setIsDarkMode(false);
    const root = document.documentElement;
    if (!root) return;
    
    // Ajouter une transition fluide
    root.style.transition = 'background-color 0.3s ease, color 0.3s ease';
    
    root.classList.remove("dark");
    localStorage.theme = "light";
    
    // Mettre à jour les métadonnées du thème
    updateThemeMetadata('light');
  }, [setIsDarkMode]);

  const _toogleDarkMode = useCallback(() => {
    if (isDarkMode) {
      toLight();
    } else {
      toDark();
    }
  }, [isDarkMode, toDark, toLight]);

  const resetToSystem = useCallback(() => {
    localStorage.removeItem('theme');
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    
    if (systemTheme === 'dark') {
      toDark();
    } else {
      toLight();
    }
  }, [toDark, toLight]);

  return {
    isDarkMode,
    toDark,
    toLight,
    _toogleDarkMode,
    resetToSystem,
  };
};

// Fonction utilitaire pour mettre à jour les métadonnées du thème
const updateThemeMetadata = (theme: 'light' | 'dark') => {
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  const metaColorScheme = document.querySelector('meta[name="color-scheme"]');
  
  if (metaThemeColor) {
    metaThemeColor.setAttribute('content', theme === 'dark' ? '#0f172a' : '#ffffff');
  }
  
  if (metaColorScheme) {
    metaColorScheme.setAttribute('content', theme);
  }
};
