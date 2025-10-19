'use client';

import React, { useEffect, useState } from 'react';
import ToolCard from '@/components/Cards/ToolCard';
import { ToolDataType } from '@/data/types';
import HeaderFilter from '@/components/HeaderFilter';

const ToolsPage = () => {
  const [tools, setTools] = useState<ToolDataType[]>([]);

  useEffect(() => {
    const fetchTools = async () => {
      try {
        const response = await fetch('/api/tools');
        if (!response.ok) {
          throw new Error('Failed to fetch tools');
        }
        const data = await response.json();
        setTools(data);
      } catch (error) {
        console.error(error);
      }
    };

    fetchTools();
  }, []);

  return (
    <div className="container mb-24 lg:mb-32">
        {/* <HeaderFilter /> */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8 mt-8 lg:mt-10">
        {tools.map((tool) => (
          <ToolCard key={tool.id} data={tool} />
        ))}
      </div>
    </div>
  );
};

export default ToolsPage;
