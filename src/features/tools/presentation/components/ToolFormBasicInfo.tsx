import React from "react";

interface ToolFormBasicInfoProps {
  title: string;
  description: string;
  brand: string;
  model: string;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onBrandChange: (value: string) => void;
  onModelChange: (value: string) => void;
}

export function ToolFormBasicInfo({
  title,
  description,
  brand,
  model,
  onTitleChange,
  onDescriptionChange,
  onBrandChange,
  onModelChange,
}: ToolFormBasicInfoProps) {
  return (
    <div className="listingSection__wrap rounded-3xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-6 lg:p-8">
      <h2 className="text-xl font-semibold mb-6">Basic information</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Title *</label>
          <input
            className="w-full border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            className="w-full border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            rows={4}
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Brand</label>
            <input
              className="w-full border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={brand}
              onChange={(e) => onBrandChange(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Model</label>
            <input
              className="w-full border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={model}
              onChange={(e) => onModelChange(e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}