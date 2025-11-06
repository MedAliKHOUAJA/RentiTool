import React, { useState, useEffect } from "react";

interface ToolFormPricingProps {
  rentalPricePerDay: string;
  categoryId: string;
  subCategoryId: string;
  onPriceChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onSubCategoryChange: (value: string) => void;
}

export function ToolFormPricing({
  rentalPricePerDay,
  categoryId,
  subCategoryId,
  onPriceChange,
  onCategoryChange,
  onSubCategoryChange,
}: ToolFormPricingProps) {
  const [fkOptions, setFkOptions] = useState<Record<string, any>>({});
  const [filteredSubcats, setFilteredSubcats] = useState<Array<{ value: any; label: string }>>([]);
  const [metaError, setMetaError] = useState<string | null>(null);

  useEffect(() => {
    const loadMeta = async () => {
      try {
        setMetaError(null);
        const res = await fetch("/api/tools/meta");
        if (!res.ok) throw new Error(await res.text());
        const json = await res.json();
        setFkOptions(json.foreignKeys || {});
      } catch (e: any) {
        setMetaError(e.message || "Failed to load metadata");
      }
    };
    loadMeta();
  }, []);

  useEffect(() => {
    const run = async () => {
      setFilteredSubcats([]);
      if (!categoryId) {
        onSubCategoryChange("");
        return;
      }
      try {
        const res = await fetch(
          `/api/tools/meta/subcategories?categoryId=${encodeURIComponent(categoryId)}`
        );
        if (!res.ok) return;
        const json = await res.json();
        setFilteredSubcats(json.options || []);
        if (json.options && !json.options.some((o: any) => String(o.value) === String(subCategoryId))) {
          onSubCategoryChange("");
        }
      } catch {}
    };
    run();
  }, [categoryId]);

  return (
    <div className="listingSection__wrap rounded-3xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-6 lg:p-8">
      <h2 className="text-xl font-semibold mb-6">Pricing & Categories</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Price per day</label>
          <input
            type="number"
            className="w-full border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            value={rentalPricePerDay}
            onChange={(e) => onPriceChange(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Category</label>
          {fkOptions["CategoryId"] || fkOptions["categoryid"] || fkOptions["category_id"] ? (
            <select
              className="w-full border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={categoryId}
              onChange={(e) => onCategoryChange(e.target.value)}
            >
              <option value="">-- Category --</option>
              {(
                fkOptions["CategoryId"]?.options ||
                fkOptions["categoryid"]?.options ||
                fkOptions["category_id"]?.options ||
                []
              ).map((opt: any) => (
                <option key={String(opt.value)} value={String(opt.value)}>
                  {opt.label}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="number"
              className="w-full border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={categoryId}
              onChange={(e) => onCategoryChange(e.target.value)}
            />
          )}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">SubCategory</label>
          {fkOptions["SubCategoryId"] || fkOptions["subcategoryid"] || fkOptions["sub_category_id"] ? (
            <select
              disabled={!categoryId}
              className="w-full border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-neutral-100 disabled:dark:bg-neutral-800 disabled:cursor-not-allowed"
              value={subCategoryId}
              onChange={(e) => onSubCategoryChange(e.target.value)}
            >
              <option value="">
                {categoryId ? "-- SubCategory --" : "Choose category first"}
              </option>
              {(categoryId
                ? filteredSubcats.length
                  ? filteredSubcats
                  : fkOptions["SubCategoryId"]?.options ||
                    fkOptions["subcategoryid"]?.options ||
                    fkOptions["sub_category_id"]?.options ||
                    []
                : []
              ).map((opt: any) => (
                <option key={String(opt.value)} value={String(opt.value)}>
                  {opt.label}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="number"
              className="w-full border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={subCategoryId}
              onChange={(e) => onSubCategoryChange(e.target.value)}
            />
          )}
        </div>
      </div>
      {metaError && <div className="text-xs text-red-600 mt-2">{metaError}</div>}
    </div>
  );
}