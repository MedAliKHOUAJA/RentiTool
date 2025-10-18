'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import BgGlassmorphism from '@/components/BgGlassmorphism';
import BackgroundSection from '@/components/BackgroundSection';

const EditToolPage = () => {
  const router = useRouter();
  const sp = useSearchParams();
  const id = sp.get('id');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metaError, setMetaError] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [rentalPricePerDay, setRentalPricePerDay] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [subCategoryId, setSubCategoryId] = useState<string>('');

  const [fkOptions, setFkOptions] = useState<Record<string, { valueType: 'number'|'string'; options: Array<{ value: any; label: string }> }>>({});
  const [filteredSubcats, setFilteredSubcats] = useState<Array<{ value: any; label: string }>>([]);

  // Images state
  type ImageItem = { id: string | number; url: string; isPrimary: boolean };
  const [images, setImages] = useState<ImageItem[]>([]);
  const [imgError, setImgError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!id) return;
    const run = async () => {
      try {
        setLoading(true);
        const [metaRes, toolRes] = await Promise.all([
          fetch('/api/tools/meta'),
          fetch(`/api/tools/${encodeURIComponent(id)}`)
        ]);
        if (!metaRes.ok) throw new Error(await metaRes.text());
        if (!toolRes.ok) throw new Error(await toolRes.text());
        const metaJson = await metaRes.json();
        setFkOptions(metaJson.foreignKeys || {});
        const tool = await toolRes.json();
        setTitle(tool.title || '');
        setDescription(tool.desc || '');
        setBrand('');
        setModel('');
        setRentalPricePerDay(tool.price ? String(tool.price).replace(/[^0-9.]/g,'') : '');
        setCategoryId(tool.listingCategory?.id ? String(tool.listingCategory.id) : '');
        setSubCategoryId('');
      } catch (e: any) {
        setError(e?.message || 'Failed to load tool');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [id]);

  // Filter subcategories when category changes
  useEffect(() => {
    const run = async () => {
      setFilteredSubcats([]);
      if (!categoryId) { setSubCategoryId(''); return; }
      try {
        const res = await fetch(`/api/tools/meta/subcategories?categoryId=${encodeURIComponent(categoryId)}`);
        if (!res.ok) return;
        const json = await res.json();
        setFilteredSubcats(json.options || []);
      } catch {}
    };
    run();
  }, [categoryId]);

  // Load images for this tool
  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        setImgError(null);
        const res = await fetch(`/api/tools/${encodeURIComponent(id)}/images`);
        if (!res.ok) throw new Error(await res.text());
        const json = await res.json();
        setImages(Array.isArray(json.images) ? json.images : []);
      } catch (e: any) {
        setImgError(e?.message || 'Failed to load images');
      }
    };
    load();
  }, [id]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setSaving(true);
    setError(null);
    try {
      const payload: any = {
        title: title.trim() || undefined,
        description: description.trim() || undefined,
        brand: brand.trim() || undefined,
        model: model.trim() || undefined,
        rentalPricePerDay: rentalPricePerDay ? Number(rentalPricePerDay) : undefined,
        categoryId: categoryId ? Number(categoryId) : undefined,
        subCategoryId: subCategoryId ? Number(subCategoryId) : undefined,
      };
      const res = await fetch(`/api/tools/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
  router.push('/tools-management' as any);
    } catch (e: any) {
      setError(e?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  // Image handlers
  const handleUpload = async (file: File) => {
    if (!id || !file) return;
    try {
      setUploading(true);
      setImgError(null);
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch(`/api/tools/${encodeURIComponent(id)}/images`, { method: 'POST', body: fd });
      if (!res.ok) throw new Error(await res.text());
      // Reload images
      const list = await fetch(`/api/tools/${encodeURIComponent(id)}/images`);
      const json = await list.json();
      setImages(Array.isArray(json.images) ? json.images : []);
    } catch (e: any) {
      setImgError(e?.message || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteImage = async (imageId: string | number) => {
    if (!id) return;
    try {
      setImgError(null);
      const res = await fetch(`/api/tools/${encodeURIComponent(id)}/images/${encodeURIComponent(String(imageId))}`, { method: 'DELETE' });
      if (res.status !== 204) {
        if (!res.ok) throw new Error(await res.text());
      }
      // Refresh
      const list = await fetch(`/api/tools/${encodeURIComponent(id)}/images`);
      const json = await list.json();
      setImages(Array.isArray(json.images) ? json.images : []);
    } catch (e: any) {
      setImgError(e?.message || 'Failed to delete image');
    }
  };

  const handleSetPrimary = async (imageId: string | number) => {
    if (!id) return;
    try {
      setImgError(null);
      const res = await fetch(`/api/tools/${encodeURIComponent(id)}/images/${encodeURIComponent(String(imageId))}`, { method: 'PUT' });
      if (res.status !== 204) {
        if (!res.ok) throw new Error(await res.text());
      }
      // Refresh
      const list = await fetch(`/api/tools/${encodeURIComponent(id)}/images`);
      const json = await list.json();
      setImages(Array.isArray(json.images) ? json.images : []);
    } catch (e: any) {
      setImgError(e?.message || 'Failed to set primary image');
    }
  };

  if (!id) {
    return <div className="container py-10">Invalid id</div>;
  }

  return (
    <div className="container my-10 relative">
      <BgGlassmorphism className="absolute inset-x-0 md:top-10 xl:top-40 min-h-0 pl-20 py-24 flex overflow-hidden z-0 pointer-events-none" />
      <div className="relative py-8">
        <BackgroundSection className="bg-neutral-100 dark:bg-black dark:bg-opacity-20 pointer-events-none" />
        <h1 className="relative z-10 text-2xl md:text-3xl font-semibold">Edit tool</h1>
        <p className="relative z-10 text-neutral-500 dark:text-neutral-400 mt-2">Update your tool information.</p>
      </div>

      {loading ? (
        <div className="py-10 text-neutral-500">Loading…</div>
      ) : (
        <div className="lg:flex lg:space-x-10 mt-8">
          <form onSubmit={onSubmit} className="w-full lg:w-2/3 space-y-8">
            {/* BASIC INFO */}
            <div className="listingSection__wrap rounded-3xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-6 lg:p-8">
              <h2 className="text-xl font-semibold mb-6">Basic information</h2>
              {error && <div className="mb-4 text-red-600">{error}</div>}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Title</label>
                  <input className="w-full border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500" value={title} onChange={(e)=>setTitle(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea className="w-full border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500" rows={4} value={description} onChange={(e)=>setDescription(e.target.value)} />
                </div>
              </div>
            </div>

            {/* PRICING & CATEGORY */}
            <div className="listingSection__wrap rounded-3xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-6 lg:p-8">
              <h2 className="text-xl font-semibold mb-6">Pricing & Categories</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Price per day</label>
                  <input type="number" className="w-full border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500" value={rentalPricePerDay} onChange={(e)=>setRentalPricePerDay(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <select className="w-full border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500" value={categoryId} onChange={(e)=>setCategoryId(e.target.value)}>
                    <option value="">-- Category --</option>
                    {(fkOptions['CategoryId']?.options || fkOptions['categoryid']?.options || fkOptions['category_id']?.options || []).map((opt) => (
                      <option key={String(opt.value)} value={String(opt.value)}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">SubCategory</label>
                  <select disabled={!categoryId} className="w-full border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-neutral-100 disabled:dark:bg-neutral-800 disabled:cursor-not-allowed" value={subCategoryId} onChange={(e)=>setSubCategoryId(e.target.value)}>
                    <option value="">{categoryId ? '-- SubCategory --' : 'Choose category first'}</option>
                    {(categoryId ? (filteredSubcats.length ? filteredSubcats : (fkOptions['SubCategoryId']?.options || fkOptions['subcategoryid']?.options || fkOptions['sub_category_id']?.options || [])) : []).map((opt) => (
                      <option key={String(opt.value)} value={String(opt.value)}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* IMAGES */}
            <div className="listingSection__wrap rounded-3xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-6 lg:p-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Images</h2>
              </div>
              {imgError && <div className="mb-4 text-red-600">{imgError}</div>}
              <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
                {/* Add-image tile for mobile ergonomics */}
                <li className="relative">
                  <label className={`flex items-center justify-center w-full aspect-square rounded-lg border-2 border-dashed 
                    border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50 text-neutral-500 dark:text-neutral-300 cursor-pointer 
                    hover:bg-neutral-100 dark:hover:bg-neutral-800 transition ${uploading ? 'opacity-70 cursor-not-allowed' : ''}`}>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
                      className="hidden"
                      disabled={uploading}
                      onChange={(e)=>{
                        const file = e.target.files?.[0];
                        if (file) handleUpload(file);
                        e.currentTarget.value = '';
                      }}
                    />
                    <div className="flex flex-col items-center gap-1 text-xs">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 opacity-80"><path d="M12 16a1 1 0 0 1-1-1V8.41l-2.3 2.3a1 1 0 1 1-1.4-1.42l4-4a1 1 0 0 1 1.4 0l4 4a1 1 0 1 1-1.4 1.42L13 8.4V15a1 1 0 0 1-1 1Zm-7 2a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3h3a1 1 0 1 1 0 2H5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1h-3a1 1 0 1 1 0-2h3a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H5Z"/></svg>
                      <span>Add image</span>
                    </div>
                  </label>
                </li>
                {images.map((img) => (
                  <li key={String(img.id)} className="relative group">
                    <img src={img.url} alt="tool" className="w-full aspect-square object-cover rounded-lg border border-neutral-200 dark:border-neutral-700" />
                    {img.isPrimary && (
                      <span className="absolute top-2 left-2 text-2xs bg-bleu-nuit text-white px-2 py-0.5 rounded-full">Primary</span>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2 rounded-lg">
                      <button type="button" onClick={() => handleSetPrimary(img.id)} className="px-3 py-1.5 text-xs rounded-full bg-white text-neutral-900 hover:opacity-90">
                        Set primary
                      </button>
                      <button type="button" onClick={() => handleDeleteImage(img.id)} className="px-3 py-1.5 text-xs rounded-full bg-red-600 text-white hover:opacity-90">
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
              <p className="text-sm text-neutral-500 mt-2">Save your updates.</p>
              <button
                disabled={saving}
                onClick={onSubmit as any}
                className="mt-6 w-full px-5 py-3 rounded-full font-semibold
                  bg-neutral-900 text-white hover:bg-neutral-800
                  dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100
                  border border-transparent dark:border-neutral-300
                  disabled:opacity-60 disabled:cursor-not-allowed
                  transform transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md
                  focus:outline-none focus:ring-2 focus:ring-neutral-300 dark:focus:ring-neutral-600 active:translate-y-0"
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditToolPage;
