'use client';

import React, { useEffect, useState, Suspense, useCallback } from 'react';

import { ToolDetails } from '@/features/tools/domain/tool-details';
import GallerySlider from '@/components/GallerySlider';
import StartRating from '@/components/StartRating';
import CardAuthorBox from '@/components/CardAuthorBox';
import NcInputNumber from '@/components/NcInputNumber';
import ModalSelectDate from '@/components/ModalSelectDate';
import { ReviewList } from '@/features/reviews/components/ReviewList';
import { ReviewStats } from '@/features/reviews/components/ReviewStats';
import { WriteReviewModal } from '@/features/reviews/components/WriteReviewModal';
import { getMainRating } from '@/features/reviews/types';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth'; 
import DatePickerWithBlocking from '@/components/DatePickerWithBlocking';
import BlockedDatesDisplay from '@/components/BlockedDatesDisplay';
import PaymentMethodSelector from '@/components/PaymentMethodSelector';
import Link from 'next/link';

const ToolDetailPageContent = () => {
  console.log('🟢 [START] Composant listing-tool-detail chargé');
  
  const searchParams = useSearchParams();
  const toolId = searchParams?.get('id');
  console.log('🟢 [INIT] toolId depuis URL:', toolId);
  
  const [toolDetails, setToolDetails] = useState<ToolDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStartDate, setSelectedStartDate] = useState<Date | null>(null);
  const [selectedEndDate, setSelectedEndDate] = useState<Date | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const { user: currentUser, loading: userLoading } = useAuth();
  const [activeRentalId, setActiveRentalId] = useState<number | null>(null);
  const [calculatedPrice, setCalculatedPrice] = useState<number>(0);
  const [rentalDays, setRentalDays] = useState<number>(0);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<number>(1);

  useEffect(() => {
    console.log('🟢🟢🟢 [EFFECT] useEffect TOOL déclenché');
    console.log('🟢🟢🟢 [EFFECT] toolId:', toolId);
    
    if (!toolId) {
      console.log('🔴🔴🔴 [EFFECT] Pas de toolId, abandon');
      setLoading(false);
      return;
    }

    console.log('🟢🟢🟢 [EFFECT] On va fetcher maintenant');

    const fetchTool = async () => {
      console.log('🟢🟢🟢 [FETCH] === DÉBUT FETCH ===');
      console.log('🟢🟢🟢 [FETCH] toolId à fetcher:', toolId);
      
      try {
        setLoading(true);
        setError(null);
        
        const url = `/api/tools/${toolId}`;
        console.log('🟢🟢🟢 [FETCH] URL appelée:', url);
        console.log('🟢🟢🟢 [FETCH] 🚀 Lancement du fetch...');
        
        const response = await fetch(url);
        console.log('🟢🟢🟢 [FETCH] ✅ Réponse reçue, status:', response.status, response.statusText);
        
        if (!response.ok) {
          console.error('🔴🔴🔴 [FETCH] Erreur HTTP:', response.status);
          throw new Error('Tool not found');
        }
        
        const data = await response.json();
        console.log('🟢🟢🟢 [FETCH] ===== DATA COMPLÈTE =====');
        console.log('🟢🟢🟢 [FETCH] Données brutes:', data);
        console.log('🟢🟢🟢 [FETCH] images:', data.images);
        console.log('🟢🟢🟢 [FETCH] imagePrimary:', data.imagePrimary);
        console.log('🟢🟢🟢 [FETCH] toolReviews.length:', data.toolReviews?.length);
        console.log('🟢🟢🟢 [FETCH] ownerReviews.length:', data.ownerReviews?.length);
        console.log('🟢🟢🟢 [FETCH] === FIN DATA ===');
        
        setToolDetails(data);
        console.log('🟢🟢🟢 [FETCH] toolDetails mis à jour dans le state');
        
      } catch (err: any) {
        console.error('🔴🔴🔴 [FETCH] Exception attrapée:', err);
        console.error('🔴🔴🔴 [FETCH] Message:', err.message);
        setError(err.message);
      } finally {
        setLoading(false);
        console.log('🟢🟢🟢 [FETCH] === FIN FETCH ===');
      }
    };

    fetchTool();
  }, [toolId]);

  const refreshTool = useCallback(async () => {
    if (!toolId) return;
    
    console.log('🔄 [REFRESH] Rafraîchissement des données...');
    
    try {
      const response = await fetch(`/api/tools/${toolId}`);
      if (!response.ok) throw new Error('Erreur refresh');
      
      const data = await response.json();
      setToolDetails(data);
      console.log('✅ [REFRESH] Données rafraîchies');
    } catch (err) {
      console.error('🔴 [REFRESH] Erreur:', err);
    }
  }, [toolId]);

  useEffect(() => {
    // TODO: Fetch active rental ID from the backend
    setActiveRentalId(1);
  }, []);

  console.log('🟢 [RENDER] === DÉBUT RENDER ===');
  console.log('🟢 [RENDER] loading:', loading);
  console.log('🟢 [RENDER] userLoading:', userLoading);
  console.log('🟢 [RENDER] currentUser:', currentUser ? 'existe' : 'null');
  console.log('🟢 [RENDER] error:', error);
  console.log('🟢 [RENDER] toolDetails:', toolDetails ? 'existe' : 'null');

  if (loading) {
    console.log('🟡 [RENDER] Tool loading...');
    return <div className="container py-10">Chargement de l'outil...</div>;
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
    images,
    imagePrimary
  } = toolDetails;

  // ✅ Utiliser owner.userId au lieu de ownerId
  const isOwner = currentUser?.userId === owner.userId;

  const galleryImgs = images?.map(img => `/api/images/${img.imageId}`) || 
    (imagePrimary ? [`/api/images/${imagePrimary.imageId}`] : []);

  console.log('🟢 [DATA] galleryImgs construit:', galleryImgs);
  console.log('🟢 [DATA] images array:', images);
  console.log('🟢 [DATA] imagePrimary:', imagePrimary);

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
      
      try {
        const rating = getMainRating(review);
        console.log('🟡 [STATS]   → mainRating:', rating);
        return rating;
      } catch (error) {
        console.error('🔴 [STATS]   ❌ Erreur getMainRating:', error);
        return 0;
      }
    });

    console.log('🟡 [STATS] Tous les ratings:', ratings);
    
    const sum = ratings.reduce((acc, r) => acc + r, 0);
    const averageRating = sum / ratings.length;
    console.log('🟡 [STATS] Moyenne calculée:', averageRating);

    const distribution: { 1: number; 2: number; 3: number; 4: number; 5: number } = {
      1: 0, 2: 0, 3: 0, 4: 0, 5: 0
    };

    ratings.forEach((rating) => {
      const rounded = Math.round(rating);
      if (rounded >= 1 && rounded <= 5) {
        distribution[rounded as 1 | 2 | 3 | 4 | 5]++;
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
  console.log('🟢 [RENDER] === FIN RENDER, début JSX ===');

  const handlePriceChange = (totalPrice: number, days: number) => {
    setCalculatedPrice(totalPrice);
    setRentalDays(days);
  };

  const handleBooking = async () => {
    if (!toolId || !selectedStartDate || !selectedEndDate || !quantity) {
      alert("Veuillez sélectionner les dates et la quantité.");
      return;
    }
    if (!selectedPaymentMethod) {
      alert('Veuillez sélectionner une méthode de paiement.');
      return;
    }
    try {
      const requestData = {
        toolId: parseInt(toolId || '0'),
        ownerId: owner.userId, // ✅ Utiliser owner.userId
        renterId: currentUser?.userId || '2612236b-9fc8-4b07-a668-c197c312265f',
        totalPrice: calculatedPrice || rentalPricePerDay * rentalDays,
        rentalDateStart: selectedStartDate.toISOString(),
        rentalDateEnd: selectedEndDate.toISOString(),
        paymentMethodId: selectedPaymentMethod,
      };
      
      console.log('Sending rental request:', requestData);
      
      const response = await fetch('/api/rental-bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Échec de la réservation.');
      }

      const result = await response.json();
      alert('Réservation créée avec succès ! ID: ' + result.rentalId);
    } catch (err: any) {
      alert("Erreur de réservation: " + err.message);
    }
  };

  return (
    <div className="nc-ListingDetailPage">
      <GallerySlider 
        galleryImgs={galleryImgs}
        className="max-w-screen-xl mx-auto rounded-3xl"
      />
      <div className="container mt-10">
        <nav className="text-sm text-neutral-500 dark:text-neutral-400 mb-4" aria-label="Breadcrumb">
          <ol className="flex items-center gap-2">
            <li><Link href={"/"} className="hover:underline">Home</Link></li>
            <li className="opacity-60">/</li>
            <li><Link href={"/tools"} className="hover:underline">Tools</Link></li>
            <li className="opacity-60">/</li>
            <li className="text-neutral-800 dark:text-neutral-200 truncate max-w-[60vw]">{title}</li>
          </ol>
        </nav>

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
                {owner.locationName && (
                  <span className="block text-neutral-500 dark:text-neutral-400">
                    📍 {owner.locationName}
                  </span>
                )}
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
                    onReviewSubmitted={refreshTool} 
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
                    onReviewSubmitted={refreshTool}
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

              {!isOwner ? (
                <>
                  {/* Display blocked dates */}
                  <div className="mt-6">
                    <BlockedDatesDisplay 
                      toolId={parseInt(toolId || '0')}
                      className="mb-4"
                    />
                  </div>

                  <div className="mt-6">
                    <DatePickerWithBlocking
                      toolId={parseInt(toolId || '0')}
                      toolPrice={rentalPricePerDay}
                      onDateChange={(start, end) => { 
                        setSelectedStartDate(start); 
                        setSelectedEndDate(end); 
                      }}
                      onPriceChange={handlePriceChange}
                      className="border border-neutral-200 dark:border-neutral-700 rounded-2xl"
                    />
                    <div className="mt-4">
                      <NcInputNumber label="Quantité" defaultValue={1} max={5} onChange={setQuantity} />
                    </div>
                  </div>

                  {/* Payment Method Selection */}
                  <div className="mt-6">
                    <PaymentMethodSelector
                      onMethodChange={setSelectedPaymentMethod}
                      selectedMethodId={selectedPaymentMethod}
                      className="border border-neutral-200 dark:border-neutral-700 rounded-2xl"
                    />
                  </div>

                  {/* Price Summary */}
                  {calculatedPrice > 0 && (
                    <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium text-green-800 dark:text-green-200">Résumé de la réservation</div>
                          <div className="text-xs text-green-600 dark:text-green-400">
                            {rentalDays} jour(s) × {rentalPricePerDay}€/jour
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-green-800 dark:text-green-200">
                            {calculatedPrice}€
                          </div>
                          <div className="text-xs text-green-600 dark:text-green-400">
                            Prix total
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleBooking}
                    disabled={!selectedStartDate || !selectedEndDate}
                    className="mt-6 w-full py-3 rounded-full font-semibold
                      bg-jaune-industriel text-bleu-nuit hover:bg-jaune-industriel/90
                      disabled:opacity-50 disabled:cursor-not-allowed
                      transition duration-200 hover:-translate-y-0.5 hover:shadow-md 
                      focus:outline-none focus:ring-2 focus:ring-jaune-industriel 
                      active:translate-y-0"
                  >
                    Réserver
                  </button>

                  <div className="mt-5 flex items-center justify-between text-neutral-600 dark:text-neutral-300 text-sm">
                    <button className="inline-flex items-center gap-2 hover:underline">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M4 13h5v-2H4v2Zm0 5h9v-2H4v2ZM4 8h13V6H4v2Zm15 3.59L23.41 16 19 20.41 14.59 16 16 14.59l3 3 3-3L19 11.59Z" /></svg>
                      Comparer
                    </button>
                    <button className="inline-flex items-center gap-2 hover:underline">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M12.1 21.35 10 19.45C5.4 15.36 2 12.27 2 8.5 2 6 4 4 6.5 4c1.54 0 3.04.99 3.57 2.36h.87C14.46 4.99 15.96 4 17.5 4 20 4 22 6 22 8.5c0 3.77-3.4 6.86-8 10.95l-1.9 1.9Z"/></svg>
                      Favoris
                    </button>
                  </div>
                  <div className="mt-4 text-xs text-neutral-500 dark:text-neutral-400">
                    Annulation gratuite sous 24h • Support 7/7
                  </div>
                </>
              ) : (
                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    👤 Ceci est votre outil
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