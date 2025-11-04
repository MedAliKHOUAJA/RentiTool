import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Alert from "@/components/Alert";
import SimilarityCircle from "@/components/SimilarityCircle";
import { useCreateTool } from "../../../tools/application/hooks/useCreateTool";
import { useToolImages } from "../../../tools/application/hooks/useToolImages";
import { useFraudCheck } from "../../../tools/application/hooks/useFraudCheck";
import { ToolFormBasicInfo } from "./ToolFormBasicInfo";
import { ToolFormPricing } from "./ToolFormPricing";
import { ToolFormImages } from "./ToolFormImages";

interface AddToolFormProps {
  onSuccess: () => void;
}

export function AddToolForm({ onSuccess }: AddToolFormProps) {
  // ✅ Get current user session
  const { data: session, status } = useSession();
  
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

    // ✅ Check if user is authenticated
    if (!session?.user?.email) {
      alert("You must be logged in to create a tool");
      return;
    }

    // ✅ Include ownerId in the tool data
    const toolId = await create(
      {
        title,
        description,
        brand,
        model,
        rentalPricePerDay: rentalPricePerDay ? Number(rentalPricePerDay) : undefined,
        categoryId: categoryId ? Number(categoryId) : undefined,
        subCategoryId: subCategoryId ? Number(subCategoryId) : undefined,
        isActive,
        ownerId: session.user.id, 
      },
      stagedImages.map((s) => s.file)
    );

    if (toolId) {
      setCreatedToolId(toolId);

      // If images weren't uploaded during creation, upload them now
      if (stagedImages.length > 0 && !images.length) {
        for (const staged of stagedImages) {
          await upload(staged.file);
        }
      }

      // Clear form
      setTitle("");
      setDescription("");
      setBrand("");
      setModel("");
      setRentalPricePerDay("");
      setCategoryId("");
      setSubCategoryId("");
      setStagedImages([]);
      
      // Small delay to show success message before clearing
      setTimeout(() => {
        setCreatedToolId(null);
        onSuccess();
      }, 1500);
    }
  };

  const handleAddImage = (file: File) => {
    if (!createdToolId) {
      // Stage locally before tool is created
      const id = Math.random().toString(36).slice(2);
      const preview = URL.createObjectURL(file);
      setStagedImages((prev) => [...prev, { id, file, preview }]);
    } else {
      // Upload immediately if tool already exists
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

  // ✅ Show loading state while session is loading
  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="lg:flex lg:space-x-10 mt-8">
      <form onSubmit={handleSubmit} className="w-full lg:w-2/3 space-y-8">
        {/* Fraud Check Status */}
        {fraudCheck.status === "checking" && (
          <Alert variant="info" title="Checking image/text match…" />
        )}
        {fraudCheck.status === "fraud" && (
          <Alert variant="error" title="Potential mismatch detected">
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

        {/* Error/Success Messages */}
        {error && (
          <Alert
            variant="error"
            title="We couldn't save your tool"
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
          <Alert variant="success" title="All set!" onClose={clearMessages}>
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
      </form>

      {/* Sidebar */}
      <div className="w-full lg:w-1/3 mt-8 lg:mt-0">
        <div className="listingSectionSidebar__wrap rounded-3xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-6 lg:p-8">
          <h2 className="text-xl font-semibold">Actions</h2>
          <p className="text-sm text-neutral-500 mt-2">
            Review your details, then save your tool.
          </p>
          <button
            type="submit"
            disabled={loading || fraudCheck.status === "fraud" || !session?.user?.id}
            className="mt-6 w-full px-5 py-3 rounded-full bg-bleu-nuit text-white disabled:opacity-60 hover:bg-opacity-90 transition-all"
          >
            {loading ? "Saving…" : "Save tool"}
          </button>
        </div>
      </div>
    </div>
  );
}