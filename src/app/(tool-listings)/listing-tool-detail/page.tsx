'use client';

import React, { useEffect, useState, Suspense, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { ToolDetails } from '@/features/tools/domain/tool-details';
import GallerySlider from '@/components/GallerySlider';
import StartRating from '@/components/StartRating';
import CardAuthorBox from '@/components/CardAuthorBox';
import NcInputNumber from '@/components/NcInputNumber';
import ModalSelectDate from '@/components/ModalSelectDate';

// 🆕 IMPORTS REVIEWS
import { ReviewList } from '@/features/reviews/components/ReviewList';
import { ReviewStats } from '@/features/reviews/components/ReviewStats';

import { WriteReviewModal } from '@/features/reviews/components/WriteReviewModal';

const ToolDetailPageContent = () => {
  const searchParams = useSearchParams();
  const toolId = searchParams.get('id');
  const [toolDetails, setToolDetails] = useState<ToolDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStartDate, setSelectedStartDate] = useState<Date | null>(null);
  const [selectedEndDate, setSelectedEndDate] = useState<Date | null>(null);
  const [quantity, setQuantity] = useState<number>(1);

  const fetchTool = useCallback(async () => {
    if (!toolId) return;
    try {
      setLoading(true);
      const response = await fetch(`/api/tools/${toolId}`);
      if (!response.ok) throw new Error('Tool not found');
      const data = await response.json();
      setToolDetails(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [toolId]);

  useEffect(() => {
    fetchTool();
  }, [fetchTool]);

  const handleBooking = async () => {
    if (!toolId || !selectedStartDate || !selectedEndDate || !quantity) {
      alert("Veuillez sélectionner les dates et la quantité.");
      return;
    }

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

  if (loading) return <div className="container py-10">Chargement...</div>;
  if (error) return <div className="container py-10">Erreur: {error}</div>;
  if (!toolDetails) return <div className="container py-10">Outil non trouvé.</div>;

  const { 
    title, 
    description, 
    owner, 
    toolReviews, 
    ownerReviews, 
    rentalPricePerDay, 
    imageUrl 
  } = toolDetails;

  const reviewStart = toolReviews.length > 0 ? toolReviews.reduce((acc, review) => acc + review.rating, 0) / toolReviews.length : 0;
  const reviewCount = toolReviews.length;

  const stats = {
    averageRating: reviewStart,
    totalReviews: reviewCount,
    distribution: {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    },
  };

  if (toolReviews) {
    for (const review of toolReviews) {
      stats.distribution[review.rating as keyof typeof stats.distribution]++;
    }
  }

  return (
    <div className="nc-ListingDetailPage">
      <GallerySlider 
        galleryImgs={imageUrl ? [imageUrl] : []}
        className="max-w-screen-xl mx-auto rounded-3xl"

      />

      <div className="container mt-10">
        <div className="lg:flex lg:space-x-10">
          <div className="w-full lg:w-2/3 space-y-8 lg:space-y-10">
            {/* TITLE */}
            <div className="listingSection__wrap !space-y-6">
              <h1 className="text-2xl font-semibold md:text-3xl">{title}</h1>
              <div className="flex items-center space-x-4">
                <StartRating reviewCount={reviewCount} point={reviewStart} />
                <span className="text-sm text-neutral-500 dark:text-neutral-400">({reviewCount} avis)</span>
                <span className="block text-neutral-500 dark:text-neutral-400">{owner.locationId}</span>
              </div>
            </div>

            {/* DESCRIPTION */}
            <div className="listingSection__wrap">
              <h2 className="text-2xl font-semibold">Description de l'outil</h2>
              <div className="text-neutral-600 dark:text-neutral-300 mt-4">
                <p>{description}</p>
              </div>
            </div>

            {/* OWNER */}
            <div className="listingSection__wrap">
              <h2 className="text-2xl font-semibold">À propos du propriétaire</h2>
              <CardAuthorBox author={owner} />
            </div>

            {/* 🆕 REVIEWS SECTION */}
            <div className="listingSection__wrap">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold">Avis sur l'outil</h2>
                <WriteReviewModal toolId={toolId || ""} ownerId={owner.userId} reviewType="tool" onReviewSubmitted={fetchTool} />
              </div>
              
              {/* Stats */}
              {stats && (
                <div className="mb-8">
                  <ReviewStats stats={stats} />
                </div>
              )}
              
              {/* List */}
              <ReviewList reviews={toolReviews || []} reviewType="tool" />
            </div>

            <div className="listingSection__wrap">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold">Avis sur le propriétaire</h2>
                <WriteReviewModal toolId={toolId || ""} ownerId={owner.userId} reviewType="owner" onReviewSubmitted={fetchTool} />
              </div>
              <ReviewList reviews={ownerReviews || []} reviewType="owner" />
            </div>
          </div>

          {/* SIDEBAR */}
          <div className="w-full lg:w-1/3 mt-10 lg:mt-0">
            <div className="listingSectionSidebar__wrap sticky top-24">
              <h2 className="text-2xl font-semibold">Louer cet outil</h2>
              <div className="flex items-center justify-between mt-4">
                <span className="text-3xl font-semibold">{rentalPricePerDay}€</span>
                <span className="text-base text-neutral-500 dark:text-neutral-400">/ jour</span>
              </div>

              <div className="mt-6">
                <ModalSelectDate 
                  renderChildren={({ openModal }) => (
                    <button onClick={openModal} className="w-full flex justify-between items-center px-4 py-3 border border-neutral-200 dark:border-neutral-700 rounded-full">
                      <span>
                        {selectedStartDate && selectedEndDate 
                          ? `${selectedStartDate.toLocaleDateString()} - ${selectedEndDate.toLocaleDateString()}` 
                          : "Sélectionner les dates"}
                      </span>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </button>
                  )}
                  onChangeDate={(start, end) => { 
                    setSelectedStartDate(start); 
                    setSelectedEndDate(end); 
                  }}
                />
              </div>

              <div className="mt-4">
                <NcInputNumber label="Quantité" defaultValue={1} max={5} onChange={setQuantity} />
              </div>

              <button 
                onClick={handleBooking}
                className="mt-6 w-full bg-jaune-industriel text-bleu-nuit font-semibold py-3 rounded-full hover:bg-jaune-industriel/90 transition-colors"
              >
                Réserver
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ToolDetailPage = () => {
  return (
    <Suspense fallback={<div>Chargement de la page de détail...</div>}>
      <ToolDetailPageContent />
    </Suspense>
  );
};

export default ToolDetailPage;