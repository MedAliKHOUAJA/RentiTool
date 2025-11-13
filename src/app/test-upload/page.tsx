'use client';

import React, { useState } from 'react';

export default function TestUpload() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setUploadResult('');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadResult('Veuillez sélectionner un fichier');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('image', selectedFile);

    try {
      const response = await fetch('/api/profile/image', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      
      if (response.ok) {
        setUploadResult(`✅ Upload réussi: ${result.message || 'Image sauvegardée'}`);
      } else {
        setUploadResult(`❌ Erreur: ${result.error || 'Erreur inconnue'}`);
      }
    } catch (error) {
      setUploadResult(`❌ Erreur réseau: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleTestValidation = async () => {
    if (!selectedFile) {
      setUploadResult('Veuillez sélectionner un fichier pour le test');
      return;
    }

    // Test de validation directe
    const response = await fetch('/api/profile/image/validate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        fileType: selectedFile.type,
      }),
    });

    const result = await response.json();
    setUploadResult(`Validation: ${JSON.stringify(result)}`);
  };

  return (
    <div className="container mx-auto p-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-8 text-center">Test Upload d'Image</h1>
      
      <div className="bg-white dark:bg-neutral-800 p-6 rounded-lg shadow-lg">
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">
            Sélectionner une image:
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="block w-full text-sm text-neutral-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 dark:file:bg-neutral-700 dark:file:text-neutral-300"
          />
        </div>

        {selectedFile && (
          <div className="mb-6 p-4 bg-neutral-50 dark:bg-neutral-700 rounded-lg">
            <h3 className="font-semibold mb-2">Fichier sélectionné:</h3>
            <p>Nom: {selectedFile.name}</p>
            <p>Taille: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
            <p>Type: {selectedFile.type}</p>
          </div>
        )}

        <div className="flex gap-4 mb-6">
          <button
            onClick={handleUpload}
            disabled={!selectedFile || loading}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-neutral-300 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Upload en cours...' : 'Uploader l\'image'}
          </button>
          
          <button
            onClick={handleTestValidation}
            disabled={!selectedFile}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-neutral-300 disabled:cursor-not-allowed transition-colors"
          >
            Tester la validation
          </button>
        </div>

        {uploadResult && (
          <div className={`p-4 rounded-lg ${uploadResult.includes('✅') ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
            <p className="font-medium">{uploadResult}</p>
          </div>
        )}
      </div>

      <div className="mt-8 p-4 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
        <h3 className="font-semibold mb-2">Contraintes:</h3>
        <ul className="text-sm space-y-1">
          <li>• Formats acceptés: JPEG, PNG, WebP</li>
          <li>• Taille maximale: 5MB</li>
          <li>• L'image sera convertie en base64</li>
        </ul>
      </div>
    </div>
  );
}