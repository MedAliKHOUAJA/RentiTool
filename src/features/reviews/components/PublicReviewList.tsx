'use client';

import React from 'react';
import { Review } from '@/features/reviews/types';
import PublicReviewCard from './PublicReviewCard';

interface PublicReviewListProps {
  reviews: Review[];
  ownerAvatar?: string;
}

const PublicReviewList: React.FC<PublicReviewListProps> = ({ reviews, ownerAvatar }) => {
  if (!reviews || reviews.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        Aucun avis pour le moment.
      </div>
    );
  }

  return (
    <div>
      {reviews.map((review) => (
        <PublicReviewCard
          key={review.ratingId}
          review={review}
          ownerAvatar={ownerAvatar}
        />
      ))}
    </div>
  );
};

export default PublicReviewList;
