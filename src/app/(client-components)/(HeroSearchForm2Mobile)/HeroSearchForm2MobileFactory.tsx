"use client";

import React from "react";
import { PathName } from "@/routers/types";
import HeroSearchForm2Mobile from "./HeroSearchForm2Mobile";
import HeroSearchForm2RealEstateMobile from "./HeroSearchForm2RealEstateMobile";
import { usePathname } from "next/navigation";
import { Route } from "next";

const PAGES_REAL_ESTATE: PathName[] = [
  "/home-2" as Route,
  "/listing-real-estate " as Route , 
  "/listing-real-estate-map" as Route,
];

const HeroSearchForm2MobileFactory = () => {
  const pathname = usePathname();
  if (PAGES_REAL_ESTATE.includes(pathname as PathName)) {
    return <HeroSearchForm2RealEstateMobile />;
  }
  return <HeroSearchForm2Mobile />;
};

export default HeroSearchForm2MobileFactory;
