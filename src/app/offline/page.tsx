'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function OfflinePage() {
  const router = useRouter();
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    // Check online status
    const handleOnline = () => {
      setIsOnline(true);
      // Automatically redirect when back online
      setTimeout(() => {
        router.back();
      }, 1000);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    // Set initial state
    setIsOnline(navigator.onLine);

    // Listen for online/offline events
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="text-center max-w-md">
        {isOnline ? (
          // Back online
          <div className="animate-fade-in">
            <div className="mb-6">
              <svg 
                className="w-24 h-24 mx-auto text-green-500" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" 
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Vous êtes de retour en ligne !
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Redirection en cours...
            </p>
          </div>
        ) : (
          // Offline
          <div>
            <div className="mb-6">
              <svg 
                className="w-24 h-24 mx-auto text-gray-400" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829l-2.829-2.829m-4.243 2.829a4 4 0 010-5.656m0 0a4 4 0 015.656 0m-7.071 7.071l7.071-7.071" 
                />
              </svg>
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Vous êtes hors ligne
            </h1>
            
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Vérifiez votre connexion Internet pour accéder aux dernières données.
            </p>

            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">
                📱 Mode Hors Ligne
              </h3>
              <p className="text-sm text-blue-800 dark:text-blue-400">
                Vous pouvez toujours consulter vos cartes de visite et outils mis en cache. 
                Les nouvelles données seront synchronisées une fois la connexion rétablie.
              </p>
            </div>

            <button
              onClick={() => router.back()}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-lg"
            >
              Retour
            </button>

            <button
              onClick={() => window.location.reload()}
              className="mt-3 block w-full px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              Réessayer
            </button>
          </div>
        )}
      </div>
    </div>
  );
}