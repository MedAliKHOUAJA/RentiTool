"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ToolDataType } from "@/data/types";
import GallerySlider from "@/components/GallerySlider";
import StartRating from "@/components/StartRating";
import CardAuthorBox from "@/components/CardAuthorBox";
import { Route } from "@/routers/types";
import Link from "next/link";

const OwnerToolDetailPageContent = () => {
  const searchParams = useSearchParams();
  const toolId = searchParams.get("id");
  const [tool, setTool] = useState<ToolDataType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!toolId) return;
    (async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/tools/${toolId}`);
        if (!response.ok) throw new Error("Tool not found");
        const data = await response.json();
        setTool(data);
      } catch (e: any) {
        setError(e?.message || "Failed to load");
      } finally {
        setLoading(false);
      }
    })();
  }, [toolId]);

  if (loading) return <div className="container py-10">Loading...</div>;
  if (error) return <div className="container py-10">Error: {error}</div>;
  if (!tool) return <div className="container py-10">Tool not found.</div>;

  const {
    title,
    address,
    reviewStart,
    reviewCount,
    price,
    saleOff,
    desc,
    author,
    galleryImgs,
  } = tool;
  const priceNumber =
    Number(
      String(price)
        .replace(/[^0-9.,]/g, "")
        .replace(",", ".")
    ) || 0;
  const priceFormatted = new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 0,
  }).format(priceNumber);
  const isAvailable = true;

  return (
    <div className="nc-OwnerToolDetailPage">
      <div className="container mt-10">
        <nav
          className="text-sm text-neutral-500 dark:text-neutral-400 mb-4"
          aria-label="Breadcrumb"
        >
          <ol className="flex items-center gap-2">
            <li>
              <Link href={"/" as Route} className="hover:underline">
                Home
              </Link>
            </li>
            <li className="opacity-60">/</li>
            <li>
              <Link href={"/tools" as Route} className="hover:underline">
                Tools
              </Link>
            </li>
            <li className="opacity-60">/</li>
            <li className="text-neutral-800 dark:text-neutral-200 truncate max-w-[60vw]">
              {title}
            </li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
          <div className="lg:col-span-7">
            <div className="rounded-3xl overflow-hidden bg-transparent">
              <GallerySlider
                galleryImgs={galleryImgs}
                className="rounded-3xl"
                ratioClass="h-[55vh] md:h-[60vh] lg:h-[70vh] xl:h-[75vh]"
                imageClass="object-contain"
                galleryClass="rounded-3xl p-0 bg-transparent"
                uniqueID={`owner-tool-${toolId || "detail"}`}
                navigation={true}
              />
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="rounded-3xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-6 lg:p-7 shadow-sm">
              <div>
                <div className="flex flex-wrap items-center gap-3 mb-3">
                  {tool.listingCategory?.name && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                      {tool.listingCategory.name}
                    </span>
                  )}
                </div>
                <h1 className="text-2xl md:text-3xl font-semibold leading-tight">
                  {title}
                </h1>
                <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-neutral-500 dark:text-neutral-400">
                  <div className="flex items-center gap-2">
                    <StartRating
                      reviewCount={reviewCount ?? 0}
                      point={reviewStart ?? 0}
                    />
                    <span>({reviewCount ?? 0} reviews)</span>
                  </div>
                  {address && <span className="truncate">{address}</span>}
                  {saleOff && (
                    <span className="text-red-500 font-medium">{saleOff}</span>
                  )}
                </div>
              </div>

              <div className="mt-6 flex items-start justify-between">
                <div>
                  <div className="text-red-600 dark:text-red-500 text-3xl md:text-4xl font-extrabold tracking-tight">
                    {priceFormatted} DT
                  </div>
                  <div className="mt-2 text-sm">
                    Availability:{" "}
                    <span
                      className={
                        isAvailable ? "text-green-600" : "text-red-600"
                      }
                    >
                      {isAvailable ? "In stock" : "Unavailable"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Owner view: no reservation UI */}
            </div>
          </div>
        </div>

        <div className="mt-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="rounded-3xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-6 lg:p-8">
              <h2 className="text-xl font-semibold">Description</h2>
              <div className="mt-4 prose prose-neutral dark:prose-invert max-w-none">
                <p className="leading-relaxed">
                  {desc || "No description provided for this tool."}
                </p>
              </div>
            </div>
          </div>
          <div>
            <div className="rounded-3xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-6 lg:p-8">
              <h2 className="text-xl font-semibold mb-4">About the owner</h2>
              <CardAuthorBox author={author} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const OwnerToolDetailPage = () => (
  <Suspense fallback={<div>Loading detail page...</div>}>
    <OwnerToolDetailPageContent />
  </Suspense>
);

export default OwnerToolDetailPage;
