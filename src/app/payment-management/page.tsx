'use client';

import React, { useEffect, useState } from 'react';
import { PaymentDataType, PaymentStatusType, PaymentTypeType } from '@/data/types';

const PaymentManagementPage = () => {
  const [payments, setPayments] = useState<PaymentDataType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed' | 'failed' | 'refunded'>('all');
  const [paymentStatuses, setPaymentStatuses] = useState<PaymentStatusType[]>([]);
  const [paymentTypes, setPaymentTypes] = useState<PaymentTypeType[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<PaymentDataType | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);

  useEffect(() => {
    fetchPayments();
    fetchPaymentStatuses();
    fetchPaymentTypes();
  }, [filter]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter !== 'all') {
        const statusMap = {
          'pending': '1',
          'completed': '2', 
          'failed': '3',
          'refunded': '4'
        };
        params.append('statusId', statusMap[filter]);
      }
      // Add current user ID (for now using static ID)
      params.append('userId', '2612236b-9fc8-4b07-a668-c197c312265f');
      
      const response = await fetch(`/api/payments?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch payments');
      const data = await response.json();
      setPayments(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentStatuses = async () => {
    try {
      const response = await fetch('/api/payment-status');
      if (response.ok) {
        const data = await response.json();
        setPaymentStatuses(data);
      }
    } catch (error) {
      console.error('Failed to fetch payment statuses:', error);
    }
  };

  const fetchPaymentTypes = async () => {
    try {
      const response = await fetch('/api/payment-types');
      if (response.ok) {
        const data = await response.json();
        setPaymentTypes(data);
      }
    } catch (error) {
      console.error('Failed to fetch payment types:', error);
    }
  };

  const handleStatusChange = async (paymentId: number, newStatusId: number) => {
    try {
      const response = await fetch(`/api/payments/${paymentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentStatusId: newStatusId })
      });

      if (!response.ok) throw new Error('Failed to update payment status');
      
      // Refresh payments
      await fetchPayments();
      setShowStatusModal(false);
      setSelectedPayment(null);
    } catch (err: any) {
      alert(`Erreur: ${err?.message || 'Failed to update payment status'}`);
    }
  };

  const getStatusColor = (statusId: number) => {
    switch (statusId) {
      case 1: return 'bg-yellow-100 text-yellow-800 border-yellow-200'; // Pending
      case 2: return 'bg-green-100 text-green-800 border-green-200'; // Completed
      case 3: return 'bg-red-100 text-red-800 border-red-200'; // Failed
      case 4: return 'bg-blue-100 text-blue-800 border-blue-200'; // Refunded
      case 5: return 'bg-gray-100 text-gray-800 border-gray-200'; // Cancelled
      case 6: return 'bg-orange-100 text-orange-800 border-orange-200'; // In Progress
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (statusId: number) => {
    const status = paymentStatuses.find(s => s.statusId === statusId);
    return status?.statusName || 'Unknown';
  };

  const getTypeText = (typeId: number) => {
    const type = paymentTypes.find(t => t.typeId === typeId);
    return type?.typeName || 'Unknown';
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'TND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="container py-10">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des paiements...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-10">
        <div className="text-center text-red-600">
          <p>Erreur: {error}</p>
          <button 
            onClick={() => fetchPayments()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Gestion des Paiements
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Gérez les paiements de vos outils loués
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'all', label: 'Tous', count: payments.length },
            { key: 'pending', label: 'En attente', count: payments.filter(p => p.paymentStatusId === 1).length },
            { key: 'completed', label: 'Terminés', count: payments.filter(p => p.paymentStatusId === 2).length },
            { key: 'failed', label: 'Échoués', count: payments.filter(p => p.paymentStatusId === 3).length },
            { key: 'refunded', label: 'Remboursés', count: payments.filter(p => p.paymentStatusId === 4).length }
          ].map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setFilter(key as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === key
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              {label} ({count})
            </button>
          ))}
        </div>
      </div>

      {payments.length === 0 && !loading && !error ? (
        <div className="text-center py-10 text-neutral-500 dark:text-neutral-400">
          <div className="text-6xl mb-4">💳</div>
          <h3 className="text-lg font-semibold mb-2">Aucun paiement trouvé</h3>
          <p>Il n'y a pas encore de paiements pour vos outils.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {payments.map((payment) => (
            <div key={payment.paymentId} className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-700 p-6">
              <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(payment.paymentStatusId)}`}>
                      {getStatusText(payment.paymentStatusId)}
                    </span>
                    <span className="text-sm text-neutral-500">Paiement #{payment.paymentId}</span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-4">
                    <div>
                      <span className="text-neutral-500">Montant:</span>
                      <span className="ml-2 font-medium text-green-600">{formatPrice(payment.amount)}</span>
                    </div>
                    <div>
                      <span className="text-neutral-500">Type de paiement:</span>
                      <span className="ml-2 font-medium">{getTypeText(payment.paymentTypeId)}</span>
                    </div>
                    <div>
                      <span className="text-neutral-500">Date de paiement:</span>
                      <span className="ml-2 font-medium">{formatDate(payment.paymentDate)}</span>
                    </div>
                    <div>
                      <span className="text-neutral-500">Réservation:</span>
                      <span className="ml-2 font-medium">#{payment.rentalId}</span>
                    </div>
                  </div>

                  {payment.rentalInfo && (
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">Informations de la réservation</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-500">Outil:</span>
                          <span className="ml-2 font-medium">{payment.rentalInfo.toolName || `Outil #${payment.rentalInfo.toolId}`}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Période:</span>
                          <span className="ml-2 font-medium">
                            {payment.rentalInfo.rentalDateStart && payment.rentalInfo.rentalDateEnd
                              ? `${formatDate(payment.rentalInfo.rentalDateStart)} - ${formatDate(payment.rentalInfo.rentalDateEnd)}`
                              : 'N/A'
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col sm:flex-row gap-2 lg:ml-auto lg:flex-shrink-0">
                  <button 
                    onClick={() => {
                      setSelectedPayment(payment);
                      setShowStatusModal(true);
                    }}
                    className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
                  >
                    Modifier Statut
                  </button>
                  
                  <button className="px-4 py-2 bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200">
                    Voir Détails
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Status Change Modal */}
      {showStatusModal && selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-semibold mb-4">Modifier le statut du paiement</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Paiement #{selectedPayment.paymentId} - {formatPrice(selectedPayment.amount)}
            </p>
            
            <div className="space-y-2">
              {paymentStatuses.map((status) => (
                <button
                  key={status.statusId}
                  onClick={() => handleStatusChange(selectedPayment.paymentId, status.statusId)}
                  className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                    selectedPayment.paymentStatusId === status.statusId
                      ? 'bg-blue-50 border-blue-200 text-blue-800'
                      : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div className="font-medium">{status.statusName}</div>
                </button>
              ))}
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowStatusModal(false)}
                className="flex-1 px-4 py-2 bg-neutral-200 text-neutral-700 rounded-lg hover:bg-neutral-300"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentManagementPage;
