"use client";

import React from 'react';
import { useWindowSize } from '@/app/ClientCommons';
import { Tool } from '@/features/tools/domain/tool';
import ToolCard from '@/components/Cards/ToolCard';


interface FeaturedToolsProps {
  tools: Tool[];
}

const FeaturedTools: React.FC<FeaturedToolsProps> = ({ tools }) => {
  const { width } = useWindowSize();

  const toolsToShow = width < 768 ? tools.slice(0, 4) : tools;

  return (
    <div className="grid gap-6 md:gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {toolsToShow.length > 0 ? (
        toolsToShow.map((tool) => (
          <ToolCard key={tool.toolId} data={tool} />
        ))
      ) : (
        <p>Aucun outil à afficher pour le moment.</p>
      )}
    </div>
  );
};

export default FeaturedTools;