// src/app/(client-components)/(Header)/DashboardHeader.tsx
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardHeader() {
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (!response.ok) {
          router.push('/login');
          return;
        }
        const userData = await response.json();
        setUser(userData);
      } catch (error) {
        router.push('/login');
      }
    };

    checkAuth();
  }, [router]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  if (!user) {
    return null; // or a loading state
  }

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-gray-900">RentiTool</h1>
            <span className="ml-4 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
              Propriétaire
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-gray-700">Bonjour, {user.firstName} {user.lastName}</span>
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
