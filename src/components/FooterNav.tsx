"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { 
  WrenchScrewdriverIcon,
  MapPinIcon,
  HomeIcon,
  PlusCircleIcon,
  UserCircleIcon
} from "@heroicons/react/24/outline";
import {
  WrenchScrewdriverIcon as WrenchSolid,
  MapPinIcon as MapPinSolid,
  HomeIcon as HomeIconSolid,
  PlusCircleIcon as PlusCircleSolid,
  UserCircleIcon as UserCircleSolid
} from "@heroicons/react/24/solid";
import { useAuth } from "@/hooks/useAuth";
import { PathName } from "@/routers/types";

export default function FooterNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  const navItems = [
    {
      name: "Outils",
      href:"/tools" ,
      icon: WrenchScrewdriverIcon,
      iconActive: WrenchSolid,
    },
    {
      name: "Lieux",
      href: "/account/rentals" as PathName,
      icon: MapPinIcon,
      iconActive: MapPinSolid,
    },
    {
      name: "Home",
      href:"/"  as PathName,
      icon: HomeIcon,
      iconActive: HomeIconSolid,
      isHome: true,
    },
    {
      name: "Ajouter",
      href: "/add-listing" as PathName ,
      icon: PlusCircleIcon,
      iconActive: PlusCircleSolid,
    },
    {
      name: "Compte",
      href: "/account/profile",
      icon: UserCircleIcon,
      iconActive: UserCircleSolid,
    },
  ];



  const isActive = (item: typeof navItems[0]) => {
    if (item.isHome) return pathname === "/";
    return pathname.startsWith(item.href.split('?')[0]);
  };

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-700 shadow-lg">
      <div className="grid grid-cols-5 h-16">
        {navItems.map((item) => {
          const active = isActive(item);
          const Icon = active ? item.iconActive : item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`
                flex flex-col items-center justify-center gap-1
                transition-all duration-200
                ${active 
                  ? "text-primary-600 dark:text-primary-500 scale-105" 
                  : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100"
                }
              `}
            >
              <Icon className="w-6 h-6" />
              <span className={`text-xs font-medium ${active ? "font-semibold" : ""}`}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}