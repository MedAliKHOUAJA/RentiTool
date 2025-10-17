'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import BgGlassmorphism from '@/components/BgGlassmorphism';
import BackgroundSection from '@/components/BackgroundSection';
import ToolCard from '@/components/Cards/ToolCard';
import { ToolDataType } from '@/data/types';

const ToolsManagementPage = () => {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [rentalPricePerDay, setRentalPricePerDay] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [subCategoryId, setSubCategoryId] = useState<string>('');
  const STATIC_OWNER_ID = '2612236b-9fc8-4b07-a668-c197c312265f';
  const [ownerId, setOwnerId] = useState<string>(STATIC_OWNER_ID);
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [metaError, setMetaError] = useState<string | null>(null);
  const [fkOptions, setFkOptions] = useState<Record<string, { valueType: 'number'|'string'; options: Array<{ value: any; label: string }> }>>({});
  const [filteredSubcats, setFilteredSubcats] = useState<Array<{ value: any; label: string }>>([]);
  const [activeTab, setActiveTab] = useState<'mine'|'add'|'reserved'>('mine');
  const [myTools, setMyTools] = useState<ToolDataType[]>([]);
  const [myToolsLoading, setMyToolsLoading] = useState(false);
  const [myToolsError, setMyToolsError] = useState<string | null>(null);
  const refreshMine = async () => {
    setMyToolsLoading(true);
    setMyToolsError(null);
    try {
      const res = await fetch(`/api/tools?ownerId=${encodeURIComponent(ownerId)}`);
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setMyTools(data as ToolDataType[]);
    } catch (e: any) {
      setMyToolsError(e?.message || 'Failed to load your tools');
    } finally {
      setMyToolsLoading(false);
    }
  };

  useEffect(() => {
    const loadMeta = async () => {
      try {
        setMetaError(null);
        const res = await fetch('/api/tools/meta');
        if (!res.ok) {
          throw new Error(await res.text());
        }
        const json = await res.json();
        setFkOptions(json.foreignKeys || {});
      } catch (e: any) {
        setMetaError(e.message || 'Failed to load metadata');
      }
    };
    loadMeta();
  }, []);

  // Load subcategories filtered by selected category
  useEffect(() => {
    const run = async () => {
      setFilteredSubcats([]);
      if (!categoryId) {
        setSubCategoryId('');
        return;
      }
      try {
        const res = await fetch(`/api/tools/meta/subcategories?categoryId=${encodeURIComponent(categoryId)}`);
        if (!res.ok) {
          // keep generic list if endpoint fails
          return;
        }
        const json = await res.json();
        setFilteredSubcats(json.options || []);
        // If current subcat not in filtered list, clear it
        if (json.options && !json.options.some((o: any) => String(o.value) === String(subCategoryId))) {
          setSubCategoryId('');
        }
      } catch {}
    };
    run();
  }, [categoryId]);

  // Load my tools when tab is 'mine'
  useEffect(() => {
    if (activeTab !== 'mine') return;
    refreshMine();
  }, [activeTab, ownerId]);

  const handleDelete = async (toolId: number) => {
    if (!confirm('Delete this tool? This action cannot be undone.')) return;
    try {
      const res = await fetch(`/api/tools/${encodeURIComponent(String(toolId))}`, { method: 'DELETE' });
      if (res.status === 204) {
        await refreshMine();
      } else if (res.status === 404) {
        alert('Tool not found. It may have been deleted already.');
        await refreshMine();
      } else {
        const msg = await res.text();
        alert(msg || 'Failed to delete tool');
      }
    } catch (e: any) {
      alert(e?.message || 'Failed to delete tool');
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    // OwnerId is required by DB; must be UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(ownerId.trim())) {
      setError('Owner ID must be a valid UUID');
      return;
    }
    setLoading(true);
    try {
      const payload: any = {
        title: title.trim(),
        description: description.trim() || undefined,
        brand: brand.trim() || undefined,
        model: model.trim() || undefined,
        rentalPricePerDay: rentalPricePerDay ? Number(rentalPricePerDay) : undefined,
        categoryId: categoryId ? Number(categoryId) : undefined,
        subCategoryId: subCategoryId ? Number(subCategoryId) : undefined,
        ownerId: ownerId.trim(),
        isActive,
      };
      const res = await fetch('/api/tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || 'Failed to create tool');
      }
      await res.json();
      setSuccess('Tool created successfully');
      // Switch to "My tools" tab and refresh list
      setActiveTab('mine');
    } catch (e: any) {
      setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="nc-ToolsManagementPage container my-10 relative">
      <BgGlassmorphism className="absolute inset-x-0 md:top-10 xl:top-40 min-h-0 pl-20 py-24 flex overflow-hidden z-0 pointer-events-none" />
      <div className="relative py-8">
        <BackgroundSection className="bg-neutral-100 dark:bg-black dark:bg-opacity-20 pointer-events-none" />
        <h1 className="relative z-10 text-2xl md:text-3xl font-semibold">Tools management</h1>
        <p className="relative z-10 text-neutral-500 dark:text-neutral-400 mt-2">Manage your tools, add new ones, and check reservations.</p>
        {/* Tabs */}
        <div className="relative z-10 mt-6 border-b border-neutral-200 dark:border-neutral-700">
          <nav className="flex gap-6" aria-label="Tabs">
            {[
              { key: 'mine', label: 'My tools' },
              { key: 'add', label: 'Add a tool' },
              { key: 'reserved', label: 'Reserved tools' },
            ].map(t => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key as any)}
                className={`-mb-px pb-3 border-b-2 text-sm md:text-base ${activeTab===t.key ? 'border-bleu-nuit text-bleu-nuit' : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'}`}
              >
                {t.label}
              </button>
            ))}
          </nav>
        </div>
      </div>
      {/* CONTENT BY TAB */}
      {activeTab === 'mine' && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Your tools</h2>
            <button onClick={() => setActiveTab('add')} className="px-4 py-2 rounded-full bg-bleu-nuit text-white">Add a tool</button>
          </div>
          {myToolsLoading && <div className="py-6 text-neutral-500">Loading your tools…</div>}
          {myToolsError && <div className="py-6 text-red-600">{myToolsError}</div>}
          {!myToolsLoading && !myToolsError && myTools.length === 0 && (
            <div className="py-6 text-neutral-500">You don't have any tools yet.</div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
            {myTools.map(tool => {
              const ownerHref = `/owner-tool-detail?id=${encodeURIComponent(String(tool.id))}` as any;
              return (
                <ToolCard
                  key={tool.id}
                  data={{ ...tool, href: ownerHref }}
                  onDelete={() => handleDelete(Number(tool.id))}
                  onEdit={() => router.push(`/tools-management/edit?id=${encodeURIComponent(String(tool.id))}` as any)}
                  showLike={false}
                />
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'add' && (
      <div className="lg:flex lg:space-x-10 mt-8">
        <form onSubmit={onSubmit} className="w-full lg:w-2/3 space-y-8">
          {/* BASIC INFO */}
          <div className="listingSection__wrap rounded-3xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-6 lg:p-8">
            <h2 className="text-xl font-semibold mb-6">Basic information</h2>
            {error && <div className="mb-4 text-red-600">{error}</div>}
            {success && <div className="mb-4 text-green-600">{success}</div>}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title *</label>
                <input className="w-full border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500" value={title} onChange={(e)=>setTitle(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea className="w-full border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500" rows={4} value={description} onChange={(e)=>setDescription(e.target.value)} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Brand</label>
                  <input className="w-full border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500" value={brand} onChange={(e)=>setBrand(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Model</label>
                  <input className="w-full border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500" value={model} onChange={(e)=>setModel(e.target.value)} />
                </div>
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
                {fkOptions['CategoryId'] || fkOptions['categoryid'] || fkOptions['category_id'] ? (
                  <select className="w-full border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500" value={categoryId} onChange={(e)=>setCategoryId(e.target.value)}>
                    <option value="">-- Category --</option>
                    {(fkOptions['CategoryId']?.options || fkOptions['categoryid']?.options || fkOptions['category_id']?.options || []).map((opt) => (
                      <option key={String(opt.value)} value={String(opt.value)}>{opt.label}</option>
                    ))}
                  </select>
                ) : (
                  <input type="number" className="w-full border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500" value={categoryId} onChange={(e)=>setCategoryId(e.target.value)} />
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">SubCategory</label>
                {fkOptions['SubCategoryId'] || fkOptions['subcategoryid'] || fkOptions['sub_category_id'] ? (
                  <select disabled={!categoryId} className="w-full border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-neutral-100 disabled:dark:bg-neutral-800 disabled:cursor-not-allowed" value={subCategoryId} onChange={(e)=>setSubCategoryId(e.target.value)}>
                    <option value="">{categoryId ? '-- SubCategory --' : 'Choose category first'}</option>
                    {(categoryId ? (filteredSubcats.length ? filteredSubcats : (fkOptions['SubCategoryId']?.options || fkOptions['subcategoryid']?.options || fkOptions['sub_category_id']?.options || [])) : []).map((opt) => (
                      <option key={String(opt.value)} value={String(opt.value)}>{opt.label}</option>
                    ))}
                  </select>
                ) : (
                  <input type="number" className="w-full border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500" value={subCategoryId} onChange={(e)=>setSubCategoryId(e.target.value)} />
                )}
              </div>
            </div>
            {metaError && <div className="text-xs text-red-600 mt-2">{metaError}</div>}
          </div>

          {/* Ownership & Status removed from UI */}

        </form>

        {/* SIDEBAR ACTIONS */}
        <div className="w-full lg:w-1/3 mt-8 lg:mt-0">
          <div className="listingSectionSidebar__wrap rounded-3xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-6 lg:p-8">
            <h2 className="text-xl font-semibold">Actions</h2>
            <p className="text-sm text-neutral-500 mt-2">Review your details, then save your tool.</p>
            <button disabled={loading} formAction={undefined} onClick={onSubmit as any} className="mt-6 w-full px-5 py-3 rounded-full bg-bleu-nuit text-white disabled:opacity-60">
              {loading ? 'Saving…' : 'Save tool'}
            </button>
          </div>
        </div>
      </div>
      )}

      {activeTab === 'reserved' && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Reserved tools</h2>
          <div className="py-6 text-neutral-500">You don't have any reservations yet.</div>
        </div>
      )}
    </div>
  );
};

export default ToolsManagementPage;
