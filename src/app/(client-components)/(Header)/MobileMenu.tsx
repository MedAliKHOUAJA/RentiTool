'use client';

import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { 
  XMarkIcon, 
  UserCircleIcon, 
  WrenchScrewdriverIcon, 
  HeartIcon, 
  Cog6ToothIcon, 
  ArrowRightOnRectangleIcon,
  ClipboardDocumentListIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import Avatar from '@/shared/Avatar';
import SwitchDarkMode2 from '@/shared/SwitchDarkMode2';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileMenu({ isOpen, onClose }: Props) {
  const { user, loading } = useAuth();

  const getInitials = () => {
    if (!user) return 'U';
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    return 'U';
  };

  const menuItems = [
    { name: 'Mon compte', href: '/account/profile', icon: UserCircleIcon },
    { name: 'Mes outils', href: '/tools-management', icon: WrenchScrewdriverIcon },
    { name: 'Mes réservations', href: '/my-rentals', icon: ClipboardDocumentListIcon },
    { name: 'Messages', href: '/account-messages', icon: ChatBubbleLeftRightIcon },
    { name: 'Favoris', href: '/account-savelists', icon: HeartIcon },
    { name: 'Paramètres', href: '/account/settings', icon: Cog6ToothIcon },
  ];

  const handleLogout = async () => {
    onClose();
    setTimeout(() => {
      window.location.href = '/login';
    }, 100);
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        {/* Backdrop */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
        </Transition.Child>

        {/* Drawer Container */}
        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            {/* ✅ CORRECTION : left-0 pour slide depuis la GAUCHE */}
            <div className="pointer-events-none fixed inset-y-0 left-0 flex max-w-full pr-10">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-300"
                enterFrom="-translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-300"
                leaveFrom="translate-x-0"
                leaveTo="-translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto w-screen max-w-sm">
                  <div className="flex h-full flex-col bg-white dark:bg-neutral-900 shadow-xl">
                    {/* Header */}
                    <div className="px-6 py-6 border-b border-neutral-200 dark:border-neutral-700">
                      <div className="flex items-center justify-between mb-4">
                        <Dialog.Title className="text-lg font-semibold">
                          Menu
                        </Dialog.Title>
                        <button
                          onClick={onClose}
                          className="rounded-full p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
                        >
                          <XMarkIcon className="h-6 w-6" />
                        </button>
                      </div>

                      {/* User Info */}
                      {user ? (
                        <div className="flex items-center gap-3">
                          {user.profilePictureUrl ? (
                            <Avatar
                              imgUrl={user.profilePictureUrl}
                              sizeClass="w-14 h-14"
                              userName={`${user.firstName} ${user.lastName}`}
                            />
                          ) : (
                            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 text-white flex items-center justify-center font-semibold text-lg">
                              {getInitials()}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-base truncate">
                              {user.firstName} {user.lastName}
                            </p>
                            <p className="text-sm text-neutral-500 dark:text-neutral-400 truncate">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <p className="text-neutral-500 dark:text-neutral-400 mb-3">
                            Connectez-vous pour accéder à toutes les fonctionnalités
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Menu Items */}
                    <div className="flex-1 overflow-y-auto p-4">
                      {user ? (
                        <nav className="space-y-1">
                          {menuItems.map((item) => (
                            <Link
                              key={item.name}
                              href={item.href}
                              onClick={onClose}
                              className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition group"
                            >
                              <item.icon className="w-6 h-6 text-neutral-500 dark:text-neutral-400 group-hover:text-primary-600 dark:group-hover:text-primary-500 transition" />
                              <span className="font-medium">{item.name}</span>
                            </Link>
                          ))}
                        </nav>
                      ) : (
                        <div className="space-y-3">
                          <Link
                            href="/login"
                            onClick={onClose}
                            className="flex items-center justify-center gap-2 px-4 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition font-medium"
                          >
                            Se connecter
                          </Link>
                          <Link
                            href="/signup"
                            onClick={onClose}
                            className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-primary-600 text-primary-600 dark:text-primary-400 rounded-xl hover:bg-primary-50 dark:hover:bg-primary-900/20 transition font-medium"
                          >
                            Créer un compte
                          </Link>
                        </div>
                      )}

                      {/* Dark Mode Toggle */}
                      <div className="mt-6 px-4 py-4 border-t border-neutral-200 dark:border-neutral-700">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Mode sombre</span>
                          </div>
                          <SwitchDarkMode2 />
                        </div>
                      </div>
                    </div>

                    {/* Footer - Logout */}
                    {user && (
                      <div className="border-t border-neutral-200 dark:border-neutral-700 p-4">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center justify-center gap-2 px-4 py-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition font-medium"
                        >
                          <ArrowRightOnRectangleIcon className="w-5 h-5" />
                          <span>Déconnexion</span>
                        </button>
                      </div>
                    )}
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}