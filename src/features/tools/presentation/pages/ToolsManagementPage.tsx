"use client";

import React, { useState, useEffect } from "react";
import BgGlassmorphism from "@/components/BgGlassmorphism";
import BackgroundSection from "@/components/BackgroundSection";
import ConfirmDialog from "@/components/ConfirmDialog";
import Link from "next/link";
import { useUserTools } from "../../../tools/application/hooks/useUserTools";
import { deleteTool } from "../../../tools/application/use-cases/delete-tool.use-case";
import { toggleToolStatus } from "../../../tools/application/use-cases/toggle-tool-status.use-case";
import { ToolsList } from "../components/ToolsList";
import { ToolsListControls } from "../components/ToolsListControls";
import { AddToolForm } from "../components/AddToolForm";
import { SortKey } from "../../domain/tool.types";
import { useAuth } from "@/hooks/useAuth";

// ✅ Type pour les réservations
interface RentalDataType {
  rentalId: number;
  toolId: number;
  toolName?: string;
  ownerId: string;
  renterId: string;
  totalPrice: number;
  rentalDateStart: string;
  rentalDateEnd: string;
  statusId: number;
  createdAt: string;
  updatedAt: string;
}

type RentalFilter = 'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled';

const ToolsManagementPage = () => {
  const { user, loading: userLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<"mine" | "add" | "reserved">("mine");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("newest");

  // ✅ États pour les réservations
  const [rentals, setRentals] = useState<RentalDataType[]>([]);
  const [allRentals, setAllRentals] = useState<RentalDataType[]>([]);
  const [rentalsLoading, setRentalsLoading] = useState(false);
  const [rentalsError, setRentalsError] = useState<string | null>(null);
  const [rentalFilter, setRentalFilter] = useState<RentalFilter>('all');

  // ✅ Log pour debug
  console.log('📄 [ToolsManagementPage] Render:', { 
    userLoading, 
    hasUser: !!user,
    userId: user?.userId 
  });

  // Delete confirmation state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);

  // Toggle confirmation state
  const [toggleDialogOpen, setToggleDialogOpen] = useState(false);
  const [pendingToggle, setPendingToggle] = useState<{
    id: number;
    nextActive: boolean;
  } | null>(null);
  const [toggleLoading, setToggleLoading] = useState(false);

  const shouldFetchTools = !userLoading && !!user?.userId && activeTab === "mine";

  const {
    tools,
    loading: toolsLoading,
    error: toolsError,
    refresh: refreshTools,
  } = useUserTools({
    sortKey,
    searchQuery,
    enabled: shouldFetchTools,
    ownerId: user?.userId || '',
  });

  // ✅ Fetch rentals when tab is 'reserved'
  useEffect(() => {
    if (activeTab !== 'reserved') return;
    fetchRentals();
  }, [activeTab, rentalFilter, user?.userId]);

  // ✅ Fonction pour récupérer les réservations
  const fetchRentals = async () => {
    if (!user?.userId) return;
    
    try {
      setRentalsLoading(true);
      setRentalsError(null);
      
      const response = await fetch('/api/rental-bookings');
      
      if (response.ok) {
        const data = await response.json();
        console.log('📦 Database API response:', data);
        
        if (Array.isArray(data)) {
          // ✅ Filtrer par propriétaire (ownerId)
          const ownerRentals = data.filter((r: RentalDataType) => r.ownerId === user.userId);
          
          // ✅ Appliquer le filtre de statut
          let filteredRentals = ownerRentals;
          if (rentalFilter !== 'all') {
            const statusMap: Record<RentalFilter, number> = {
              'all': 0,
              'pending': 1,
              'confirmed': 2,
              'completed': 5,
              'cancelled': 6
            };
            filteredRentals = ownerRentals.filter(
              (rental: RentalDataType) => rental.statusId === statusMap[rentalFilter]
            );
          }
          
          console.log('✅ Owner rentals:', ownerRentals.length);
          console.log('✅ Filtered rentals:', filteredRentals.length);
          
          setAllRentals(ownerRentals);
          setRentals(filteredRentals);
        }
      } else {
        throw new Error('Failed to fetch rentals');
      }
    } catch (err: any) {
      console.error('❌ Rentals fetch error:', err);
      setRentalsError(err?.message || 'Failed to load rentals');
      setRentals([]);
      setAllRentals([]);
    } finally {
      setRentalsLoading(false);
    }
  };

  // ✅ Utilitaires pour les réservations
  const getStatusColor = (statusId: number) => {
    switch (statusId) {
      case 1: return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 2: return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 3: return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 4: return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 5: return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      case 6: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (statusId: number) => {
    const statusMap: Record<number, string> = {
      1: 'Pending',
      2: 'Confirmed',
      3: 'Rejected',
      4: 'In Progress',
      5: 'Completed',
      6: 'Cancelled'
    };
    return statusMap[statusId] || 'Unknown';
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
      currency: 'EUR',
      minimumFractionDigits: 0 
    }).format(price);
  };

  // ✅ Actions sur les réservations
  const acceptRental = async (rentalId: number) => {
    try {
      const response = await fetch('/api/rental-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rentalId, action: 'accept' })
      });
      
      if (response.ok) {
        await fetchRentals(); // Refresh list
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
        await fetchRentals();
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
        await fetchRentals();
        
        const statusNames: Record<number, string> = {
          4: 'En Cours',
          5: 'Terminée'
        };
        
        alert(`✅ Réservation #${rentalId} mise à jour vers: ${statusNames[newStatusId]}`);
      } else {
        const errorData = await response.json();
        alert('❌ Erreur: ' + (errorData.error || 'Failed to update status'));
      }
    } catch (err: any) {
      console.error('Update error:', err);
      alert('❌ Erreur: ' + err.message);
    }
  };

  const handleDeleteClick = (toolId: number) => {
    setPendingDeleteId(toolId);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (pendingDeleteId == null) return;
    
    setConfirmLoading(true);
    const result = await deleteTool(pendingDeleteId);
    setConfirmLoading(false);

    if (result.success || result.notFound) {
      setConfirmOpen(false);
      setPendingDeleteId(null);
      await refreshTools();
      if (result.notFound) {
        alert("Tool not found. It may have been deleted already.");
      }
    } else {
      alert(result.error || "Failed to delete tool");
    }
  };

  const handleToggleClick = (toolId: number, currentActive?: boolean) => {
    const nextActive = !(currentActive ?? true);
    setPendingToggle({ id: toolId, nextActive });
    setToggleDialogOpen(true);
  };

  const handleConfirmToggle = async () => {
    if (!pendingToggle) return;

    setToggleLoading(true);
    const result = await toggleToolStatus({
      toolId: pendingToggle.id,
      isActive: pendingToggle.nextActive,
    });
    setToggleLoading(false);

    if (result.success) {
      setToggleDialogOpen(false);
      setPendingToggle(null);
      await refreshTools();
    } else {
      alert(result.error || "Failed to update tool status");
    }
  };

  const handleToolCreated = async () => {
    setActiveTab("mine");
    await refreshTools();
  };

  if (userLoading) {
    return (
      <div className="nc-ToolsManagementPage container my-10">
        <div className="py-20 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-neutral-500">Chargement de votre profil...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="nc-ToolsManagementPage container my-10">
        <div className="py-20 text-center">
          <div className="text-lg text-red-600 mb-4">
            ❌ Vous devez être connecté pour accéder à cette page.
          </div>
          <button
            onClick={() => window.location.href = '/login'}
            className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
          >
            Se connecter
          </button>
        </div>
      </div>
    );
  }

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
            Bienvenue {user.firstName} ! Gérez vos outils et réservations ici.
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
            <ToolsListControls
              searchQuery={searchQuery}
              sortKey={sortKey}
              onSearchChange={setSearchQuery}
              onSortChange={setSortKey}
              onAddClick={() => setActiveTab("add")}
            />
            <ToolsList
              tools={tools}
              loading={toolsLoading}
              error={toolsError}
              onDelete={handleDeleteClick}
              onToggleActive={handleToggleClick}
            />
          </div>
        )}

        {activeTab === "add" && <AddToolForm onSuccess={handleToolCreated} />}

        {/* ✅ NOUVEAU : Onglet Reserved Tools */}
        {activeTab === "reserved" && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Réservations de vos outils</h2>
              
              {/* Filtres de statut */}
              <div className="flex gap-2">
                {(['all', 'pending', 'confirmed', 'completed', 'cancelled'] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => setRentalFilter(status)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      rentalFilter === status
                        ? 'bg-bleu-nuit text-white'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                    }`}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            
            {rentalsLoading && (
              <div className="py-10 text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto mb-4"></div>
                <p className="text-neutral-500">Chargement des réservations...</p>
              </div>
            )}
            
            {rentalsError && (
              <div className="py-6 text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                ❌ {rentalsError}
              </div>
            )}
            
            {!rentalsLoading && !rentalsError && rentals.length === 0 && (
              <div className="py-10 text-center text-neutral-500">
                {rentalFilter === 'all' 
                  ? "Vous n'avez aucune réservation pour vos outils."
                  : `Aucune réservation avec le statut "${rentalFilter}".`}
              </div>
            )}
            
            {!rentalsLoading && !rentalsError && rentals.length > 0 && (
              <div className="grid gap-6">
                {rentals.map((rental) => (
                  <div 
                    key={rental.rentalId} 
                    className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-700 p-6 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                      {/* Tool Image placeholder */}
                      <div className="flex-shrink-0">
                        <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 rounded-lg flex items-center justify-center">
                          <span className="text-2xl font-bold text-blue-600 dark:text-blue-300">
                            #{rental.toolId}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(rental.statusId)}`}>
                            {getStatusText(rental.statusId)}
                          </span>
                          <span className="text-sm text-neutral-500">Réservation #{rental.rentalId}</span>
                        </div>
                        
                        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
                          {rental.toolName || `Tool #${rental.toolId}`}
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-neutral-500">Prix total:</span>
                            <span className="ml-2 font-semibold text-green-600 dark:text-green-400">
                              {formatPrice(rental.totalPrice)}
                            </span>
                          </div>
                          <div>
                            <span className="text-neutral-500">Dates:</span>
                            <span className="ml-2 font-medium">
                              {formatDate(rental.rentalDateStart)} → {formatDate(rental.rentalDateEnd)}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row gap-2 lg:ml-auto lg:flex-shrink-0">
                        <Link 
                          href={`/listing-tool-detail?id=${rental.toolId}`}
                          className="px-4 py-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 text-center transition"
                        >
                          Voir l'outil
                        </Link>
                        
                        {/* Actions selon le statut */}
                        {rental.statusId === 1 && (
                          <div className="flex gap-2">
                            <button 
                              onClick={() => acceptRental(rental.rentalId)}
                              className="px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition"
                            >
                              ✓ Accepter
                            </button>
                            <button 
                              onClick={() => rejectRental(rental.rentalId)}
                              className="px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition"
                            >
                              ✕ Refuser
                            </button>
                          </div>
                        )}
                        
                        {rental.statusId === 2 && (
                          <button 
                            onClick={() => updateRentalStatus(rental.rentalId, 4)}
                            className="px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition"
                          >
                            ▶ Démarrer
                          </button>
                        )}
                        
                        {rental.statusId === 4 && (
                          <button 
                            onClick={() => updateRentalStatus(rental.rentalId, 5)}
                            className="px-4 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50 transition"
                          >
                            ✓ Terminer
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Confirm Dialogs */}
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
        onConfirm={handleConfirmDelete}
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
        onConfirm={handleConfirmToggle}
      />
    </>
  );
};

export default ToolsManagementPage;