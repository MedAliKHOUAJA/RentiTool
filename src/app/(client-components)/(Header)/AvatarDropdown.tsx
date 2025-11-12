"use client";

import { Popover, Transition } from "@headlessui/react";
import { Fragment, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Avatar from "@/shared/Avatar";
import SwitchDarkMode2 from "@/shared/SwitchDarkMode2";
import { PathName } from "@/routers/types";
import Link from "next/link";
import { Route } from "next";
import { useAuth } from "@/hooks/useAuth";

interface Props {
  className?: string;
}

export default function AvatarDropdown({ className = "" }: Props) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname(); // ✅ AJOUTÉ

  useEffect(() => {
  }, [pathname]);

  const handleLogout = async (close: () => void) => {
    try {
     // await logout();
      close(); // ✅ Fermer avant de naviguer
      
      // ✅ Attendre un tick avant de naviguer
      setTimeout(() => {
        window.location.href = "/login";
      }, 100);
    } catch (error) {
      console.error("Logout error:", error);
      alert("Erreur lors de la déconnexion");
    }
  };

  if (loading) {
    return (
      <div className={`AvatarDropdown relative flex ${className}`}>
        <div className="self-center w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-neutral-200 dark:bg-neutral-700 animate-pulse" />
      </div>
    );
  }

  if (!user) {
    return (
      <Link
        href="/login"
        className={`self-center px-4 py-2 rounded-full bg-primary-600 text-white hover:bg-primary-700 transition ${className}`}
      >
        Se connecter
      </Link>
    );
  }

  const getInitials = () => {
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    return "U";
  };

  const getFullName = () => {
    return `${user.firstName} ${user.lastName}`;
  };

  const getLocation = () => {
    return user.locationName || "Location non définie";
  };

  const getRoleBadge = () => {
    const roleMap: Record<number, { label: string; color: string }> = {
      1: { label: 'Admin', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
      2: { label: 'Owner', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
      3: { label: 'Renter', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
    };
    
    const role = roleMap[user.roleId] || { label: 'User', color: 'bg-gray-100 text-gray-800' };
    
    return (
      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${role.color}`}>
        {role.label}
      </span>
    );
  };

  const UserAvatar = ({ sizeClass }: { sizeClass: string }) => {
    if (user.profilePictureUrl) {
      return (
        <Avatar 
          imgUrl={user.profilePictureUrl} 
          sizeClass={sizeClass}
          userName={getFullName()}
        />
      );
    }
    
    return (
      <div className={`${sizeClass} rounded-full bg-gradient-to-br from-primary-500 to-primary-700 text-white flex items-center justify-center font-semibold shadow-lg`}>
        {getInitials()}
      </div>
    );
  };

  return (
    <Popover className={`AvatarDropdown relative flex ${className}`}>
      {({ open, close }) => (
        <>
          <Popover.Button
            className={`self-center w-10 h-10 sm:w-12 sm:h-12 rounded-full text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none flex items-center justify-center transition-all hover:scale-105`}
          >
            <UserAvatar sizeClass="w-8 h-8 sm:w-9 sm:h-9" />
          </Popover.Button>
          
          <Transition
            as={Fragment}
            enter="transition ease-out duration-200"
            enterFrom="opacity-0 translate-y-1"
            enterTo="opacity-100 translate-y-0"
            leave="transition ease-in duration-150"
            leaveFrom="opacity-100 translate-y-0"
            leaveTo="opacity-0 translate-y-1"
          >
                         <Popover.Panel className="absolute z-10 w-screen max-w-[280px] px-4 top-full -right-10 sm:right-0 sm:px-0">
                <div className="overflow-hidden rounded-3xl shadow-lg ring-1 ring-black ring-opacity-5">
                  <div className="relative grid grid-cols-1 gap-6 bg-white dark:bg-neutral-800 py-7 px-6">
                    {/* ✅ En-tête avec infos utilisateur */}
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-full bg-primary-600 text-white flex items-center justify-center font-semibold text-lg flex-shrink-0">
                        {getInitials()}
                      </div>

                      <div className="flex-grow overflow-hidden">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold truncate">
                            {getFullName()}
                          </h4>
                          {getRoleBadge()}
                        </div>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                          📍 {getLocation()}
                        </p>
                        {user.starRating !== undefined && user.starRating > 0 && (
                          <p className="text-xs text-yellow-600 dark:text-yellow-500 mt-0.5">
                            ⭐ {user.starRating.toFixed(1)} / 5.0
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="w-full border-b border-neutral-200 dark:border-neutral-700" />

                    {/* ✅ Mon compte */}
                    <Link
                      href={"/account/profile" as PathName}
                      className="flex items-center p-2 -m-3 transition duration-150 ease-in-out rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 focus:outline-none"
                      onClick={() => close()}
                    >
                      <div className="flex items-center justify-center flex-shrink-0 text-neutral-500 dark:text-neutral-300">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                          <path
                            d="M12.1601 10.87C12.0601 10.86 11.9401 10.86 11.8301 10.87C9.45006 10.79 7.56006 8.84 7.56006 6.44C7.56006 3.99 9.54006 2 12.0001 2C14.4501 2 16.4401 3.99 16.4401 6.44C16.4301 8.84 14.5401 10.79 12.1601 10.87Z"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M7.15997 14.56C4.73997 16.18 4.73997 18.82 7.15997 20.43C9.90997 22.27 14.42 22.27 17.17 20.43C19.59 18.81 19.59 16.17 17.17 14.56C14.43 12.73 9.91997 12.73 7.15997 14.56Z"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium">Mon compte</p>
                      </div>
                    </Link>

                    {/* ✅ Mes réservations */}
                    <Link
                      href={"/my-rentals" as PathName}
                      className="flex items-center p-2 -m-3 transition duration-150 ease-in-out rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 focus:outline-none"
                      onClick={() => close()}
                    >
                      <div className="flex items-center justify-center flex-shrink-0 text-neutral-500 dark:text-neutral-300">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                          <path d="M8 12.2H15" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M8 16.2H12.38" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M10 6H14C16 6 16 5 16 4C16 2 15 2 14 2H10C9 2 8 2 8 4C8 6 9 6 10 6Z" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M16 4.02002C19.33 4.20002 21 5.43002 21 10V16C21 20 20 22 15 22H9C4 22 3 20 3 16V10C3 5.44002 4.67 4.20002 8 4.02002" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium">Mes réservations</p>
                      </div>
                    </Link>

                    {/* ✅ Gérer mes outils (uniquement pour Owner ou Admin) */}
                    {(user.roleId === 1 || user.roleId === 2) && (
                      <Link
                        href={"/tools-management" as Route}
                        className="flex items-center p-2 -m-3 transition duration-150 ease-in-out rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 focus:outline-none"
                        onClick={() => close()}
                      >
                        <div className="flex items-center justify-center flex-shrink-0 text-neutral-500 dark:text-neutral-300">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path d="M9.5 13.75C9.5 14.72 10.25 15.5 11.17 15.5H13.05C13.85 15.5 14.5 14.82 14.5 13.97C14.5 13.06 14.1 12.73 13.51 12.52L10.5 11.47C9.91 11.26 9.51001 10.94 9.51001 10.02C9.51001 9.17999 10.16 8.48999 10.96 8.48999H12.84C13.76 8.48999 14.51 9.26999 14.51 10.24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M12 7.5V16.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M22 12C22 17.52 17.52 22 12 22C6.48 22 2 17.52 2 12C2 6.48 6.48 2 12 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M17 3V7H21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M22 2L17 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium">Gérer mes outils</p>
                        </div>
                      </Link>
                    )}

                    {/* ✅ Wishlist */}
                    <Link
                      href={"/account-savelists" as Route}
                      className="flex items-center p-2 -m-3 transition duration-150 ease-in-out rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 focus:outline-none"
                      onClick={() => close()}
                    >
                      <div className="flex items-center justify-center flex-shrink-0 text-neutral-500 dark:text-neutral-300">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                          <path d="M12.62 20.81C12.28 20.93 11.72 20.93 11.38 20.81C8.48 19.82 2 15.69 2 8.68998C2 5.59998 4.49 3.09998 7.56 3.09998C9.38 3.09998 10.99 3.97998 12 5.33998C13.01 3.97998 14.63 3.09998 16.44 3.09998C19.51 3.09998 22 5.59998 22 8.68998C22 15.69 15.52 19.82 12.62 20.81Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium">Favoris</p>
                      </div>
                    </Link>

                    <div className="w-full border-b border-neutral-200 dark:border-neutral-700" />

                    {/* ✅ Dark mode toggle */}
                    <div className="flex items-center justify-between p-2 -m-3 transition duration-150 ease-in-out rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700">
                      <div className="flex items-center">
                        <div className="flex items-center justify-center flex-shrink-0 text-neutral-500 dark:text-neutral-300">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path d="M12.0001 7.88989L10.9301 9.74989C10.6901 10.1599 10.8901 10.4999 11.3601 10.4999H12.6301C13.1101 10.4999 13.3001 10.8399 13.0601 11.2499L12.0001 13.1099" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M8.30011 18.0399V16.8799C6.00011 15.4899 4.11011 12.7799 4.11011 9.89993C4.11011 4.94993 8.66011 1.06993 13.8001 2.18993C16.0601 2.68993 18.0401 4.18993 19.0701 6.25993C21.1601 10.4599 18.9601 14.9199 15.7301 16.8699V18.0299C15.7301 18.3199 15.8401 18.9899 14.7701 18.9899H9.26011C8.16011 18.9999 8.30011 18.5699 8.30011 18.0399Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M8.5 22C10.79 21.35 13.21 21.35 15.5 22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium">Mode sombre</p>
                        </div>
                      </div>
                      <SwitchDarkMode2 />
                    </div>

                    {/* ✅ Aide */}
                    <Link
                      href={"/#" as PathName}
                      className="flex items-center p-2 -m-3 transition duration-150 ease-in-out rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 focus:outline-none"
                      onClick={() => close()}
                    >
                      <div className="flex items-center justify-center flex-shrink-0 text-neutral-500 dark:text-neutral-300">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                          <path d="M11.97 22C17.4928 22 21.97 17.5228 21.97 12C21.97 6.47715 17.4928 2 11.97 2C6.44715 2 1.97 6.47715 1.97 12C1.97 17.5228 6.44715 22 11.97 22Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M12 16.5C14.4853 16.5 16.5 14.4853 16.5 12C16.5 9.51472 14.4853 7.5 12 7.5C9.51472 7.5 7.5 9.51472 7.5 12C7.5 14.4853 9.51472 16.5 12 16.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M4.89999 4.92993L8.43999 8.45993" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M4.89999 19.07L8.43999 15.54" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M19.05 19.07L15.51 15.54" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M19.05 4.92993L15.51 8.45993" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium">Aide</p>
                      </div>
                    </Link>

                    {/* ✅ Déconnexion */}
                    <button
                      onClick={() => handleLogout(close)}
                      className="flex items-center p-2 -m-3 transition duration-150 ease-in-out rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 focus:outline-none text-red-600 dark:text-red-400"
                    >
                      <div className="flex items-center justify-center flex-shrink-0">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                          <path d="M8.90002 7.55999C9.21002 3.95999 11.06 2.48999 15.11 2.48999H15.24C19.71 2.48999 21.5 4.27999 21.5 8.74999V15.27C21.5 19.74 19.71 21.53 15.24 21.53H15.11C11.09 21.53 9.24002 20.08 8.91002 16.54" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M15 12H3.62" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M5.85 8.6499L2.5 11.9999L5.85 15.3499" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium">Déconnexion</p>
                      </div>
                    </button>
                  </div>
                </div>
              </Popover.Panel>
          </Transition>
        </>
      )}
    </Popover>
  );
}