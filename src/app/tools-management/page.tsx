"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import BgGlassmorphism from "@/components/BgGlassmorphism";
import BackgroundSection from "@/components/BackgroundSection";
import ToolCard from "@/components/Cards/ToolCard";
import ConfirmDialog from "@/components/ConfirmDialog";

import Alert from "@/components/Alert";
import SimilarityCircle from "@/components/SimilarityCircle";
import { ToolDataType } from "@/features/tools/presentation/tool.dto";

const ToolsManagementPage = () => {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [rentalPricePerDay, setRentalPricePerDay] = useState<string>("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [subCategoryId, setSubCategoryId] = useState<string>("");
  const STATIC_OWNER_ID = "420430c2-0338-4612-aa74-65f0a82900fe";
  const [ownerId, setOwnerId] = useState<string>(STATIC_OWNER_ID);
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [fraudSimilarity, setFraudSimilarity] = useState<number | null>(null);
  // Live precheck state (Add)
  const [preStatusAdd, setPreStatusAdd] = useState<
    "idle" | "checking" | "ok" | "fraud" | "error"
  >("idle");
  const [preMessageAdd, setPreMessageAdd] = useState<string | null>(null);
  const [preSimilarityAdd, setPreSimilarityAdd] = useState<number | null>(null);
  const [metaError, setMetaError] = useState<string | null>(null);
  const [fkOptions, setFkOptions] = useState<
    Record<
      string,
      {
        valueType: "number" | "string";
        options: Array<{ value: any; label: string }>;
      }
    >
  >({});
  const [filteredSubcats, setFilteredSubcats] = useState<
    Array<{ value: any; label: string }>
  >([]);
  const [activeTab, setActiveTab] = useState<"mine" | "add" | "reserved">(
    "mine"
  );
  const [myTools, setMyTools] = useState<ToolDataType[]>([]);
  const [myToolsLoading, setMyToolsLoading] = useState(false);
  const [myToolsError, setMyToolsError] = useState<string | null>(null);
  // Owner list: search and order
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  type SortKey =
    | "newest"
    | "oldest"
    | "title_asc"
    | "title_desc"
    | "price_asc"
    | "price_desc"
    | "brand_asc"
    | "brand_desc"
    | "model_asc"
    | "model_desc"
    | "category_asc"
    | "category_desc";
  const [sortKey, setSortKey] = useState<SortKey>("newest");
  // Add Tool image handling
  const [createdToolId, setCreatedToolId] = useState<string | number | null>(
    null
  );
  type ImageItem = { id: string | number; url: string; isPrimary: boolean };
  const [imagesAdd, setImagesAdd] = useState<ImageItem[]>([]);
  const [imgErrorAdd, setImgErrorAdd] = useState<string | null>(null);
  const [uploadingAdd, setUploadingAdd] = useState(false);
  // Staged images before tool is created
  const [stagedImagesAdd, setStagedImagesAdd] = useState<
    Array<{ id: string; file: File; preview: string }>
  >([]);

  // Cleanup object URLs on unmount or when staged list changes
  useEffect(() => {
    return () => {
      stagedImagesAdd.forEach((s) => URL.revokeObjectURL(s.preview));
    };
  }, []);
  useEffect(() => {
    return () => {
      stagedImagesAdd.forEach((s) => URL.revokeObjectURL(s.preview));
    };
  }, [stagedImagesAdd]);
  const refreshMine = async () => {
    setMyToolsLoading(true);
    setMyToolsError(null);
    try {
      // Map sort key to orderBy/order
      const mapSort = (
        k: SortKey
      ): { orderBy: string; order: "asc" | "desc" } => {
        switch (k) {
          case "oldest":
            return { orderBy: "id", order: "asc" };
          case "title_asc":
            return { orderBy: "title", order: "asc" };
          case "title_desc":
            return { orderBy: "title", order: "desc" };
          case "price_asc":
            return { orderBy: "price", order: "asc" };
          case "price_desc":
            return { orderBy: "price", order: "desc" };
          case "brand_asc":
            return { orderBy: "brand", order: "asc" };
          case "brand_desc":
            return { orderBy: "brand", order: "desc" };
          case "model_asc":
            return { orderBy: "model", order: "asc" };
          case "model_desc":
            return { orderBy: "model", order: "desc" };
          case "category_asc":
            return { orderBy: "category", order: "asc" };
          case "category_desc":
            return { orderBy: "category", order: "desc" };
          case "newest":
          default:
            return { orderBy: "id", order: "desc" };
        }
      };
      const { orderBy, order } = mapSort(sortKey);
      const q = debouncedSearch.trim();
      const params = new URLSearchParams({ ownerId });
      params.set("orderBy", orderBy);
      params.set("order", order);
      if (q) params.set("q", q);
      const res = await fetch(`/api/tools?${params.toString()}`);
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setMyTools(data as ToolDataType[]);
    } catch (e: any) {
      setMyToolsError(e?.message || "Failed to load your tools");
    } finally {
      setMyToolsLoading(false);
    }
  };

  useEffect(() => {
    const loadMeta = async () => {
      try {
        setMetaError(null);
        const res = await fetch("/api/tools/meta");
        if (!res.ok) {
          throw new Error(await res.text());
        }
        const json = await res.json();
        setFkOptions(json.foreignKeys || {});
      } catch (e: any) {
        setMetaError(e.message || "Failed to load metadata");
      }
    };
    loadMeta();
  }, []);

  // Debounced live fraud precheck for Add form
  useEffect(() => {
    // Only run when there's some text and at least one image (staged file or uploaded)
    const hasText = title.trim().length + description.trim().length > 0;
    const hasImage = stagedImagesAdd.length > 0 || imagesAdd.length > 0;
    if (!hasText || !hasImage) {
      setPreStatusAdd("idle");
      setPreMessageAdd(null);
      setPreSimilarityAdd(null);
      return;
    }
    setPreStatusAdd("checking");
    setPreMessageAdd(null);
    setPreSimilarityAdd(null);

    const t = setTimeout(async () => {
      try {
        const fd = new FormData();
        fd.append("title", title.trim());
        fd.append("description", description.trim() || "");
        if (stagedImagesAdd.length) {
          fd.append("image_file", stagedImagesAdd[0].file);
        } else if (imagesAdd.length) {
          const url = imagesAdd[0].url;
          const isAbs = /^https?:\/\//i.test(url);
          const absUrl = isAbs
            ? url
            : `${window.location.protocol}//${window.location.host}${
                url.startsWith("/") ? url : "/" + url
              }`;
          fd.append("image_url", absUrl);
        }
        fd.append("threshold", "0.25");
        const pre = await fetch("/api/fraud-check", {
          method: "POST",
          body: fd,
        });
        let preJson: any = null;
        try {
          preJson = await pre.json();
        } catch {}
        if (!pre.ok) {
          const maybeSim = preJson?.similarity;
          if (
            pre.status === 400 &&
            (typeof maybeSim === "number" || typeof maybeSim === "string")
          ) {
            const sim = Number(maybeSim);
            setPreSimilarityAdd(!Number.isNaN(sim) ? sim : null);
            setPreStatusAdd("fraud");
            setPreMessageAdd(
              preJson?.message || "Image does not match title/description."
            );
            return;
          }
          setPreStatusAdd("error");
          setPreMessageAdd(preJson?.message || "Fraud check failed");
          return;
        }
        // ok
        setPreStatusAdd("ok");
        setPreMessageAdd(null);
        setPreSimilarityAdd(preJson?.similarity ?? null);
      } catch (e: any) {
        setPreStatusAdd("error");
        setPreMessageAdd(e?.message || "Fraud check failed");
      }
    }, 700);
    return () => clearTimeout(t);
  }, [title, description, stagedImagesAdd, imagesAdd]);

  // Load subcategories filtered by selected category
  useEffect(() => {
    const run = async () => {
      setFilteredSubcats([]);
      if (!categoryId) {
        setSubCategoryId("");
        return;
      }
      try {
        const res = await fetch(
          `/api/tools/meta/subcategories?categoryId=${encodeURIComponent(
            categoryId
          )}`
        );
        if (!res.ok) {
          // keep generic list if endpoint fails
          return;
        }
        const json = await res.json();
        setFilteredSubcats(json.options || []);
        // If current subcat not in filtered list, clear it
        if (
          json.options &&
          !json.options.some(
            (o: any) => String(o.value) === String(subCategoryId)
          )
        ) {
          setSubCategoryId("");
        }
      } catch {}
    };
    run();
  }, [categoryId]);

  // Debounce search input for owner list
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery), 400);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // Load my tools when tab is 'mine' and when filters change
  useEffect(() => {
    if (activeTab !== "mine") return;
    refreshMine();
  }, [activeTab, ownerId, debouncedSearch, sortKey]);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const [toggleDialogOpen, setToggleDialogOpen] = useState(false);
  const [pendingToggle, setPendingToggle] = useState<{
    id: number;
    nextActive: boolean;
  } | null>(null);
  const [toggleLoading, setToggleLoading] = useState(false);

  const askDelete = (toolId: number) => {
    setPendingDeleteId(toolId);
    setConfirmOpen(true);
  };

  const askToggle = (toolId: number, currentActive?: boolean) => {
    const nextActive = !(currentActive ?? true);
    setPendingToggle({ id: toolId, nextActive });
    setToggleDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (pendingDeleteId == null) return;
    setConfirmLoading(true);
    try {
      const res = await fetch(
        `/api/tools/${encodeURIComponent(String(pendingDeleteId))}`,
        { method: "DELETE" }
      );
      if (res.status === 204) {
        setConfirmOpen(false);
        setPendingDeleteId(null);
        await refreshMine();
      } else if (res.status === 404) {
        setConfirmOpen(false);
        setPendingDeleteId(null);
        alert("Tool not found. It may have been deleted already.");
        await refreshMine();
      } else {
        const msg = await res.text();
        alert(msg || "Failed to delete tool");
      }
    } catch (e: any) {
      alert(e?.message || "Failed to delete tool");
    } finally {
      setConfirmLoading(false);
    }
  };

  const confirmToggle = async () => {
    if (!pendingToggle) return;
    setToggleLoading(true);
    try {
      const res = await fetch(
        `/api/tools/${encodeURIComponent(String(pendingToggle.id))}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isActive: pendingToggle.nextActive }),
        }
      );
      if (!res.ok) {
        const msg = await res.text();
        alert(msg || "Failed to update tool status");
      } else {
        setToggleDialogOpen(false);
        setPendingToggle(null);
        await refreshMine();
      }
    } catch (e: any) {
      alert(e?.message || "Failed to update tool status");
    } finally {
      setToggleLoading(false);
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    // OwnerId is required by DB; must be UUID
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(ownerId.trim())) {
      setError("Owner ID must be a valid UUID");
      return;
    }
    setLoading(true);
    try {
      // 1) Run fraud-check using staged image (if any) or first uploaded image URL
      try {
        const fd = new FormData();
        fd.append("title", title.trim());
        fd.append("description", description.trim() || "");
        if (stagedImagesAdd.length) {
          fd.append("image_file", stagedImagesAdd[0].file);
        } else if (imagesAdd.length) {
          // Ensure absolute URL for fraud service
          const url = imagesAdd[0].url;
          const isAbs = /^https?:\/\//i.test(url);
          const absUrl = isAbs
            ? url
            : `${window.location.protocol}//${window.location.host}${
                url.startsWith("/") ? url : "/" + url
              }`;
          fd.append("image_url", absUrl);
        }
        fd.append("threshold", "0.25");
        const pre = await fetch("/api/fraud-check", {
          method: "POST",
          body: fd,
        });
        let preJson: any = null;
        try {
          preJson = await pre.json();
        } catch {}
        if (!pre.ok) {
          const maybeSim = preJson?.similarity;
          if (
            pre.status === 400 &&
            (typeof maybeSim === "number" || typeof maybeSim === "string")
          ) {
            const sim = Number(maybeSim);
            setFraudSimilarity(!Number.isNaN(sim) ? sim : null);
            setError(
              "The selected image doesn’t appear to match your title/description. Try another image or adjust the text."
            );
            setLoading(false);
            return;
          }
          const msg = preJson?.message || "Fraud check failed";
          throw new Error(msg);
        }
        setFraudSimilarity(null);
      } catch (fcErr: any) {
        // Block save when remote says fraud (400). Other network errors: allow save but show banner.
        if (
          typeof fcErr?.message === "string" &&
          fcErr.message.includes("Image does not match")
        ) {
          throw fcErr;
        }
        console.warn(
          "Fraud-check error (non-blocking):",
          fcErr?.message || fcErr
        );
      }

      const payload: any = {
        title: title.trim(),
        description: description.trim() || undefined,
        brand: brand.trim() || undefined,
        model: model.trim() || undefined,
        rentalPricePerDay: rentalPricePerDay
          ? Number(rentalPricePerDay)
          : undefined,
        categoryId: categoryId ? Number(categoryId) : undefined,
        subCategoryId: subCategoryId ? Number(subCategoryId) : undefined,
        ownerId: ownerId.trim(),
        isActive,
      };
      const res = await fetch("/api/tools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || "Failed to create tool");
      }
      const created = await res.json();
      const newId =
        created?.id ??
        created?.tool?.id ??
        created?.data?.id ??
        created?.[0]?.id ??
        null;
      setCreatedToolId(newId);
      // If there are staged images, upload them now
      if (newId && stagedImagesAdd.length) {
        setUploadingAdd(true);
        setImgErrorAdd(null);
        for (const s of stagedImagesAdd) {
          try {
            await uploadImageForTool(newId, s.file);
          } catch (e) {
            // uploadImageForTool already sets errors
          }
        }
        // Clear staged images after upload
        setStagedImagesAdd([]);
        setUploadingAdd(false);
        setSuccess("Tool created and images uploaded successfully");
      } else {
        setSuccess("Tool created successfully. You can now upload images.");
      }
      // Go back to My tools and refresh list
      await refreshMine();
      setActiveTab("mine");
      // Reset Add form
      setTitle("");
      setDescription("");
      setBrand("");
      setModel("");
      setRentalPricePerDay("");
      setCategoryId("");
      setSubCategoryId("");
      setCreatedToolId(null);
      setImagesAdd([]);
      setStagedImagesAdd([]);
      setFraudSimilarity(null);
      setPreStatusAdd("idle");
      setPreMessageAdd(null);
      setPreSimilarityAdd(null);
    } catch (e: any) {
      setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  // Load images for the newly created tool
  useEffect(() => {
    const load = async () => {
      if (!createdToolId) return;
      try {
        setImgErrorAdd(null);
        const res = await fetch(
          `/api/tools/${encodeURIComponent(String(createdToolId))}/images`
        );
        if (!res.ok) throw new Error(await res.text());
        const json = await res.json();
        setImagesAdd(Array.isArray(json.images) ? json.images : []);
      } catch (e: any) {
        setImgErrorAdd(e?.message || "Failed to load images");
      }
    };
    load();
  }, [createdToolId]);

  // Image handlers for Add flow
  const uploadImageForTool = async (toolIdAny: string | number, file: File) => {
    if (!toolIdAny || !file) return;
    try {
      setUploadingAdd(true);
      setImgErrorAdd(null);
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(
        `/api/tools/${encodeURIComponent(String(toolIdAny))}/images`,
        { method: "POST", body: fd }
      );
      if (!res.ok) throw new Error(await res.text());
      // Reload images
      const list = await fetch(
        `/api/tools/${encodeURIComponent(String(toolIdAny))}/images`
      );
      const json = await list.json();
      setImagesAdd(Array.isArray(json.images) ? json.images : []);
    } catch (e: any) {
      setImgErrorAdd(e?.message || "Failed to upload image");
      throw e;
    } finally {
      setUploadingAdd(false);
    }
  };

  const handleUploadAdd = async (file: File) => {
    if (!createdToolId || !file) return;
    return uploadImageForTool(createdToolId, file);
  };

  const handleAddTileSelect = (file: File) => {
    if (!file) return;
    if (!createdToolId) {
      // Stage locally with preview until tool is created
      const id = Math.random().toString(36).slice(2);
      const preview = URL.createObjectURL(file);
      setStagedImagesAdd((prev) => [...prev, { id, file, preview }]);
      return;
    }
    // If tool exists, upload immediately
    handleUploadAdd(file);
  };

  const removeStagedImage = (id: string) => {
    setStagedImagesAdd((prev) => {
      const found = prev.find((p) => p.id === id);
      if (found) URL.revokeObjectURL(found.preview);
      return prev.filter((p) => p.id !== id);
    });
  };

  const handleDeleteImageAdd = async (imageId: string | number) => {
    if (!createdToolId) return;
    try {
      setImgErrorAdd(null);
      const res = await fetch(
        `/api/tools/${encodeURIComponent(
          String(createdToolId)
        )}/images/${encodeURIComponent(String(imageId))}`,
        { method: "DELETE" }
      );
      if (res.status !== 204) {
        if (!res.ok) throw new Error(await res.text());
      }
      // Refresh
      const list = await fetch(
        `/api/tools/${encodeURIComponent(String(createdToolId))}/images`
      );
      const json = await list.json();
      setImagesAdd(Array.isArray(json.images) ? json.images : []);
    } catch (e: any) {
      setImgErrorAdd(e?.message || "Failed to delete image");
    }
  };

  const handleSetPrimaryImageAdd = async (imageId: string | number) => {
    if (!createdToolId) return;
    try {
      setImgErrorAdd(null);
      const res = await fetch(
        `/api/tools/${encodeURIComponent(
          String(createdToolId)
        )}/images/${encodeURIComponent(String(imageId))}`,
        { method: "PUT" }
      );
      if (res.status !== 204) {
        if (!res.ok) throw new Error(await res.text());
      }
      // Refresh
      const list = await fetch(
        `/api/tools/${encodeURIComponent(String(createdToolId))}/images`
      );
      const json = await list.json();
      setImagesAdd(Array.isArray(json.images) ? json.images : []);
    } catch (e: any) {
      setImgErrorAdd(e?.message || "Failed to set primary image");
    }
  };

  return (
    <>
      <div className="nc-ToolsManagementPage container my-10 relative">
        <BgGlassmorphism className="absolute inset-x-0 md:top-10 xl:top-40 min-h-0 pl-20 py-24 flex overflow-hidden z-0 pointer-events-none" />
        <div className="relative py-8">
          <BackgroundSection className="bg-neutral-100 dark:bg-black dark:bg-opacity-20 pointer-events-none" />
          <h1 className="relative z-10 text-2xl md:text-3xl font-semibold">
            Tools management
          </h1>
          <p className="relative z-10 text-neutral-500 dark:text-neutral-400 mt-2">
            Manage your tools, add new ones, and check reservations.
          </p>
          {/* Tabs */}
          <div className="relative z-10 mt-6 border-b border-neutral-200 dark:border-neutral-700">
            <nav className="flex gap-6" aria-label="Tabs">
              {[
                { key: "mine", label: "My tools" },
                { key: "add", label: "Add a tool" },
                { key: "reserved", label: "Reserved tools" },
              ].map((t) => (
                <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key as any)}
                  className={`-mb-px pb-3 border-b-2 text-sm md:text-base ${
                    activeTab === t.key
                      ? "border-bleu-nuit text-bleu-nuit"
                      : "border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </nav>
          </div>
        </div>
        {/* CONTENT BY TAB */}
        {activeTab === "mine" && (
          <div className="mt-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
              <h2 className="text-xl font-semibold">Your tools</h2>
              <div className="flex flex-1 items-center gap-3 sm:justify-end">
                {/* Search */}
                <div className="w-full sm:w-72">
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by title or description"
                    className="w-full border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                {/* Sort */}
                <div>
                  <select
                    value={sortKey}
                    onChange={(e) => setSortKey(e.target.value as SortKey)}
                    className="border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 rounded-full px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="newest">Newest</option>
                    <option value="oldest">Oldest</option>
                    <option value="title_asc">Title A–Z</option>
                    <option value="title_desc">Title Z–A</option>
                    <option value="price_asc">Price Low–High</option>
                    <option value="price_desc">Price High–Low</option>
                    <option value="brand_asc">Brand A–Z</option>
                    <option value="brand_desc">Brand Z–A</option>
                    <option value="model_asc">Model A–Z</option>
                    <option value="model_desc">Model Z–A</option>
                    <option value="category_asc">Category A–Z</option>
                    <option value="category_desc">Category Z–A</option>
                  </select>
                </div>
                <button
                  onClick={() => setActiveTab("add")}
                  className="px-4 py-2 rounded-full bg-bleu-nuit text-white"
                >
                  Add a tool
                </button>
              </div>
            </div>
            {myToolsLoading && (
              <div className="py-6 text-neutral-500">Loading your tools…</div>
            )}
            {myToolsError && (
              <div className="py-6 text-red-600">{myToolsError}</div>
            )}
            {!myToolsLoading && !myToolsError && myTools.length === 0 && (
              <div className="py-6 text-neutral-500">
                You don't have any tools yet.
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
              {myTools.map((tool) => {
                const ownerHref = `/owner-tool-detail?id=${encodeURIComponent(
                  String(tool.id)
                )}` as any;
                return (
                  <ToolCard
                    key={tool.id}
                    data={{ ...tool, href: ownerHref }}
                    onDelete={() => askDelete(Number(tool.id))}
                    onEdit={() =>
                      router.push(
                        `/tools-management/edit?id=${encodeURIComponent(
                          String(tool.id)
                        )}` as any
                      )
                    }
                    onToggleActive={() =>
                      askToggle(Number(tool.id), tool.isActive)
                    }
                    showLike={false}
                    showStatusBadge
                  />
                );
              })}
            </div>
          </div>
        )}

        {activeTab === "add" && (
          <div className="lg:flex lg:space-x-10 mt-8">
            <form onSubmit={onSubmit} className="w-full lg:w-2/3 space-y-8">
              {/* BASIC INFO */}
              <div className="listingSection__wrap rounded-3xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-6 lg:p-8">
                <h2 className="text-xl font-semibold mb-6">
                  Basic information
                </h2>
                {/* Live precheck status */}
                {preStatusAdd === "checking" && (
                  <Alert variant="info" title="Checking image/text match…" />
                )}
                {preStatusAdd === "fraud" && (
                  <Alert variant="error" title="Potential mismatch detected">
                    <div className="whitespace-pre-line">{preMessageAdd}</div>
                    {preSimilarityAdd !== null && (
                      <div className="mt-3 flex items-center justify-center">
                        <SimilarityCircle
                          similarity={preSimilarityAdd}
                          size={88}
                        />
                      </div>
                    )}
                  </Alert>
                )}
                {preStatusAdd === "ok" && preSimilarityAdd !== null && (
                  <div className="mb-4 flex items-center justify-center">
                    <SimilarityCircle
                      similarity={preSimilarityAdd}
                      size={72}
                      variant="success"
                    />
                  </div>
                )}
                {error && (
                  <Alert
                    variant="error"
                    title="We couldn't save your tool"
                    onClose={() => {
                      setError(null);
                      setFraudSimilarity(null);
                    }}
                  >
                    <div className="whitespace-pre-line">{error}</div>
                    {fraudSimilarity !== null && (
                      <div className="mt-3 flex items-center justify-center">
                        <SimilarityCircle
                          similarity={fraudSimilarity}
                          size={88}
                        />
                      </div>
                    )}
                  </Alert>
                )}
                {success && (
                  <Alert
                    variant="success"
                    title="All set!"
                    onClose={() => setSuccess(null)}
                  >
                    {success}
                  </Alert>
                )}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Title *
                    </label>
                    <input
                      className="w-full border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Description
                    </label>
                    <textarea
                      className="w-full border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      rows={4}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Brand
                      </label>
                      <input
                        className="w-full border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        value={brand}
                        onChange={(e) => setBrand(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Model
                      </label>
                      <input
                        className="w-full border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        value={model}
                        onChange={(e) => setModel(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* PRICING & CATEGORY */}
              <div className="listingSection__wrap rounded-3xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-6 lg:p-8">
                <h2 className="text-xl font-semibold mb-6">
                  Pricing & Categories
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Price per day
                    </label>
                    <input
                      type="number"
                      className="w-full border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      value={rentalPricePerDay}
                      onChange={(e) => setRentalPricePerDay(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Category
                    </label>
                    {fkOptions["CategoryId"] ||
                    fkOptions["categoryid"] ||
                    fkOptions["category_id"] ? (
                      <select
                        className="w-full border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        value={categoryId}
                        onChange={(e) => setCategoryId(e.target.value)}
                      >
                        <option value="">-- Category --</option>
                        {(
                          fkOptions["CategoryId"]?.options ||
                          fkOptions["categoryid"]?.options ||
                          fkOptions["category_id"]?.options ||
                          []
                        ).map((opt) => (
                          <option
                            key={String(opt.value)}
                            value={String(opt.value)}
                          >
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="number"
                        className="w-full border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        value={categoryId}
                        onChange={(e) => setCategoryId(e.target.value)}
                      />
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      SubCategory
                    </label>
                    {fkOptions["SubCategoryId"] ||
                    fkOptions["subcategoryid"] ||
                    fkOptions["sub_category_id"] ? (
                      <select
                        disabled={!categoryId}
                        className="w-full border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-neutral-100 disabled:dark:bg-neutral-800 disabled:cursor-not-allowed"
                        value={subCategoryId}
                        onChange={(e) => setSubCategoryId(e.target.value)}
                      >
                        <option value="">
                          {categoryId
                            ? "-- SubCategory --"
                            : "Choose category first"}
                        </option>
                        {(categoryId
                          ? filteredSubcats.length
                            ? filteredSubcats
                            : fkOptions["SubCategoryId"]?.options ||
                              fkOptions["subcategoryid"]?.options ||
                              fkOptions["sub_category_id"]?.options ||
                              []
                          : []
                        ).map((opt) => (
                          <option
                            key={String(opt.value)}
                            value={String(opt.value)}
                          >
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="number"
                        className="w-full border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        value={subCategoryId}
                        onChange={(e) => setSubCategoryId(e.target.value)}
                      />
                    )}
                  </div>
                </div>
                {metaError && (
                  <div className="text-xs text-red-600 mt-2">{metaError}</div>
                )}
              </div>

              {/* Ownership & Status removed from UI */}

              {/* IMAGES (enabled after creation) */}
              <div className="listingSection__wrap rounded-3xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-6 lg:p-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">Images</h2>
                </div>
                {imgErrorAdd && (
                  <div className="mb-4 text-red-600">{imgErrorAdd}</div>
                )}
                <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
                  {/* Add-image tile (stages before create or uploads after) */}
                  <li className="relative">
                    <label
                      className={`flex items-center justify-center w-full aspect-square rounded-lg border-2 border-dashed 
                      border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50 text-neutral-500 dark:text-neutral-300 cursor-pointer 
                      hover:bg-neutral-100 dark:hover:bg-neutral-800 transition ${
                        uploadingAdd ? "opacity-70 cursor-not-allowed" : ""
                      }`}
                    >
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={uploadingAdd}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleAddTileSelect(file);
                          e.currentTarget.value = "";
                        }}
                      />
                      <div className="flex flex-col items-center gap-1 text-xs">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className="w-6 h-6 opacity-80"
                        >
                          <path d="M12 16a1 1 0 0 1-1-1V8.41l-2.3 2.3a1 1 0 1 1-1.4-1.42l4-4a1 1 0 0 1 1.4 0l4 4a1 1 0 1 1-1.4 1.42L13 8.4V15a1 1 0 0 1-1 1Zm-7 2a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3h3a1 1 0 1 1 0 2H5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1h-3a1 1 0 1 1 0-2h3a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H5Z" />
                        </svg>
                        <span>Add image</span>
                      </div>
                    </label>
                  </li>

                  {/* Staged previews (before tool creation) */}
                  {stagedImagesAdd.map((s) => (
                    <li key={s.id} className="relative group">
                      <img
                        src={s.preview}
                        alt="staged"
                        className="w-full aspect-square object-cover rounded-lg border border-neutral-200 dark:border-neutral-700"
                      />
                      <span className="absolute top-2 left-2 text-2xs bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 px-2 py-0.5 rounded-full">
                        New
                      </span>
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2 rounded-lg">
                        <button
                          type="button"
                          onClick={() => removeStagedImage(s.id)}
                          className="px-3 py-1.5 text-xs rounded-full bg-red-600 text-white hover:opacity-90"
                        >
                          Remove
                        </button>
                      </div>
                    </li>
                  ))}

                  {/* Uploaded images (after tool creation) */}
                  {imagesAdd.map((img) => (
                    <li key={String(img.id)} className="relative group">
                      <img
                        src={img.url}
                        alt="tool"
                        className="w-full aspect-square object-cover rounded-lg border border-neutral-200 dark:border-neutral-700"
                      />
                      {img.isPrimary && (
                        <span className="absolute top-2 left-2 text-2xs bg-bleu-nuit text-white px-2 py-0.5 rounded-full">
                          Primary
                        </span>
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2 rounded-lg">
                        <button
                          type="button"
                          onClick={() => handleSetPrimaryImageAdd(img.id)}
                          className="px-3 py-1.5 text-xs rounded-full bg-white text-neutral-900 hover:opacity-90"
                        >
                          Set primary
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteImageAdd(img.id)}
                          className="px-3 py-1.5 text-xs rounded-full bg-red-600 text-white hover:opacity-90"
                        >
                          Delete
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </form>

            {/* SIDEBAR ACTIONS */}
            <div className="w-full lg:w-1/3 mt-8 lg:mt-0">
              <div className="listingSectionSidebar__wrap rounded-3xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-6 lg:p-8">
                <h2 className="text-xl font-semibold">Actions</h2>
                <p className="text-sm text-neutral-500 mt-2">
                  Review your details, then save your tool.
                </p>
                <button
                  disabled={loading || preStatusAdd === "fraud"}
                  formAction={undefined}
                  onClick={onSubmit as any}
                  className="mt-6 w-full px-5 py-3 rounded-full bg-bleu-nuit text-white disabled:opacity-60"
                >
                  {loading ? "Saving…" : "Save tool"}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "reserved" && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">Reserved tools</h2>
            <div className="py-6 text-neutral-500">
              You don't have any reservations yet.
            </div>
          </div>
        )}
      </div>
      <ConfirmDialog
        open={confirmOpen}
        loading={confirmLoading}
        title="Delete tool"
        description="Are you sure you want to delete this tool? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onCancel={() => {
          setConfirmOpen(false);
          setPendingDeleteId(null);
        }}
        onConfirm={confirmDelete}
      />
      <ConfirmDialog
        open={toggleDialogOpen}
        loading={toggleLoading}
        title={pendingToggle?.nextActive ? "Enable tool" : "Disable tool"}
        description={
          pendingToggle?.nextActive
            ? "Make this tool visible to clients again."
            : "Disable this tool so it no longer appears to clients. You can enable it later."
        }
        confirmText={pendingToggle?.nextActive ? "Enable" : "Disable"}
        cancelText="Cancel"
        onCancel={() => {
          setToggleDialogOpen(false);
          setPendingToggle(null);
        }}
        onConfirm={confirmToggle}
      />
    </>
  );
};

export default ToolsManagementPage;
