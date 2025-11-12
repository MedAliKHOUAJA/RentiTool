// src/app/profile/page.tsx
"use client";

import { useEffect, useState, useRef } from 'react';
import { loadFaceModels, startCamera, stopCamera, computeEmbeddingFromVideo, hasMediaDevices } from '@/utils/face';
import { useRouter, useSearchParams } from 'next/navigation';

interface User {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  roleId: number;
  locationId: string;
  governorate: string;
  delegation: string;
  postalCode: string;
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editedData, setEditedData] = useState<Partial<User>>({});
  const [saveLoading, setSaveLoading] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Onboarding state (post-login)
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingMessage, setOnboardingMessage] = useState('');
  const [onboardingError, setOnboardingError] = useState('');
  const [onboardingFields, setOnboardingFields] = useState<{ firstName: string; lastName: string; phone: string }>({ firstName: '', lastName: '', phone: '' });
  const [signupDate] = useState<string>(() => new Date().toLocaleDateString());

  // Édition de la localisation
  const [isLocationEditing, setIsLocationEditing] = useState(false);
  const [locationQuery, setLocationQuery] = useState('');
  const [locationResults, setLocationResults] = useState<Array<{ LocationId: number; Governorate: string; Delegation: string; Postalcode: string }>>([]);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationSaveLoading, setLocationSaveLoading] = useState(false);

  // Fonction pour uploader l'image vers le serveur (FormData)
  const uploadProfileImage = async (file: File) => {
    try {
      console.log('🔄 Envoi de l\'image au serveur...');
      const formData = new FormData();
      formData.append('image', file);
      const response = await fetch('/api/profile/image', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la sauvegarde de l\'image');
      }
      console.log('✅ Image sauvegardée avec succès:', data.message);
      return data;
    } catch (error) {
      console.error('❌ Erreur sauvegarde image:', error);
      throw error;
    }
  };

  // Gestion de l'upload d'image
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Veuillez sélectionner une image valide (JPEG, PNG, etc.)');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      alert('L\'image ne doit pas dépasser 2MB');
      return;
    }
    setIsUploading(true);
    try {
      // Prévisualisation locale
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setProfileImage(base64String);
        if (user && typeof window !== 'undefined') {
          localStorage.setItem(`profileImage_${user.userId}`, base64String);
          console.log('💾 Image sauvegardée dans le localStorage');
        }
      };
      reader.readAsDataURL(file);
      // Envoi au serveur via FormData
      await uploadProfileImage(file);
      console.log('🎉 Photo de profil mise à jour avec succès!');
    } catch (error) {
      console.error('💥 Erreur upload image:', error);
      alert('Erreur lors du téléchargement de l\'image');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Déclencher l'input file
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Commencer l'édition d'un champ
  const startEditing = (field: string, value: string) => {
    setEditingField(field);
    setEditedData(prev => ({ ...prev, [field]: value }));
  };

  // Annuler l'édition
  const cancelEditing = () => {
    setEditingField(null);
    setEditedData({});
  };

  // Sauvegarder les modifications
  const saveField = async (field: string) => {
    if (!user || !editedData[field as keyof User]) return;
    setSaveLoading(field);
    try {
      const updateData = {
        firstName: field === 'firstName' ? editedData.firstName : user.firstName,
        lastName: field === 'lastName' ? editedData.lastName : user.lastName,
        email: field === 'email' ? editedData.email : user.email,
        phone: field === 'phone' ? editedData.phone : user.phone,
      };
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la mise à jour');
      }
      // Mettre à jour l'état local en s'assurant que les champs obligatoires restent des strings
      setUser(prev => prev ? {
        ...prev,
        firstName: updateData.firstName ?? prev.firstName,
        lastName: updateData.lastName ?? prev.lastName,
        email: updateData.email ?? prev.email,
        phone: updateData.phone ?? prev.phone,
      } : null);
      setEditingField(null);
      setEditedData({});
      console.log(`✅ ${field} mis à jour avec succès`);
    } catch (e) {
      console.error('Erreur mise à jour', e);
    } finally {
      setSaveLoading(null);
    }
  };

  // -----------------------------
  // Reconnaissance faciale (enrôlement)
  // -----------------------------
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [faceLoading, setFaceLoading] = useState(false);
  const [faceMessage, setFaceMessage] = useState<string>('');
  const [faceError, setFaceError] = useState<string>('');
  const [embedding, setEmbedding] = useState<number[] | null>(null);

  useEffect(() => {
    return () => {
      if (videoRef.current) stopCamera(videoRef.current);
    };
  }, []);

  const handleStartCamera = async () => {
    setFaceError('');
    setFaceMessage('');
    if (!hasMediaDevices()) {
      setFaceError('La caméra n\'est pas disponible dans ce navigateur.');
      return;
    }
    try {
      setFaceLoading(true);
      await loadFaceModels('/models');
      if (!videoRef.current) return;
      await startCamera(videoRef.current);
      setCameraOn(true);
      setFaceMessage('Caméra démarrée. Regardez bien en face de l\'écran.');
    } catch (e) {
      console.error('Camera start error', e);
      setFaceError('Impossible de démarrer la caméra. Autorisez l\'accès et réessayez.');
    } finally {
      setFaceLoading(false);
    }
  };

  const handleCaptureFace = async () => {
    setFaceError('');
    setFaceMessage('');
    if (!videoRef.current) return;
    try {
      setFaceLoading(true);
      const emb = await computeEmbeddingFromVideo(videoRef.current, 30, 150);
      if (!emb) {
        setFaceError('Visage non détecté. Essayez avec une meilleure luminosité.');
        return;
      }
      setEmbedding(emb);
      setFaceMessage('Visage détecté. Prêt à sauvegarder.');
    } catch (e) {
      console.error('Compute embedding error', e);
      setFaceError('Erreur durant la détection du visage.');
    } finally {
      setFaceLoading(false);
    }
  };

  const handleSaveFaceEmbedding = async () => {
    setFaceError('');
    setFaceMessage('');
    if (!embedding) {
      setFaceError('Aucune empreinte faciale à sauvegarder.');
      return;
    }
    try {
      setFaceLoading(true);
      const res = await fetch('/api/auth/face-setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ embedding }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erreur serveur');
      }
      setFaceMessage('Reconnaissance faciale configurée avec succès.');
    } catch (e: any) {
      console.error('Save embedding error', e);
      setFaceError(e?.message || 'Erreur lors de la sauvegarde');
    } finally {
      setFaceLoading(false);
    }
  };

  const handleStopCamera = () => {
    if (videoRef.current) stopCamera(videoRef.current);
    setCameraOn(false);
  };

  // Charger profil et image au montage
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const [profileRes, imageRes] = await Promise.all([
          fetch('/api/profile'),
          fetch('/api/profile/image'),
        ]);
        const profileData = await profileRes.json();
        const imageData = await imageRes.json();
        if (profileRes.ok) {
          setUser(profileData);
          setOnboardingFields({
            firstName: profileData.firstName || '',
            lastName: profileData.lastName || '',
            phone: profileData.phone || '',
          });
        } else {
          setError(profileData.error || 'Erreur lors du chargement du profil');
        }
        if (imageRes.ok && imageData?.image) {
          setProfileImage(imageData.image);
        }
      } catch (e) {
        console.error('Erreur chargement profil', e);
        setError('Erreur de chargement du profil');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  // Afficher onboarding si flag présent ou si champs manquants
  useEffect(() => {
    const flag = searchParams.get('onboarding');
    const shouldShow = flag === '1' || !profileImage || !user?.firstName || !user?.lastName;
    if (shouldShow) setShowOnboarding(true);
  }, [searchParams, profileImage, user]);

  // Soumettre onboarding (photo + détails)
  const submitOnboarding = async () => {
    try {
      setOnboardingError('');
      setOnboardingMessage('');

      // Mettre à jour les infos de base
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: onboardingFields.firstName,
          lastName: onboardingFields.lastName,
          email: user?.email || '',
          phone: onboardingFields.phone,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Mise à jour profil échouée');
      setUser(prev => prev ? {
        ...prev,
        firstName: onboardingFields.firstName,
        lastName: onboardingFields.lastName,
        phone: onboardingFields.phone,
      } : null);

      setOnboardingMessage('Profil mis à jour. Vous pouvez aussi ajouter une photo.');
    } catch (e: any) {
      console.error('Onboarding error', e);
      setOnboardingError(e?.message || 'Erreur lors de la mise à jour');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow p-6">
        <h1 className="text-2xl font-bold mb-2">Profil</h1>
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
        )}

        {showOnboarding && (
          <div className="mb-6 rounded-xl border border-indigo-200 bg-indigo-50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-indigo-800">Complétez votre profil</h2>
                <p className="text-sm text-indigo-700">Date d'inscription: {signupDate}</p>
              </div>
              <button onClick={() => setShowOnboarding(false)} className="text-indigo-700 text-sm">Fermer</button>
            </div>
            {onboardingError && (
              <div className="mt-3 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">{onboardingError}</div>
            )}
            {onboardingMessage && (
              <div className="mt-3 bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded text-sm">{onboardingMessage}</div>
            )}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm text-slate-700">Prénom</label>
                <input
                  className="w-full border rounded-lg px-3 py-2"
                  value={onboardingFields.firstName}
                  onChange={(e) => setOnboardingFields(s => ({ ...s, firstName: e.target.value }))}
                />
                <label className="text-sm text-slate-700">Nom</label>
                <input
                  className="w-full border rounded-lg px-3 py-2"
                  value={onboardingFields.lastName}
                  onChange={(e) => setOnboardingFields(s => ({ ...s, lastName: e.target.value }))}
                />
                <label className="text-sm text-slate-700">Téléphone</label>
                <input
                  className="w-full border rounded-lg px-3 py-2"
                  value={onboardingFields.phone}
                  onChange={(e) => setOnboardingFields(s => ({ ...s, phone: e.target.value }))}
                />
                <button onClick={submitOnboarding} className="mt-2 px-4 py-2 rounded-lg bg-indigo-600 text-white">Sauvegarder les informations</button>
              </div>
              <div className="space-y-2">
                <label className="text-sm text-slate-700">Photo de profil</label>
                <div className="flex items-center gap-3">
                  <button onClick={triggerFileInput} className="px-4 py-2 rounded-lg bg-blue-600 text-white">Télécharger une photo</button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </div>
                {profileImage && (
                  <img src={profileImage} alt="Profil" className="w-20 h-20 rounded-full object-cover" />
                )}
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <button onClick={triggerFileInput} className="px-4 py-2 rounded-lg bg-blue-600 text-white">
              Changer la photo
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />
            <button onClick={handleStartCamera} disabled={faceLoading} className="px-4 py-2 rounded-lg bg-indigo-600 text-white disabled:opacity-50">
              {faceLoading ? 'Démarrage…' : 'Configurer reconnaissance faciale'}
            </button>
          </div>

          {profileImage && (
            <img src={profileImage} alt="Profil" className="w-32 h-32 rounded-full object-cover" />
          )}

          {user && (
            <div className="text-sm text-slate-700">
              <div>Nom: {user.firstName} {user.lastName}</div>
              <div>Email: {user.email}</div>
              <div>Téléphone: {user.phone || '—'}</div>
            </div>
          )}
        </div>

        {/* Section Configuration Reconnaissance Faciale */}
        <div className="mt-8 border-t pt-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-3">Configuration de la reconnaissance faciale</h2>
          {faceError && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{faceError}</div>
          )}
          {faceMessage && (
            <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">{faceMessage}</div>
          )}

          <div className="space-y-4">
            <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
              <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
            </div>

            <div className="flex gap-3">
              {!cameraOn ? (
                <button onClick={handleStartCamera} disabled={faceLoading} className="px-4 py-2 rounded-lg bg-blue-600 text-white disabled:opacity-50">
                  {faceLoading ? 'Démarrage…' : 'Démarrer la caméra'}
                </button>
              ) : (
                <button onClick={handleStopCamera} className="px-4 py-2 rounded-lg bg-gray-200 text-gray-800">Arrêter la caméra</button>
              )}

              <button onClick={handleCaptureFace} disabled={faceLoading || !cameraOn} className="px-4 py-2 rounded-lg bg-indigo-600 text-white disabled:opacity-50">
                {faceLoading ? 'Analyse…' : 'Capturer le visage'}
              </button>

              <button onClick={handleSaveFaceEmbedding} disabled={faceLoading || !embedding} className="px-4 py-2 rounded-lg bg-green-600 text-white disabled:opacity-50">
                {faceLoading ? 'Sauvegarde…' : 'Sauvegarder'}
              </button>
            </div>

            <div className="text-sm text-slate-500">
              Conseil: assurez-vous d'être bien éclairé, face à la caméra, sans lunettes opaques.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}