'use client';

import React, { useState } from 'react';
import { generateRentalMessage } from '@/utils/generateRentalMessage';

const TestGeminiPage = () => {
  const [rentalId, setRentalId] = useState<string>('1');
  const [messageType, setMessageType] = useState<'confirmation' | 'acceptance' | 'rejection' | 'reminder' | 'completion' | 'cancellation'>('confirmation');
  const [language, setLanguage] = useState<'fr' | 'en' | 'ar'>('fr');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message?: string; error?: string } | null>(null);

  const handleGenerateMessage = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await generateRentalMessage({
        rentalId: parseInt(rentalId),
        messageType,
        language,
      });

      setResult(response);
    } catch (error: any) {
      setResult({
        success: false,
        error: error?.message || 'Erreur inconnue',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="nc-ListingDetailPage">
      <div className="container mt-10 mb-20">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">🤖 Test Gemini AI - Génération de Messages</h1>
          <p className="text-neutral-600 dark:text-neutral-400 mb-6">
            Testez la génération automatique de messages personnalisés avec Gemini AI
          </p>
        </div>

        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Paramètres de test</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">ID de Réservation</label>
              <input
                type="number"
                value={rentalId}
                onChange={(e) => setRentalId(e.target.value)}
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
                placeholder="Entrez un ID de réservation"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Type de Message</label>
              <select
                value={messageType}
                onChange={(e) => setMessageType(e.target.value as any)}
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
              >
                <option value="confirmation">Confirmation</option>
                <option value="acceptance">Acceptation</option>
                <option value="rejection">Refus</option>
                <option value="reminder">Rappel</option>
                <option value="completion">Fin de réservation</option>
                <option value="cancellation">Annulation</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Langue</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as any)}
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
              >
                <option value="fr">Français</option>
                <option value="en">English</option>
                <option value="ar">العربية</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleGenerateMessage}
            disabled={loading || !rentalId}
            className="w-full md:w-auto px-6 py-3 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? '⏳ Génération en cours...' : '🚀 Générer le Message'}
          </button>
        </div>

        {result && (
          <div className={`rounded-2xl border p-6 ${
            result.success
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
          }`}>
            <h2 className={`text-xl font-semibold mb-4 ${
              result.success ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'
            }`}>
              {result.success ? '✅ Message généré avec succès !' : '❌ Erreur lors de la génération'}
            </h2>

            {result.success && result.message && (
              <div className="bg-white dark:bg-neutral-800 rounded-lg p-4 border border-neutral-200 dark:border-neutral-700">
                <h3 className="font-medium mb-2 text-neutral-700 dark:text-neutral-300">Message généré :</h3>
                <div className="whitespace-pre-wrap text-neutral-600 dark:text-neutral-400">
                  {result.message}
                </div>
              </div>
            )}

            {result.error && (
              <div className="bg-white dark:bg-neutral-800 rounded-lg p-4 border border-neutral-200 dark:border-neutral-700">
                <h3 className="font-medium mb-2 text-red-700 dark:text-red-300">Erreur :</h3>
                <p className="text-red-600 dark:text-red-400">{result.error}</p>
              </div>
            )}
          </div>
        )}

        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-200 dark:border-blue-800 p-6">
          <h3 className="text-lg font-semibold mb-3 text-blue-800 dark:text-blue-200">💡 Instructions</h3>
          <ol className="list-decimal list-inside space-y-2 text-blue-700 dark:text-blue-300">
            <li>Entrez un ID de réservation existant dans votre base de données</li>
            <li>Sélectionnez le type de message que vous voulez générer</li>
            <li>Choisissez la langue (Français, English, العربية)</li>
            <li>Cliquez sur "Générer le Message"</li>
            <li>Le message sera généré automatiquement par Gemini AI</li>
          </ol>
        </div>

        <div className="mt-6 bg-yellow-50 dark:bg-yellow-900/20 rounded-2xl border border-yellow-200 dark:border-yellow-800 p-6">
          <h3 className="text-lg font-semibold mb-3 text-yellow-800 dark:text-yellow-200">⚠️ Note importante</h3>
          <p className="text-yellow-700 dark:text-yellow-300">
            Assurez-vous que le serveur est démarré et que la clé API Gemini est configurée dans le fichier <code className="bg-yellow-100 dark:bg-yellow-900 px-2 py-1 rounded">.env.local</code>
          </p>
        </div>
      </div>
    </div>
  );
};

export default TestGeminiPage;

