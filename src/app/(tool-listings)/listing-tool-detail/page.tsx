"use client";

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
import { getMainRating } from '@/features/reviews/types';

const ToolDetailPageContent = () => {
  console.log('🟢 [START] Composant listing-tool-detail chargé');
  
  const searchParams = useSearchParams();
  const toolId = searchParams.get('id');
  console.log('🟢 [INIT] toolId depuis URL:', toolId);
  
  const [toolDetails, setToolDetails] = useState<ToolDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStartDate, setSelectedStartDate] = useState<Date | null>(null);
  const [selectedEndDate, setSelectedEndDate] = useState<Date | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [currentUser, setCurrentUser] = useState<{ userId: string } | null>(null);
  const [activeRentalId, setActiveRentalId] = useState<number | null>(null);

  const fetchTool = useCallback(async () => {
    console.log('🟢 [FETCH] === DÉBUT FETCH ===');
    console.log('🟢 [FETCH] toolId à fetcher:', toolId);
    
    if (!toolId) {
      console.log('🔴 [FETCH] Pas de toolId, abandon fetch');
      return;
    }
    
    try {
      setLoading(true);
      const url = `/api/tools/${toolId}`;
      console.log('🟢 [FETCH] URL appelée:', url);
      
      const response = await fetch(url);
      console.log('🟢 [FETCH] Réponse reçue, status:', response.status, response.statusText);
      
      if (!response.ok) {
        console.error('🔴 [FETCH] Erreur HTTP:', response.status);
        throw new Error('Tool not found');
      }
      
      const data = await response.json();
      console.log('🟢 [FETCH] ===== DATA COMPLÈTE =====');
      console.log('🟢 [FETCH] Données brutes:', data);
      console.log('🟢 [FETCH] title:', data.title);
      console.log('🟢 [FETCH] toolReviews:', data.toolReviews);
      console.log('🟢 [FETCH] toolReviews.length:', data.toolReviews?.length);
      console.log('🟢 [FETCH] ownerReviews:', data.ownerReviews);
      console.log('🟢 [FETCH] ownerReviews.length:', data.ownerReviews?.length);
      console.log('🟢 [FETCH] === FIN DATA ===');
      
      setToolDetails(data);
      console.log('🟢 [FETCH] toolDetails mis à jour dans le state');
      
    } catch (err: any) {
      console.error('🔴 [FETCH] Exception attrapée:', err);
      console.error('🔴 [FETCH] Message:', err.message);
      console.error('🔴 [FETCH] Stack:', err.stack);
      setError(err.message);
    } finally {
      setLoading(false);
      console.log('🟢 [FETCH] === FIN FETCH ===');
    }
  }, [toolId]);

  useEffect(() => {
    console.log('🟢 [EFFECT] Initialisation user et rental');
    setCurrentUser({ userId: "420430c2-0338-4612-aa74-65f0a82900fe" });
    setActiveRentalId(1);
    console.log('🟢 [EFFECT] User et rental initialisés');
  }, []);

  useEffect(() => {
    console.log('🟢 [EFFECT] useEffect fetchTool déclenché');
    fetchTool();
  }, [fetchTool]);

  console.log('🟢 [RENDER] === DÉBUT RENDER ===');
  console.log('🟢 [RENDER] loading:', loading);
  console.log('🟢 [RENDER] error:', error);
  console.log('🟢 [RENDER] toolDetails:', toolDetails ? 'existe' : 'null');

  if (loading) {
    console.log('🟡 [RENDER] Retour loading...');
    return <div className="container py-10">Chargement...</div>;
  }
  
  if (error) {
    console.log('🔴 [RENDER] Retour erreur:', error);
    return <div className="container py-10">Erreur: {error}</div>;
  }
  
  if (!toolDetails) {
    console.log('🔴 [RENDER] Pas de toolDetails');
    return <div className="container py-10">Outil non trouvé.</div>;
  }

  console.log('🟢 [RENDER] Passage des conditions, destructuration...');
  
  const { 
    title, 
    description, 
    owner, 
    toolReviews, 
    ownerReviews, 
    rentalPricePerDay, 
    images
  } = toolDetails;

  console.log('🟢 [DATA] === DONNÉES DESTRUCTURÉES ===');
  console.log('🟢 [DATA] title:', title);
  console.log('🟢 [DATA] toolReviews:', toolReviews);
  console.log('🟢 [DATA] toolReviews est un tableau?', Array.isArray(toolReviews));
  console.log('🟢 [DATA] toolReviews.length:', toolReviews?.length || 0);
  
  if (toolReviews && toolReviews.length > 0) {
    console.log('🟢 [DATA] Premier review:', toolReviews[0]);
  }

  // ✅ Calcul des statistiques TOOL
  console.log('🟡 [STATS] ======= CALCUL TOOL STATS =======');
  const toolStats = (() => {
    if (!toolReviews || toolReviews.length === 0) {
      console.log('🟡 [STATS] Pas de tool reviews, stats vides');
      return {
        averageRating: 0,
        totalReviews: 0,
        distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      };
    }

    console.log('🟡 [STATS] Nombre de reviews à traiter:', toolReviews.length);
    
    const ratings = toolReviews.map((review, index) => {
      console.log(`\n🟡 [STATS] === Review ${index + 1}/${toolReviews.length} ===`);
      console.log('🟡 [STATS]   ratingId:', review.ratingId);
      console.log('🟡 [STATS]   toolStatus:', review.toolStatus);
      console.log('🟡 [STATS]   fiability:', review.fiability);
      console.log('🟡 [STATS]   ratedEntityTypeId:', review.ratedEntityTypeId);
      
      try {
        const rating = getMainRating(review);
        console.log('🟡 [STATS]   → mainRating:', rating);
        console.log('🟡 [STATS]   → arrondi:', Math.round(rating));
        return rating;
      } catch (error) {
        console.error('🔴 [STATS]   ❌ Erreur getMainRating:', error);
        return 0;
      }
    });

    console.log('🟡 [STATS] Tous les ratings:', ratings);
    
    const sum = ratings.reduce((acc, r) => acc + r, 0);
    console.log('🟡 [STATS] Somme des ratings:', sum);
    
    const averageRating = sum / ratings.length;
    console.log('🟡 [STATS] Moyenne calculée:', averageRating);

    const distribution: { 1: number; 2: number; 3: number; 4: number; 5: number } = {
      1: 0, 2: 0, 3: 0, 4: 0, 5: 0
    };

    ratings.forEach((rating, index) => {
      const rounded = Math.round(rating);
      console.log(`🟡 [STATS] Distribution: rating ${rating} → arrondi ${rounded}`);
      
      if (rounded >= 1 && rounded <= 5) {
        distribution[rounded as 1 | 2 | 3 | 4 | 5]++;
      } else {
        console.warn('🟠 [STATS] Rating hors limites:', rounded);
      }
    });

    console.log('🟡 [STATS] Distribution finale:', distribution);

    const result = {
      averageRating,
      totalReviews: toolReviews.length,
      distribution,
    };
    
    console.log('🟡 [STATS] ====== RÉSULTAT TOOL STATS ======');
    console.log('🟡 [STATS]', result);
    
    return result;
  })();

  console.log('🟢 [STATS] toolStats FINAL stocké:', toolStats);

  // ✅ Calcul des statistiques OWNER
  console.log('🟡 [STATS] === CALCUL OWNER STATS ===');
  const ownerStats = (() => {
    if (!ownerReviews || ownerReviews.length === 0) {
      console.log('🟡 [STATS] Pas de owner reviews');
      return {
        averageRating: 0,
        totalReviews: 0,
        distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      };
    }

    const ratings = ownerReviews.map(review => getMainRating(review));
    const averageRating = ratings.reduce((acc, r) => acc + r, 0) / ratings.length;

    const distribution: { 1: number; 2: number; 3: number; 4: number; 5: number } = {
      1: 0, 2: 0, 3: 0, 4: 0, 5: 0
    };

    ratings.forEach(rating => {
      const rounded = Math.round(rating);
      if (rounded >= 1 && rounded <= 5) {
        distribution[rounded as 1 | 2 | 3 | 4 | 5]++;
      }
    });

    return {
      averageRating,
      totalReviews: ownerReviews.length,
      distribution,
    };
  })();

  console.log('🟢 [STATS] ownerStats FINAL:', ownerStats);

  const reviewStart = toolStats.averageRating;
  const reviewCount = toolStats.totalReviews;
  const canLeaveReview = currentUser && activeRentalId;

  console.log('🟢 [DISPLAY] Variables pour affichage:');
  console.log('🟢 [DISPLAY]   reviewStart:', reviewStart);
  console.log('🟢 [DISPLAY]   reviewCount:', reviewCount);
  console.log('🟢 [DISPLAY]   canLeaveReview:', canLeaveReview);
  console.log('🟢 [RENDER] === FIN RENDER, début JSX ===');

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

  return (
    <div className="nc-ListingDetailPage">
      <GallerySlider 
        galleryImgs={
          images && images.length > 0
            ? images.map(
                (img) =>
                  `data:image/jpeg;base64,${Buffer.from(
                    (img.imageBinary as any).data
                  ).toString("base64")}`
              )
            : []
        }
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
                <span className="text-sm text-neutral-500 dark:text-neutral-400">
                  ({reviewCount} avis)
                </span>
                <span className="block text-neutral-500 dark:text-neutral-400">
                  {owner.locationId}
                </span>
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

            {/* REVIEWS - OUTIL */}
            <div className="listingSection__wrap">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold">Avis sur l'outil</h2>
                
                {canLeaveReview ? (
                  <WriteReviewModal 
                    rentalId={activeRentalId!}
                    raterId={currentUser!.userId}
                    ratedToolId={toolId || undefined}
                    ratedUserId={undefined}
                    ratedEntityTypeId={1}
                    onReviewSubmitted={fetchTool} 
                  />
                ) : (
                  <div className="text-sm text-neutral-500 dark:text-neutral-400">
                    Louez cet outil pour laisser un avis
                  </div>
                )}
              </div>
              
              {toolStats.totalReviews > 0 && (
                <div className="mb-8">
                  <ReviewStats stats={toolStats} />
                </div>
              )}
              
              <ReviewList 
                reviews={toolReviews || []} 
                reviewType="tool"
              />
            </div>

            {/* REVIEWS - PROPRIÉTAIRE */}
            <div className="listingSection__wrap">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold">Avis sur le propriétaire</h2>
                
                {canLeaveReview ? (
                  <WriteReviewModal 
                    rentalId={activeRentalId!}
                    raterId={currentUser!.userId}
                    ratedToolId={undefined}
                    ratedUserId={owner.userId}
                    ratedEntityTypeId={3}
                    onReviewSubmitted={fetchTool} 
                  />
                ) : (
                  <div className="text-sm text-neutral-500 dark:text-neutral-400">
                    Louez cet outil pour laisser un avis
                  </div>
                )}
              </div>
              
              {ownerStats.totalReviews > 0 && (
                <div className="mb-8">
                  <ReviewStats stats={ownerStats} />
                </div>
              )}
              
              <ReviewList 
                reviews={ownerReviews || []} 
                reviewType="owner"
              />
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
                    <button 
                      onClick={openModal} 
                      className="w-full flex justify-between items-center px-4 py-3 border border-neutral-200 dark:border-neutral-700 rounded-full hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                    >
                      <span className="text-sm">
                        {selectedStartDate && selectedEndDate 
                          ? `${selectedStartDate.toLocaleDateString('fr-FR')} - ${selectedEndDate.toLocaleDateString('fr-FR')}` 
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
                <NcInputNumber 
                  label="Quantité" 
                  defaultValue={1} 
                  max={5} 
                  onChange={setQuantity} 
                />
              </div>

              <button 
                onClick={handleBooking}
                disabled={!selectedStartDate || !selectedEndDate}
                className="mt-6 w-full bg-jaune-industriel text-bleu-nuit font-semibold py-3 rounded-full hover:bg-jaune-industriel/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Réserver
              </button>

              {!canLeaveReview && (
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    💡 Vous pourrez laisser un avis après avoir loué cet outil
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ToolDetailPage = () => {
  return (
    <Suspense fallback={<div className="container py-10">Chargement...</div>}>
      <ToolDetailPageContent />
    </Suspense>
  );
};

export default ToolDetailPage;
