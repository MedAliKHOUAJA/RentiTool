"use client";

import React, { useState } from 'react';
import { useSwipeable } from 'react-swipeable';
import { ReviewCard } from './ReviewCard';
import { Review } from '../types';
import { useWindowSize } from '@/app/ClientCommons';
import ButtonCircle from '@/shared/ButtonCircle';
import { ArrowLeftIcon, ArrowRightIcon } from '@heroicons/react/24/solid';

interface ReviewListProps {
  reviews: Review[];
  loading?: boolean;
  reviewType: 'tool' | 'owner';
}

export function ReviewList({ reviews, loading, reviewType }: ReviewListProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const { width } = useWindowSize();

  const handlers = useSwipeable({
    onSwipedLeft: () => setCurrentIndex((prev) => (prev + 1) % reviews.length),
    onSwipedRight: () => setCurrentIndex((prev) => (prev - 1 + reviews.length) % reviews.length),
    preventScrollOnSwipe: true,
    trackMouse: true,
  });

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-neutral-200 dark:bg-neutral-700 rounded-2xl h-40 animate-pulse" />
        ))}
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📝</div>
        <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">
          Aucun avis pour le moment
        </h3>
        <p className="text-neutral-600 dark:text-neutral-400">
          Soyez le premier à laisser un avis !
        </p>
      </div>
    );
  }

  const isMobile = width < 768; // md breakpoint

  if (isMobile) {
    return (
      <div {...handlers} className="relative overflow-hidden">
        <div
          className="flex transition-transform duration-300 ease-in-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {reviews.map((review) => (
            <div key={review.ratingId} className="w-full flex-shrink-0">
              <ReviewCard review={review} reviewType={reviewType} />
            </div>
          ))}
        </div>
        {reviews.length > 1 && (
          <>
            <ButtonCircle
              className="absolute left-2 top-1/2 -translate-y-1/2"
              onClick={() => setCurrentIndex((prev) => (prev - 1 + reviews.length) % reviews.length)}
            >
              <ArrowLeftIcon className="w-6 h-6" />
            </ButtonCircle>
            <ButtonCircle
              className="absolute right-2 top-1/2 -translate-y-1/2"
              onClick={() => setCurrentIndex((prev) => (prev + 1) % reviews.length)}
            >
              <ArrowRightIcon className="w-6 h-6" />
            </ButtonCircle>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {reviews.map((review) => (
        <ReviewCard key={review.ratingId} review={review} reviewType={reviewType} />
      ))}
    </div>
  );
}