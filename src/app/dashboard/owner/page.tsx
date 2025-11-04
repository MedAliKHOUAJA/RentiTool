// src/app/dashboard/owner/page.tsx
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function OwnerDashboard() {
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    // Vérifier si l'utilisateur est connecté
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
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Card 1: Statistiques */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold">🏠</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Biens loués</dt>
                      <dd>
                        <div className="text-lg font-medium text-gray-900">12</div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Revenus */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold">💰</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Revenus mensuels</dt>
                      <dd>
                        <div className="text-lg font-medium text-gray-900">4,200 €</div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3: Locations actives */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold">📋</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Locations actives</dt>
                      <dd>
                        <div className="text-lg font-medium text-gray-900">8</div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Recent Activities */}
          <div className="mt-8 bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Dernières activités</h3>
              <div className="mt-4 space-y-4">
                <div className="flex items-center justify-between py-3 border-b">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Nouveau locataire</p>
                    <p className="text-sm text-gray-500">Appartement Paris 15e</p>
                  </div>
                  <span className="text-sm text-gray-500">Aujourd'hui</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Paiement reçu</p>
                    <p className="text-sm text-gray-500">Studio Lyon</p>
                  </div>
                  <span className="text-sm text-gray-500">Hier</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}