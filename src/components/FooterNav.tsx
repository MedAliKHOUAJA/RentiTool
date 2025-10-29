"use client";

import {
  MagnifyingGlassIcon,
  UserCircleIcon,
  HomeIcon,
  PlusCircleIcon,
  ClipboardDocumentListIcon,
} from "@heroicons/react/24/outline";
import React, { useEffect, useRef } from "react";
import { PathName } from "@/routers/types";
import Link from "next/link";
import { usePathname } from "next/navigation";
import isInViewport from "@/utils/isInViewport";
import { Route } from "next/types";

let WIN_PREV_POSITION = 0;
if (typeof window !== "undefined") {
  WIN_PREV_POSITION = window.pageYOffset;
}

interface NavItem {
  name: string;
  link?: PathName;
  icon: any;
  isCentral?: boolean;
}

const NAV: NavItem[] = [
  {
    name: "Outils",
    link: "/tools",
    icon: MagnifyingGlassIcon,
  },
  {
    name: "Locations",
    link: "/account/rentals" as PathName,
    icon: ClipboardDocumentListIcon,
  },
  {
    name: "Home",
    link: "/",
    icon: HomeIcon,
    isCentral: true,
  },
  {
    name: "Ajouter",
    link: "/add-listing" as PathName ,
    icon: PlusCircleIcon,
  },
  {
    name: "Compte",
    link: "/account/profile",
    icon: UserCircleIcon,
  },
];

const FooterNav = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.addEventListener("scroll", handleEvent);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("scroll", handleEvent);
      }
    };
  }, []);

  const handleEvent = () => {
    if (typeof window !== "undefined") {
      window.requestAnimationFrame(showHideHeaderMenu);
    }
  };

  const showHideHeaderMenu = () => {
    let currentScrollPos = window.pageYOffset;
    if (!containerRef.current) return;

    if (currentScrollPos > WIN_PREV_POSITION) {
      if (
        isInViewport(containerRef.current) &&
        currentScrollPos - WIN_PREV_POSITION < 80
      ) {
        return;
      }
      containerRef.current.classList.add("FooterNav--hide");
    } else {
      if (
        !isInViewport(containerRef.current) &&
        WIN_PREV_POSITION - currentScrollPos < 80
      ) {
        return;
      }
      containerRef.current.classList.remove("FooterNav--hide");
    }

    WIN_PREV_POSITION = currentScrollPos;
  };

  const renderItem = (item: NavItem, index: number) => {
    const isActive = pathname === item.link;

    if (item.isCentral) {
      return (
        <Link
          key={index}
          href={item.link || "/"}
          className={`flex items-center justify-center w-16 h-16 rounded-full bg-primary-600 text-white shadow-lg transform -translate-y-1/2`}
        >
          <item.icon className="w-8 h-8" />
        </Link>
      );
    }

    return (
      <Link
        key={index}
        href={item.link || "/"}
        className={`flex flex-col items-center justify-center text-neutral-500 dark:text-neutral-300/90 ${
          isActive ? "text-primary-600 dark:text-primary-400" : ""
        }`}
      >
        <item.icon className={`w-6 h-6`} />
        <span className="text-[11px] leading-none mt-1">{item.name}</span>
      </Link>
    );
  };

  return (
    <div
      ref={containerRef}
      className="FooterNav block md:!hidden bg-white dark:bg-neutral-800 fixed bottom-0 inset-x-0 z-30 border-t border-neutral-300 dark:border-neutral-700 transition-transform duration-300 ease-in-out"
    >
      <div className="w-full max-w-lg flex justify-around items-center mx-auto text-sm text-center ">
        {NAV.map(renderItem)}
      </div>
    </div>
  );
};

export default FooterNav;