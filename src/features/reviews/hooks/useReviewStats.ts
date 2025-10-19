import { useState, useEffect } from 'react';
import { ReviewStatistics } from '../types';

export function useReviewStats(toolId: string) {
  const [stats, setStats] = useState<ReviewStatistics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/reviews/statistics?toolId=${toolId}`);
        if (!response.ok) throw new Error('Failed to fetch stats');
        const data = await response.json();
        setStats(data);
      } catch (err) {
        console.error('Error loading stats:', err);
      } finally {
        setLoading(false);
      }
    };

    if (toolId) {
      fetchStats();
    }
  }, [toolId]);

  return { stats, loading };
}