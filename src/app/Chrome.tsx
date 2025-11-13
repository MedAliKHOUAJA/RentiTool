"use client";

import React from "react";
import { usePathname } from "next/navigation";
import SiteHeader from "./(client-components)/(Header)/SiteHeader";

interface ChromeProps {
  children: React.ReactNode;
}

// Rend conditionnellement le header et le footer selon la route courante
export default function Chrome({ children }: ChromeProps) {
  const pathname = usePathname();
  const hideChrome = pathname === "/login" || pathname === "/signup" || pathname === "/";

  if (hideChrome) {
    return <>{children}</>;
  }

  return (
    <>
      <SiteHeader />
      {children}
    </>
  );
}