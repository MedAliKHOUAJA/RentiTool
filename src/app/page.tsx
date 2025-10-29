import React from "react";
import ToolCard from "@/features/tools/presentation/components/ToolCard";
import BgGlassmorphism from "@/components/BgGlassmorphism";
import SectionGridCategoryBox from "@/components/SectionGridCategoryBox";
import { DEMO_TOOL_CATEGORIES } from "@/data/taxonomies";
import SectionHowItWork from "@/components/SectionHowItWork";
import SectionOurFeatures from "@/components/SectionOurFeatures";
import { ToolDataType } from "@/features/tools/presentation/tool.dto";

export const dynamic = 'force-dynamic';

async function getTools() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tools?limit=8`, { cache: 'no-store' });
    if (!res.ok) {
      return [];
    }
    return res.json();
  } catch (error) {
    console.error(error);
    return [];
  }
}

import FeaturedTools from "./(home)/FeaturedTools";

async function PageHome() {
  const tools: ToolDataType[] = await getTools();

  return (
    <main className="nc-PageHome relative overflow-hidden">
      <BgGlassmorphism />

      <div className="container relative space-y-24 mb-24 lg:space-y-28 lg:mb-28">
        {/* HERO SECTION */}
        <div className="relative pt-10 lg:pt-20 pb-16">
            <div className="flex flex-col items-center text-center">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-neutral-900 dark:text-neutral-50">Louez les outils dont vous avez besoin</h1>
                <p className="mt-4 text-lg text-neutral-6000 dark:text-neutral-300">La plateforme de location de matériel entre particuliers. Simple, rapide et local.</p>
                <div className="mt-8 w-full max-w-2xl">
                    {/* Search bar placeholder */}
                    <div className="relative">
                        <input type="text" placeholder="Rechercher un outil (ex: perceuse, tondeuse...)" className="w-full p-4 pr-12 rounded-full border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-jaune-industriel" />
                        <button className="absolute right-2 top-1/2 -translate-y-1/2 p-3 rounded-full bg-jaune-industriel text-bleu-nuit">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m1.35-5.65a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>

        {/* BROWSE BY CATEGORY SECTION */}
        <SectionGridCategoryBox 
            categories={DEMO_TOOL_CATEGORIES}
            heading="Parcourir par catégorie"
            subHeading="Trouvez l'outil parfait pour chaque type de projet"
        />

        {/* HOW IT WORKS SECTION */}
        <SectionHowItWork />

        {/* WHY CHOOSE RENTITOOL SECTION */}
        <SectionOurFeatures />

        {/* FEATURED TOOLS SECTION */}
        <div className="relative py-16">
            <div className="container">
                <div className="flex justify-between items-end mb-8">
                    <h2 className="text-3xl font-bold text-neutral-900 dark:text-neutral-50">Outils populaires</h2>
                    <a href="/tools" className="text-jaune-industriel font-semibold hover:underline">Voir tout</a>
                </div>
                <FeaturedTools tools={tools} />
            </div>
        </div>

      </div>
    </main>
  );
}

export default PageHome;