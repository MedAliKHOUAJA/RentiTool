import { useState, useEffect } from 'react';
import { Review } from '../types';

export function useReviews(toolId: string) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/reviews?toolId=${toolId}`);
        if (!response.ok) throw new Error('Failed to fetch reviews');
        const data = await response.json();
        setReviews(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading reviews');
      } finally {
        setLoading(false);
      }
    };

    if (toolId) {
      fetchReviews();
    }
  }, [toolId]);

  return { reviews, loading, error };
}