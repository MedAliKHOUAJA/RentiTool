// src/features/Cards/hooks/useCardAI.ts

import { useState } from 'react';
import {
  enrichCardData,
  suggestCardTags,
  analyzeCardCollection,
} from '../services/aiService';
import { Card } from '../types';

export const useCardAI = () => {
  const [enrichLoading, setEnrichLoading] = useState(false);
  const [tagsLoading, setTagsLoading] = useState(false);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const enrichCard = async (card: Partial<Card>) => {
    setEnrichLoading(true);
    setError(null);
    try {
      const result = await enrichCardData({
        firstName: card.FirstName || '',
        lastName: card.LastName || '',
        jobTitle: card.JobTitle || '',
        companyName: card.CompanyName || '',
        specialties: card.SpecialtiesAndExpertise || [],
      });
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur enrichissement';
      setError(message);
      throw err;
    } finally {
      setEnrichLoading(false);
    }
  };

  const getTags = async (card: Partial<Card>) => {
    setTagsLoading(true);
    setError(null);
    try {
      const tags = await suggestCardTags({
        firstName: card.FirstName || '',
        lastName: card.LastName || '',
        jobTitle: card.JobTitle || '',
        companyName: card.CompanyName || '',
        specialties: card.SpecialtiesAndExpertise || [],
        description: card.Notes || '',
      });
      return tags;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la suggestion des tags';
      setError(message);
      throw err;
    } finally {
      setTagsLoading(false);
    }
  };

  const analyzeCollection = async (cards: Card[]) => {
    setAnalysisLoading(true);
    setError(null);
    try {
      const analysis = await analyzeCardCollection(
        cards.map((c) => ({
          firstName: c.FirstName || '',
          lastName: c.LastName || '',
          jobTitle: c.JobTitle || '',
          companyName: c.CompanyName || '',
          specialties: c.SpecialtiesAndExpertise || [],
        }))
      );
      return analysis;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de l\'analyse';
      setError(message);
      throw err;
    } finally {
      setAnalysisLoading(false);
    }
  };

  return {
    enrichCard,
    getTags,
    analyzeCollection,
    enrichLoading,
    tagsLoading,
    analysisLoading,
    error,
  };
};