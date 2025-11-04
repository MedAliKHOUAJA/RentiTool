import React, { useState } from 'react';
import { StarRating } from './StarRating';
import { Review, getMainRating } from '../types';
import Avatar from '@/shared/Avatar';
import { 
  SENTIMENT_CONFIG, 
  RATING_LABELS, 
  LOCALE_FR,
  TRANSITION_CLASSES 
} from '@/features/reviews/constants';

interface ReviewCardProps {
  review: Review;
  reviewType: 'tool' | 'owner';
}

export function ReviewCard({ review, reviewType }: ReviewCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const mainRating = getMainRating(review);

  // Badge de sentiment
  const getSentimentBadge = () => {
    if (!review.sentiment) return null;

    const config = SENTIMENT_CONFIG[review.sentiment.sentiment];

    return (
      <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border ${config.bgColor} ${config.textColor} ${config.borderColor} ${TRANSITION_CLASSES.DEFAULT}`}>
        <span className="text-base">{config.emoji}</span>
        <span className="text-sm font-medium">{config.label}</span>
      </div>
    );
  };

  // Barre de sentiment
  const renderSentimentBar = () => {
    if (!review.sentiment) return null;

    const { confidenceScores } = review.sentiment;
    const positive = (confidenceScores.positive * 100).toFixed(0);
    const neutral = (confidenceScores.neutral * 100).toFixed(0);
    const negative = (confidenceScores.negative * 100).toFixed(0);

    return (
      <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Analyse des sentiments
          </p>
          {getSentimentBadge()}
        </div>

        {/* Barre de progression tricolore */}
        <div className="flex items-center h-3 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
          {confidenceScores.positive > 0 && (
            <div
              className={`h-full ${SENTIMENT_CONFIG.positive.barColor} ${TRANSITION_CLASSES.SLOW}`}
              style={{ width: `${confidenceScores.positive * 100}%` }}
              title={`Positif: ${positive}%`}
            />
          )}
          {confidenceScores.neutral > 0 && (
            <div
              className={`h-full ${SENTIMENT_CONFIG.neutral.barColor} ${TRANSITION_CLASSES.SLOW}`}
              style={{ width: `${confidenceScores.neutral * 100}%` }}
              title={`Neutre: ${neutral}%`}
            />
          )}
          {confidenceScores.negative > 0 && (
            <div
              className={`h-full ${SENTIMENT_CONFIG.negative.barColor} ${TRANSITION_CLASSES.SLOW}`}
              style={{ width: `${confidenceScores.negative * 100}%` }}
              title={`Négatif: ${negative}%`}
            />
          )}
        </div>

        {/* Légende avec pourcentages */}
        <div className="flex items-center justify-between mt-3 text-xs">
          <div className="flex items-center gap-1">
            <div className={`w-2 h-2 ${SENTIMENT_CONFIG.positive.barColor} rounded-full`}></div>
            <span className="text-gray-600 dark:text-gray-400">
              Positif {positive}%
            </span>
          </div>
          <div className="flex items-center gap-1">
            <div className={`w-2 h-2 ${SENTIMENT_CONFIG.neutral.barColor} rounded-full`}></div>
            <span className="text-gray-600 dark:text-gray-400">
              Neutre {neutral}%
            </span>
          </div>
          <div className="flex items-center gap-1">
            <div className={`w-2 h-2 ${SENTIMENT_CONFIG.negative.barColor} rounded-full`}></div>
            <span className="text-gray-600 dark:text-gray-400">
              Négatif {negative}%
            </span>
          </div>
        </div>

        {/* Note suggérée par l'IA (optionnel) */}
        {review.sentiment.rating !== undefined && review.sentiment.rating > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600 dark:text-gray-400">
                Note suggérée par l'IA:
              </span>
              <div className="flex items-center gap-1">
                <StarRating rating={review.sentiment.rating} size="sm" readonly />
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  {review.sentiment.rating.toFixed(1)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`bg-white dark:bg-neutral-800 rounded-2xl p-6 shadow-sm border border-neutral-200 dark:border-neutral-700 hover:shadow-md ${TRANSITION_CLASSES.DEFAULT}`}>
      {/* Header avec avatar et date */}
      <div className="flex items-start gap-3 mb-4">
        <Avatar
          imgUrl={review.reviewer.avatar}
          sizeClass="w-12 h-12"
        />
        <div className="flex-1">
          <h4 className="font-semibold text-neutral-900 dark:text-white">
            {review.reviewer.name}
          </h4>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            {new Date(review.createdAt).toLocaleDateString(
              LOCALE_FR.code, 
              LOCALE_FR.dateFormat
            )}
          </p>
        </div>
        
        {/* Note globale en haut à droite */}
        <div className="flex flex-col items-end">
          <div className="flex items-center gap-1">
            <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">
              {mainRating.toFixed(1)}
            </span>
            <span className="text-sm text-neutral-500 dark:text-neutral-400">/ 5</span>
          </div>
          <StarRating rating={mainRating} size="sm" readonly />
        </div>
      </div>

      {/* Ratings détaillés par catégorie */}
      <div className="space-y-2 mb-4">
        {reviewType === 'tool' && (
          <>
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-600 dark:text-neutral-400">
                {RATING_LABELS.tool.toolStatus}:
              </span>
              <StarRating rating={review.toolStatus ?? 0} size="sm" readonly />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-600 dark:text-neutral-400">
                {RATING_LABELS.tool.fiability}:
              </span>
              <StarRating rating={review.fiability ?? 0} size="sm" readonly />
            </div>
          </>
        )}
        {reviewType === 'owner' && (
          <>
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-600 dark:text-neutral-400">
                {RATING_LABELS.owner.communication}:
              </span>
              <StarRating rating={review.communication ?? 0} size="sm" readonly />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-600 dark:text-neutral-400">
                {RATING_LABELS.owner.ponctuality}:
              </span>
              <StarRating rating={review.ponctuality ?? 0} size="sm" readonly />
            </div>
          </>
        )}
      </div>

      {/* Commentaire */}
      {review.comment && (
        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900/30 rounded-lg">
          <p
            className={`text-neutral-700 dark:text-neutral-300 leading-relaxed ${
              !isExpanded && 'line-clamp-3'
            }`}
          >
            {review.comment}
          </p>
          {review.comment.length > 150 && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-sm font-semibold text-primary-600 hover:text-primary-800 mt-2"
            >
              {isExpanded ? 'Voir moins' : 'Voir plus'}
            </button>
          )}
        </div>
      )}

      {/* ✅ ANALYSE DES SENTIMENTS - Pour TOUS les types d'avis */}
      {renderSentimentBar()}

      {/* Images (si présentes) */}
      {review.images && review.images.length > 0 && (
        <div className="mt-4 flex gap-2 flex-wrap">
          {review.images.map((image, index) => (
            <img
              key={index}
              src={image}
              alt={`Photo ${index + 1}`}
              className={`w-20 h-20 object-cover rounded-lg hover:scale-105 cursor-pointer ${TRANSITION_CLASSES.DEFAULT}`}
              onClick={() => window.open(image, '_blank')}
            />
          ))}
        </div>
      )}

      {/* Réponse du propriétaire (si présente) */}
      {review.response && (
        <div className="mt-4 pl-4 border-l-2 border-primary-500 bg-primary-50 dark:bg-primary-900/20 p-4 rounded-r-xl">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-4 h-4 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
            <p className="text-sm font-semibold text-primary-700 dark:text-primary-400">
              Réponse du propriétaire
            </p>
          </div>
          <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
            {review.response}
          </p>
          {review.respondedAt && (
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
              Répondu le {new Date(review.respondedAt).toLocaleDateString(LOCALE_FR.code)}
            </p>
          )}
        </div>
      )}
    </div>
  );
}