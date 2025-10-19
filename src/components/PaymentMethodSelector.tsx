'use client';

import React, { useState, useEffect } from 'react';
import { PaymentTypeType } from '@/data/types';

interface PaymentMethodSelectorProps {
  onMethodChange: (methodId: number) => void;
  selectedMethodId?: number;
  className?: string;
}

const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  onMethodChange,
  selectedMethodId,
  className = ''
}) => {
  const [paymentTypes, setPaymentTypes] = useState<PaymentTypeType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPaymentTypes();
  }, []);

  const fetchPaymentTypes = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/payment-types');
      
      if (response.ok) {
        const data = await response.json();
        setPaymentTypes(data);
        // Auto-select first method if none selected
        if (!selectedMethodId && data.length > 0) {
          onMethodChange(data[0].typeId);
        }
      }
    } catch (error) {
      console.error('Failed to fetch payment types:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMethodIcon = (typeName: string) => {
    if (!typeName) return '💳';
    switch (typeName.toLowerCase()) {
      case 'credit card':
        return '💳';
      case 'debit card':
        return '💳';
      case 'cash':
        return '💵';
      case 'bank transfer':
        return '🏦';
      case 'bank check':
        return '📄';
      default:
        return '💳';
    }
  };

  const getMethodDescription = (typeName: string) => {
    if (!typeName) return 'Méthode de paiement';
    switch (typeName.toLowerCase()) {
      case 'credit card':
        return 'Paiement par carte de crédit';
      case 'debit card':
        return 'Paiement par carte de débit';
      case 'cash':
        return 'Paiement en espèces';
      case 'bank transfer':
        return 'Virement bancaire';
      case 'bank check':
        return 'Chèque bancaire';
      default:
        return 'Méthode de paiement';
    }
  };

  if (loading) {
    return (
      <div className={`p-4 ${className}`}>
        <div className="text-center text-gray-500">Chargement des méthodes de paiement...</div>
      </div>
    );
  }

  return (
    <div className={`p-4 ${className}`}>
      <h3 className="text-lg font-semibold mb-4">Méthode de paiement</h3>
      
      <div className="space-y-3">
        {paymentTypes.length > 0 ? paymentTypes.map((method) => (
          <div
            key={method.typeId}
            className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
              selectedMethodId === method.typeId
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
            }`}
            onClick={() => onMethodChange(method.typeId)}
          >
            <div className="flex items-center gap-3">
              <div className="text-2xl">{getMethodIcon(method.typeName)}</div>
              <div className="flex-1">
                <div className="font-medium text-gray-900 dark:text-white">
                  {method.typeName || 'Méthode de paiement'}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {getMethodDescription(method.typeName)}
                </div>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                selectedMethodId === method.typeId
                  ? 'border-blue-500 bg-blue-500'
                  : 'border-gray-300 dark:border-gray-600'
              }`}>
                {selectedMethodId === method.typeId && (
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                )}
              </div>
            </div>
          </div>
        )) : (
          <div className="text-center text-gray-500 py-4">
            Aucune méthode de paiement disponible
          </div>
        )}
      </div>

      {selectedMethodId && (
        <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <div className="flex items-center gap-2 text-green-800 dark:text-green-200">
            <span>✅</span>
            <span className="text-sm font-medium">
              Méthode de paiement sélectionnée
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentMethodSelector;
