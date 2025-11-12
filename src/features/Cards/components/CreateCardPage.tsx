'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createCardSchema, CreateCardFormData } from '@/features/Cards/schemas/Cards';
import { createCard, getCurrentUser } from '@/features/Cards/actions/Cards';
import { useCardAI } from '@/features/Cards/hooks/useCardAI';
import toast from 'react-hot-toast';
import { Sparkles, Check, Scan, Copy, CheckCheck } from 'lucide-react';
import { BusinessCardScanner } from '@/features/Cards/components/BusinessCardScanner';

interface User {
  userId: string;
  FirstName: string;
  LastName: string;
  Email: string;
  Phone: number | null;
  Governorate?: string;
  Delegation?: string;
  Postalcode?: number;
  LocationId?: number;
}

async function action(formData: FormData) {
  console.log('Action triggered with formData:', Object.fromEntries(formData));
  const result = await createCard(formData);
  if (!result.success) throw new Error(result.error || 'Échec de la création');
  return result.cardId;
}

const CreateCardPage = () => {
  const router = useRouter();
  const { enrichCard, enrichLoading, error: aiError } = useCardAI();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    watch,
    setValue,
  } = useForm<CreateCardFormData>({
    resolver: zodResolver(createCardSchema),
    mode: 'onChange',
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
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
  const [enrichmentApplied, setEnrichmentApplied] = useState(false);
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [enrichedJobTitle, setEnrichedJobTitle] = useState<string>('');
  const [scannerOpen, setScannerOpen] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedTitle, setCopiedTitle] = useState(false);

  // Watch form fields
  const profilePicture = watch('profilePicture');
  const companyLogo = watch('companyLogo');
  const jobTitle = watch('jobTitle');
  const companyName = watch('companyName');

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const data = await getCurrentUser();
        if (data) {
          setUser(data);
          setValue('firstName', data.FirstName || '');
          setValue('lastName', data.LastName || '');
          setValue('email', data.Email || '');
          setValue('phone', data.Phone ? data.Phone.toString() : '');
        } else {
          setError('Utilisateur non trouvé');
        }
      } catch (err) {
        console.error('Fetch user error:', err);
        setError('Erreur lors de la récupération des données utilisateur');
        if (err instanceof Error && err.message.includes('Unauthorized')) {
          router.push('/login');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [router, setValue]);

  // File previews
  useEffect(() => {
    if (profilePicture instanceof File) {
      const reader = new FileReader();
      reader.onloadend = () => setProfilePreview(reader.result as string);
      reader.readAsDataURL(profilePicture);
    }
  }, [profilePicture]);

  useEffect(() => {
    if (companyLogo instanceof File) {
      const reader = new FileReader();
      reader.onloadend = () => setLogoPreview(reader.result as string);
      reader.readAsDataURL(companyLogo);
    }
  }, [companyLogo]);

  const handleCopySpecialty = async (specialty: string, index: number) => {
    try {
      await navigator.clipboard.writeText(specialty);
      setCopiedIndex(index);
      toast.success('Copié !');
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      toast.error('Erreur lors de la copie');
    }
  };

  const handleCopyTitle = async (title: string) => {
    try {
      await navigator.clipboard.writeText(title);
      setCopiedTitle(true);
      toast.success('Titre copié !');
      setTimeout(() => setCopiedTitle(false), 2000);
    } catch (err) {
      toast.error('Erreur lors de la copie');
    }
  };

  const handleApplyTitle = () => {
    if (enrichedJobTitle) {
      setValue('jobTitle', enrichedJobTitle, { shouldValidate: true });
      toast.success('Titre appliqué !');
    }
  };

  const handleEnrichment = async () => {
    if (!jobTitle || !companyName) {
      toast.error('Veuillez remplir le titre professionnel et le nom de l\'entreprise');
      return;
    }

    try {
      const result = await enrichCard({
        FirstName: watch('firstName') || user?.FirstName,
        LastName: watch('lastName') || user?.LastName,
        JobTitle: jobTitle,
        CompanyName: companyName,
        SpecialtiesAndExpertise: specialties,
      });

      if (result.enrichedJobTitle) {
        setEnrichedJobTitle(result.enrichedJobTitle);
      }

      setSpecialties(result.suggestedSpecialties || []);
      setEnrichmentApplied(true);
      toast.success('Enrichissement appliqué avec succès !');
    } catch (err) {
      console.error('Enrichment error:', err);
      toast.error('Erreur lors de l\'enrichissement');
    }
  };

  const handleScannedData = useCallback((data: any) => {
    console.log('📥 CreateCard: handleScannedData received:', JSON.stringify(data, null, 2));
    const e = data.entities || {};
    let fieldsSet = 0;

    if (e.name && e.name.trim()) {
      const fullName = e.name.trim().split(' ');
      if (fullName.length >= 2) {
        setValue('firstName', fullName[0], { shouldValidate: true, shouldDirty: true, shouldTouch: true });
        setValue('lastName', fullName.slice(1).join(' '), { shouldValidate: true, shouldDirty: true, shouldTouch: true });
        fieldsSet++;
        toast.success('Nom extrait !');
      }
    }

    if (e.email && e.email.trim()) {
      setValue('email', e.email.trim(), { shouldValidate: true, shouldDirty: true, shouldTouch: true });
      fieldsSet++;
      toast.success('Email extrait !');
    }

    if (e.phone && e.phone.trim()) {
      setValue('phone', e.phone.trim(), { shouldValidate: true, shouldDirty: true, shouldTouch: true });
      fieldsSet++;
      toast.success('Téléphone extrait !');
    }

    if (e.title && e.title.trim()) {
      setValue('jobTitle', e.title.trim(), { shouldValidate: true, shouldDirty: true, shouldTouch: true });
      fieldsSet++;
      toast.success('Titre professionnel extrait !');
    }

    if (e.company && e.company.trim()) {
      setValue('companyName', e.company.trim(), { shouldValidate: true, shouldDirty: true, shouldTouch: true });
      fieldsSet++;
      toast.success('Nom de l\'entreprise extrait !');
    }

    if (e.website && e.website.trim()) {
      setValue('webSite', e.website.trim(), { shouldValidate: true, shouldDirty: true, shouldTouch: true });
      fieldsSet++;
      toast.success('Site web extrait !');
    }

    if (fieldsSet === 0) {
      console.warn('⚠️ CreateCard: No fields were extracted from the scan');
      toast.error('Aucune donnée n\'a pu être extraite de la carte. Veuillez réessayer avec une image plus claire.');
    }
  }, [setValue]);

  const onSubmit = async (data: CreateCardFormData) => {
    console.log('onSubmit triggered with data:', data);
    if (!user) return;

    const formData = new FormData();
    formData.append('userId', user.userId);
    formData.append('firstName', data.firstName || '');
    formData.append('lastName', data.lastName || '');
    formData.append('email', data.email || '');
    formData.append('phone', data.phone || '');
    formData.append('jobTitle', data.jobTitle);
    formData.append('companyName', data.companyName);
    formData.append('webSite', data.webSite || '');

    if (specialties.length > 0) {
      formData.append('specialties', JSON.stringify(specialties));
    }

    if (data.profilePicture instanceof File) {
      formData.append('profilePicture', data.profilePicture);
    }

    if (data.companyLogo instanceof File) {
      formData.append('companyLogo', data.companyLogo);
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
      {/* Header */}
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
        {/* Scanner Button */}
        <div className="mb-4">
          <button
            type="button"
            onClick={() => setScannerOpen(true)}
            className="w-full p-4 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white rounded-lg font-medium transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
          >
            <Scan className="w-5 h-5" />
            Scanner une Carte de Visite Physique
          </button>
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">
            Prenez une photo de votre carte pour remplir automatiquement les champs
          </p>
        </div>

        {/* User Info Section - Editable */}
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
            Informations Personnelles
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">Prénom</label>
              <input
                {...register('firstName')}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isSubmitting}
                placeholder="Votre prénom"
              />
              {errors.firstName && (
                <p className="text-red-600 dark:text-red-400 text-sm mt-2">{getErrorMessage(errors.firstName)}</p>
              )}
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">Nom de Famille</label>
              <input
                {...register('lastName')}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isSubmitting}
                placeholder="Votre nom de famille"
              />
              {errors.lastName && (
                <p className="text-red-600 dark:text-red-400 text-sm mt-2">{getErrorMessage(errors.lastName)}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">Email</label>
              <input
                {...register('email')}
                type="email"
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isSubmitting}
                placeholder="votre@email.com"
              />
              {errors.email && (
                <p className="text-red-600 dark:text-red-400 text-sm mt-2">{getErrorMessage(errors.email)}</p>
              )}
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">Téléphone</label>
              <input
                {...register('phone')}
                type="tel"
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isSubmitting}
                placeholder="0123456789"
              />
              {errors.phone && (
                <p className="text-red-600 dark:text-red-400 text-sm mt-2">{getErrorMessage(errors.phone)}</p>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
          </div>
        )}

        {aiError && (
          <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <p className="text-yellow-600 dark:text-yellow-400 text-sm">{aiError}</p>
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
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isSubmitting}
              placeholder="Ex: TechCorp Solutions"
            />
            {errors.companyName && (
              <p className="text-red-600 dark:text-red-400 text-sm mt-2">{getErrorMessage(errors.companyName)}</p>
            )}
          </div>

          {/* AI Enrichment Section */}
          {jobTitle && companyName && (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-4 rounded-lg border-2 border-blue-200 dark:border-blue-800">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100 flex items-center gap-2 mb-2">
                    <Sparkles className="w-5 h-5" />
                    Enrichissement IA
                  </h3>
                  <p className="text-sm text-blue-700 dark:text-blue-200 mb-3">
                    Laissez l'IA suggérer des spécialités et améliorer votre titre professionnel.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleEnrichment}
                disabled={enrichLoading || isSubmitting}
                className={`w-full py-2 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                  enrichmentApplied
                    ? 'bg-green-500 hover:bg-green-600 text-white'
                    : 'bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-50'
                }`}
              >
                {enrichLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Enrichissement en cours...
                  </>
                ) : enrichmentApplied ? (
                  <>
                    <Check className="w-4 h-4" />
                    Enrichissement appliqué
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Enrichir automatiquement
                  </>
                )}
              </button>

              {/* Enriched Job Title with Copy Button */}
              {enrichmentApplied && enrichedJobTitle && (
                <div className="mt-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-blue-200 dark:border-blue-700">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-300">
                      Titre professionnel suggéré:
                    </p>
                    <button
                      type="button"
                      onClick={handleApplyTitle}
                      className="text-xs bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded transition-colors"
                    >
                      Appliquer
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="flex-1 text-sm font-medium text-blue-700 dark:text-blue-300">
                      {enrichedJobTitle}
                    </p>
                    <button
                      type="button"
                      onClick={() => handleCopyTitle(enrichedJobTitle)}
                      className="p-2 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                      title="Copier le titre"
                    >
                      {copiedTitle ? (
                        <CheckCheck className="w-4 h-4 text-green-600 dark:text-green-400" />
                      ) : (
                        <Copy className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Specialties with Copy Buttons */}
              {enrichmentApplied && specialties.length > 0 && (
                <div className="mt-3 p-3 bg-white dark:bg-gray-800 rounded-lg">
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-2">
                    Spécialités suggérées:
                  </p>
                  <div className="space-y-2">
                    {specialties.map((specialty, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between gap-2 p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                      >
                        <span className="flex-1 text-sm text-blue-700 dark:text-blue-200 font-medium">
                          {specialty}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopySpecialty(specialty, idx)}
                          className="p-1.5 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                          title="Copier"
                        >
                          {copiedIndex === idx ? (
                            <CheckCheck className="w-4 h-4 text-green-600 dark:text-green-400" />
                          ) : (
                            <Copy className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Website */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">Site Web</label>
            <input
              {...register('webSite')}
              type="url"
              inputMode="url"
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isSubmitting}
              placeholder="https://www.exemple.com"
            />
            {errors.webSite && (
              <p className="text-red-600 dark:text-red-400 text-sm mt-2">{getErrorMessage(errors.webSite)}</p>
            )}
          </div>

          {/* Profile Picture */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">Photo de Profil</label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Max 5 Mo • JPEG ou PNG</p>
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
                      <img src={profilePreview} alt="Aperçu" className="w-24 h-24 object-cover rounded-full border-2 border-blue-500 dark:border-blue-400" />
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
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">Logo de l'Entreprise</label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Facultatif • Max 5 Mo • JPEG ou PNG</p>
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
                      <img src={logoPreview} alt="Aperçu" className="w-24 h-24 object-contain rounded-lg border-2 border-blue-500 dark:border-blue-400" />
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

      {/* Scanner Modal */}
      <BusinessCardScanner
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onDataExtracted={handleScannedData}
      />
      {/* Bottom action bar */}
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
            form="create-card-form" // Add id to form if needed, but since handleSubmit, use onClick
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
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
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