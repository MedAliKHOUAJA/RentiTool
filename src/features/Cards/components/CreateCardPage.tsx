// src/features/Cards/components/CreateCardPage.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createCardSchema, CreateCardFormData } from '@/features/Cards/schemas/Cards';
import { createCard, getUserById } from '@/features/Cards/actions/Cards';
import toast from 'react-hot-toast';

interface User {
  userId: string;
  FirstName: string;
  LastName: string;
  Email: string;
  Phone: number | null;
  Governorate?: string;
  Delegation?: string;
  Postalcode?: number;
}

async function action(formData: FormData) {
  console.log('Action triggered with formData:', Object.fromEntries(formData));
  const result = await createCard(formData);
  if (!result.success) throw new Error(result.error || 'Échec de la création');
  return result.cardId;
}

const CreateCardPage = () => {
  const router = useRouter();
  const { 
    register, 
    handleSubmit, 
    control,
    formState: { errors, isSubmitting }, 
    watch 
  } = useForm<CreateCardFormData>({
    resolver: zodResolver(createCardSchema),
    mode: 'onChange',
    defaultValues: {
      jobTitle: '',
      companyName: '',
      webSite: '',
      profilePicture: null,
      companyLogo: null,
    },
  });

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profilePreview, setProfilePreview] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  // Watch file inputs preview
  const profilePicture = watch('profilePicture');
  const companyLogo = watch('companyLogo');

  //  preview URLs
  useEffect(() => {
    if (profilePicture instanceof File) {
      const url = URL.createObjectURL(profilePicture);
      setProfilePreview(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setProfilePreview(null);
    }
  }, [profilePicture]);

  useEffect(() => {
    if (companyLogo instanceof File) {
      const url = URL.createObjectURL(companyLogo);
      setLogoPreview(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setLogoPreview(null);
    }
  }, [companyLogo]);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const data = await getUserById('a1b2c3d4-5678-90ab-cdef-123456789abc');//badl ki ji users
        if (data) {
          setUser(data);
        } else {
          setError('Utilisateur non trouvé');
        }
      } catch (err) {
        console.error('Fetch user error:', err);
        setError('Erreur lors de la récupération des données utilisateur');
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const onSubmit = async (data: CreateCardFormData) => {
    console.log('onSubmit triggered with data:', data);
    if (!user) return;

    const formData = new FormData();
    formData.append('userId', user.userId);
    formData.append('jobTitle', data.jobTitle);
    formData.append('companyName', data.companyName);
    formData.append('webSite', data.webSite || '');
    
    if (data.profilePicture instanceof File) {
      formData.append('profilePicture', data.profilePicture);
      console.log('Profile picture added:', data.profilePicture.name);
    }
    
    if (data.companyLogo instanceof File) {
      formData.append('companyLogo', data.companyLogo);
      console.log('Company logo added:', data.companyLogo.name);
    }

    try {
      const cardId = await action(formData);
      toast.success('Carte créée avec succès !');
      router.push('/account/cards');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Une erreur inconnue s\'est produite';
      console.error('Submission error:', err);
      toast.error(errorMessage);
      setError(errorMessage);
    }
  };

  const getErrorMessage = (error: any): string | null => {
    if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
      return error.message;
    }
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-900 dark:text-gray-100">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 text-lg">Erreur : Utilisateur non trouvé</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/*  header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 active:bg-gray-200 dark:active:bg-gray-600 transition-colors"
            aria-label="Retour"
          >
            <svg className="w-6 h-6 text-gray-700 dark:text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Créer une Carte</h1>
        </div>
      </div>

      <div className="p-4 pb-24 max-w-2xl mx-auto">
        {/* User Info Card - Collaps */}
        <details className="mb-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <summary className="p-4 cursor-pointer select-none font-medium text-gray-900 dark:text-gray-100 flex items-center justify-between active:bg-gray-50 dark:active:bg-gray-700">
            <span>Informations de l'Utilisateur</span>
            <svg className="w-5 h-5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </summary>
          <div className="px-4 pb-4 space-y-2 text-sm">
            <p className="text-gray-700 dark:text-gray-300">
              <span className="font-medium">Nom:</span> {user.FirstName} {user.LastName}
            </p>
            <p className="text-gray-700 dark:text-gray-300">
              <span className="font-medium">Email:</span> {user.Email}
            </p>
            <p className="text-gray-700 dark:text-gray-300">
              <span className="font-medium">Téléphone:</span> {user.Phone || 'Non fourni'}
            </p>
            <p className="text-gray-700 dark:text-gray-300">
              <span className="font-medium">Adresse:</span> {user.Governorate || 'N/A'}, {user.Delegation || 'N/A'}, {user.Postalcode || 'N/A'}
            </p>
          </div>
        </details>

        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Job Title */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
              Titre Professionnel <span className="text-red-500">*</span>
            </label>
            <input
              {...register('jobTitle')}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400"
              disabled={isSubmitting}
              placeholder="Ex: Développeur Full Stack"
            />
            {errors.jobTitle && (
              <p className="text-red-600 dark:text-red-400 text-sm mt-2">{getErrorMessage(errors.jobTitle)}</p>
            )}
          </div>

          {/* Company Name */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
              Nom de l'Entreprise <span className="text-red-500">*</span>
            </label>
            <input
              {...register('companyName')}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400"
              disabled={isSubmitting}
              placeholder="Ex: TechCorp Solutions"
            />
            {errors.companyName && (
              <p className="text-red-600 dark:text-red-400 text-sm mt-2">{getErrorMessage(errors.companyName)}</p>
            )}
          </div>

          {/* Website */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
              Site Web
            </label>
            <input
              {...register('webSite')}
              type="url"
              inputMode="url"
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400"
              disabled={isSubmitting}
              placeholder="https://www.exemple.com"
            />
            {errors.webSite && (
              <p className="text-red-600 dark:text-red-400 text-sm mt-2">{getErrorMessage(errors.webSite)}</p>
            )}
          </div>

          {/* Profile Picture */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
              Photo de Profil
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
              Facultatif • Max 5 Mo • JPEG ou PNG
            </p>
            <Controller
              name="profilePicture"
              control={control}
              render={({ field: { onChange, value, ...field } }) => (
                <div>
                  <label className="flex items-center justify-center w-full p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-blue-500 dark:hover:border-blue-400 transition-colors active:bg-gray-50 dark:active:bg-gray-700">
                    <input
                      {...field}
                      type="file"
                      accept="image/jpeg,image/png"
                      className="hidden"
                      disabled={isSubmitting}
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        console.log('Profile picture selected:', file?.name);
                        onChange(file);
                      }}
                    />
                    <div className="text-center">
                      <svg className="w-10 h-10 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-sm text-blue-500 dark:text-blue-400 font-medium">
                        {profilePicture instanceof File ? 'Changer la photo' : 'Ajouter une photo'}
                      </span>
                    </div>
                  </label>
                  {profilePreview && (
                    <div className="mt-3 flex justify-center">
                      <img 
                        src={profilePreview} 
                        alt="Aperçu" 
                        className="w-24 h-24 object-cover rounded-full border-2 border-blue-500 dark:border-blue-400"
                      />
                    </div>
                  )}
                </div>
              )}
            />
            {errors.profilePicture && (
              <p className="text-red-600 dark:text-red-400 text-sm mt-2">{getErrorMessage(errors.profilePicture)}</p>
            )}
          </div>

          {/* Company Logo */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
              Logo de l'Entreprise
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
              de pref • Max 5 Mo •
            </p>
            <Controller
              name="companyLogo"
              control={control}
              render={({ field: { onChange, value, ...field } }) => (
                <div>
                  <label className="flex items-center justify-center w-full p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-blue-500 dark:hover:border-blue-400 transition-colors active:bg-gray-50 dark:active:bg-gray-700">
                    <input
                      {...field}
                      type="file"
                      accept="image/jpeg,image/png"
                      className="hidden"
                      disabled={isSubmitting}
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        console.log('Company logo selected:', file?.name);
                        onChange(file);
                      }}
                    />
                    <div className="text-center">
                      <svg className="w-10 h-10 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      <span className="text-sm text-blue-500 dark:text-blue-400 font-medium">
                        {companyLogo instanceof File ? 'Changer le logo' : 'Ajouter un logo'}
                      </span>
                    </div>
                  </label>
                  {logoPreview && (
                    <div className="mt-3 flex justify-center">
                      <img 
                        src={logoPreview} 
                        alt="Aperçu" 
                        className="w-24 h-24 object-contain rounded-lg border-2 border-blue-500 dark:border-blue-400"
                      />
                    </div>
                  )}
                </div>
              )}
            />
            {errors.companyLogo && (
              <p className="text-red-600 dark:text-red-400 text-sm mt-2">{getErrorMessage(errors.companyLogo)}</p>
            )}
          </div>
        </form>
      </div>

      {/*bottom action bar  */}
<div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 pb-20 safe-area-inset-bottom">
        <div className="max-w-2xl mx-auto flex gap-3">
          <button
            type="button"
            onClick={() => router.push('/account/cards')}
            className="flex-1 py-3 px-4 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg font-medium active:bg-gray-200 dark:active:bg-gray-600 transition-colors text-base"
            disabled={isSubmitting}
          >
            Annuler
          </button>
          <button
            type="submit"
            onClick={handleSubmit(onSubmit)}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors text-base ${
              isSubmitting 
                ? 'bg-blue-300 dark:bg-blue-700 text-white cursor-not-allowed' 
                : 'bg-blue-500 dark:bg-blue-600 text-white active:bg-blue-600 dark:active:bg-blue-700'
            }`}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Enregistrement...
              </span>
            ) : (
              'Enregistrer'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateCardPage;