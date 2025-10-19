// src/features/Cards/components/ViewCardsPage.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCardsByUserId, deleteCard, getSavedCardsByUserId } from '@/features/Cards/actions/Cards';
import { Card } from '@/features/Cards/types';
import toast from 'react-hot-toast';
import { Edit2, Trash2, Eye, Plus } from 'lucide-react';

const CURRENT_USER_ID = 'a1b2c3d4-5678-90ab-cdef-123456789abc'; // wait user auth aicha

const ViewCardsPage = () => {
  const router = useRouter();
  const [cards, setCards] = useState<Card[]>([]);
  const [ownCardIds, setOwnCardIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingCardId, setDeletingCardId] = useState<number | null>(null);

  useEffect(() => {
    const fetchCards = async () => {
      try {
        const [ownCards, savedCards] = await Promise.all([
          getCardsByUserId(CURRENT_USER_ID),
          getSavedCardsByUserId(CURRENT_USER_ID),
        ]);
        
        // cartaa taa chkoun ? 
        const ownIds = new Set((ownCards || []).map(card => card.CardId));
        setOwnCardIds(ownIds);
        
        // Merge own/saved cards no dups by CardId
        const allCards = [...(ownCards || []), ...(savedCards || [])].reduce((acc, card) => {
          if (!acc.find((c: { CardId: any; }) => c.CardId === card.CardId)) acc.push(card);
          return acc;
        }, [] as Card[]);
        
        setCards(allCards);
        console.log('✅ Total cards fetched:', allCards.length);
        console.log('✅ Own cards count:', ownCards?.length || 0);
        console.log('✅ Saved cards count:', savedCards?.length || 0);
        console.log('✅ Own card IDs:', Array.from(ownIds));
        console.log('✅ Sample card UserId:', allCards[0]?.UserId);
      } catch (err) {
        console.error('Error fetching cards:', err);
        setError('Erreur lors de la récupération des cartes');
      } finally {
        setLoading(false);
      }
    };
    fetchCards();
  }, []);

  const handleDelete = async (cardId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette carte ?')) return;

    setDeletingCardId(cardId);
    try {
      const result = await deleteCard(cardId);
      if (result.success) {
        toast.success('Carte supprimée avec succès !');
        setCards(cards.filter((card) => card.CardId !== cardId));
        setOwnCardIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(cardId);
          return newSet;
        });
      } else {
        toast.error(result.error || 'Échec de la suppression de la carte');
      }
    } catch (err) {
      console.error('Delete error:', err);
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
          <p className="text-red-600 text-xl">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">
              Mes Cartes de Visite
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Gérez et affichez vos cartes personnelles et sauvegardées
            </p>
          </div>
          <button 
            onClick={() => router.push('/account/cards/create')}
            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors shadow-lg flex items-center justify-center space-x-2 w-full sm:w-auto"
          >
            <Plus className="w-5 h-5" />
            <span>Nouvelle Carte</span>
          </button>
        </div>
      </div>

      {/* Total Cards */}
      <div className="mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Total Cartes</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{cards.length}</p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                {ownCardIds.size} carte(s) personnelle(s) • {cards.length - ownCardIds.size} sauvegardée(s)
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
              <span className="text-2xl">📇</span>
            </div>
          </div>
        </div>
      </div>

      {/* Cards Grid */}
      {cards.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((card, index) => {
            const gradient = cardColors[index % cardColors.length];
            const isOwnCard = ownCardIds.has(card.CardId);
            
            return (
              <div
                key={card.CardId}
                className="group relative"
              >
                {/* Badge showing if it's own card or saved */}
                {isOwnCard && (
                  <div className="absolute -top-2 -left-2 z-10">
                    <div className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-semibold shadow-lg">
                      Ma carte
                    </div>
                  </div>
                )}
                
                <div
                  onClick={() => handleViewDetails(card.CardId)}
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden cursor-pointer transform hover:-translate-y-1 border border-gray-200 dark:border-gray-700"
                >
                  {/* Card Front - Colored Section */}
                  <div className={`relative h-48 bg-gradient-to-br ${gradient} p-6 overflow-hidden`}>
                    {/* Decorative circles */}
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-white opacity-10 rounded-full"></div>
                    <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-white opacity-10 rounded-full"></div>
                    
                    {/* Company Logo */}
                    <div className="absolute top-4 right-4">
                      {card.CompanyLogoUrl ? (
                        <img
                          src={`data:image/jpeg;base64,${card.CompanyLogoUrl}`}
                          alt="Logo"
                          className="w-12 h-12 bg-white rounded-lg p-1"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                          <span className="text-white font-bold text-lg">
                            {card.CompanyName?.charAt(0)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Profile Section */}
                    <div className="relative z-10 flex items-center space-x-3">
                      {card.ProfilePictureUrl ? (
                        <img
                          src={`data:image/jpeg;base64,${card.ProfilePictureUrl}`}
                          alt="Profile"
                          className="w-16 h-16 rounded-full border-3 border-white shadow-lg object-cover"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full border-3 border-white bg-white bg-opacity-20 flex items-center justify-center shadow-lg">
                          <span className="text-white text-xl font-bold">
                            {card.FirstName?.charAt(0)}{card.LastName?.charAt(0)}
                          </span>
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="text-white font-bold text-lg leading-tight">
                          {card.FirstName} {card.LastName}
                        </h3>
                        <p className="text-white text-opacity-90 text-sm">
                          {card.JobTitle}
                        </p>
                      </div>
                    </div>

                    {/* Company Name at bottom */}
                    <div className="absolute bottom-4 left-6 right-6">
                      <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg px-3 py-2 border border-white border-opacity-30">
                        <p className="text-white text-sm font-semibold truncate">
                          {card.CompanyName}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Card Info - White Section */}
                  <div className="p-6 bg-white dark:bg-gray-800">
                    <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-400 dark:text-gray-500">📧</span>
                        <span className="truncate">{card.Email}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-400 dark:text-gray-500">📱</span>
                        <span>{card.Phone || 'Non fourni'}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-400 dark:text-gray-500">📍</span>
                        <span className="truncate">{card.Delegation}, {card.Governorate}</span>
                      </div>
                      {card.Notes && (
                        <div className="flex items-center space-x-2">
                          <span className="text-gray-400 dark:text-gray-500">📝</span>
                          <span className="truncate">{card.Notes}</span>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
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

                {/* Hover Badge */}
                <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg">
                    Cliquez pour voir
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-5xl">📇</span>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Aucune carte de visite
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Créez votre première carte pour commencer
          </p>
          <button 
            onClick={() => router.push('/account/cards/create')}
            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            Créer une carte
          </button>
        </div>
      )}
    </div>
  );
};

export default ViewCardsPage;