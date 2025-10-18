import React, { useState } from 'react';
import { StarRating } from './StarRating';
import { createReview } from '../actions'; 

interface WriteReviewModalProps {
  toolId: string;
  ownerId: string;
  reviewType: 'tool' | 'owner';
  onReviewSubmitted: () => void; // Add this prop
}

export function WriteReviewModal({ toolId, ownerId, reviewType }: WriteReviewModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [toolCondition, setToolCondition] = useState(0);
  const [fiability, setFiability] = useState(0);
  const [communication, setCommunication] = useState(0);
  const [punctuality, setPunctuality] = useState(0);
  const [comment, setComment] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const reviewData = {
      bookingId: 1,
      toolId: reviewType === 'tool' ? toolId : undefined,
      revieweeId: reviewType === 'owner' ? ownerId : undefined,
      rating: fiability,
      communication,
      toolCondition,
      punctuality,
      comment,
    };

    const result = await createReview(reviewData);

    if (result.success) {
      alert("Avis soumis avec succès!");
      setIsOpen(false);
      // TODO: Refresh reviews on the page
    } else {
      alert("Erreur lors de la soumission de l'avis: " + result.error);
    }
  };

  return (
    <>
      <button onClick={() => setIsOpen(true)} className="bg-primary-500 text-white px-4 py-2 rounded-md">
        Écrire un avis
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-neutral-800 p-6 rounded-lg w-full max-w-lg">
            <h2 className="text-2xl font-semibold mb-4">Écrire un avis pour {reviewType === 'tool' ? 'l\'outil' : 'le propriétaire'}</h2>
            <form onSubmit={handleSubmit}>
              {reviewType === 'tool' && (
                <>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">État de l'outil</label>
                    <StarRating rating={toolCondition} onChange={setToolCondition} />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Fiabilité</label>
                    <StarRating rating={fiability} onChange={setFiability} />
                  </div>
                </>
              )}
              {reviewType === 'owner' && (
                <>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Communication</label>
                    <StarRating rating={communication} onChange={setCommunication} />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Ponctualité</label>
                    <StarRating rating={punctuality} onChange={setPunctuality} />
                  </div>
                </>
              )}
              <div className="mb-4">
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Commentaire</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full px-4 py-2 border border-neutral-200 dark:border-neutral-700 rounded-md"
                  rows={4}
                ></textarea>
              </div>
              <div className="flex justify-end space-x-2">
                <button type="button" onClick={() => setIsOpen(false)} className="bg-gray-500 text-white px-4 py-2 rounded-md">
                  Annuler
                </button>
                <button type="submit" className="bg-primary-500 text-white px-4 py-2 rounded-md">
                  Envoyer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}