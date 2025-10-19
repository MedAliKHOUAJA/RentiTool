'use client';

import React, { useEffect, useState } from 'react';
import { RentalDataType } from '@/data/types';
import Link from 'next/link';
import CountdownTimer from '@/components/CountdownTimer';

const MyRentalsPage = () => {
  const [rentals, setRentals] = useState<RentalDataType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled'>('all');
  const [toolImages, setToolImages] = useState<Record<number, string>>({});
  
  // States for edit/delete functionality
  const [editingRental, setEditingRental] = useState<RentalDataType | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [rentalToDelete, setRentalToDelete] = useState<RentalDataType | null>(null);
  const [editForm, setEditForm] = useState({
    rentalDateStart: '',
    rentalDateEnd: ''
  });

  useEffect(() => {
    fetchRentals();
  }, [filter]);

  const fetchToolImage = async (toolId: number) => {
    try {
      const response = await fetch(`/api/tools/${toolId}/image`);
      if (response.ok) {
        const data = await response.json();
        if (data.imageUrl) {
          setToolImages(prev => ({
            ...prev,
            [toolId]: data.imageUrl
          }));
        }
      }
    } catch (error) {
      console.log(`Failed to fetch image for tool ${toolId}:`, error);
    }
  };

  const fetchRentals = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter !== 'all') {
        const statusMap = {
          'pending': '1',
          'confirmed': '2', 
          'completed': '3',
          'cancelled': '4'
        };
        params.append('statusId', statusMap[filter]);
      }
      
      const response = await fetch(`/api/rental-bookings?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch rentals');
      const data = await response.json();
      setRentals(data);

      // Fetch images for each tool
      data.forEach((rental: RentalDataType) => {
        if (!toolImages[rental.toolId]) {
          fetchToolImage(rental.toolId);
        }
      });
    } catch (err: any) {
      setError(err?.message || 'Failed to load rentals');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (statusId: number) => {
    switch (statusId) {
      case 1: return 'bg-yellow-100 text-yellow-800'; // Pending
      case 2: return 'bg-green-100 text-green-800'; // Confirmed
      case 3: return 'bg-blue-100 text-blue-800'; // Completed
      case 4: return 'bg-red-100 text-red-800'; // Cancelled
      case 5: return 'bg-gray-100 text-gray-800'; // Rejected
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (statusId: number) => {
    switch (statusId) {
      case 1: return 'Pending';
      case 2: return 'Confirmed';
      case 3: return 'Completed';
      case 4: return 'Cancelled';
      case 5: return 'Rejected';
      default: return 'Unknown';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
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

  // Edit rental functions
  const handleEditRental = (rental: RentalDataType) => {
    setEditingRental(rental);
    setEditForm({
      rentalDateStart: rental.rentalDateStart.split('T')[0], // Convert to YYYY-MM-DD format
      rentalDateEnd: rental.rentalDateEnd.split('T')[0]
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editingRental) return;
    
    try {
      const response = await fetch(`/api/rental-bookings/${editingRental.rentalId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rentalDateStart: new Date(editForm.rentalDateStart).toISOString(),
          rentalDateEnd: new Date(editForm.rentalDateEnd).toISOString()
        })
      });

      if (response.ok) {
        // Refresh rentals list
        await fetchRentals();
        setShowEditModal(false);
        setEditingRental(null);
        alert('Rental updated successfully!');
      } else {
        const errorData = await response.json();
        alert('Error updating rental: ' + (errorData.error || 'Unknown error'));
      }
    } catch (err: any) {
      alert('Error updating rental: ' + err.message);
    }
  };

  // Delete rental functions
  const handleDeleteRental = (rental: RentalDataType) => {
    setRentalToDelete(rental);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!rentalToDelete) return;
    
    try {
      const response = await fetch(`/api/rental-bookings/${rentalToDelete.rentalId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        // Refresh rentals list
        await fetchRentals();
        setShowDeleteModal(false);
        setRentalToDelete(null);
        alert('Rental deleted successfully!');
      } else {
        const errorData = await response.json();
        alert('Error deleting rental: ' + (errorData.error || 'Unknown error'));
      }
    } catch (err: any) {
      alert('Error deleting rental: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="container py-10">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-900"></div>
          <span className="ml-2">Loading my rentals...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-10">
        <div className="text-center">
          <div className="text-red-600 mb-4">Error: {error}</div>
          <button 
            onClick={fetchRentals}
            className="px-4 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="nc-ListingDetailPage">
      <div className="container mt-10">
        <nav className="text-sm text-neutral-500 dark:text-neutral-400 mb-4" aria-label="Breadcrumb">
          <ol className="flex items-center gap-2">
            <li><Link href={"/"} className="hover:underline">Home</Link></li>
            <li className="opacity-60">/</li>
            <li className="text-neutral-800 dark:text-neutral-200">My Rentals</li>
          </ol>
        </nav>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">My Rentals</h1>
          
          {/* Filter buttons */}
          <div className="flex flex-wrap gap-2 mb-6">
            {(['all', 'pending', 'confirmed', 'completed', 'cancelled'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  filter === status
                    ? 'bg-neutral-900 text-white'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)} ({status === 'all' ? rentals.length : rentals.filter(r => {
                  const statusMap = { 'pending': 1, 'confirmed': 2, 'completed': 3, 'cancelled': 4 };
                  return r.statusId === statusMap[status];
                }).length})
              </button>
            ))}
          </div>
        </div>

        {rentals.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-neutral-500 mb-4">No rentals found</div>
            <Link 
              href="/tools"
              className="inline-flex items-center px-4 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800"
            >
              Browse Tools
            </Link>
          </div>
        ) : (
          <div className="grid gap-6">
            {rentals.map((rental) => (
              <div key={rental.rentalId} className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-700 p-6">
                <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                  {/* Tool Image */}
                  <div className="flex-shrink-0">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 rounded-lg overflow-hidden flex items-center justify-center">
                      {toolImages[rental.toolId] ? (
                        <img 
                          src={toolImages[rental.toolId]} 
                          alt={`Tool ${rental.toolId}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.nextElementSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div className={`w-full h-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg ${toolImages[rental.toolId] ? 'hidden' : ''}`}>
                        {rental.toolId}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(rental.statusId)}`}>
                        {getStatusText(rental.statusId)}
                      </span>
                      <span className="text-sm text-neutral-500">Rental #{rental.rentalId}</span>
                    </div>
                    
                    {/* Tool Name */}
                    <div className="mb-3">
                      <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
                        {rental.toolName || `Tool #${rental.toolId}`}
                      </h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-neutral-500">Tool ID:</span>
                        <span className="ml-2 font-medium">{rental.toolId}</span>
                      </div>
                      <div>
                        <span className="text-neutral-500">Total Price:</span>
                        <span className="ml-2 font-medium text-green-600">{formatPrice(rental.totalPrice)}</span>
                      </div>
                      <div>
                        <span className="text-neutral-500">Start Date:</span>
                        <span className="ml-2 font-medium">{formatDate(rental.rentalDateStart)}</span>
                      </div>
                      <div>
                        <span className="text-neutral-500">End Date:</span>
                        <span className="ml-2 font-medium">{formatDate(rental.rentalDateEnd)}</span>
                      </div>
                    </div>
                    
                    {/* Countdown timer for confirmed rentals */}
                    {rental.statusId === 2 && (
                      <div className="mt-4">
                        <CountdownTimer 
                          targetDate={rental.rentalDateStart}
                          onExpired={() => {
                            console.log('Rental pickup time has passed for rental #' + rental.rentalId);
                          }}
                        />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-2 lg:ml-auto lg:flex-shrink-0">
                    <Link 
                      href={`/listing-tool-detail?id=${rental.toolId}`}
                      className="px-4 py-2 bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200 text-center"
                    >
                      View Tool
                    </Link>
                    
                    
                    {/* Edit and Delete buttons - only for pending rentals */}
                    {rental.statusId === 1 && (
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleEditRental(rental)}
                          className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDeleteRental(rental)}
                          className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                    
                    
                    {/* Cancel button for other statuses */}
                    {rental.statusId !== 1 && rental.statusId !== 5 && rental.statusId !== 6 && (
                      <button className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200">
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
              
            ))}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && editingRental && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-semibold mb-4">Edit Rental</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Start Date</label>
                <input
                  type="date"
                  value={editForm.rentalDateStart}
                  onChange={(e) => setEditForm({...editForm, rentalDateStart: e.target.value})}
                  className="w-full border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 rounded-lg px-3 py-2"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">End Date</label>
                <input
                  type="date"
                  value={editForm.rentalDateEnd}
                  onChange={(e) => setEditForm({...editForm, rentalDateEnd: e.target.value})}
                  className="w-full border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 rounded-lg px-3 py-2"
                />
              </div>
              
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSaveEdit}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Save Changes
              </button>
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 px-4 py-2 bg-neutral-200 text-neutral-700 rounded-lg hover:bg-neutral-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && rentalToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-semibold mb-4">Delete Rental</h3>
            <p className="text-neutral-600 dark:text-neutral-400 mb-6">
              Are you sure you want to delete rental #{rentalToDelete.rentalId}? This action cannot be undone.
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2 bg-neutral-200 text-neutral-700 rounded-lg hover:bg-neutral-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default MyRentalsPage;
