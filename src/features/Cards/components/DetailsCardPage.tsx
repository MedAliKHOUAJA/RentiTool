// src/features/Cards/components/DetailsCardPage.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { getCardById, saveSharedCard } from '@/features/Cards/actions/Cards';
import { Card } from '@/features/Cards/types';
import { Mail, Phone, Globe, MapPin, Linkedin, Facebook, Twitter, Instagram, Github, LucideIcon } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { NFCShareButton } from '@/features/Cards/components/NFCShareButton';
import { NFCReceiveButton } from '@/features/Cards/components/NFCReceiveButton';

const DetailsCardPage = () => {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const cardId = Number(params.cardId);
  const isShared = searchParams.get('shared') === 'true';
  const [card, setCard] = useState<Card | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [flipped, setFlipped] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    const fetchCard = async () => {
      try {
        const data = await getCardById(cardId);
        if (data) {
          setCard(data);
        } else {
          setError('Carte non trouvée');
        }
      } catch (err) {
        setError('Erreur lors de la récupération des données de la carte');
        alert('Erreur lors de la récupération des données de la carte');
      } finally {
        setLoading(false);
      }
    };
    fetchCard();
  }, [cardId]);

  const getSocialIcon = (platform: string): LucideIcon => {
    const icons: Record<string, LucideIcon> = {
      linkedin: Linkedin,
      facebook: Facebook,
      twitter: Twitter,
      instagram: Instagram,
      github: Github,
    };
    return icons[platform.toLowerCase()] || Globe;
  };

  const handleShare = () => {
    const shareLink = `${window.location.origin}/account/cards/details/${cardId}?shared=true`;
    navigator.clipboard.writeText(shareLink)
      .then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 1500); 
      })
      .catch((err) => {
        alert('Erreur lors de la copie du lien. Veuillez réessayer.'); 
        console.error('Clipboard error:', err);
      });
  };

  const handleSave = async () => {
    if (saved || saving) return;

    setSaving(true);
    try {
      await saveSharedCard(cardId);
      setSaved(true);
      alert('Carte sauvegardée avec succès !');
    } catch (err) {
      alert('Erreur lors de la sauvegarde de la carte');
      console.error('Save error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleQR = () => {
    setShowQR(true);
  };

  const closeQR = () => {
    setShowQR(false);
  };

  if (loading) {
    return (
      <div className="container mx-auto py-10 px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Chargement...</p>
        </div>
      </div>
    );
  }

  if (error || !card) {
    return (
      <div className="container mx-auto py-10 px-4">
        <div className="text-center">
          <p className="text-red-600 text-xl">{error || 'Carte non trouvée'}</p>
          <button
            onClick={() => router.push('/account/cards')}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retour
          </button>
        </div>
      </div>
    );
  }

  const shareLink = `${window.location.origin}/account/cards/details/${cardId}?shared=true`;

  return (
    <div className="container mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Carte de Visite Numérique
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Cliquez sur la carte pour la retourner
          </p>
        </div>

        {/* Card Container with 3D flip effect */}
        <div className="flex justify-center mb-8">
          <div 
            className="relative w-full max-w-2xl cursor-pointer"
            style={{ perspective: '1000px', height: '400px' }}
            onClick={() => setFlipped(!flipped)}
          >
            <div
              className="relative w-full h-full transition-transform duration-700"
              style={{
                transformStyle: 'preserve-3d',
                transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
              }}
            >
              {/* FRONT SIDE */}
              <div
                className="absolute w-full h-full rounded-2xl shadow-2xl overflow-hidden"
                style={{ backfaceVisibility: 'hidden' }}
              >
                <div className="relative h-full bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-8">
                  {/* Decorative Elements */}
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-32 -mt-32"></div>
                  <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-5 rounded-full -ml-24 -mb-24"></div>
                  
                  {/* QR Code on Card */}
                  <div className="absolute bottom-8 right-8 bg-white p-3 rounded-lg shadow-lg">
                    <QRCodeSVG value={shareLink} size={80} />
                  </div>

                  {/* Company Logo Area */}
                  <div className="absolute top-8 right-8">
                    {card.CompanyLogoUrl ? (
                      <img
                        src={`data:image/jpeg;base64,${card.CompanyLogoUrl}`}
                        alt="Logo"
                        className="w-20 h-20 object-contain bg-white rounded-lg p-2"
                      />
                    ) : (
                      <div className="w-20 h-20 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-2xl">
                          {card.CompanyName?.charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Main Content */}
                  <div className="relative z-10 h-full flex flex-col justify-between">
                    {/* Top Section - Name and Title */}
                    <div>
                      <div className="flex items-start space-x-4">
                        {card.ProfilePictureUrl ? (
                          <img
                            src={`data:image/jpeg;base64,${card.ProfilePictureUrl}`}
                            alt="Profile"
                            className="w-24 h-24 rounded-full border-4 border-white shadow-lg object-cover"
                          />
                        ) : (
                          <div className="w-24 h-24 rounded-full border-4 border-white bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg">
                            <span className="text-white text-3xl font-bold">
                              {card.FirstName?.charAt(0)}{card.LastName?.charAt(0)}
                            </span>
                          </div>
                        )}
                        <div className="flex-1 pt-2">
                          <h2 className="text-3xl font-bold text-white mb-1">
                            {card.FirstName} {card.LastName}
                          </h2>
                          <p className="text-blue-100 text-lg font-medium">{card.JobTitle}</p>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Section - Company */}
                    <div className="mr-24">
                      <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-4 border border-white border-opacity-20">
                        <p className="text-white text-xl font-semibold">{card.CompanyName}</p>
                        {card.WebSite && (
                          <p className="text-blue-100 text-sm mt-1">
                            {card.WebSite.replace('https://', '').replace('http://', '')}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* BACK SIDE */}
              <div
                className="absolute w-full h-full rounded-2xl shadow-2xl bg-white dark:bg-gray-800 overflow-hidden border border-gray-200 dark:border-gray-700"
                style={{
                  backfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)'
                }}
              >
                <div className="h-full p-8 flex flex-col justify-between">
                  {/* Header with accent */}
                  <div className="border-b-4 border-blue-600 pb-4">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Coordonnées</h3>
                  </div>

                  {/* Contact Information */}
                  <div className="flex-1 py-6 space-y-4">
                    {/* Email */}
                    <div className="flex items-center space-x-3 group">
                      <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center group-hover:bg-blue-200 dark:group-hover:bg-blue-800 transition-colors">
                        <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">Email</p>
                        <a href={`mailto:${card.Email}`} className="text-gray-800 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                          {card.Email}
                        </a>
                      </div>
                    </div>

                    {/* Phone */}
                    <div className="flex items-center space-x-3 group">
                      <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center group-hover:bg-blue-200 dark:group-hover:bg-blue-800 transition-colors">
                        <Phone className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">Téléphone</p>
                        <a href={`tel:${card.Phone}`} className="text-gray-800 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                          {card.Phone || 'Non fourni'}
                        </a>
                      </div>
                    </div>

                    {/* Website */}
                    {card.WebSite && (
                      <div className="flex items-center space-x-3 group">
                        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center group-hover:bg-blue-200 dark:group-hover:bg-blue-800 transition-colors">
                          <Globe className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">Site Web</p>
                          <a href={card.WebSite} target="_blank" rel="noopener noreferrer" className="text-gray-800 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                            {card.WebSite.replace('https://', '').replace('http://', '')}
                          </a>
                        </div>
                      </div>
                    )}

                    {/* Address */}
                    <div className="flex items-center space-x-3 group">
                      <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center group-hover:bg-blue-200 dark:group-hover:bg-blue-800 transition-colors">
                        <MapPin className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">Adresse</p>
                        <p className="text-gray-800 dark:text-gray-200">
                          {card.Delegation}, {card.Governorate} {card.Postalcode}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Social Links */}
                  {card.SocialLinks && Object.keys(card.SocialLinks).length > 0 && (
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                      <p className="text-sm text-gray-500 dark:text-gray-400 uppercase font-semibold mb-3">Réseaux Sociaux</p>
                      <div className="flex space-x-3">
                        {Object.entries(card.SocialLinks).map(([platform, url]) => {
                          const Icon = getSocialIcon(platform);
                          return (
                            <a
                              key={platform}
                              href={url as string}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-blue-600 dark:hover:bg-blue-600 flex items-center justify-center transition-all group"
                              title={platform}
                            >
                              <Icon className="w-5 h-5 text-gray-600 dark:text-gray-300 group-hover:text-white transition-colors" />
                            </a>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-center gap-4 flex-wrap">
          {/* NFC Share (only for own cards) */}
          {!isShared && <NFCShareButton cardId={card.CardId} />}

          {/* NFC Receive (only when shared) */}
          {isShared && <NFCReceiveButton />}

          {/* Edit Button (only for own cards) */}
          {!isShared && (
            <button
              onClick={() => router.push(`/account/cards/edit/${card.CardId}`)}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-lg flex items-center justify-center space-x-2"
            >
              <span>Modifier</span>
            </button>
          )}

          {/* Back Button */}
          <button
            onClick={() => router.push('/account/cards')}
            className="px-6 py-3 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors shadow-lg border border-gray-200 dark:border-gray-700"
          >
            Retour
          </button>

          {/* Share Link Button (only for own cards) */}
          {!isShared && (
            <button
              onClick={handleShare}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-colors shadow-lg"
            >
              {isCopied ? 'Lien Copié !' : 'Partager'}
            </button>
          )}

          {/* QR Code Modal Button (only for own cards) */}
          {!isShared && (
            <button
              onClick={handleQR}
              className="px-6 py-3 bg-gradient-to-r from-yellow-600 to-orange-600 text-white rounded-lg hover:from-yellow-700 hover:to-orange-700 transition-colors shadow-lg"
            >
              QR Code
            </button>
          )}

          {/* Save Button (only when shared) */}
          {isShared && (
            <button
              onClick={handleSave}
              disabled={saved || saving}
              className={`px-6 py-3 text-white rounded-lg transition-colors shadow-lg ${
                saved ? 'bg-gray-400 cursor-not-allowed' : saving ? 'bg-green-400' : 'bg-green-500 hover:bg-green-600'
              }`}
            >
              {saving ? 'Sauvegarde...' : saved ? 'Sauvegardé' : 'Sauvegarder'}
            </button>
          )}
        </div>

        {/* QR Code Modal */}
        {showQR && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl max-w-md">
              <h3 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white text-center">Scannez le QR Code</h3>
              <div className="bg-white p-4 rounded-lg">
                <QRCodeSVG value={shareLink} size={256} className="mx-auto" />
              </div>
              <p className="text-center mt-6 text-sm text-gray-600 dark:text-gray-400 break-all">
                {shareLink}
              </p>
              <button
                onClick={closeQR}
                className="mt-6 w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        )}

        {/* Info Text */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            💡 Astuce : Cliquez sur la carte pour voir les coordonnées complètes
          </p>
        </div>
      </div>
    </div>
  );
};

export default DetailsCardPage;