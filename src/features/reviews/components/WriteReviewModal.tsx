'use client';

import React, { useState } from 'react';
import { StarRating } from './StarRating';
import { createReview } from '../actions/create-review';

interface WriteReviewModalProps {
  rentalId: number;
  raterId: string;
  ratedToolId?: string;
  ratedUserId?: string;
  ratedEntityTypeId: 1 | 2 | 3; // 1=Tool, 2=Rater, 3=Rated
  onReviewSubmitted: () => void;
}

export function WriteReviewModal({ 
  rentalId,
  raterId,
  ratedToolId,
  ratedUserId,
  ratedEntityTypeId,
  onReviewSubmitted 
}: WriteReviewModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Pour les outils
  const [toolStatus, setToolStatus] = useState(0);
  const [fiability, setFiability] = useState(0);
  
  // Pour les utilisateurs
  const [communication, setCommunication] = useState(0);
  const [ponctuality, setPonctuality] = useState(0);
  
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isToolReview = ratedEntityTypeId === 1;
  const isUserReview = ratedEntityTypeId === 2 || ratedEntityTypeId === 3;

  const resetForm = () => {
    setToolStatus(0);
    setFiability(0);
    setCommunication(0);
    setPonctuality(0);
    setComment('');
    setError(null);
  };

  const handleClose = () => {
    setIsOpen(false);
    resetForm();
  };

  const validateForm = (): boolean => {
    setError(null);

    if (isToolReview) {
      if (toolStatus === 0) {
        setError("Veuillez noter l'état de l'outil");
        return false;
      }
      if (fiability === 0) {
        setError("Veuillez noter la fiabilité de l'outil");
        return false;
      }
    }

    if (isUserReview) {
      if (communication === 0) {
        setError("Veuillez noter la communication");
        return false;
      }
      if (ponctuality === 0) {
        setError("Veuillez noter la ponctualité");
        return false;
      }
    }

    if (!comment.trim()) {
      setError("Veuillez ajouter un commentaire");
      return false;
    }

    if (comment.trim().length < 10) {
      setError("Le commentaire doit contenir au moins 10 caractères");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const reviewData = {
        rentalId,
        raterId,
        ratedToolId,
        ratedUserId,
        ratedEntityTypeId,
        ...(isToolReview && {
          toolStatus,
          fiability,
        }),
        ...(isUserReview && {
          communication,
          ponctuality,
        }),
        comment: comment.trim(),
      };

      const result = await createReview(reviewData);

      if (result.success) {
        handleClose();
        onReviewSubmitted();
        
        // Optionnel : Afficher le sentiment détecté
        if (result.sentiment) {
          console.log('Sentiment détecté:', result.sentiment);
        }
      } else {
        setError(result.error || "Erreur lors de la soumission de l'avis");
      }
    } catch (err) {
      setError("Une erreur inattendue s'est produite");
      console.error('Error submitting review:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)} 
        className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
      >
        Écrire un avis
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-800 p-6 rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-semibold mb-4 text-neutral-900 dark:text-white">
              Écrire un avis pour {isToolReview ? "l'outil" : 'l\'utilisateur'}
            </h2>

            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {isToolReview && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      État de l'outil *
                    </label>
                    <StarRating rating={toolStatus} onChange={setToolStatus} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      Fiabilité *
                    </label>
                    <StarRating rating={fiability} onChange={setFiability} />
                  </div>
                </>
              )}

              {isUserReview && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      Communication *
                    </label>
                    <StarRating rating={communication} onChange={setCommunication} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      Ponctualité *
                    </label>
                    <StarRating rating={ponctuality} onChange={setPonctuality} />
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Commentaire * (minimum 10 caractères)
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full px-4 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  rows={4}
                  placeholder="Partagez votre expérience..."
                />
                <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                  {comment.length} caractères
                </p>
                <p className="mt-1 text-xs text-primary-600 dark:text-primary-400">
                  💡 Votre commentaire sera analysé automatiquement pour détecter le sentiment
                </p>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button 
                  type="button" 
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-lg font-medium hover:bg-neutral-300 dark:hover:bg-neutral-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Annuler
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Analyse en cours...
                    </>
                  ) : (
                    'Envoyer'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}