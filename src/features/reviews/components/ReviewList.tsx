import React from 'react';
import { ReviewCard } from './ReviewCard';
import { Review } from '../types';

interface ReviewListProps {
  reviews: Review[];
  loading?: boolean;
}

export function ReviewList({ reviews, loading }: ReviewListProps) {
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

  return (
    <div className="space-y-6">
      {reviews.map((review) => (
        <ReviewCard key={review.id} review={review} />
      ))}
    </div>
  );
}