'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import BgGlassmorphism from '@/components/BgGlassmorphism';
import BackgroundSection from '@/components/BackgroundSection';
import ToolCard from '@/components/Cards/ToolCard';
import ConfirmDialog from '@/components/ConfirmDialog';
import { ToolDataType, RentalDataType } from '@/data/types';
import Link from 'next/link';

const ToolsManagementPage = () => {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [rentalPricePerDay, setRentalPricePerDay] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [subCategoryId, setSubCategoryId] = useState<string>('');
  const STATIC_OWNER_ID = '420430c2-0338-4612-aa74-65f0a82900fe';
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
  
  // Rental management state
  const [rentals, setRentals] = useState<RentalDataType[]>([]);
  const [allRentals, setAllRentals] = useState<RentalDataType[]>([]); // Store all rentals for counting
  const [rentalsLoading, setRentalsLoading] = useState(false);
  const [rentalsError, setRentalsError] = useState<string | null>(null);
  const [rentalFilter, setRentalFilter] = useState<'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled'>('all');
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

  const fetchRentals = async () => {
    try {
      setRentalsLoading(true);
      setRentalsError(null);
      
      // Try to fetch from database API first
      try {
        const response = await fetch('/api/rental-bookings');
        if (response.ok) {
          const data = await response.json();
          console.log('Database API response:', data);
          
          if (Array.isArray(data)) {
            // Show all rentals, not just current owner's
            const ownerRentals = data; // Remove owner filter to show all rentals
            
            // Apply status filter
            let filteredRentals = ownerRentals;
            if (rentalFilter !== 'all') {
              const statusMap = {
                'pending': 1,      // Requested/Pending
                'confirmed': 2,    // Accepted/Confirmed  
                'completed': 5,    // Completed
                'cancelled': 6     // Cancelled
              };
              filteredRentals = ownerRentals.filter((rental: RentalDataType) => rental.statusId === statusMap[rentalFilter]);
            }
            
            console.log('All rentals found:', ownerRentals.length);
            console.log('Filtered rentals:', filteredRentals.length);
            console.log('Current filter:', rentalFilter);
            
            console.log('Filtered rentals from database:', filteredRentals.length);
            setAllRentals(ownerRentals); // Store all rentals
            setRentals(filteredRentals);
            return;
          }
        }
      } catch (apiError) {
        console.log('Database API not available, using localStorage fallback');
      }
      
      // Fallback to localStorage or mock data
      const savedRentals = localStorage.getItem('rentals-management');
      let mockRentals: RentalDataType[] = [
        {
          rentalId: 1,
          toolId: 14,
          ownerId: '420430c2-0338-4612-aa74-65f0a82900fe',
          renterId: '550e8400-e29b-41d4-a716-446655440000',
          totalPrice: 55,
          rentalDateStart: '2024-12-15',
          rentalDateEnd: '2024-12-16',
          statusId: 1,
          createdAt: '2024-12-01T10:00:00Z',
          updatedAt: '2024-12-01T10:00:00Z'
        },
        {
          rentalId: 2,
          toolId: 15,
          ownerId: '420430c2-0338-4612-aa74-65f0a82900fe',
          renterId: '550e8400-e29b-41d4-a716-446655440001',
          totalPrice: 120,
          rentalDateStart: '2024-12-20',
          rentalDateEnd: '2024-12-22',
          statusId: 2,
          createdAt: '2024-12-02T10:00:00Z',
          updatedAt: '2024-12-02T10:00:00Z'
        }
      ];
      
      if (savedRentals) {
        mockRentals = JSON.parse(savedRentals);
      }
      
      // Filter by status if not 'all'
      let filteredRentals = mockRentals;
      if (rentalFilter !== 'all') {
        const statusMap = {
          'pending': 1,
          'confirmed': 2, 
          'completed': 5,
          'cancelled': 6
        };
        filteredRentals = mockRentals.filter((rental: RentalDataType) => rental.statusId === statusMap[rentalFilter]);
      }
      
      setAllRentals(mockRentals); // Store all mock rentals
      setRentals(filteredRentals);
    } catch (err: any) {
      setRentalsError(err?.message || 'Failed to load rentals');
    } finally {
      setRentalsLoading(false);
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

  // Load rentals when tab is 'reserved'
  useEffect(() => {
    if (activeTab !== 'reserved') return;
    fetchRentals();
  }, [activeTab, rentalFilter]);

  // Rental management utility functions
  const getStatusColor = (statusId: number) => {
    switch (statusId) {
      case 1: return 'bg-yellow-100 text-yellow-800'; // Requested
      case 2: return 'bg-green-100 text-green-800'; // Accepted
      case 3: return 'bg-red-100 text-red-800'; // Rejected
      case 4: return 'bg-blue-100 text-blue-800'; // In Progress
      case 5: return 'bg-purple-100 text-purple-800'; // Completed
      case 6: return 'bg-gray-100 text-gray-800'; // Cancelled
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (statusId: number) => {
    switch (statusId) {
      case 1: return 'Requested';
      case 2: return 'Accepted';
      case 3: return 'Rejected';
      case 4: return 'In Progress';
      case 5: return 'Completed';
      case 6: return 'Cancelled';
      default: return 'Unknown';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', { 
      style: 'currency', 
      currency: 'TND',
      minimumFractionDigits: 0 
    }).format(price);
  };

  const acceptRental = async (rentalId: number) => {
    try {
      const response = await fetch('/api/rental-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rentalId, action: 'accept' })
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('Rental accepted:', result);
        
        // Update local state
        setRentals(prevRentals => 
          prevRentals.map(rental => 
            rental.rentalId === rentalId 
              ? { ...rental, statusId: 2 } // Accepted
              : rental
          )
        );
        
        alert(`✅ Réservation #${rentalId} acceptée avec succès`);
      } else {
        const errorData = await response.json();
        alert('❌ Erreur: ' + (errorData.error || 'Failed to accept rental'));
      }
    } catch (err: any) {
      console.error('Accept error:', err);
      alert('❌ Erreur: ' + err.message);
    }
  };

  const rejectRental = async (rentalId: number) => {
    try {
      const response = await fetch('/api/rental-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rentalId, action: 'reject' })
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('Rental rejected:', result);
        
        // Update local state
        setRentals(prevRentals => 
          prevRentals.map(rental => 
            rental.rentalId === rentalId 
              ? { ...rental, statusId: 3 } // Rejected
              : rental
          )
        );
        
        alert(`✅ Réservation #${rentalId} rejetée avec succès`);
      } else {
        const errorData = await response.json();
        alert('❌ Erreur: ' + (errorData.error || 'Failed to reject rental'));
      }
    } catch (err: any) {
      console.error('Reject error:', err);
      alert('❌ Erreur: ' + err.message);
    }
  };

  const updateRentalStatus = async (rentalId: number, newStatusId: number) => {
    try {
      const response = await fetch('/api/rental-bookings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rentalId, statusId: newStatusId })
      });
      
      if (response.ok) {
        setRentals(prevRentals => 
          prevRentals.map(rental => 
            rental.rentalId === rentalId 
              ? { ...rental, statusId: newStatusId }
              : rental
          )
        );
        
        const statusNames = {
          4: 'En Cours',
          5: 'Terminée'
        };
        
        alert(`✅ Réservation #${rentalId} mise à jour vers: ${statusNames[newStatusId as keyof typeof statusNames]}`);
      } else {
        const errorData = await response.json();
        alert('❌ Erreur: ' + (errorData.error || 'Failed to update status'));
      }
    } catch (err: any) {
      console.error('Update error:', err);
      alert('❌ Erreur: ' + err.message);
    }
  };

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);

  const askDelete = (toolId: number) => {
    setPendingDeleteId(toolId);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (pendingDeleteId == null) return;
    setConfirmLoading(true);
    try {
      const res = await fetch(`/api/tools/${encodeURIComponent(String(pendingDeleteId))}`, { method: 'DELETE' });
      if (res.status === 204) {
        setConfirmOpen(false);
        setPendingDeleteId(null);
        await refreshMine();
      } else if (res.status === 404) {
        setConfirmOpen(false);
        setPendingDeleteId(null);
        alert('Tool not found. It may have been deleted already.');
        await refreshMine();
      } else {
        const msg = await res.text();
        alert(msg || 'Failed to delete tool');
      }
    } catch (e: any) {
      alert(e?.message || 'Failed to delete tool');
    } finally {
      setConfirmLoading(false);
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
    <>
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
                  onDelete={() => askDelete(Number(tool.id))}
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
    <ConfirmDialog
      open={confirmOpen}
      loading={confirmLoading}
      title="Delete tool"
      description="Are you sure you want to delete this tool? This action cannot be undone."
      confirmText="Delete"
      cancelText="Cancel"
      onCancel={() => { setConfirmOpen(false); setPendingDeleteId(null); }}
      onConfirm={confirmDelete}
    />
    </>
  );
};

export default ToolsManagementPage;
