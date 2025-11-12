'use client';

import { useState } from 'react';
import { MagnifyingGlassIcon, Bars3Icon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import NotificationBell from '@/features/notifications/presentation/components/NotificationBell';
import { useAuth } from '@/hooks/useAuth';

interface Props {
  onMenuClick?: () => void;
}

export default function MobileTopBar({ onMenuClick }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();
  const { user } = useAuth();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/listing-tool?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-700 shadow-sm">
      {/* Ligne 1 : Menu (gauche) + Notifications (droite) */}
      <div className="flex items-center justify-between px-4 pt-3">
        {/* Menu Burger - GAUCHE */}
        <button
          onClick={onMenuClick}
          className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
          aria-label="Menu"
        >
          <Bars3Icon className="w-6 h-6 text-neutral-700 dark:text-neutral-300" />
        </button>

        {/* Notifications - DROITE (si connecté) */}
        {user && (
          <NotificationBell className="flex-shrink-0" />
        )}
      </div>

      {/* Ligne 2 : Search Bar */}
      <div className="px-4 pb-3 pt-2">
        <form onSubmit={handleSearch}>
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un outil..."
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-neutral-100 dark:bg-neutral-800 border-0 rounded-full focus:ring-2 focus:ring-primary-500 focus:outline-none transition"
            />
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
          </div>
        </form>
      </div>
    </div>
  );
}