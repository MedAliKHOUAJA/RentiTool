'use client';

import React, { FC } from "react";
import Logo from "@/shared/Logo";
import Navigation from "@/shared/Navigation/Navigation";
import SearchDropdown from "./SearchDropdown";
import ButtonPrimary from "@/shared/ButtonPrimary";
import SwitchDarkMode from "@/shared/SwitchDarkMode";
import { useAuth } from "@/hooks/useAuth";
import AvatarDropdown from "./AvatarDropdown";
import NotificationBell from "@/features/notifications/presentation/components/NotificationBell";
import MobileHeader from "./MobileHeader"; 

export interface MainNav1Props {
  className?: string;
}

const MainNav1: FC<MainNav1Props> = ({ className = "" }) => {
  const { user, loading } = useAuth();

  return (
    <>
      {/* ✅ Desktop Navigation */}
      <div className={`nc-MainNav1 relative z-10 hidden lg:block ${className}`}>
        <div className="px-4 lg:container h-20 relative flex justify-between">
          <div className="hidden md:flex justify-start flex-1 space-x-4 sm:space-x-10">
            <Logo className="w-24 self-center" />
            <Navigation />
          </div>

          <div className="hidden md:flex flex-shrink-0 justify-end flex-1 lg:flex-none text-neutral-700 dark:text-neutral-100">
            <div className="hidden xl:flex space-x-0.5">
              <SwitchDarkMode />
              <SearchDropdown className="flex items-center" />
              <div className="px-1" />
              
              {!loading && (
                <>
                  {user ? (
                    <>
                      <NotificationBell className="self-center" />
                      <div className="px-1" />
                      <AvatarDropdown />
                    </>
                  ) : (
                    <>
                      <ButtonPrimary className="self-center" href="/login">
                        Login
                      </ButtonPrimary>
                      <div className="px-1" />
                      <ButtonPrimary className="self-center" href="/signup">
                        Sign up
                      </ButtonPrimary>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ✅ Mobile Header (simple) */}
      <MobileHeader />
    </>
  );
};

export default MainNav1;
