'use client';

import { useState, useEffect, useCallback } from 'react';
import { Tool } from '../../domain/tool';
import { SortKey } from '../../domain/tool.types';

interface UseUserToolsParams {
  sortKey: SortKey;
  searchQuery: string;
  enabled?: boolean;
  ownerId?: string;
}

export function useUserTools({ 
  sortKey, 
  searchQuery, 
  enabled = true,
  ownerId 
}: UseUserToolsParams) {
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTools = useCallback(async () => {
    if (!enabled) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        sortKey,
        searchQuery,
      });

      if (ownerId) {
        params.append('ownerId', ownerId);
      }

      const response = await fetch(`/api/tools?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setTools(data.tools || []);
      } else {
        setError(data.error || 'Failed to fetch tools');
      }
    } catch (err) {
      console.error('Error fetching tools:', err);
      setError('An error occurred while fetching tools');
    } finally {
      setLoading(false);
    }
  }, [sortKey, searchQuery, enabled, ownerId]);

  useEffect(() => {
    fetchTools();
  }, [fetchTools]);

  return {
    tools,
    loading,
    error,
    refresh: fetchTools,
  };
}