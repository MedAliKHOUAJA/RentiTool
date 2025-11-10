'use client';

import React from 'react';
import { ReviewStatistics } from '@/features/reviews/types';
import { StarIcon } from '@heroicons/react/24/solid';

interface MyReviewsStatsProps {
  statistics: ReviewStatistics;
}

const MyReviewsStats: React.FC<MyReviewsStatsProps> = ({ statistics }) => {
  const { averageRating, totalReviews, distribution, sentimentDistribution } = statistics;

  return (
    <div className="bg-white shadow rounded-lg p-6 mb-6">
      <h2 className="text-2xl font-semibold text-gray-900 mb-4">Statistiques des Avis</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-md">
          <p className="text-5xl font-bold text-indigo-600">{averageRating.toFixed(1)}</p>
          <div className="flex items-center mt-2">
            {[...Array(5)].map((_, i) => (
              <StarIcon
                key={i}
                className={`h-6 w-6 ${i < Math.round(averageRating) ? 'text-yellow-400' : 'text-gray-300'}`}
              />
            ))}
          </div>
          <p className="text-sm text-gray-500 mt-1">Moyenne des notes</p>
        </div>

        <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-md">
          <p className="text-5xl font-bold text-indigo-600">{totalReviews}</p>
          <p className="text-sm text-gray-500 mt-1">Avis au total</p>
        </div>

        {sentimentDistribution && (
          <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-md">
            <p className="text-xl font-bold text-gray-900">Sentiment</p>
            <div className="mt-2 text-sm text-gray-600">
              <p>Positif: {sentimentDistribution.positive}</p>
              <p>Neutre: {sentimentDistribution.neutral}</p>
              <p>Négatif: {sentimentDistribution.negative}</p>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Distribution des notes</h3>
        {Object.entries(distribution).sort(([a], [b]) => parseInt(b) - parseInt(a)).map(([star, count]) => (
          <div key={star} className="flex items-center mb-1">
            <span className="w-8 text-sm font-medium text-gray-600">{star} étoile{parseInt(star) > 1 ? 's' : ''}</span>
            <div className="flex-1 bg-gray-200 rounded-full h-2.5 mx-2">
              <div
                className="bg-indigo-600 h-2.5 rounded-full"
                style={{ width: `${(count / totalReviews) * 100 || 0}%` }}
              ></div>
            </div>
            <span className="text-sm text-gray-600">{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MyReviewsStats;
