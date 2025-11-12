
'use client';

import React, { useState, useRef } from 'react';
import { X, Upload, Camera, Loader2, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface ScannedData {
  extractedText: string;
  entities: {
    name?: string;
    title?: string;
    company?: string;
    email?: string;
    phone?: string;
    website?: string;
  };
}

interface BusinessCardScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onDataExtracted: (data: ScannedData) => void;
}

export const BusinessCardScanner: React.FC<BusinessCardScannerProps> = ({
  isOpen,
  onClose,
  onDataExtracted,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Veuillez sélectionner une image');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('L\'image ne doit pas dépasser 5 Mo');
      return;
    }

    setSelectedFile(file);
    setScanComplete(false);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleScan = async () => {
    if (!selectedFile) {
      toast.error('Veuillez sélectionner une image');
      return;
    }

    setIsScanning(true);
    console.log('🔍 Scanner: Starting scan process...');

    try {
      // Prepare form data
      const formData = new FormData();
      formData.append('image', selectedFile);
      console.log('📤 Scanner: Sending image:', selectedFile.name, selectedFile.type, selectedFile.size);

      // Call your backend API endpoint
      const response = await fetch('/api/scan-business-card', {
        method: 'POST',
        body: formData,
      });

      console.log('📥 Scanner: Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Scanner: Response error:', errorText);
        throw new Error('Erreur lors du scan');
      }

      const result = await response.json();
      console.log('✅ Scanner: Full API Response:', JSON.stringify(result, null, 2));

      if (result.success) {
        setScanComplete(true);
        
        // Log the extracted data
        console.log('📋 Scanner: Extracted Text:', result.extractedText);
        console.log('🏷️ Scanner: Structured Entities:', result.entities);
        console.log('🔍 Scanner: Raw Entities:', result.rawEntities);
        
        // Prepare the data to pass to parent
        const scannedData: ScannedData = {
          extractedText: result.extractedText || '',
          entities: {
            name: result.entities?.name || undefined,
            title: result.entities?.title || undefined,
            company: result.entities?.company || undefined,
            email: result.entities?.email || undefined,
            phone: result.entities?.phone || undefined,
            website: result.entities?.website || undefined,
          }
        };
        
        console.log('🚀 Scanner: Passing data to parent component:', JSON.stringify(scannedData, null, 2));
        
        // Pass the extracted data to parent
        onDataExtracted(scannedData);
        
        toast.success('Carte scannée avec succès !');

        // Close modal after a short delay
        setTimeout(() => {
          onClose();
          resetScanner();
        }, 1500);
      } else {
        throw new Error(result.error || 'Erreur lors du scan');
      }
    } catch (error) {
      console.error('❌ Scanner: Scan error:', error);
      toast.error(
        error instanceof Error ? error.message : 'Erreur lors du scan de la carte'
      );
    } finally {
      setIsScanning(false);
    }
  };

  const resetScanner = () => {
    setSelectedFile(null);
    setPreview(null);
    setScanComplete(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    resetScanner();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Scanner une Carte de Visite
          </h2>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            disabled={isScanning}
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* File Input */}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              disabled={isScanning}
            />
            
            {!preview ? (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full p-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition-colors cursor-pointer"
                disabled={isScanning}
              >
                <div className="text-center">
                  <Upload className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Cliquez pour télécharger
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    JPEG ou PNG • Max 5 Mo
                  </p>
                </div>
              </button>
            ) : (
              <div className="space-y-3">
                {/* Preview */}
                <div className="relative rounded-lg overflow-hidden border-2 border-gray-200 dark:border-gray-700">
                  <img
                    src={preview}
                    alt="Aperçu de la carte"
                    className="w-full h-auto max-h-64 object-contain bg-gray-50 dark:bg-gray-900"
                  />
                  {scanComplete && (
                    <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                      <CheckCircle className="w-16 h-16 text-green-500" />
                    </div>
                  )}
                </div>

                {/* Change Image Button */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-2 px-4 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  disabled={isScanning}
                >
                  Changer l'image
                </button>
              </div>
            )}
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <strong>Astuce:</strong> Prenez une photo claire de votre carte de visite avec un bon éclairage pour de meilleurs résultats.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 p-4 rounded-b-2xl flex gap-3">
          <button
            onClick={handleClose}
            className="flex-1 py-3 px-4 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            disabled={isScanning}
          >
            Annuler
          </button>
          <button
            onClick={handleScan}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
              isScanning || !selectedFile
                ? 'bg-blue-300 dark:bg-blue-700 text-white cursor-not-allowed'
                : 'bg-blue-500 dark:bg-blue-600 text-white hover:bg-blue-600 dark:hover:bg-blue-700'
            }`}
            disabled={isScanning || !selectedFile}
          >
            {isScanning ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Scan en cours...
              </>
            ) : (
              <>
                <Camera className="w-5 h-5" />
                Scanner
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};