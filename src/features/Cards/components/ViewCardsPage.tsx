'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  getCardsByUserId,
  deleteCard,
  getSavedCardsByUserId,
  getCurrentUser,
  updateCard,
} from '@/features/Cards/actions/Cards';
import { useCardAI } from '@/features/Cards/hooks/useCardAI';
import { Card } from '@/features/Cards/types';
import toast from 'react-hot-toast';
import { Edit2, Trash2, Eye, Plus, Tag, Sparkles, X } from 'lucide-react';

// Helper: Parse tags safely (JSON string -> array, or fallback to empty array)
const parseTags = (tagsValue: any): string[] => {
  if (!tagsValue) return [];
  if (Array.isArray(tagsValue)) return tagsValue;
  if (typeof tagsValue === 'string') {
    try {
      return JSON.parse(tagsValue);
    } catch (e) {
      console.warn('Failed to parse tags JSON:', tagsValue);
      return [];
    }
  }
  return [];
};

// SmartTaggingUI Component
const SmartTaggingUI = ({ 
  card, 
  onTagsUpdate, 
  onClose 
}: { 
  card: Card; 
  onTagsUpdate: (tags: string[]) => void;
  onClose: () => void;
}) => {
  const { getTags, tagsLoading } = useCardAI();
  const [tags, setTags] = useState<string[]>(parseTags(card.Tags)); // ✅ Fixed: Always parse to array
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSuggestTags = async () => {
    try {
      const suggestedTags = await getTags(card);
      if (suggestedTags.length > 0) {
        setTags(suggestedTags);
        setShowTagSuggestions(true);
        setIsEditing(true); // Auto-enable editing after suggestion
        toast.success('Tags suggérés par IA !');
      } else {
        toast.error('Aucune suggestion de tags générée.');
      }
    } catch (error) {
      console.error('Tagging failed:', error);
      toast.error('Erreur lors de la suggestion des tags');
    }
  };

  const handleSaveTags = async () => {
    setIsSaving(true);
    try {
      const result = await updateCard(card.CardId, { tags });

      if (result.success) {
        onTagsUpdate(tags);
        setIsEditing(false);
        toast.success('Tags sauvegardés !');
        onClose(); // Close the tagging UI after save
      } else {
        toast.error(result.error || 'Erreur lors de la sauvegarde');
      }
    } catch (error) {
      console.error('Save tags error:', error);
      toast.error('Erreur lors de la sauvegarde des tags');
    } finally {
      setIsSaving(false);
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const addCustomTag = () => {
    const newTag = prompt('Entrez un nouveau tag:');
    if (newTag && newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setIsEditing(true);
    }
  };

  return (
    <div 
      className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700"
      onClick={(e) => e.stopPropagation()} // Prevent card click
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Tag className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Tags</span>
        </div>
        <div className="flex items-center gap-2">
          {!isEditing && (
            <button
              onClick={handleSuggestTags}
              disabled={tagsLoading || isSaving}
              className="text-xs px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded hover:bg-purple-200 dark:hover:bg-purple-900/50 disabled:opacity-50 flex items-center gap-1 transition-colors"
            >
              {tagsLoading ? (
                <>
                  <div className="w-3 h-3 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                  Suggestion...
                </>
              ) : (
                <>
                  <Sparkles className="w-3 h-3" />
                  Suggérer
                </>
              )}
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
            title="Fermer"
          >
            <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          </button>
        </div>
      </div>

      {/* Tags Display with Scrolling */}
      <div className="max-h-32 overflow-y-auto mb-3">
        <div className="flex flex-wrap gap-2">
          {tags.length > 0 ? (
            tags.map((tag, i) => (
              <div
                key={i}
                className="px-3 py-1 bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 rounded-full text-xs font-medium flex items-center gap-2"
              >
                {tag}
                {isEditing && (
                  <button
                    onClick={() => removeTag(tag)}
                    className="text-purple-500 hover:text-purple-700 dark:hover:text-purple-200"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))
          ) : (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Aucun tag - Cliquez sur Suggérer
            </span>
          )}
        </div>
      </div>

      {showTagSuggestions && (
        <div className="text-xs text-green-600 dark:text-green-400 mb-2 flex items-center gap-1">
          <span>✓</span>
          <span>Tags suggérés par IA</span>
        </div>
      )}

      {/* Action Buttons */}
      {!isEditing && tags.length > 0 && (
        <div className="flex gap-2">
          <button
            onClick={() => setIsEditing(true)}
            className="flex-1 text-xs px-3 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
          >
            Modifier
          </button>
          <button
            onClick={addCustomTag}
            className="flex-1 text-xs px-3 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
          >
            Ajouter
          </button>
        </div>
      )}

      {isEditing && (
        <div className="flex gap-2">
          <button
            onClick={handleSaveTags}
            disabled={isSaving}
            className="flex-1 text-xs px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 transition-colors font-medium"
          >
            {isSaving ? (
              <span className="flex items-center justify-center gap-1">
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Enregistrement...
              </span>
            ) : (
              'Enregistrer'
            )}
          </button>
          <button
            onClick={() => {
              setIsEditing(false);
              setTags(parseTags(card.Tags)); // ✅ Reset to parsed original
            }}
            disabled={isSaving}
            className="flex-1 text-xs px-3 py-2 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors font-medium disabled:opacity-50"
          >
            Annuler
          </button>
        </div>
      )}
    </div>
  );
};

// Main ViewCardsPage Component
const ViewCardsPage = () => {
  const router = useRouter();
  const [cards, setCards] = useState<Card[]>([]);
  const [ownCardIds, setOwnCardIds] = useState<Set<number>>(new Set());
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingCardId, setDeletingCardId] = useState<number | null>(null);
  const [expandedTagsCard, setExpandedTagsCard] = useState<number | null>(null);

  useEffect(() => {
    const fetchCards = async () => {
      try {
        const user = await getCurrentUser();
        if (!user) {
          router.push('/login');
          return;
        }
        setCurrentUserId(user.userId);

        const [ownCards, savedCards] = await Promise.all([
          getCardsByUserId(),
          getSavedCardsByUserId(),
        ]);

        const ownIds = new Set((ownCards || []).map((card) => card.CardId));
        setOwnCardIds(ownIds);

        const allCards = [...(ownCards || []), ...(savedCards || [])].reduce((acc, card) => {
          if (!acc.find((c: { CardId: any }) => c.CardId === card.CardId)) acc.push(card);
          return acc;
        }, [] as Card[]);

        allCards.sort((a: { CardId: number }, b: { CardId: number }) => b.CardId - a.CardId);

        setCards(allCards);
        console.log('Current user:', user.userId);
        console.log('Total cards fetched:', allCards.length);
      } catch (err) {
        console.error('Error fetching cards:', err);

        if (err instanceof Error && err.message.includes('Unauthorized')) {
          toast.error('Session expirée, veuillez vous reconnecter');
          router.push('/login');
          return;
        }

        setError('Erreur lors de la récupération des cartes');
        toast.error('Erreur lors du chargement des cartes');
      } finally {
        setLoading(false);
      }
    };
    fetchCards();
  }, [router]);

  const handleDelete = async (cardId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette carte ?')) return;

    setDeletingCardId(cardId);
    try {
      const result = await deleteCard(cardId);
      if (result.success) {
        toast.success('Carte supprimée avec succès !');
        setCards(cards.filter((card) => card.CardId !== cardId));
        setOwnCardIds((prev) => {
          const newSet = new Set(prev);
          newSet.delete(cardId);
          return newSet;
        });
      } else {
        toast.error(result.error || 'Échec de la suppression de la carte');
      }
    } catch (err) {
      console.error('Delete error:', err);

      if (err instanceof Error && err.message.includes('Unauthorized')) {
        toast.error('Session expirée, veuillez vous reconnecter');
        router.push('/login');
        return;
      }

      toast.error('Erreur lors de la suppression de la carte');
    } finally {
      setDeletingCardId(null);
    }
  };

  const handleUpdate = (cardId: number) => {
    router.push(`/account/cards/edit/${cardId}`);
  };

  const handleViewDetails = (cardId: number) => {
    router.push(`/account/cards/details/${cardId}`);
  };

  const handleTagsUpdate = useCallback((cardId: number, newTags: string[]) => {
    setCards((prevCards) =>
      prevCards.map((card) =>
        card.CardId === cardId ? { ...card, Tags: newTags } : card // Store as array; action will JSON.stringify
      )
    );
  }, []);

  const cardColors = [
    'from-blue-600 to-indigo-700',
    'from-purple-600 to-pink-600',
    'from-emerald-600 to-teal-600',
    'from-orange-600 to-red-600',
    'from-cyan-600 to-blue-600',
    'from-violet-600 to-purple-600',
  ];

  if (loading) {
    return (
      <div className="container mx-auto py-10 px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Chargement de vos cartes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-10 px-4">
        <div className="text-center">
          <p className="text-red-600 text-xl mb-4">{error}</p>
          <button
            onClick={() => router.push('/login')}
            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            Se connecter
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">
              Mes Cartes de Visite
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
              Gérez et affichez vos cartes personnelles et sauvegardées
            </p>
          </div>
          <button
            onClick={() => router.push('/account/cards/create')}
            className="px-4 py-2 sm:px-6 sm:py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors shadow-lg flex items-center justify-center space-x-2 w-full sm:w-auto text-sm sm:text-base"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Nouvelle Carte</span>
          </button>
        </div>
      </div>

      {/* Total Cards */}
      <div className="mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 shadow-md border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm font-medium">Total Cartes</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mt-1">{cards.length}</p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                {ownCardIds.size} carte(s) personnelle(s) • {cards.length - ownCardIds.size} sauvegardée(s)
              </p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
              <span className="text-xl sm:text-2xl">📇</span>
            </div>
          </div>
        </div>
      </div>

      {/* Cards Horizontal Scroll */}
      {cards.length > 0 ? (
        <div className="flex overflow-x-auto gap-4 sm:gap-6 pb-4 snap-x snap-mandatory">
          {cards.map((card, index) => {
            const gradient = cardColors[index % cardColors.length];
            const isOwnCard = ownCardIds.has(card.CardId);
            const isTagsExpanded = expandedTagsCard === card.CardId;
            const parsedTags = parseTags(card.Tags); // ✅ Parse for button logic
            const hasTags = parsedTags.length > 0;

            return (
              <div key={card.CardId} className="group relative flex-shrink-0 w-[90%] sm:w-80 md:w-[calc(50%-1rem)] lg:w-[calc(33.333%-1.333rem)] snap-start">
                {/* Badge: Own card */}
                {isOwnCard && (
                  <div className="absolute -top-2 -left-2 z-10">
                    <div className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-semibold shadow-lg">
                      Ma carte
                    </div>
                  </div>
                )}

                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-200 dark:border-gray-700 h-full">
                  {/* Gradient Header - Made height auto with min-h for better mobile stacking */}
                  <div className={`bg-gradient-to-br ${gradient} p-4 sm:p-6 relative overflow-hidden min-h-[160px] sm:min-h-[192px]`}>
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-white opacity-10 rounded-full"></div>
                    <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-white opacity-10 rounded-full"></div>

                    {/* Logo */}
                    <div className="absolute top-4 right-4">
                      {card.CompanyLogoUrl ? (
                        <img
                          src={`data:image/jpeg;base64,${card.CompanyLogoUrl}`}
                          alt="Logo"
                          className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-lg p-1 object-contain"
                        />
                      ) : (
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                          <span className="text-white font-bold text-base sm:text-lg">
                            {card.CompanyName?.charAt(0)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Profile and Company - Flex col to prevent overlap */}
                    <div className="relative z-10 flex flex-col gap-3 sm:gap-4">
                      <div className="flex items-center space-x-3">
                        {card.ProfilePictureUrl ? (
                          <img
                            src={`data:image/jpeg;base64,${card.ProfilePictureUrl}`}
                            alt="Profile"
                            className="w-12 h-12 sm:w-16 sm:h-16 rounded-full border-3 border-white shadow-lg object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full border-3 border-white bg-white bg-opacity-20 flex items-center justify-center shadow-lg">
                            <span className="text-white text-lg sm:text-xl font-bold">
                              {card.FirstName?.charAt(0)}{card.LastName?.charAt(0)}
                            </span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-white font-bold text-base sm:text-lg leading-tight line-clamp-1">
                            {card.FirstName} {card.LastName}
                          </h3>
                          <p className="text-white text-opacity-90 text-xs sm:text-sm line-clamp-1">
                            {card.JobTitle}
                          </p>
                        </div>
                      </div>

                      {/* Company Name */}
                      <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg px-3 py-2 border border-white border-opacity-30">
                        <p className="text-white text-xs sm:text-sm font-semibold truncate">
                          {card.CompanyName}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Info Section */}
                  <div className="p-4 sm:p-6 bg-white dark:bg-gray-800 space-y-3 sm:space-y-4">
                    <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">📧</span>
                        <span className="truncate">{card.Email}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">📱</span>
                        <span>{card.Phone || 'Non fourni'}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">📍</span>
                        <span className="truncate">
                          {card.Delegation}, {card.Governorate}
                        </span>
                      </div>
                      {card.Notes && (
                        <div className="flex items-start space-x-2">
                          <span className="font-medium">📝</span>
                          <span className="line-clamp-2">{card.Notes}</span>
                        </div>
                      )}
                    </div>

                    {/* Tags Preview - Show when NOT expanded */}
                    {!isTagsExpanded && hasTags && (
                      <div className="mt-2 sm:mt-3 flex flex-wrap gap-1 sm:gap-2">
                        {parsedTags.slice(0, 3).map((tag, i) => (
                          <span
                            key={i}
                            className="px-2 py-1 bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 rounded-full text-xs font-medium"
                          >
                            {tag}
                          </span>
                        ))}
                        {parsedTags.length > 3 && (
                          <span className="px-2 py-1 text-purple-600 dark:text-purple-400 text-xs font-medium">
                            +{parsedTags.length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Manage Tags Button */}
                    {!isTagsExpanded && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedTagsCard(card.CardId);
                        }}
                        className="w-full mt-2 sm:mt-3 text-xs px-2 py-2 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded border border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors flex items-center justify-center gap-1"
                      >
                        <Sparkles className="w-3 h-3" />
                        {hasTags ? 'Gérer les tags' : 'Ajouter des tags'} {/* ✅ Fixed: Use parsed length */}
                      </button>
                    )}

                    {/* Expanded Tagging UI */}
                    {isTagsExpanded && (
                      <SmartTaggingUI
                        card={card}
                        onTagsUpdate={(newTags) => handleTagsUpdate(card.CardId, newTags)}
                        onClose={() => setExpandedTagsCard(null)}
                      />
                    )}

                    {/* Actions */}
                    <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewDetails(card.CardId);
                        }}
                        className="flex items-center space-x-1 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        <span>Voir détails</span>
                      </button>
                      {isOwnCard && (
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUpdate(card.CardId);
                            }}
                            className="p-2 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-lg transition-colors group/btn"
                            title="Modifier"
                          >
                            <Edit2 className="w-4 h-4 text-gray-500 dark:text-gray-400 group-hover/btn:text-blue-600 dark:group-hover/btn:text-blue-400" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(card.CardId);
                            }}
                            disabled={deletingCardId === card.CardId}
                            className="p-2 hover:bg-red-50 dark:hover:bg-gray-700 rounded-lg transition-colors group/btn disabled:opacity-50"
                            title="Supprimer"
                          >
                            {deletingCardId === card.CardId ? (
                              <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <Trash2 className="w-4 h-4 text-gray-500 dark:text-gray-400 group-hover/btn:text-red-600 dark:group-hover/btn:text-red-400" />
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 sm:py-16">
          <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl sm:text-5xl">📇</span>
          </div>
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Aucune carte de visite
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4 sm:mb-6 text-sm sm:text-base">Créez votre première carte pour commencer</p>
          <button
            onClick={() => router.push('/account/cards/create')}
            className="px-4 py-2 sm:px-6 sm:py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm sm:text-base"
          >
            Créer une carte
          </button>
        </div>
      )}
    </div>
  );
};

export default ViewCardsPage;