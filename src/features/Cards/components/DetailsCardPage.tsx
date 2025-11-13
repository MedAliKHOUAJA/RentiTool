'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { getCardById, saveSharedCard } from '@/features/Cards/actions/Cards';
import { Card } from '@/features/Cards/types';
import { Mail, Phone, Globe, MapPin, Linkedin, Facebook, Twitter, Instagram, Github, LucideIcon, Download } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { NFCShareButton } from '@/features/Cards/components/NFCShareButton';
import { NFCReceiveButton } from '@/features/Cards/components/NFCReceiveButton';
import toast from 'react-hot-toast';

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
      } catch (err: any) {
        console.error('Fetch error:', err);
        if (err.message.includes('Unauthorized')) {
          toast.error('Connexion requise');
          router.push('/login');
          return;
        }
        setError(err.message || 'Erreur de chargement');
      } finally {
        setLoading(false);
      }
    };
    fetchCard();
  }, [cardId, router]);

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
    const link = `${window.location.origin}/account/cards/details/${cardId}?shared=true`;
    navigator.clipboard.writeText(link).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 1500);
    });
  };

  const handleSave = async () => {
    if (saved || saving) return;
    setSaving(true);
    try {
      await saveSharedCard(cardId);
      setSaved(true);
      toast.success('Carte sauvegardée !');
    } catch (err: any) {
      if (err.message.includes('Unauthorized')) {
        toast.error('Connexion requise');
        router.push('/login');
      } else {
        toast.error('Échec de la sauvegarde');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadVCF = () => {
    if (!card) return;

    // Build vCard string (v3.0 format for broad compatibility)
    const vcardLines = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `FN:${card.FirstName} ${card.LastName}`,
      `N:${card.LastName};${card.FirstName};;;`,
      card.CompanyName ? `ORG:${card.CompanyName}` : '',
      card.JobTitle ? `TITLE:${card.JobTitle}` : '',
      card.Phone ? `TEL;TYPE=WORK,VOICE:${card.Phone}` : '',
      card.Email ? `EMAIL;TYPE=WORK:${card.Email}` : '',
      card.WebSite ? `URL:${card.WebSite}` : '',
      // Address format: ADR;TYPE=WORK:;;street;city;state;postal;country
      `ADR;TYPE=WORK:;;${card.Delegation || ''};${card.Governorate || ''};;${card.Postalcode || ''};`,
    ];

    // Add social links
    if (card.SocialLinks && Object.keys(card.SocialLinks).length > 0) {
      Object.entries(card.SocialLinks).forEach(([platform, url]) => {
        if (url) {
          vcardLines.push(`X-SOCIALPROFILE;type=${platform}:${url}`);
        }
      });
    }

    vcardLines.push('END:VCARD');

    // Filter out empty lines and join
    const vcard = vcardLines.filter(line => line && !line.endsWith(':')).join('\n');

    // Create Blob and trigger download
    const blob = new Blob([vcard], { type: 'text/vcard;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${card.FirstName}_${card.LastName}.vcf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('Contact téléchargé !');
  };

  if (loading) return <div className="text-center py-10">Chargement...</div>;
  if (error || !card) {
    return (
      <div className="text-center py-10 px-4">
        <p className="text-red-600">{error || 'Carte non trouvée'}</p>
        <button onClick={() => router.push('/account/cards')} className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg">
          Retour
        </button>
      </div>
    );
  }

  const shareLink = `${window.location.origin}/account/cards/details/${cardId}?shared=true`;

  return (
    <div className="container mx-auto py-6 md:py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-6 md:mb-8">
          <h1 className="text-2xl md:text-4xl font-bold">Carte de Visite</h1>
          <p className="text-sm md:text-base text-gray-600">Cliquez pour retourner</p>
        </div>

        <div className="flex justify-center mb-6 md:mb-8" style={{ perspective: '1000px' }}>
          <div className="relative w-full max-w-2xl cursor-pointer" onClick={() => setFlipped(!flipped)} style={{ aspectRatio: '16/10' }}>
            <div className="relative w-full h-full transition-transform duration-700" style={{ transformStyle: 'preserve-3d', transform: flipped ? 'rotateY(180deg)' : '' }}>
              {/* FRONT */}
              <div className="absolute inset-0 rounded-xl md:rounded-2xl shadow-2xl bg-gradient-to-br from-blue-600 to-indigo-800 p-4 md:p-8" style={{ backfaceVisibility: 'hidden' }}>
                {/* QR Code - Responsive positioning */}
                <div className="absolute bottom-3 right-3 md:bottom-8 md:right-8 bg-white p-2 md:p-3 rounded-lg">
                  <QRCodeSVG value={shareLink} size={window.innerWidth < 768 ? 50 : 80} />
                </div>
                
                {/* Company Logo - Responsive */}
                <div className="absolute top-3 right-3 md:top-8 md:right-8">
                  {card.CompanyLogoUrl ? (
                    <img src={`data:image/jpeg;base64,${card.CompanyLogoUrl}`} alt="Logo" className="w-12 h-12 md:w-20 md:h-20 object-contain bg-white rounded-lg p-1 md:p-2" />
                  ) : (
                    <div className="w-12 h-12 md:w-20 md:h-20 bg-white/20 rounded-lg flex items-center justify-center text-lg md:text-2xl text-white font-bold">
                      {card.CompanyName?.[0]}
                    </div>
                  )}
                </div>
                
                {/* Profile and Name Section - Responsive */}
                <div className="flex items-start space-x-2 md:space-x-4 pt-2 md:pt-4">
                  {card.ProfilePictureUrl ? (
                    <img src={`data:image/jpeg;base64,${card.ProfilePictureUrl}`} alt="Profile" className="w-16 h-16 md:w-24 md:h-24 rounded-full border-2 md:border-4 border-white object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-16 h-16 md:w-24 md:h-24 rounded-full border-2 md:border-4 border-white bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-xl md:text-3xl text-white font-bold flex-shrink-0">
                      {card.FirstName?.[0]}{card.LastName?.[0]}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h2 className="text-lg md:text-3xl font-bold text-white truncate">{card.FirstName} {card.LastName}</h2>
                    <p className="text-blue-100 text-sm md:text-lg truncate">{card.JobTitle}</p>
                  </div>
                </div>
                
                {/* Company Info - Responsive */}
                <div className="absolute bottom-3 left-3 right-16 md:bottom-8 md:left-8 md:right-32">
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg md:rounded-xl p-2 md:p-4 border border-white/20">
                    <p className="text-white text-sm md:text-xl font-semibold truncate">{card.CompanyName}</p>
                    {card.WebSite && <p className="text-blue-100 text-xs md:text-sm truncate">{card.WebSite.replace(/^https?:\/\//, '')}</p>}
                  </div>
                </div>
              </div>

              {/* BACK */}
              <div className="absolute inset-0 rounded-xl md:rounded-2xl shadow-2xl bg-white dark:bg-gray-800 p-4 md:p-8 overflow-y-auto" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                <div className="border-b-2 md:border-b-4 border-blue-600 pb-2 md:pb-4">
                  <h3 className="text-xl md:text-2xl font-bold">Coordonnées</h3>
                </div>
                <div className="py-4 md:py-6 space-y-3 md:space-y-4">
                  <div className="flex items-center space-x-2 md:space-x-3">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <Mail className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs uppercase font-semibold text-gray-500">Email</p>
                      <a href={`mailto:${card.Email}`} className="hover:text-blue-600 text-sm md:text-base break-all">{card.Email}</a>
                    </div>
                  </div>
                  {card.Phone && (
                    <div className="flex items-center space-x-2 md:space-x-3">
                      <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <Phone className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs uppercase font-semibold text-gray-500">Téléphone</p>
                        <a href={`tel:${card.Phone}`} className="hover:text-blue-600 text-sm md:text-base">{card.Phone}</a>
                      </div>
                    </div>
                  )}
                  {card.WebSite && (
                    <div className="flex items-center space-x-2 md:space-x-3">
                      <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <Globe className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs uppercase font-semibold text-gray-500">Site Web</p>
                        <a href={card.WebSite} target="_blank" rel="noopener" className="hover:text-blue-600 text-sm md:text-base break-all">
                          {card.WebSite.replace(/^https?:\/\//, '')}
                        </a>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center space-x-2 md:space-x-3">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs uppercase font-semibold text-gray-500">Adresse</p>
                      <p className="text-sm md:text-base">{card.Delegation}, {card.Governorate} {card.Postalcode}</p>
                    </div>
                  </div>
                </div>
                {card.SocialLinks && Object.keys(card.SocialLinks).length > 0 && (
                  <div className="border-t pt-3 md:pt-4">
                    <p className="text-sm uppercase font-semibold text-gray-500 mb-2 md:mb-3">Réseaux</p>
                    <div className="flex flex-wrap gap-2 md:gap-3">
                      {Object.entries(card.SocialLinks).map(([platform, url]) => {
                        const Icon = getSocialIcon(platform);
                        return (
                          <a key={platform} href={url as string} target="_blank" rel="noopener" className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gray-100 hover:bg-blue-600 flex items-center justify-center group">
                            <Icon className="w-4 h-4 md:w-5 md:h-5 text-gray-600 group-hover:text-white" />
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

        <div className="flex flex-wrap justify-center gap-2 md:gap-4">
          {!isShared && <NFCShareButton cardId={card.CardId} />}
          {isShared && <NFCReceiveButton />}
          
          {/* VCF Download Button - Available for everyone */}
          <button 
            onClick={handleDownloadVCF} 
            className="px-4 md:px-6 py-2 md:py-3 text-sm md:text-base bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-lg hover:from-green-600 hover:to-teal-600 transition-all flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Télécharger Contact
          </button>

          {!isShared && (
            <button onClick={() => router.push(`/account/cards/edit/${card.CardId}`)} className="px-4 md:px-6 py-2 md:py-3 text-sm md:text-base bg-blue-600 text-white rounded-lg">
              Modifier
            </button>
          )}
          <button onClick={() => router.push('/account/cards')} className="px-4 md:px-6 py-2 md:py-3 text-sm md:text-base bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-lg border">
            Retour
          </button>
          {!isShared && (
            <button onClick={handleShare} className="px-4 md:px-6 py-2 md:py-3 text-sm md:text-base bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg">
              {isCopied ? 'Copié !' : 'Partager'}
            </button>
          )}
          {!isShared && (
            <button onClick={() => setShowQR(true)} className="px-4 md:px-6 py-2 md:py-3 text-sm md:text-base bg-gradient-to-r from-yellow-600 to-orange-600 text-white rounded-lg">
              QR Code
            </button>
          )}
          {isShared && (
            <button onClick={handleSave} disabled={saved || saving} className={`px-4 md:px-6 py-2 md:py-3 text-sm md:text-base text-white rounded-lg ${saved ? 'bg-gray-400' : 'bg-green-500 hover:bg-green-600'}`}>
              {saving ? '...' : saved ? 'Sauvegardé' : 'Sauvegarder'}
            </button>
          )}
        </div>

        {showQR && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-2xl max-w-md w-full">
              <h3 className="text-xl md:text-2xl font-bold text-center mb-4 md:mb-6">Scannez</h3>
              <div className="bg-white p-4 rounded-lg">
                <QRCodeSVG value={shareLink} size={Math.min(window.innerWidth - 120, 256)} className="mx-auto" />
              </div>
              <p className="text-center mt-4 text-xs md:text-sm break-all">{shareLink}</p>
              <button onClick={() => setShowQR(false)} className="mt-4 md:mt-6 w-full py-2 md:py-3 bg-blue-600 text-white rounded-lg">
                Fermer
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DetailsCardPage;