'use client';

import React, { useEffect, useState } from 'react';
import { RentalDataType } from '@/data/types';
import { Route } from '@/routers/types';
import Link from 'next/link';

const RentalManagementPage = () => {
  const [rentals, setRentals] = useState<RentalDataType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled'>('all');

  useEffect(() => {
    fetchRentals();
  }, [filter]);

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
    } catch (err: any) {
      setError(err?.message || 'Failed to load rentals');
    } finally {
      setLoading(false);
    }
  };

  const handleRentalAction = async (rentalId: number, action: 'accept' | 'reject') => {
    try {
      const response = await fetch('/api/rental-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rentalId,
          action
        })
      });

      if (!response.ok) throw new Error('Failed to update rental status');
      
      // Refresh the rentals list
      await fetchRentals();
    } catch (err: any) {
      console.error('Error updating rental:', err);
      setError(err?.message || 'Failed to update rental status');
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

  if (loading) {
    return (
      <div className="container py-10">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-900"></div>
          <span className="ml-2">Loading rental management...</span>
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
            <li className="text-neutral-800 dark:text-neutral-200">Rental Management</li>
          </ol>
        </nav>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">Rental Management</h1>
          <p className="text-neutral-600 dark:text-neutral-400 mb-6">
            Manage rental requests for your tools
          </p>
          
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
            <div className="text-neutral-500 mb-4">No rental requests found</div>
            <Link 
              href="/tools-management"
              className="inline-flex items-center px-4 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800"
            >
              Manage Tools
            </Link>
          </div>
        ) : (
          <div className="grid gap-6">
            {rentals.map((rental) => (
              <div key={rental.rentalId} className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-700 p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(rental.statusId)}`}>
                        {getStatusText(rental.statusId)}
                      </span>
                      <span className="text-sm text-neutral-500">Rental #{rental.rentalId}</span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-neutral-500">Tool ID:</span>
                        <span className="ml-2 font-medium">{rental.toolId}</span>
                      </div>
                      <div>
                        <span className="text-neutral-500">Renter ID:</span>
                        <span className="ml-2 font-medium">{rental.renterId}</span>
                      </div>
                      <div>
                        <span className="text-neutral-500">Total Price:</span>
                        <span className="ml-2 font-medium text-green-600">{formatPrice(rental.totalPrice)}</span>
                      </div>
                      <div>
                        <span className="text-neutral-500">Rental Period:</span>
                        <span className="ml-2 font-medium">{formatDate(rental.rentalDateStart)} - {formatDate(rental.rentalDateEnd)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Link 
                      href={`/listing-tool-detail?id=${rental.toolId}`}
                      className="px-4 py-2 bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200 text-center"
                    >
                      View Tool
                    </Link>
                    {rental.statusId === 1 && (
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleRentalAction(rental.rentalId, 'accept')}
                          className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
                        >
                          Accept
                        </button>
                        <button 
                          onClick={() => handleRentalAction(rental.rentalId, 'reject')}
                          className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RentalManagementPage;
