'use client';

import { usePathname, useRouter } from 'next/navigation';
import { 
  HomeIcon, 
  WrenchScrewdriverIcon, 
  MapPinIcon, 
  PlusCircleIcon, 
  UserCircleIcon 
} from '@heroicons/react/24/outline';
import { 
  HomeIcon as HomeIconSolid, 
  WrenchScrewdriverIcon as WrenchSolid, 
  MapPinIcon as MapPinSolid, 
  PlusCircleIcon as PlusCircleSolid, 
  UserCircleIcon as UserCircleSolid 
} from '@heroicons/react/24/solid';
import { useAuth } from '@/hooks/useAuth';

export default function MobileBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();

  const navItems = [
    {
      name: 'Outils',
      path: '/listing-tool',
      icon: WrenchScrewdriverIcon,
      iconSolid: WrenchSolid,
    },
    {
      name: 'Lieux',
      path: '/locations',
      icon: MapPinIcon,
      iconSolid: MapPinSolid,
    },
    {
      name: 'Home',
      path: '/home',
      icon: HomeIcon,
      iconSolid: HomeIconSolid,
      isHome: true,
    },
    {
      name: 'Ajouter',
      path: user ? '/tools-management?tab=add' : '/login',
      icon: PlusCircleIcon,
      iconSolid: PlusCircleSolid,
      requireAuth: true,
    },
    {
      name: 'Compte',
      path: user ? '/account/profile' : '/login',
      icon: UserCircleIcon,
      iconSolid: UserCircleSolid,
    },
  ];

  const handleNavClick = (path: string) => {
    router.push(path);
  };

  const isActive = (item: typeof navItems[0]) => {
    if (item.isHome) return pathname === '/';
    return pathname.startsWith(item.path.split('?')[0]);
  };

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-700 shadow-lg">
      <div className="grid grid-cols-5 h-16">
        {navItems.map((item) => {
          const active = isActive(item);
          const Icon = active ? item.iconSolid : item.icon;

          return (
            <button
              key={item.name}
              onClick={() => handleNavClick(item.path)}
              className={`
                flex flex-col items-center justify-center gap-1
                transition-all duration-200
                ${active 
                  ? 'text-primary-600 dark:text-primary-500 scale-105' 
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
                }
              `}
            >
              <Icon className="w-6 h-6" />
              <span className={`text-xs font-medium ${active ? 'font-semibold' : ''}`}>
                {item.name}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}