"use client";

import React, { useEffect, useState } from "react";
import { Tool } from "@/features/tools/domain/tool";
import ToolCard from "@/components/Cards/ToolCard";

const ToolsPage = () => {
  const [tools, setTools] = useState<Tool[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchTools = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/tools");
        if (!response.ok) {
          const msg = await response.text();
          throw new Error(msg || "Failed to fetch tools");
        }
        const data = await response.json();
        setTools(data.tools);
        setError(null);
      } catch (error) {
        console.error(error);
        setError(error instanceof Error ? error.message : String(error));
      } finally {
        setLoading(false);
      }
    };

    fetchTools();
  }, []);

  return (
    <div className="container mb-24 lg:mb-32">
      {/* <HeaderFilter /> */}
      {loading && (
        <div className="py-10 text-neutral-500">Chargement des outils…</div>
      )}
      {!loading && error && (
        <div className="py-10 text-red-600">Erreur: {error}</div>
      )}
      {!loading && !error && tools.length === 0 && (
        <div className="py-10 text-neutral-500">Aucun outil trouvé.</div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8 mt-8 lg:mt-10">
        {tools.map((tool) => (
          <ToolCard key={tool.toolId} data={tool} />
        ))}
      </div>
    </div>
  );
};

export default ToolsPage;
