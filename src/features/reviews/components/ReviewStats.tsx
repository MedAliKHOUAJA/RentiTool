// src/features/reviews/components/ReviewStats.tsx
import React from 'react';
import { StarRating } from './StarRating';
import { ReviewStatistics } from '../types';

interface ReviewStatsProps {
  stats: ReviewStatistics;
}

export function ReviewStats({ stats }: ReviewStatsProps) {
  const { averageRating, totalReviews, distribution } = stats;

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-700">
      {/* Average */}
      <div className="text-center mb-6">
        <div className="text-5xl font-bold text-neutral-900 dark:text-white mb-2">
          {averageRating.toFixed(1)}
        </div>
        <StarRating rating={averageRating} size="lg" readonly />
        <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-2">
          {totalReviews} {totalReviews > 1 ? 'avis' : 'avis'}
        </p>
      </div>

      {/* Distribution */}
      <div className="space-y-2">
        {[5, 4, 3, 2, 1].map((star) => {
          const count = distribution[star as keyof typeof distribution] || 0;
          const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;

          return (
            <div key={star} className="flex items-center gap-3">
              <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300 w-8">
                {star} ★
              </span>
              
              <div className="flex-1 h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-yellow-400 transition-all duration-500"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              
              <span className="text-sm text-neutral-600 dark:text-neutral-400 w-12 text-right">
                {count}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}