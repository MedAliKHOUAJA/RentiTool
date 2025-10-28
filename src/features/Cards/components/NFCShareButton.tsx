// src/features/Cards/components/NFCShareButton.tsx
'use client';

import { useNFC } from '@/features/Cards/hooks/useNFC';

interface NFCShareButtonProps {
  cardId: number;
}

// Temporary debug in NFCShareButton.tsx
export const NFCShareButton = ({ cardId }: NFCShareButtonProps) => {
  const { isSupported, writeCard } = useNFC();

  console.log('NFC Support:', isSupported); // Add this line

  if (!isSupported) {
    // Temporarily render a disabled button to see if it appears
    return (
      <button
        disabled
        className="px-6 py-3 bg-gray-400 text-white rounded-lg cursor-not-allowed shadow-lg"
      >
        NFC Non Supporté
      </button>
    );
  }

  return (
    <button
      onClick={() => writeCard(cardId)}
      className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg flex items-center justify-center space-x-2"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017a2 2 0 01-1.789-1.106l-3.5-7a2 2 0 011.789-2.894H10" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v3" />
      </svg>
      <span>Partager par NFC</span>
    </button>
  );
};