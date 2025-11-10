'use client';

import { useState, useEffect } from 'react';
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

  // ✅ Fonction de fetch (pas de useCallback pour éviter les problèmes de deps)
  const fetchTools = async () => {
    console.log('🔄 [useUserTools] fetchTools appelé', { enabled, ownerId, sortKey, searchQuery });

    if (!enabled) {
      console.log('⚠️ [useUserTools] Fetch désactivé (enabled = false)');
      return;
    }

    if (!ownerId) {
      console.log('⚠️ [useUserTools] Pas d\'ownerId, skip');
      setTools([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('📥 [useUserTools] Début fetch...', { sortKey, searchQuery, ownerId });

      // Construire les paramètres
      const params = new URLSearchParams();
      if (sortKey) params.append('sortKey', sortKey);
      if (searchQuery?.trim()) params.append('searchQuery', searchQuery.trim());

      const url = `/api/tools/my-tools${params.toString() ? `?${params.toString()}` : ''}`;
      console.log('📡 [useUserTools] URL:', url);

      const response = await fetch(url);
      console.log('📡 [useUserTools] Response status:', response.status);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Non authentifié. Veuillez vous reconnecter.');
        }
        const errorText = await response.text();
        console.error('❌ [useUserTools] Error response:', errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ [useUserTools] Data reçue:', data);
      console.log('✅ [useUserTools] Tools count:', data.tools?.length || 0);

      if (data.success) {
        setTools(data.tools || []);
      } else {
        throw new Error(data.error || 'Failed to fetch tools');
      }
    } catch (err: any) {
      console.error('❌ [useUserTools] Erreur complète:', err);
      setError(err.message || 'An error occurred while fetching tools');
      setTools([]);
    } finally {
      setLoading(false);
    }
  };

  // ✅ useEffect simplifié avec deps directes
  useEffect(() => {
    console.log('🔄 [useUserTools] useEffect triggered', { 
      enabled, 
      ownerId, 
      sortKey, 
      searchQuery 
    });

    fetchTools();
  }, [enabled, ownerId, sortKey, searchQuery]); // ⚠️ Dépendances directes

  return {
    tools,
    loading,
    error,
    refresh: fetchTools,
  };
}