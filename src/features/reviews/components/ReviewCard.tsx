import React from 'react';
import { StarRating } from './StarRating';
import { Review } from '../types';
import Avatar from '@/shared/Avatar';

interface ReviewCardProps {
  review: Review;
}

export function ReviewCard({ review }: ReviewCardProps) {
  return (
    <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 shadow-sm border border-neutral-200 dark:border-neutral-700">
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <Avatar 
          imgUrl={review.reviewer.avatar}
          sizeClass="w-12 h-12"
        />
        <div className="flex-1">
          <h4 className="font-semibold text-neutral-900 dark:text-white">
            {review.reviewer.name}
          </h4>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            {new Date(review.createdAt).toLocaleDateString('fr-FR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>
      </div>
      
      {/* Rating */}
      <StarRating rating={review.rating} readonly />
      
      {/* Comment */}
      {review.comment && (
        <p className="mt-4 text-neutral-700 dark:text-neutral-300">
          {review.comment}
        </p>
      )}
      
      {/* Images */}
      {review.images && review.images.length > 0 && (
        <div className="mt-4 flex gap-2">
          {review.images.map((image, index) => (
            <img
              key={index}
              src={image}
              alt={`Photo ${index + 1}`}
              className="w-20 h-20 object-cover rounded-lg"
            />
          ))}
        </div>
      )}
      
      {/* Owner response */}
      {review.response && (
        <div className="mt-4 pl-4 border-l-2 border-primary-500 bg-primary-50 dark:bg-primary-900/20 p-3 rounded-r-lg">
          <p className="text-sm font-semibold text-primary-700 dark:text-primary-400 mb-1">
            Réponse du propriétaire
          </p>
          <p className="text-sm text-neutral-700 dark:text-neutral-300">
            {review.response}
          </p>
        </div>
      )}
    </div>
  );
}