'use client';

import React, { useEffect, useState } from 'react';
import { Review, ReviewStatistics } from '@/features/reviews/types';
import MyReviewsStats from '@/features/reviews/components/MyReviewsStats';
import MyReviewCard from '@/features/reviews/components/MyReviewCard';

interface ReviewsPageData {
  reviews: Review[];
  statistics: ReviewStatistics;
}

const ReviewsPage: React.FC = () => {
  const [data, setData] = useState<ReviewsPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isReplying, setIsReplying] = useState(false);

  const fetchReviews = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/my-reviews');
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to fetch reviews');
      }
      const result: ReviewsPageData = await res.json();
      setData(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleReply = async (reviewId: number, replyText: string) => {
    setIsReplying(true);
    try {
      const res = await fetch(`/api/my-reviews/${reviewId}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ responseText: replyText }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to post reply');
      }

      await fetchReviews(); // Refresh data after successful reply
    } catch (err: any) {
      alert(`Erreur lors de l'envoi de la réponse: ${err.message}`);
    }
    finally {
      setIsReplying(false);
    }
  };

  if (loading) {
    return <div className="container mx-auto p-4 text-center">Chargement des avis...</div>;
  }

  if (error) {
    return <div className="container mx-auto p-4 text-red-500 text-center">Erreur: {error}</div>;
  }

  if (!data || data.reviews.length === 0) {
    return <div className="container mx-auto p-4 text-center">Aucun avis trouvé pour vos outils.</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Mes Avis et Statistiques</h1>

      {data.statistics && <MyReviewsStats statistics={data.statistics} />}

      <div className="mt-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Détail des Avis</h2>
        {data.reviews.map((review) => (
          <MyReviewCard
            key={review.ratingId}
            review={review}
            onReply={handleReply}
            isSubmitting={isReplying}
          />
        ))}
      </div>
    </div>
  );
};

export default ReviewsPage;