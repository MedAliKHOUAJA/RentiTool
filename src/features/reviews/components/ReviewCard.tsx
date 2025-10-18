import React from 'react';
import { StarRating } from './StarRating';
import { Review } from '../types';
import Avatar from '@/shared/Avatar';

interface ReviewCardProps {
  review: Review;
  reviewType: 'tool' | 'owner';
}

export function ReviewCard({ review, reviewType }: ReviewCardProps) {
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
      <div className="flex items-center space-x-2">
        {reviewType === 'tool' && (
          <>
            <div className="flex items-center space-x-1">
                <span className="text-sm text-neutral-500 dark:text-neutral-400">État de l'outil:</span>
                <StarRating rating={review.toolCondition ?? 0} readonly />
            </div>
            <div className="flex items-center space-x-1">
                <span className="text-sm text-neutral-500 dark:text-neutral-400">Fiabilité:</span>
                <StarRating rating={review.rating} readonly />
            </div>
          </>
        )}
        {reviewType === 'owner' && (
          <>
            <div className="flex items-center space-x-1">
                <span className="text-sm text-neutral-500 dark:text-neutral-400">Communication:</span>
                <StarRating rating={review.communication ?? 0} readonly />
            </div>
            <div className="flex items-center space-x-1">
                <span className="text-sm text-neutral-500 dark:text-neutral-400">Ponctualité:</span>
                <StarRating rating={review.punctuality ?? 0} readonly />
            </div>
          </>
        )}
      </div>
      
      {/* Comment */}
      {review.comment && (
        <p className="mt-4 text-neutral-700 dark:text-neutral-300">
          {review.comment}
        </p>
      )}

      {/* Feeling Analysis (Placeholder) */}
      <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Analyse des sentiments (à venir)</p>
        <div className="flex items-center mt-2">
            <div className="w-1/4 h-2 bg-green-500 rounded-l-full"></div>
            <div className="w-1/2 h-2 bg-yellow-500"></div>
            <div className="w-1/4 h-2 bg-red-500 rounded-r-full"></div>
        </div>
      </div>
      
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