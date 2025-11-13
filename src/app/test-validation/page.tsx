'use client';

import React, { useState } from 'react';

export default function TestValidation() {
  const [testData, setTestData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    userType: 'tenant'
  });
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setTestData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleTestValidation = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/test-validation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData),
      });

      const data = await response.json();
      
      if (response.ok) {
        setResult(`✅ Données valides: ${JSON.stringify(data, null, 2)}`);
      } else {
        setResult(`❌ Erreurs de validation: ${JSON.stringify(data.errors, null, 2)}`);
      }
    } catch (error) {
      setResult(`❌ Erreur réseau: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-8 text-center">Test Validation</h1>
      
      <div className="bg-white dark:bg-neutral-800 p-6 rounded-lg shadow-lg space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Prénom</label>
            <input
              type="text"
              name="firstName"
              value={testData.firstName}
              onChange={handleChange}
              className="w-full p-2 border rounded-lg dark:bg-neutral-700 dark:border-neutral-600"
              placeholder="Mohamed"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Nom</label>
            <input
              type="text"
              name="lastName"
              value={testData.lastName}
              onChange={handleChange}
              className="w-full p-2 border rounded-lg dark:bg-neutral-700 dark:border-neutral-600"
              placeholder="Tounsi"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            name="email"
            value={testData.email}
            onChange={handleChange}
            className="w-full p-2 border rounded-lg dark:bg-neutral-700 dark:border-neutral-600"
            placeholder="aichamaala@gmail.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Téléphone</label>
          <input
            type="tel"
            name="phone"
            value={testData.phone}
            onChange={handleChange}
            className="w-full p-2 border rounded-lg dark:bg-neutral-700 dark:border-neutral-600"
            placeholder="27108858"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Mot de passe</label>
            <input
              type="password"
              name="password"
              value={testData.password}
              onChange={handleChange}
              className="w-full p-2 border rounded-lg dark:bg-neutral-700 dark:border-neutral-600"
              placeholder="wympuh-gecre9-zoRhan"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Confirmer</label>
            <input
              type="password"
              name="confirmPassword"
              value={testData.confirmPassword}
              onChange={handleChange}
              className="w-full p-2 border rounded-lg dark:bg-neutral-700 dark:border-neutral-600"
              placeholder="wympuh-gecre9-zoRhan"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Type d'utilisateur</label>
          <select
            name="userType"
            value={testData.userType}
            onChange={handleChange}
            className="w-full p-2 border rounded-lg dark:bg-neutral-700 dark:border-neutral-600"
          >
            <option value="tenant">Locataire</option>
            <option value="owner">Propriétaire</option>
          </select>
        </div>

        <button
          onClick={handleTestValidation}
          disabled={loading}
          className="w-full px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-neutral-300 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Test en cours...' : 'Tester la validation'}
        </button>

        {result && (
          <div className={`p-4 rounded-lg ${result.includes('✅') ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
            <pre className="whitespace-pre-wrap text-sm">{result}</pre>
          </div>
        )}
      </div>

      <div className="mt-8 p-4 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
        <h3 className="font-semibold mb-2">Exemples de test:</h3>
        <div className="text-sm space-y-2">
          <button
            onClick={() => setTestData({
              firstName: 'Mohamed',
              lastName: 'Tounsi',
              email: 'aichamaala@gmail.com',
              phone: '27108858',
              password: 'wympuh-gecre9-zoRhan!',
              confirmPassword: 'wympuh-gecre9-zoRhan!',
              userType: 'owner'
            })}
            className="block w-full text-left p-2 bg-white dark:bg-neutral-700 rounded hover:bg-neutral-50 dark:hover:bg-neutral-600"
          >
            Données valides
          </button>
          <button
            onClick={() => setTestData({
              firstName: 'A',
              lastName: 'B',
              email: 'invalid-email',
              phone: '123',
              password: '123',
              confirmPassword: '456',
              userType: 'invalid'
            })}
            className="block w-full text-left p-2 bg-white dark:bg-neutral-700 rounded hover:bg-neutral-50 dark:hover:bg-neutral-600"
          >
            Données invalides
          </button>
        </div>
      </div>
    </div>
  );
}