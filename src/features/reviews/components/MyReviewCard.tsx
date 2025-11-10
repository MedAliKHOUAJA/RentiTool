'use client';

import React, { useState } from 'react';
import { Review } from '@/features/reviews/types';
import { StarIcon } from '@heroicons/react/24/solid';
import { format } from 'date-fns';

interface MyReviewCardProps {
  review: Review;
  onReply: (reviewId: number, replyText: string) => Promise<void>;
  isSubmitting: boolean;
}

const MyReviewCard: React.FC<MyReviewCardProps> = ({ review, onReply, isSubmitting }) => {
  const [replyText, setReplyText] = useState(review.response || '');
  const [showReplyForm, setShowReplyForm] = useState(!review.response);

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (replyText.trim() === '') return;
    await onReply(review.ratingId, replyText);
    setShowReplyForm(false);
  };

  const renderStars = (rating: number) => {
    const roundedRating = Math.round(rating);
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <StarIcon
            key={i}
            className={`h-5 w-5 ${i < roundedRating ? 'text-yellow-400' : 'text-gray-300'}`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="bg-white shadow rounded-lg p-6 mb-4 border border-gray-200">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {review.reviewer.name}
            {review.toolTitle && (
              <span className="text-sm text-gray-500 font-normal ml-2">
                à propos de "{review.toolTitle}"
              </span>
            )}
          </h3>
          <div className="flex items-center mt-1">
            {renderStars(review.toolStatus || review.communication || 0)}
            <span className="ml-2 text-sm text-gray-500">
              {review.createdAt ? format(new Date(review.createdAt), 'dd/MM/yyyy') : ''}
            </span>
          </div>
        </div>
        {review.sentiment && (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              review.sentiment.sentiment === 'positive'
                ? 'bg-green-100 text-green-800'
                : review.sentiment.sentiment === 'negative'
                ? 'bg-red-100 text-red-800'
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            {review.sentiment.sentiment}
          </span>
        )}
      </div>

      <p className="text-gray-700 mb-4">{review.comment}</p>

      {review.response && (
        <div className="mt-4 p-3 bg-blue-50 rounded-md border border-blue-200">
          <p className="font-semibold text-blue-800">Votre réponse :</p>
          <p className="text-blue-700 italic">{review.response}</p>
          {review.respondedAt && (
            <p className="text-xs text-blue-600 mt-1">
              Répondu le {format(new Date(review.respondedAt), 'dd/MM/yyyy')}
            </p>
          )}
          <button
            onClick={() => setShowReplyForm(true)}
            className="mt-2 text-sm text-indigo-600 hover:text-indigo-800 font-medium"
          >
            Modifier la réponse
          </button>
        </div>
      )}

      {showReplyForm && (
        <form onSubmit={handleReplySubmit} className="mt-4">
          <label htmlFor={`reply-${review.ratingId}`} className="block text-sm font-medium text-gray-700">
            Votre réponse :
          </label>
          <textarea
            id={`reply-${review.ratingId}`}
            rows={3}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Écrivez votre réponse ici..."
            disabled={isSubmitting}
          ></textarea>
          <div className="mt-3 flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => {
                setReplyText(review.response || '');
                setShowReplyForm(false);
              }}
              className="inline-flex justify-center rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              disabled={isSubmitting}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              disabled={isSubmitting || replyText.trim() === ''}
            >
              {isSubmitting ? 'Envoi...' : 'Envoyer la réponse'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default MyReviewCard;
