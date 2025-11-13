'use client';

import { useNFC } from '@/features/Cards/hooks/useNFC';

export const NFCReceiveButton = () => {
  const { isSupported, isScanning, startScan } = useNFC();

  if (!isSupported) return null;

  return (
    <button
      onClick={startScan}
      disabled={isScanning}
      className="px-6 py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg hover:from-green-700 hover:to-teal-700 disabled:opacity-50 transition-all shadow-lg flex items-center justify-center space-x-2"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <span>{isScanning ? 'Scan en cours...' : 'Recevoir par NFC'}</span>
    </button>
  );
};