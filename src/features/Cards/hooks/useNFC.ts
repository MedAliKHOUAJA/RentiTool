// src/features/Cards/hooks/useNFC.ts
'use client';

import { useState } from 'react';

export const useNFC = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [lastScannedUrl, setLastScannedUrl] = useState<string | null>(null);

  const isSupported = typeof window !== 'undefined' && 'NDEFReader' in window;

  const startScan = async (): Promise<void> => {
    if (!isSupported) {
      alert('NFC non supporté sur cet appareil');
      return;
    }

    try {
      setIsScanning(true);
      const ndef = new (window as any).NDEFReader();
      await ndef.scan();

      ndef.onreading = ({ message }: any) => {
        for (const record of message.records) {
          if (record.recordType === 'url' || record.recordType === 'text') {
            const decoder = new TextDecoder(record.encoding || 'utf-8');
            const url = decoder.decode(record.data);
            setLastScannedUrl(url);
            window.location.href = url; // Auto-navigate
          }
        }
      };

      ndef.onreadingerror = () => {
        alert('Erreur de lecture NFC. Réessayez.');
      };
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        alert('Autorisation NFC refusée. Activez NFC et réessayez.');
      } else {
        alert('NFC non disponible');
      }
    } finally {
      setIsScanning(false);
    }
  };

  const writeCard = async (cardId: number): Promise<void> => {
    if (!isSupported) {
      alert('NFC non supporté sur cet appareil');
      return;
    }

    const shareUrl = `${window.location.origin}/account/cards/details/${cardId}?shared=true`;

    try {
      const ndef = new (window as any).NDEFReader();
      await ndef.write({
        records: [{ recordType: 'url', data: shareUrl }]
      });
      alert('Carte prête ! Approchez un autre téléphone.');
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        alert('Autorisation NFC refusée. Activez NFC et réessayez.');
      } else {
        alert('Échec écriture NFC');
      }
    }
  };

  return { isSupported, isScanning, startScan, writeCard, lastScannedUrl };
};