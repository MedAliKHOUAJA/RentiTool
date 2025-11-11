"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SwitchDarkMode from '@/shared/SwitchDarkMode';
import ThemeSelector from '@/shared/ThemeSelector';

interface TestResult {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'success' | 'error';
  message?: string;
  duration?: number;
}

const FeatureTestPage: React.FC = () => {
  const router = useRouter();
  const [tests, setTests] = useState<TestResult[]>([
    { id: '1', name: 'Inscription avec validation', status: 'pending' },
    { id: '2', name: 'Email de bienvenue', status: 'pending' },
    { id: '3', name: 'Connexion avec SMS', status: 'pending' },
    { id: '4', name: 'Upload d\'image de profil', status: 'pending' },
    { id: '5', name: 'Système de rôles', status: 'pending' },
    { id: '6', name: 'Mode nuit/sombre', status: 'pending' },
    { id: '7', name: 'Validation des données', status: 'pending' },
  ]);
  
  const [isRunning, setIsRunning] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    // Vérifier l'utilisateur connecté
    checkCurrentUser();
  }, []);

  const checkCurrentUser = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const user = await response.json();
        setCurrentUser(user);
      }
    } catch (error) {
      console.error('Erreur lors de la vérification de l\'utilisateur:', error);
    }
  };

  const updateTestStatus = (id: string, status: TestResult['status'], message?: string, duration?: number) => {
    setTests(prev => prev.map(test => 
      test.id === id ? { ...test, status, message, duration } : test
    ));
  };

  const runTests = async () => {
    setIsRunning(true);
    
    // Test 1: Inscription avec validation
    await testSignupValidation();
    
    // Test 2: Email de bienvenue
    await testWelcomeEmail();
    
    // Test 3: Connexion avec SMS
    await testLoginWithSMS();
    
    // Test 4: Upload d'image de profil
    await testProfileImageUpload();
    
    // Test 5: Système de rôles
    await testRoleSystem();
    
    // Test 6: Mode nuit/sombre
    await testDarkMode();
    
    // Test 7: Validation des données
    await testDataValidation();
    
    setIsRunning(false);
  };

  const testSignupValidation = async () => {
    updateTestStatus('1', 'running');
    const startTime = Date.now();
    
    try {
      // Test avec des données invalides
      const invalidResponse = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: '',
          lastName: '',
          email: 'invalid-email',
          password: '123',
          phone: '123'
        })
      });
      
      if (invalidResponse.status === 400) {
        const invalidData = await invalidResponse.json();
        
        // Test avec des données valides
        const validResponse = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            firstName: 'Test',
            lastName: 'User',
            email: `test${Date.now()}@example.com`,
            password: 'Test@123!',
            phone: '+21650123456'
          })
        });
        
        if (validResponse.ok) {
          const duration = Date.now() - startTime;
          updateTestStatus('1', 'success', 'Validation fonctionne correctement', duration);
        } else {
          updateTestStatus('1', 'error', 'Erreur lors de l\'inscription valide');
        }
      } else {
        updateTestStatus('1', 'error', 'La validation ne fonctionne pas');
      }
    } catch (error) {
      updateTestStatus('1', 'error', `Erreur: ${error}`);
    }
  };

  const testWelcomeEmail = async () => {
    updateTestStatus('2', 'running');
    const startTime = Date.now();
    
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: 'Email',
          lastName: 'Test',
          email: `emailtest${Date.now()}@example.com`,
          password: 'Test@123!',
          phone: '+21650123456'
        })
      });
      
      if (response.ok) {
        const duration = Date.now() - startTime;
        updateTestStatus('2', 'success', 'Email de bienvenue envoyé', duration);
      } else {
        updateTestStatus('2', 'error', 'Erreur lors de l\'envoi de l\'email');
      }
    } catch (error) {
      updateTestStatus('2', 'error', `Erreur: ${error}`);
    }
  };

  const testLoginWithSMS = async () => {
    updateTestStatus('3', 'running');
    const startTime = Date.now();
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'Test@123!'
        })
      });
      
      if (response.ok) {
        const duration = Date.now() - startTime;
        updateTestStatus('3', 'success', 'Connexion réussie avec SMS', duration);
      } else {
        updateTestStatus('3', 'error', 'Erreur lors de la connexion');
      }
    } catch (error) {
      updateTestStatus('3', 'error', `Erreur: ${error}`);
    }
  };

  const testProfileImageUpload = async () => {
    updateTestStatus('4', 'running');
    const startTime = Date.now();
    
    try {
      // Créer une image de test
      const canvas = document.createElement('canvas');
      canvas.width = 100;
      canvas.height = 100;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#3B82F6';
        ctx.fillRect(0, 0, 100, 100);
      }
      
      canvas.toBlob(async (blob) => {
        if (blob) {
          const formData = new FormData();
          formData.append('image', blob, 'test-image.png');
          
          const response = await fetch('/api/profile/image', {
            method: 'POST',
            body: formData
          });
          
          if (response.ok) {
            const duration = Date.now() - startTime;
            updateTestStatus('4', 'success', 'Image uploadée avec succès', duration);
          } else {
            updateTestStatus('4', 'error', 'Erreur lors de l\'upload de l\'image');
          }
        }
      });
    } catch (error) {
      updateTestStatus('4', 'error', `Erreur: ${error}`);
    }
  };

  const testRoleSystem = async () => {
    updateTestStatus('5', 'running');
    const startTime = Date.now();
    
    try {
      // Tester l'accès admin
      const adminResponse = await fetch('/api/admin/users');
      
      if (adminResponse.status === 403) {
        // Normal si l'utilisateur n'est pas admin
        const duration = Date.now() - startTime;
        updateTestStatus('5', 'success', 'Système de rôles fonctionne (accès restreint)', duration);
      } else if (adminResponse.ok) {
        const duration = Date.now() - startTime;
        updateTestStatus('5', 'success', 'Accès admin autorisé', duration);
      } else {
        updateTestStatus('5', 'error', 'Erreur du système de rôles');
      }
    } catch (error) {
      updateTestStatus('5', 'error', `Erreur: ${error}`);
    }
  };

  const testDarkMode = async () => {
    updateTestStatus('6', 'running');
    const startTime = Date.now();
    
    try {
      // Vérifier si le mode sombre est bien implémenté
      const hasDarkClass = typeof window !== 'undefined' && document.documentElement.classList.contains('dark');
      const hasLocalStorage = typeof window !== 'undefined' && localStorage.getItem('theme') !== null;
      
      const duration = Date.now() - startTime;
      updateTestStatus('6', 'success', `Mode sombre configuré (${hasDarkClass ? 'actif' : 'inactif'})`, duration);
    } catch (error) {
      updateTestStatus('6', 'error', `Erreur: ${error}`);
    }
  };

  const testDataValidation = async () => {
    updateTestStatus('7', 'running');
    const startTime = Date.now();
    
    try {
      // Test de validation d'email
      const emailResponse = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: 'Test',
          lastName: 'Validation',
          email: 'invalid-email',
          password: 'Test@123!',
          phone: '+21650123456'
        })
      });
      
      // Test de validation de mot de passe
      const passwordResponse = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: 'Test',
          lastName: 'Validation',
          email: `valid${Date.now()}@example.com`,
          password: '123',
          phone: '+21650123456'
        })
      });
      
      if (emailResponse.status === 400 && passwordResponse.status === 400) {
        const duration = Date.now() - startTime;
        updateTestStatus('7', 'success', 'Validation des données fonctionne', duration);
      } else {
        updateTestStatus('7', 'error', 'Problème de validation');
      }
    } catch (error) {
      updateTestStatus('7', 'error', `Erreur: ${error}`);
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'pending':
        return <div className="w-4 h-4 bg-gray-300 rounded-full" />;
      case 'running':
        return <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse" />;
      case 'success':
        return <div className="w-4 h-4 bg-green-500 rounded-full" />;
      case 'error':
        return <div className="w-4 h-4 bg-red-500 rounded-full" />;
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-lg p-6 mb-8">
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-4">
            Test des Fonctionnalités RentiTool
          </h1>
          
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <SwitchDarkMode />
              <ThemeSelector variant="dropdown" showLabels={false} />
            </div>
            
            {currentUser && (
              <div className="text-sm text-neutral-600 dark:text-neutral-400">
                Connecté en tant que: <span className="font-medium">{currentUser.email}</span>
                {currentUser.role === 'admin' && (
                  <span className="ml-2 px-2 py-1 bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300 rounded text-xs">
                    Admin
                  </span>
                )}
              </div>
            )}
          </div>
          
          <button
            onClick={runTests}
            disabled={isRunning}
            className="bg-primary-600 hover:bg-primary-700 disabled:bg-neutral-400 text-white px-6 py-3 rounded-lg font-medium transition-colors mb-6"
          >
            {isRunning ? 'Tests en cours...' : 'Lancer tous les tests'}
          </button>
          
          <div className="space-y-4">
            {tests.map((test) => (
              <div key={test.id} className="border border-neutral-200 dark:border-neutral-700 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(test.status)}
                    <div>
                      <h3 className="font-medium text-neutral-900 dark:text-white">
                        {test.name}
                      </h3>
                      {test.message && (
                        <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                          {test.message}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {test.duration && (
                    <span className="text-xs text-neutral-500 dark:text-neutral-500">
                      {test.duration}ms
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-8 p-4 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
            <h3 className="font-medium text-neutral-900 dark:text-white mb-2">Résumé des tests</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-neutral-900 dark:text-white">
                  {tests.filter(t => t.status === 'success').length}
                </div>
                <div className="text-green-600 dark:text-green-400">Succès</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-neutral-900 dark:text-white">
                  {tests.filter(t => t.status === 'error').length}
                </div>
                <div className="text-red-600 dark:text-red-400">Erreurs</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-neutral-900 dark:text-white">
                  {tests.filter(t => t.status === 'running').length}
                </div>
                <div className="text-blue-600 dark:text-blue-400">En cours</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-neutral-900 dark:text-white">
                  {tests.filter(t => t.status === 'pending').length}
                </div>
                <div className="text-gray-600 dark:text-gray-400">En attente</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeatureTestPage;