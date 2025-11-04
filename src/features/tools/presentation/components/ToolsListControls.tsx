import React from "react";
import { SortKey } from "../../domain/tool.types";

interface ToolsListControlsProps {
  searchQuery: string;
  sortKey: SortKey;
  onSearchChange: (value: string) => void;
  onSortChange: (value: SortKey) => void;
  onAddClick: () => void;
}

export function ToolsListControls({
  searchQuery,
  sortKey,
  onSearchChange,
  onSortChange,
  onAddClick,
}: ToolsListControlsProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
      <h2 className="text-xl font-semibold">Your tools</h2>
      <div className="flex flex-1 items-center gap-3 sm:justify-end">
        {/* Search */}
        <div className="w-full sm:w-72">
          <input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by title or description"
            className="w-full border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        {/* Sort */}
        <div>
          <select
            value={sortKey}
            onChange={(e) => onSortChange(e.target.value as SortKey)}
            className="border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 rounded-full px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="title_asc">Title A–Z</option>
            <option value="title_desc">Title Z–A</option>
            <option value="price_asc">Price Low–High</option>
            <option value="price_desc">Price High–Low</option>
            <option value="brand_asc">Brand A–Z</option>
            <option value="brand_desc">Brand Z–A</option>
            <option value="model_asc">Model A–Z</option>
            <option value="model_desc">Model Z–A</option>
            <option value="category_asc">Category A–Z</option>
            <option value="category_desc">Category Z–A</option>
          </select>
        </div>
        <button
          onClick={onAddClick}
          className="px-4 py-2 rounded-full bg-bleu-nuit text-white"
        >
          Add a tool
        </button>
      </div>
    </div>
  );
}