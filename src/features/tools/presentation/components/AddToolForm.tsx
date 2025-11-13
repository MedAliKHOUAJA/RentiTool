"use client";

import React, { useState, useEffect } from "react";
import Alert from "@/components/Alert";
import SimilarityCircle from "@/components/SimilarityCircle";
import { useCreateTool } from "../../../tools/application/hooks/useCreateTool";
import { useToolImages } from "../../../tools/application/hooks/useToolImages";
import { useFraudCheck } from "../../../tools/application/hooks/useFraudCheck";
import { ToolFormBasicInfo } from "./ToolFormBasicInfo";
import { ToolFormPricing } from "./ToolFormPricing";
import { ToolFormImages } from "./ToolFormImages";
import { useAuth } from "@/hooks/useAuth";

interface AddToolFormProps {
  onSuccess: () => void;
}

export function AddToolForm({ onSuccess }: AddToolFormProps) {
  // ✅ Utiliser useAuth au lieu de useSession
  const { user, loading: authLoading } = useAuth();
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [rentalPricePerDay, setRentalPricePerDay] = useState<string>("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [subCategoryId, setSubCategoryId] = useState<string>("");
  const [isActive, setIsActive] = useState(true);
  const [createdToolId, setCreatedToolId] = useState<string | number | null>(null);

  const [stagedImages, setStagedImages] = useState<
    Array<{ id: string; file: File; preview: string }>
  >([]);

  const { create, loading, error, success, fraudSimilarity, clearMessages } = useCreateTool();
  const { images, upload, remove, setPrimary, loading: uploadingImages, error: imageError } = useToolImages(createdToolId);
  
  const fraudCheck = useFraudCheck(
    title,
    description,
    stagedImages,
    images
  );

  // Cleanup object URLs
  useEffect(() => {
    return () => {
      stagedImages.forEach((s) => URL.revokeObjectURL(s.preview));
    };
  }, [stagedImages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // ✅ Vérifier l'authentification avec useAuth
    if (!user?.userId) {
      alert("Vous devez être connecté pour créer un outil");
      return;
    }

    // ✅ Validation des champs requis
    if (!title.trim() || !description.trim() || !rentalPricePerDay) {
      alert("Veuillez remplir tous les champs obligatoires (titre, description, prix)");
      return;
    }

    // ✅ Vérifier la fraude avant de soumettre
    if (fraudCheck.status === "fraud") {
      alert("Veuillez corriger les incohérences détectées avant de soumettre");
      return;
    }

    try {
      // ✅ Inclure ownerId dans les données
      const toolId = await create(
        {
          title: title.trim(),
          description: description.trim(),
          brand: brand.trim(),
          model: model.trim(),
          rentalPricePerDay: rentalPricePerDay ? Number(rentalPricePerDay) : undefined,
          categoryId: categoryId ? Number(categoryId) : undefined,
          subCategoryId: subCategoryId ? Number(subCategoryId) : undefined,
          isActive,
          ownerId: user.userId, 
        },
        stagedImages.map((s) => s.file)
      );

      if (toolId) {
        setCreatedToolId(toolId);

        // Si les images n'ont pas été uploadées pendant la création, les uploader maintenant
        if (stagedImages.length > 0 && !images.length) {
          try {
            for (const staged of stagedImages) {
              await upload(staged.file);
            }
          } catch (uploadError) {
            console.error("Erreur lors de l'upload des images:", uploadError);
            alert("L'outil a été créé mais certaines images n'ont pas pu être uploadées");
          }
        }

        // Réinitialiser le formulaire
        setTitle("");
        setDescription("");
        setBrand("");
        setModel("");
        setRentalPricePerDay("");
        setCategoryId("");
        setSubCategoryId("");
        setStagedImages([]);
        
        // Petit délai pour afficher le message de succès avant de nettoyer
        setTimeout(() => {
          setCreatedToolId(null);
          onSuccess();
        }, 1500);
      }
    } catch (submitError) {
      console.error("Erreur lors de la création de l'outil:", submitError);
      // L'erreur sera gérée par le hook useCreateTool
    }
  };

  const handleAddImage = (file: File) => {
    if (!createdToolId) {
      // Stocker localement avant la création de l'outil
      const id = Math.random().toString(36).slice(2);
      const preview = URL.createObjectURL(file);
      setStagedImages((prev) => [...prev, { id, file, preview }]);
    } else {
      // Uploader immédiatement si l'outil existe déjà
      upload(file);
    }
  };

  const handleRemoveStagedImage = (id: string) => {
    setStagedImages((prev) => {
      const found = prev.find((p) => p.id === id);
      if (found) URL.revokeObjectURL(found.preview);
      return prev.filter((p) => p.id !== id);
    });
  };

  // ✅ Afficher l'état de chargement pendant l'authentification
  if (authLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        <span className="ml-4 text-neutral-600">Chargement...</span>
      </div>
    );
  }

  // ✅ Vérifier si l'utilisateur est connecté
  if (!user) {
    return (
      <div className="text-center py-10">
        <Alert variant="error" title="Authentification requise">
          <p>Vous devez être connecté pour créer un outil.</p>
          <button
            onClick={() => window.location.href = '/login'}
            className="mt-4 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Se connecter
          </button>
        </Alert>
      </div>
    );
  }

  return (
    <div className="lg:flex lg:space-x-10 mt-8">
      <form onSubmit={handleSubmit} className="w-full lg:w-2/3 space-y-8">
        {/* Vérification de fraude */}
        {fraudCheck.status === "checking" && (
          <Alert variant="info" title="Vérification image/texte en cours…" />
        )}
        {fraudCheck.status === "fraud" && (
          <Alert variant="error" title="Incohérence potentielle détectée">
            <div className="whitespace-pre-line">{fraudCheck.message}</div>
            {fraudCheck.similarity !== null && (
              <div className="mt-3 flex items-center justify-center">
                <SimilarityCircle similarity={fraudCheck.similarity} size={88} />
              </div>
            )}
          </Alert>
        )}
        {fraudCheck.status === "ok" && fraudCheck.similarity !== null && (
          <div className="mb-4 flex items-center justify-center">
            <SimilarityCircle
              similarity={fraudCheck.similarity}
              size={72}
              variant="success"
            />
          </div>
        )}

        {/* Messages d'erreur/succès */}
        {error && (
          <Alert
            variant="error"
            title="Impossible de sauvegarder votre outil"
            onClose={clearMessages}
          >
            <div className="whitespace-pre-line">{error}</div>
            {fraudSimilarity !== null && (
              <div className="mt-3 flex items-center justify-center">
                <SimilarityCircle similarity={fraudSimilarity} size={88} />
              </div>
            )}
          </Alert>
        )}
        {success && (
          <Alert variant="success" title="Terminé !" onClose={clearMessages}>
            {success}
          </Alert>
        )}

        <ToolFormBasicInfo
          title={title}
          description={description}
          brand={brand}
          model={model}
          onTitleChange={setTitle}
          onDescriptionChange={setDescription}
          onBrandChange={setBrand}
          onModelChange={setModel}
        />

        <ToolFormPricing
          rentalPricePerDay={rentalPricePerDay}
          categoryId={categoryId}
          subCategoryId={subCategoryId}
          onPriceChange={setRentalPricePerDay}
          onCategoryChange={setCategoryId}
          onSubCategoryChange={setSubCategoryId}
        />

        <ToolFormImages
          stagedImages={stagedImages}
          uploadedImages={images}
          uploading={uploadingImages}
          error={imageError}
          onAddImage={handleAddImage}
          onRemoveStagedImage={handleRemoveStagedImage}
          onDeleteImage={remove}
          onSetPrimary={setPrimary}
        />

        {/* Bouton de soumission mobile */}
        <div className="lg:hidden mt-8">
          <div className="rounded-3xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-6">
            <h2 className="text-xl font-semibold">Actions</h2>
            <p className="text-sm text-neutral-500 mt-2">
              Vérifiez vos informations, puis sauvegardez votre outil.
            </p>
            <button
              type="submit"
              disabled={loading || fraudCheck.status === "fraud" || !user?.userId}
              className="mt-6 w-full px-5 py-3 rounded-full bg-bleu-nuit text-white disabled:opacity-60 hover:bg-opacity-90 transition-all disabled:cursor-not-allowed"
            >
              {loading ? "Sauvegarde en cours…" : "Sauvegarder l'outil"}
            </button>
          </div>
        </div>
      </form>

      {/* Sidebar - Desktop seulement */}
      <div className="hidden lg:block w-full lg:w-1/3 mt-8 lg:mt-0">
        <div className="listingSectionSidebar__wrap rounded-3xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-6 lg:p-8">
          <h2 className="text-xl font-semibold">Actions</h2>
          <p className="text-sm text-neutral-500 mt-2">
            Vérifiez vos informations, puis sauvegardez votre outil.
          </p>
          <button
            type="button"
            disabled={loading || fraudCheck.status === "fraud" || !user?.userId}
            className="mt-6 w-full px-5 py-3 rounded-full bg-bleu-nuit text-white disabled:opacity-60 hover:bg-opacity-90 transition-all disabled:cursor-not-allowed"
            onClick={handleSubmit}
          >
            {loading ? "Sauvegarde en cours…" : "Sauvegarder l'outil"}
          </button>
          
          {/* Informations utilisateur */}
          <div className="mt-6 pt-6 border-t border-neutral-200 dark:border-neutral-700">
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Connecté en tant que: <strong>{user.firstName} {user.lastName}</strong>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}