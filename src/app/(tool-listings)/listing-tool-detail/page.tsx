"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ToolDataType } from "@/data/types";
import GallerySlider from "@/components/GallerySlider";
import StartRating from "@/components/StartRating";
import CardAuthorBox from "@/components/CardAuthorBox";
import NcInputNumber from "@/components/NcInputNumber";
import ModalSelectDate from "@/components/ModalSelectDate";
import { Route } from "@/routers/types";
import Link from "next/link";

const ToolDetailPageContent = () => {
  const searchParams = useSearchParams();
  const toolId = searchParams.get("id");
  const [tool, setTool] = useState<ToolDataType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStartDate, setSelectedStartDate] = useState<Date | null>(null);
  const [selectedEndDate, setSelectedEndDate] = useState<Date | null>(null);
  const [quantity, setQuantity] = useState<number>(1);

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

  const handleBooking = async () => {
    if (!toolId || !selectedStartDate || !selectedEndDate || !quantity) {
      alert("Veuillez sélectionner les dates et la quantité.");
      return;
    }
    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toolId,
          startDate: selectedStartDate.toISOString(),
          endDate: selectedEndDate.toISOString(),
          quantity,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Échec de la réservation.");
      }
      const result = await response.json();
      alert(result.message);
    } catch (err: any) {
      alert("Erreur de réservation: " + err.message);
    }
  };

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
  // Use the same static owner id as tools-management for now
  const STATIC_OWNER_ID = "2612236b-9fc8-4b07-a668-c197c312265f";
  const isOwner = tool.ownerId && String(tool.ownerId) === STATIC_OWNER_ID;
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
    <div className="nc-ListingDetailPage">
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
                uniqueID={`tool-${toolId || "detail"}`}
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

              {!isOwner && (
                <>
                  <div className="mt-6">
                    <ModalSelectDate
                      renderChildren={({ openModal }) => (
                        <button
                          onClick={openModal}
                          className="w-full flex justify-between items-center px-4 py-3 border border-neutral-200 dark:border-neutral-700 rounded-2xl hover:bg-neutral-50 dark:hover:bg-neutral-800"
                        >
                          <span>
                            {selectedStartDate && selectedEndDate
                              ? `${selectedStartDate.toLocaleDateString()} - ${selectedEndDate.toLocaleDateString()}`
                              : "Select dates"}
                          </span>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                        </button>
                      )}
                      onChangeDate={(start, end) => {
                        setSelectedStartDate(start);
                        setSelectedEndDate(end);
                      }}
                    />
                    <div className="mt-4">
                      <NcInputNumber
                        label="Quantity"
                        defaultValue={1}
                        max={5}
                        onChange={setQuantity}
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleBooking}
                    className="mt-6 w-full py-3 rounded-full font-semibold
                      bg-neutral-900 text-white hover:bg-neutral-800
                      dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100
            border border-transparent dark:border-neutral-300
            transition duration-200 hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-neutral-300 dark:focus:ring-neutral-600 active:translate-y-0"
                  >
                    Add to cart
                  </button>

                  <div className="mt-5 flex items-center justify-between text-neutral-600 dark:text-neutral-300 text-sm">
                    <button className="inline-flex items-center gap-2 hover:underline">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="w-5 h-5"
                      >
                        <path d="M4 13h5v-2H4v2Zm0 5h9v-2H4v2ZM4 8h13V6H4v2Zm15 3.59L23.41 16 19 20.41 14.59 16 16 14.59l3 3 3-3L19 11.59Z" />
                      </svg>
                      Compare
                    </button>
                    <button className="inline-flex items-center gap-2 hover:underline">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="w-5 h-5"
                      >
                        <path d="M12.1 21.35 10 19.45C5.4 15.36 2 12.27 2 8.5 2 6 4 4 6.5 4c1.54 0 3.04.99 3.57 2.36h.87C14.46 4.99 15.96 4 17.5 4 20 4 22 6 22 8.5c0 3.77-3.4 6.86-8 10.95l-1.9 1.9Z" />
                      </svg>
                      Favorites
                    </button>
                  </div>
                  <div className="mt-4 text-xs text-neutral-500 dark:text-neutral-400">
                    Free cancellation within 24h • Support 7/7
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="mt-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="rounded-3xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-6 lg:p-8">
              <h2 className="text-xl font-semibold">Description</h2>
              <div className="mt-4 prose prose-neutral dark:prose-invert max-w-none">
                <p className="leading-relaxed">
                  {desc || "Aucune description fournie pour cet outil."}
                </p>
              </div>
            </div>
          </div>
          <div>
            <div className="rounded-3xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-6 lg:p-8">
              <h2 className="text-xl font-semibold mb-4">
                À propos du propriétaire
              </h2>
              <CardAuthorBox author={author} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ToolDetailPage = () => (
  <Suspense fallback={<div>Chargement de la page de détail...</div>}>
    <ToolDetailPageContent />
  </Suspense>
);

export default ToolDetailPage;
