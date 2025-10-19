// components/SaveButton.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { saveSharedCard } from '@/features/Cards/actions/Cards';
import toast from 'react-hot-toast';

const SaveButton = ({ cardId, notes }: { cardId: number; notes?: string }) => {
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
  }, [cardId]);

  const handleSave = async () => {
    if (saved || loading) return;

    setLoading(true);
    try {
      await saveSharedCard(cardId, notes);
      setSaved(true);
      toast.success('Carte sauvegardée avec succès !');
    } catch (err) {
      toast.error('Erreur lors de la sauvegarde de la carte');
      console.error('Save error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleSave}
      disabled={saved || loading}
      className={`px-6 py-3 text-white rounded-lg transition-colors ${
        saved ? 'bg-gray-400 cursor-not-allowed' : loading ? 'bg-green-400' : 'bg-green-500 hover:bg-green-600'
      }`}
    >
      {loading ? 'Sauvegarde...' : saved ? 'Sauvegardé' : 'Sauvegarder'}
    </button>
  );
};

export default SaveButton;