'use client';

import { useState, useEffect } from 'react';

export function useAuth() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    console.log('🔐 [useAuth] useEffect started');

    const checkAuth = async () => {
      try {
        console.log('🔐 [useAuth] Fetching /api/auth/me...');
        
        const response = await fetch('/api/auth/me', {
          credentials: 'include',
        });

        console.log('🔐 [useAuth] Response:', response.status);

        if (!isMounted) return;

        if (response.ok) {
          const data = await response.json();
          console.log('✅ [useAuth] Data received:', data);
          
          // ✅ CORRECTION : Extraire data.user si la structure l'inclut
          const userData = data.user || data;
          console.log('✅ [useAuth] User data:', userData);
          
          if (isMounted) {
            setUser(userData);
          }
        } else {
          console.log('❌ [useAuth] Response not OK');
          if (isMounted) {
            setUser(null);
          }
        }
      } catch (error) {
        console.error('❌ [useAuth] Error:', error);
        if (isMounted) {
          setUser(null);
        }
      } finally {
        console.log('🔐 [useAuth] Setting loading=false');
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    checkAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  return { user, loading };
}