"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useThemeMode } from "@/utils/useThemeMode";

export function useWindowSize() {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    function handleResize() {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowSize;
}

const ClientCommons = () => {
  // Manual Service Worker Registration
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((registration) => {
            console.log("SW registered: ", registration);
          })
          .catch((registrationError) => {
            console.log("SW registration failed: ", registrationError);
          });
      });
    }
  }, []);

  //
  useThemeMode();

  const pathname = usePathname();
  //  CUSTOM THEME STYLE
  useEffect(() => {
    const $body = document.querySelector("body");
    if (!$body) return;

    let newBodyClass = "";

    if (pathname === "/home-3") {
      newBodyClass = "theme-purple-blueGrey";
    }
    if (pathname === "/home-2") {
      newBodyClass = "theme-cyan-blueGrey";
    }

    newBodyClass && $body.classList.add(newBodyClass);
    return () => {
      newBodyClass && $body.classList.remove(newBodyClass);
    };
  }, [pathname]);

  return <></>;
};

export default ClientCommons;