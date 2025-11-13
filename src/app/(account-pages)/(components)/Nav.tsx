"use client";

import { Route } from "@/routers/types";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

export const Nav = () => {
  const pathname = usePathname();

  const listNav: Route[] = [
    "/account/profile" as Route,
    "/account/cards" as Route,
    "/account-password" as Route,
    "/tools-management" as Route,
    "/reviews" as Route,
    "/reviews/about-me" as Route,
    "/my-rentals" as Route,
    "/my-payments" as Route,
  ];

  const getLabel = (item: Route) => {
    switch (item) {
      case "/account/profile":
        return "Mon profil";
      case "/account/cards":
        return "Mes cartes de visite";
      case "/reviews":
        return "Avis sur mes outils";
      case "/reviews/about-me":
        return "Avis sur moi";
      case "/account-password":
        return "Mot de passe";
      case "/tools-management":
        return "Gestion des outils";
      case "/my-rentals":
        return "Mes locations";
      case "/my-payments":
        return "Mes paiements";
      default:
        return item.replace("-", " ").replace("/", " ");
    }
  };

  return (
    <div className="container">
      {/* Conteneur principal avec overflow-x-auto MAIS scrollbar caché */}
      <div className="w-full overflow-x-auto pb-1">
        {/* Masquage du scrollbar pour tous les navigateurs */}
        <style jsx>{`
          .hidden-scrollbar::-webkit-scrollbar {
            display: none;
          }
          .hidden-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}</style>

        {/* Navigation horizontale */}
        <div className="flex flex-nowrap space-x-6 md:space-x-8 py-3 px-4 md:px-6 hidden-scrollbar">
          {listNav.map((item) => {
            const isActive = pathname === item;
            return (
              <Link
                key={item}
                href={item}
                className={`block py-2 md:py-4 border-b-2 flex-shrink-0 whitespace-nowrap text-sm md:text-base font-medium transition-all duration-200 ${
                  isActive
                    ? "border-primary-500 text-primary-500"
                    : "border-transparent text-gray-300 hover:text-white"
                }`}
              >
                {getLabel(item)}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};