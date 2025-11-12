'use client';

import { useState } from 'react';
import { MagnifyingGlassIcon, Bars3Icon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import NotificationBell from '@/features/notifications/presentation/components/NotificationBell';
import { useAuth } from '@/hooks/useAuth';
import MobileMenu from './MobileMenu';

export default function MobileHeader() {
  const [searchQuery, setSearchQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/listing-tool?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <>
      <div className="lg:hidden sticky top-0 z-40 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-700 shadow-sm">
        {/* Ligne unique avec menu, notif, search */}
        <div className="flex items-center gap-3 px-4 py-3">
          {/* Menu Burger - GAUCHE */}
          <button
            onClick={() => setMenuOpen(true)}
            className="p-2 -ml-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition flex-shrink-0"
            aria-label="Menu"
          >
            <Bars3Icon className="w-6 h-6 text-neutral-700 dark:text-neutral-300" />
          </button>

          {/* Search Bar - CENTRE (flex-1) */}
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher un outil..."
                className="w-full pl-10 pr-4 py-2 text-sm bg-neutral-100 dark:bg-neutral-800 border-0 rounded-full focus:ring-2 focus:ring-primary-500 focus:outline-none transition"
              />
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            </div>
          </form>

          {/* Notifications - DROITE (si connecté) */}
          {user && (
            <NotificationBell className="flex-shrink-0" />
          )}
        </div>
      </div>

      {/* Drawer Menu */}
      <MobileMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}