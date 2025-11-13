"use client";

import { useEffect, useState, useRef, Suspense } from 'react';
import { loadFaceModels, startCamera, stopCamera, computeEmbeddingFromVideo, hasMediaDevices } from '@/utils/face';
import { useRouter, useSearchParams } from 'next/navigation';
import Label from "@/components/Label";
import Avatar from "@/shared/Avatar";
import ButtonPrimary from "@/shared/ButtonPrimary";
import Input from "@/shared/Input";
import Select from "@/shared/Select";
import Textarea from "@/shared/Textarea";

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
  gender?: string;
  dateOfBirth?: string;
  address?: string;
  bio?: string;
}

// Composant séparé pour gérer les search params
function OnboardingHandler({ 
  profileImage, 
  user, 
  setShowOnboarding 
}: { 
  profileImage: string | null; 
  user: User | null;
  setShowOnboarding: (show: boolean) => void;
}) {
  const searchParams = useSearchParams();

  useEffect(() => {
    const flag = searchParams.get('onboarding');
    const shouldShow = flag === '1' || !profileImage || !user?.firstName || !user?.lastName;
    if (shouldShow) setShowOnboarding(true);
  }, [searchParams, profileImage, user, setShowOnboarding]);

  return null;
}

function AccountPageContent() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Form data
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    gender: '',
    dateOfBirth: '',
    address: '',
    bio: '',
  });

  // Onboarding state
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingMessage, setOnboardingMessage] = useState('');
  const [onboardingError, setOnboardingError] = useState('');

  // Face recognition states
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [showFaceSetup, setShowFaceSetup] = useState(false);
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

  // Upload image
  const uploadProfileImage = async (file: File) => {
    try {
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
      return data;
    } catch (error) {
      console.error('Erreur sauvegarde image:', error);
      throw error;
    }
  };

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
    
    try {
      // Prévisualisation locale
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setProfileImage(base64String);
      };
      reader.readAsDataURL(file);
      
      // Envoi au serveur
      await uploadProfileImage(file);
      setOnboardingMessage('Photo de profil mise à jour avec succès!');
    } catch (error) {
      console.error('Erreur upload image:', error);
      setOnboardingError('Erreur lors du téléchargement de l\'image');
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Face recognition handlers
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
      setFaceError('Impossible de démarrer la caméra.');
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
      setFaceMessage('Reconnaissance faciale configurée avec succès!');
      setTimeout(() => setShowFaceSetup(false), 2000);
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

  // Load profile data
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
          setFormData({
            firstName: profileData.firstName || '',
            lastName: profileData.lastName || '',
            email: profileData.email || '',
            phone: profileData.phone || '',
            gender: profileData.gender || '',
            dateOfBirth: profileData.dateOfBirth || '',
            address: `${profileData.governorate || ''}, ${profileData.delegation || ''}`.trim(),
            bio: profileData.bio || '',
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

  // Update profile
  const handleUpdateProfile = async () => {
    try {
      setSaveLoading(true);
      setOnboardingError('');
      setOnboardingMessage('');

      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la mise à jour');
      }
      
      setUser(prev => prev ? { ...prev, ...formData } : null);
      setOnboardingMessage('Profil mis à jour avec succès!');
      
      setTimeout(() => setOnboardingMessage(''), 3000);
    } catch (e: any) {
      console.error('Erreur mise à jour profil', e);
      setOnboardingError(e?.message || 'Erreur lors de la mise à jour');
    } finally {
      setSaveLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Chargement du profil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <Suspense fallback={null}>
        <OnboardingHandler 
          profileImage={profileImage} 
          user={user} 
          setShowOnboarding={setShowOnboarding} 
        />
      </Suspense>

      {/* HEADING */}
      <div>
        <h2 className="text-3xl font-semibold">Account Information</h2>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
          Manage your profile and account settings
        </p>
      </div>
      
      <div className="w-14 border-b border-neutral-200 dark:border-neutral-700"></div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}
      {onboardingMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
          {onboardingMessage}
        </div>
      )}
      {onboardingError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {onboardingError}
        </div>
      )}

      {/* Onboarding Banner */}
      {showOnboarding && (
        <div className="rounded-xl border-2 border-indigo-200 bg-indigo-50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-indigo-800">Complete Your Profile</h3>
              <p className="text-sm text-indigo-700">Add your information to get started</p>
            </div>
            <button 
              onClick={() => setShowOnboarding(false)} 
              className="text-indigo-700 hover:text-indigo-900 text-sm font-medium"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row">
        {/* Avatar Section */}
        <div className="flex-shrink-0 flex items-start">
          <div className="relative rounded-full overflow-hidden flex">
            {profileImage ? (
              <img 
                src={profileImage} 
                alt="Profile" 
                className="w-32 h-32 rounded-full object-cover"
              />
            ) : (
              <Avatar sizeClass="w-32 h-32" />
            )}
            <div className="absolute inset-0 bg-black bg-opacity-60 flex flex-col items-center justify-center text-neutral-50 cursor-pointer hover:bg-opacity-70 transition-all">
              <svg
                width="30"
                height="30"
                viewBox="0 0 30 30"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M17.5 5H7.5C6.83696 5 6.20107 5.26339 5.73223 5.73223C5.26339 6.20107 5 6.83696 5 7.5V20M5 20V22.5C5 23.163 5.26339 23.7989 5.73223 24.2678C6.20107 24.7366 6.83696 25 7.5 25H22.5C23.163 25 23.7989 24.7366 24.2678 24.2678C24.7366 23.7989 25 23.163 25 22.5V17.5M5 20L10.7325 14.2675C11.2013 13.7988 11.8371 13.5355 12.5 13.5355C13.1629 13.5355 13.7987 13.7988 14.2675 14.2675L17.5 17.5M25 12.5V17.5M25 17.5L23.0175 15.5175C22.5487 15.0488 21.9129 14.7855 21.25 14.7855C20.5871 14.7855 19.9513 15.0488 19.4825 15.5175L17.5 17.5M17.5 17.5L20 20M22.5 5H27.5M25 2.5V7.5M17.5 10H17.5125"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="mt-1 text-xs">Change Image</span>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="absolute inset-0 opacity-0 cursor-pointer"
              onChange={handleImageUpload}
            />
          </div>
        </div>

        {/* Form Section */}
        <div className="flex-grow mt-10 md:mt-0 md:pl-16 max-w-3xl space-y-6">
          {/* First Name */}
          <div>
            <Label>First Name</Label>
            <Input 
              className="mt-1.5" 
              value={formData.firstName}
              onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
              placeholder="John"
            />
          </div>

          {/* Last Name */}
          <div>
            <Label>Last Name</Label>
            <Input 
              className="mt-1.5" 
              value={formData.lastName}
              onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
              placeholder="Doe"
            />
          </div>

          {/* Gender */}
          <div>
            <Label>Gender</Label>
            <Select 
              className="mt-1.5"
              value={formData.gender}
              onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value }))}
            >
              <option value="">Select gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </Select>
          </div>

          {/* Email */}
          <div>
            <Label>Email</Label>
            <Input 
              className="mt-1.5" 
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="example@email.com"
            />
          </div>

          {/* Date of Birth */}
          <div className="max-w-lg">
            <Label>Date of Birth</Label>
            <Input 
              className="mt-1.5" 
              type="date"
              value={formData.dateOfBirth}
              onChange={(e) => setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
            />
          </div>

          {/* Address */}
          <div>
            <Label>Address</Label>
            <Input 
              className="mt-1.5" 
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              placeholder="City, Country"
            />
          </div>

          {/* Phone */}
          <div>
            <Label>Phone Number</Label>
            <Input 
              className="mt-1.5" 
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="+216 12 345 678"
            />
          </div>

          {/* Bio */}
          <div>
            <Label>About You</Label>
            <Textarea 
              className="mt-1.5" 
              value={formData.bio}
              onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
              placeholder="Tell us about yourself..."
              rows={4}
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex gap-3">
            <ButtonPrimary onClick={handleUpdateProfile} loading={saveLoading}>
              Update Info
            </ButtonPrimary>
            
            <button
              onClick={() => setShowFaceSetup(!showFaceSetup)}
              className="px-6 py-3 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-colors"
            >
              {showFaceSetup ? 'Hide' : 'Setup'} Face Recognition
            </button>
          </div>
        </div>
      </div>

      {/* Face Recognition Setup Section */}
      {showFaceSetup && (
        <div className="mt-8 border-t border-neutral-200 dark:border-neutral-700 pt-8">
          <h3 className="text-2xl font-semibold mb-4">Face Recognition Setup</h3>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6">
            Configure face recognition for secure login
          </p>

          {faceError && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {faceError}
            </div>
          )}
          {faceMessage && (
            <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
              {faceMessage}
            </div>
          )}

          <div className="space-y-4 max-w-2xl">
            <div className="aspect-video bg-neutral-100 dark:bg-neutral-800 rounded-2xl overflow-hidden flex items-center justify-center">
              <video 
                ref={videoRef} 
                className="w-full h-full object-cover" 
                muted 
                playsInline 
              />
            </div>

            <div className="flex flex-wrap gap-3">
              {!cameraOn ? (
                <ButtonPrimary 
                  onClick={handleStartCamera} 
                  disabled={faceLoading}
                >
                  {faceLoading ? 'Starting...' : 'Start Camera'}
                </ButtonPrimary>
              ) : (
                <button
                  onClick={handleStopCamera}
                  className="px-6 py-3 rounded-full bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 text-neutral-800 dark:text-neutral-200 font-medium transition-colors"
                >
                  Stop Camera
                </button>
              )}

              <button
                onClick={handleCaptureFace}
                disabled={faceLoading || !cameraOn}
                className="px-6 py-3 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {faceLoading ? 'Analyzing...' : 'Capture Face'}
              </button>

              <button
                onClick={handleSaveFaceEmbedding}
                disabled={faceLoading || !embedding}
                className="px-6 py-3 rounded-full bg-green-600 hover:bg-green-700 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {faceLoading ? 'Saving...' : 'Save'}
              </button>
            </div>

            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              💡 Tip: Make sure you're well-lit, facing the camera, without opaque glasses.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AccountPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading account...</p>
        </div>
      </div>
    }>
      <AccountPageContent />
    </Suspense>
  );
}