// src/app/profile/page.tsx
"use client";

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

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

    } catch (error) {
      console.error(`❌ Erreur mise à jour ${field}:`, error);
      const message = error instanceof Error ? error.message : String(error);
      alert(`Erreur lors de la mise à jour: ${message}`);
    } finally {
      setSaveLoading(null);
    }
  };

  // Gestion des changements d'input
  const handleInputChange = (field: string, value: string) => {
    setEditedData(prev => ({ ...prev, [field]: value }));
  };

  // Déconnexion
  const handleLogout = () => {
    document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    window.location.href = '/login';
  };

  // Initiales pour l'avatar
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  // Affichage de la localisation
  const getLocationDisplay = () => {
    if (!user) return 'Non renseignée';
    
    const { governorate, delegation, postalCode } = user;
    const parts = [];
    
    if (governorate) parts.push(governorate);
    if (delegation) parts.push(delegation);
    if (postalCode) parts.push(`(${postalCode})`);
    
    return parts.length > 0 ? parts.join(' - ') : 'Non renseignée';
  };

  // Recherche des localisations
  const fetchLocationSuggestions = async (query: string) => {
    try {
      setLocationLoading(true);
      const url = query && query.trim().length > 0 ? `/api/profile/location?query=${encodeURIComponent(query.trim())}` : '/api/profile/location';
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur lors de la récupération des localisations');
      const list = Array.isArray(data.locations) ? data.locations : [];
      setLocationResults(list);
    } catch (err) {
      console.error('❌ Erreur récupération localisations:', err);
      setLocationResults([]);
    } finally {
      setLocationLoading(false);
    }
  };

  const startLocationEditing = () => {
    setIsLocationEditing(true);
    setLocationQuery('');
    fetchLocationSuggestions('');
  };

  const cancelLocationEditing = () => {
    setIsLocationEditing(false);
    setLocationQuery('');
    setLocationResults([]);
  };

  const saveLocation = async (locationId: number) => {
    if (!locationId) return;
    try {
      setLocationSaveLoading(true);
      const res = await fetch('/api/profile/location', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locationId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur mise à jour localisation');
      const loc = data.location;
      // Mettre à jour l'utilisateur localement
      setUser(prev => prev ? {
        ...prev,
        locationId: String(loc.LocationId),
        governorate: loc.Governorate,
        delegation: loc.Delegation,
        postalCode: String(loc.Postalcode)
      } : prev);
      setIsLocationEditing(false);
      console.log('✅ Localisation mise à jour');
    } catch (err) {
      console.error('❌ Erreur mise à jour localisation:', err);
      const message = err instanceof Error ? err.message : String(err);
      alert(`Erreur: ${message}`);
    } finally {
      setLocationSaveLoading(false);
    }
  };

  // Composant d'affichage/édition d'un champ
  const renderEditableField = (field: string, label: string, value: string, type: string = 'text') => {
    const isEditing = editingField === field;
    const isLoading = saveLoading === field;

    return (
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <label className="text-sm font-medium text-gray-700">{label}</label>
          </div>
          
          {!isEditing ? (
            <button
              onClick={() => startEditing(field, value)}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
            >
              Modifier
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => saveField(field)}
                disabled={isLoading}
                className="text-green-600 hover:text-green-800 text-sm font-medium transition-colors disabled:opacity-50"
              >
                {isLoading ? '...' : 'Sauvegarder'}
              </button>
              <button
                onClick={cancelEditing}
                className="text-red-600 hover:text-red-800 text-sm font-medium transition-colors"
              >
                Annuler
              </button>
            </div>
          )}
        </div>

        {isEditing ? (
          <div className="space-y-3">
            <input
              type={type}
              value={editedData[field as keyof User] || value}
              onChange={(e) => handleInputChange(field, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={`Entrez votre ${label.toLowerCase()}`}
              autoFocus
            />
            {field === 'email' && (
              <p className="text-xs text-gray-500">Vous devrez confirmer votre nouvel email</p>
            )}
          </div>
        ) : (
          <p className="text-lg font-semibold text-gray-900">
            {value || 'Non renseigné'}
          </p>
        )}
      </div>
    );
  };

  // Chargement du profil
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        console.log('🔄 Chargement du profil...');
        const response = await fetch('/api/profile');
        
        if (!response.ok) {
          if (response.status === 401) {
            console.log('❌ Non authentifié, redirection vers login');
            router.push('/login');
            return;
          }
          throw new Error(`Erreur ${response.status} lors du chargement du profil`);
        }
        
        const userData = await response.json();
        console.log('✅ Profil chargé:', userData);
        setUser(userData);
        
        if (typeof window !== 'undefined') {
          const savedImage = localStorage.getItem(`profileImage_${userData.userId}`);
          if (savedImage) {
            setProfileImage(savedImage);
            console.log('🖼️ Image de profil chargée depuis le localStorage');
          }
        }
        
      } catch (error) {
        console.error('💥 Erreur chargement profil:', error);
        setError('Impossible de charger le profil');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [router]);

  // États de chargement
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Chargement de votre profil...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Erreur de chargement</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Mon Profil
            </h1>
            <p className="text-gray-600 mt-2 text-lg">Bienvenue dans votre espace personnel</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-white text-red-600 px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-red-200 hover:bg-red-50"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Déconnexion
          </button>
        </div>

        {/* Carte principale */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Colonne de gauche - Photo et infos principales */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 hover:shadow-2xl transition-all duration-300">
              {/* Photo de profil */}
              <div className="text-center mb-6">
                <div className="relative inline-block">
                  <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-4xl font-bold shadow-lg relative overflow-hidden">
                    {profileImage ? (
                      <img 
                        src={profileImage} 
                        alt="Photo de profil" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      getInitials(user.firstName, user.lastName)
                    )}
                  </div>
                  
                  {/* Badge de rôle */}
                  <div className="absolute -top-2 -right-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                    {user.roleId === 1 ? '👑 Admin' : 
                     user.roleId === 2 ? '🏠 Propriétaire' : 
                     user.roleId === 3 ? '🔑 Locataire' : '👤 Utilisateur'}
                  </div>

                  {/* Bouton de modification de photo */}
                  <button
                    onClick={triggerFileInput}
                    disabled={isUploading}
                    className="absolute -bottom-2 -right-2 bg-white text-blue-600 p-2 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 border border-blue-200"
                  >
                    {isUploading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                  </button>

                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    className="hidden"
                  />
                </div>

                <h2 className="text-2xl font-bold text-gray-900 mt-4">
                  {user.firstName} {user.lastName}
                </h2>
                <p className="text-gray-600 mt-1">{user.email}</p>
              </div>

              {/* Stats rapides */}
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl">
                  <span className="text-gray-600">Membre depuis</span>
                  <span className="font-semibold text-blue-600">2024</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl">
                  <span className="text-gray-600">Statut</span>
                  <span className="font-semibold text-green-600">Actif</span>
                </div>
              </div>
            </div>
          </div>

          {/* Colonne de droite - Détails du profil */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 hover:shadow-2xl transition-all duration-300">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-bold text-gray-900">Informations personnelles</h3>
                <div className="text-sm text-gray-500">
                  Cliquez sur "Modifier" pour modifier chaque information
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Champs éditables */}
                {renderEditableField('firstName', 'Prénom', user.firstName)}
                {renderEditableField('lastName', 'Nom', user.lastName)}
                {renderEditableField('email', 'Email', user.email, 'email')}
                {renderEditableField('phone', 'Téléphone', user.phone || '', 'tel')}

                {/* Localisation (éditable) */}
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-xl border border-indigo-100 md:col-span-2">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-100 rounded-lg">
                        <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <label className="text-sm font-medium text-gray-700">Localisation</label>
                    </div>
                    {!isLocationEditing ? (
                      <button onClick={startLocationEditing} className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">Modifier</button>
                    ) : (
                      <button onClick={cancelLocationEditing} className="text-red-600 hover:text-red-800 text-sm font-medium">Annuler</button>
                    )}
                  </div>

                  {!isLocationEditing ? (
                    <p className="text-lg font-semibold text-gray-900">{getLocationDisplay()}</p>
                  ) : (
                    <div>
                      <div className="flex gap-3 mb-3">
                        <input
                          type="text"
                          value={locationQuery}
                          onChange={(e) => {
                            const q = e.target.value;
                            setLocationQuery(q);
                            fetchLocationSuggestions(q);
                          }}
                          placeholder="Rechercher (gouvernorat, délégation, code postal)"
                          className="flex-1 px-4 py-2 rounded-lg border border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div className="max-h-64 overflow-y-auto bg-white rounded-lg border border-indigo-100">
                        {locationLoading ? (
                          <div className="p-4 text-sm text-gray-500">Chargement...</div>
                        ) : locationResults.length === 0 ? (
                          <div className="p-4 text-sm text-gray-500">Aucun résultat</div>
                        ) : (
                          locationResults.map((loc) => (
                            <div key={loc.LocationId} className="flex items-center justify-between px-4 py-3 border-b last:border-b-0 hover:bg-indigo-50">
                              <div>
                                <div className="text-gray-900 font-medium">{loc.Governorate} - {loc.Delegation}</div>
                                <div className="text-xs text-gray-500">Code postal: {String(loc.Postalcode)}</div>
                              </div>
                              <button
                                disabled={locationSaveLoading}
                                onClick={() => saveLocation(loc.LocationId)}
                                className="text-green-600 hover:text-green-800 text-sm font-medium disabled:opacity-50"
                              >
                                {locationSaveLoading ? '...' : 'Choisir'}
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Rôle (non éditable) */}
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-xl border border-purple-100">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <label className="text-sm font-medium text-gray-700">Rôle</label>
                  </div>
                  <p className="text-lg font-semibold text-gray-900">
                    {user.roleId === 1 ? 'Administrateur' : 
                     user.roleId === 2 ? 'Propriétaire' : 
                     user.roleId === 3 ? 'Locataire' : 'Utilisateur'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}