'use client';

import React from 'react';
import { Review } from '@/features/reviews/types';
import { StarIcon } from '@heroicons/react/24/solid';
import { format } from 'date-fns';

interface PublicReviewCardProps {
  review: Review;
  ownerAvatar?: string; // Optional: Pass the owner's avatar for the reply
}

const PublicReviewCard: React.FC<PublicReviewCardProps> = ({ review, ownerAvatar }) => {
  const renderStars = (rating: number) => {
    const roundedRating = Math.round(rating);
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <StarIcon
            key={i}
            className={`h-5 w-5 ${i < roundedRating ? 'text-yellow-400' : 'text-gray-300'}`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="py-6 border-b border-gray-200">
      {/* Reviewer Info */}
      <div className="flex items-center mb-3">
        {/* Placeholder for reviewer avatar */}
        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center font-bold text-gray-500">
          {review.reviewer.name.charAt(0)}
        </div>
        <div className="ml-3">
          <p className="font-semibold text-gray-900">{review.reviewer.name}</p>
          <div className="flex items-center text-sm text-gray-500">
            {renderStars(review.toolStatus || review.communication || 0)}
            <span className="mx-2">·</span>
            <span>{review.createdAt ? format(new Date(review.createdAt), 'dd/MM/yyyy') : ''}</span>
          </div>
        </div>
      </div>

      {/* Review Comment */}
      <p className="text-gray-700">{review.comment}</p>

      {/* Owner's Reply */}
      {review.response && (
        <div className="mt-4 ml-4 pl-4 border-l-2 border-gray-200">
          <div className="flex items-center mb-2">
            {/* Placeholder for owner avatar */}
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center font-bold text-gray-500">
              {/* Assuming owner name can be fetched */}
              P
            </div>
            <div className="ml-3">
              <p className="font-semibold text-sm text-gray-800">Réponse du propriétaire</p>
              {review.respondedAt && (
                 <p className="text-xs text-gray-500">{format(new Date(review.respondedAt), 'dd/MM/yyyy')}</p>
              )}
            </div>
          </div>
          <p className="text-gray-600 italic">"{review.response}"</p>
        </div>
      )}
    </div>
  );
};

export default PublicReviewCard;
