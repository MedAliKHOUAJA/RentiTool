// src/features/Cards/components/EditCardPage.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createCardSchema, CreateCardFormData } from '@/features/Cards/schemas/Cards';
import { updateCard, getCardById } from '@/features/Cards/actions/Cards';
import { Card } from '@/features/Cards/types';
import toast from 'react-hot-toast';

const EditCardPage = () => {
  const router = useRouter();
  const params = useParams();
  const cardId = Number(params.cardId);
  
  const { 
    register, 
    handleSubmit, 
    control,
    formState: { errors, isSubmitting }, 
    reset,
    watch 
  } = useForm<CreateCardFormData>({
    resolver: zodResolver(createCardSchema),
    mode: 'onChange',
  });

  const [card, setCard] = useState<Card | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profilePreview, setProfilePreview] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const profilePicture = watch('profilePicture');
  const companyLogo = watch('companyLogo');

  useEffect(() => {
    if (profilePicture instanceof File) {
      const url = URL.createObjectURL(profilePicture);
      setProfilePreview(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [profilePicture]);

  useEffect(() => {
    if (companyLogo instanceof File) {
      const url = URL.createObjectURL(companyLogo);
      setLogoPreview(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [companyLogo]);

  useEffect(() => {
    const fetchCard = async () => {
      try {
        const data = await getCardById(cardId);
        if (data) {
          setCard(data);
          reset({
            jobTitle: data.JobTitle,
            companyName: data.CompanyName,
            webSite: data.WebSite || '',
            profilePicture: null,
            companyLogo: null,
          });
        } else {
          setError('Carte non trouvée');
        }
      } catch (err) {
        console.error('Fetch card error:', err);
        setError('Erreur lors de la récupération des données de la carte');
      } finally {
        setLoading(false);
      }
    };
    fetchCard();
  }, [cardId, reset]);

  const onSubmit = async (data: CreateCardFormData) => {
    const formData = new FormData();
    formData.append('jobTitle', data.jobTitle);
    formData.append('companyName', data.companyName);
    formData.append('webSite', data.webSite || '');
    
    if (data.profilePicture instanceof File) {
      formData.append('profilePicture', data.profilePicture);
      console.log('New profile picture:', data.profilePicture.name);
    }
    
    if (data.companyLogo instanceof File) {
      formData.append('companyLogo', data.companyLogo);
      console.log('New company logo:', data.companyLogo.name);
    }

    try {
      const result = await updateCard(cardId, formData);
      if (result.success) {
        toast.success('Carte mise à jour avec succès !');
        router.push('/account/cards');
      } else {
        toast.error(result.error || 'Échec de la mise à jour de la carte');
        setError(result.error || 'Échec de la mise à jour de la carte');
      }
    } catch (err) {
      console.error('Update error:', err);
      toast.error('Erreur lors de la mise à jour de la carte');
      setError('Erreur lors de la mise à jour de la carte');
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

  if (!card) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 text-lg">Erreur : Carte non trouvée</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile-optimized header */}
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
          <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Modifier la Carte</h1>
        </div>
      </div>

      <div className="p-4 pb-24 max-w-2xl mx-auto">
        {/* User Info - Collapsible */}
        <details className="mb-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <summary className="p-4 cursor-pointer select-none font-medium text-gray-900 dark:text-gray-100 flex items-center justify-between active:bg-gray-50 dark:active:bg-gray-700">
            <span>Informations de l'Utilisateur</span>
            <svg className="w-5 h-5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </summary>
          <div className="px-4 pb-4 space-y-2 text-sm">
            <p className="text-gray-700 dark:text-gray-300">
              <span className="font-medium">Nom:</span> {card.FirstName} {card.LastName}
            </p>
            <p className="text-gray-700 dark:text-gray-300">
              <span className="font-medium">Email:</span> {card.Email}
            </p>
            <p className="text-gray-700 dark:text-gray-300">
              <span className="font-medium">Téléphone:</span> {card.Phone || 'Non fourni'}
            </p>
            <p className="text-gray-700 dark:text-gray-300">
              <span className="font-medium">Adresse:</span> {card.Governorate || 'N/A'}, {card.Delegation || 'N/A'}, {card.Postalcode || 'N/A'}
            </p>
          </div>
        </details>

        {/* Current Images - Horizontal scroll on mobile */}
        {(card.ProfilePictureUrl || card.CompanyLogoUrl) && (
          <div className="mb-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <h3 className="text-sm font-medium mb-3 text-gray-900 dark:text-gray-100">Images Actuelles</h3>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {card.ProfilePictureUrl && (
                <div className="flex-shrink-0">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Photo de Profil</p>
                  <img 
                    src={`data:image/jpeg;base64,${card.ProfilePictureUrl}`} 
                    alt="Profile" 
                    className="w-24 h-24 object-cover rounded-lg border-2 border-gray-300 dark:border-gray-600"
                  />
                </div>
              )}
              {card.CompanyLogoUrl && (
                <div className="flex-shrink-0">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Logo Entreprise</p>
                  <img 
                    src={`data:image/jpeg;base64,${card.CompanyLogoUrl}`} 
                    alt="Logo" 
                    className="w-24 h-24 object-contain rounded-lg border-2 border-gray-300 dark:border-gray-600"
                  />
                </div>
              )}
            </div>
          </div>
        )}

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
              Nouvelle Photo de Profil
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
              Laissez vide pour conserver l'actuelle • Max 5 Mo
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
                        console.log('New profile picture selected:', file?.name);
                        onChange(file);
                      }}
                    />
                    <div className="text-center">
                      <svg className="w-10 h-10 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-sm text-blue-500 dark:text-blue-400 font-medium">
                        {profilePicture instanceof File ? 'Changer la photo' : 'Remplacer la photo'}
                      </span>
                    </div>
                  </label>
                  {profilePreview && (
                    <div className="mt-3">
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 text-center">Nouvelle image:</p>
                      <div className="flex justify-center">
                        <img 
                          src={profilePreview} 
                          alt="Nouveau" 
                          className="w-24 h-24 object-cover rounded-full border-2 border-blue-500 dark:border-blue-400"
                        />
                      </div>
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
              Nouveau Logo de l'Entreprise
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
              Laissez vide pour conserver l'actuel • Max 5 Mo
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
                        console.log('New company logo selected:', file?.name);
                        onChange(file);
                      }}
                    />
                    <div className="text-center">
                      <svg className="w-10 h-10 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      <span className="text-sm text-blue-500 dark:text-blue-400 font-medium">
                        {companyLogo instanceof File ? 'Changer le logo' : 'Remplacer le logo'}
                      </span>
                    </div>
                  </label>
                  {logoPreview && (
                    <div className="mt-3">
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 text-center">Nouveau logo:</p>
                      <div className="flex justify-center">
                        <img 
                          src={logoPreview} 
                          alt="Nouveau" 
                          className="w-24 h-24 object-contain rounded-lg border-2 border-blue-500 dark:border-blue-400"
                        />
                      </div>
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

      {/* bottom action bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 safe-area-inset-bottom">
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
                Mise à jour...
              </span>
            ) : (
              'Mettre à jour'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditCardPage;