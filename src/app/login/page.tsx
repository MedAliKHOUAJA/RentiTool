"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (!email || !password) {
      setError("Veuillez remplir tous les champs");
      setIsLoading(false);
      return;
    }

    try {
      console.log('🔄 Tentative de connexion...', { email: email.trim().toLowerCase() });
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
          remember
        }),
      });

      const data = await response.json();
      console.log('📨 Réponse API login:', data);

      if (response.ok && data.success) {
        console.log('✅ Connexion réussie! Redirection vers /profile');
        console.log('👤 Utilisateur connecté:', data.user);
        
      
      router.push('/')
        
      } else {
        console.log('❌ Erreur connexion:', data.error);
        setError(data.error || 'Email ou mot de passe incorrect');
      }
    } catch (error) {
      console.error('💥 Erreur de connexion:', error);
      setError('Erreur de connexion au serveur. Vérifiez votre connexion internet.');
    } finally {
      setIsLoading(false);
    }
  };

  // Testez avec un utilisateur existant
  const testCredentials = () => {
    setEmail("test@example.com");
    setPassword("test123");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 via-white to-indigo-50 p-6">
      {/* Decorative shapes */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <svg className="absolute -top-24 -left-24 opacity-10" width="400" height="400" viewBox="0 0 400 400" fill="none">
          <circle cx="200" cy="200" r="200" fill="#7C3AED" />
        </svg>
        <svg className="absolute -bottom-32 -right-32 opacity-5" width="500" height="500" viewBox="0 0 500 500" fill="none">
          <rect width="500" height="500" rx="100" fill="#06B6D4" />
        </svg>
      </div>

      <div className="relative z-10 max-w-3xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        {/* Left: Illustration / branding */}
        <div className="hidden md:flex flex-col justify-center px-8">
          <div className="mb-6 flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-md">
              <svg viewBox="0 0 24 24" className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M3 7v10a2 2 0 0 0 2 2h14" strokeLinecap="round" strokeLinejoin="round"></path>
                <path d="M7 7V5a3 3 0 0 1 3-3h4a3 3 0 0 1 3 3v2" strokeLinecap="round" strokeLinejoin="round"></path>
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-700">RentiTool</h3>
              <p className="text-sm text-slate-500">Gérez vos locations en toute simplicité</p>
            </div>
          </div>

          <div className="rounded-2xl bg-white/60 backdrop-blur-md p-6 shadow-lg">
            <h4 className="text-xl font-semibold text-slate-800 mb-2">Bienvenue !</h4>
            <p className="text-sm text-slate-600">
              Connectez-vous pour accéder à votre profil personnel.
            </p>
            
            {/* Bouton de test (optionnel - à retirer en production) */}
            <button 
              onClick={testCredentials}
              className="mt-4 text-xs text-blue-600 hover:underline"
              type="button"
            >
              Remplir avec des identifiants de test
            </button>
          </div>
        </div>

        {/* Right: Form card */}
        <div className="mx-auto w-full max-w-md">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-gray-100">
            <div className="mb-6 text-center">
              <h2 className="text-2xl font-extrabold text-slate-900">Connexion</h2>
              <p className="mt-1 text-sm text-slate-500">Entrez vos identifiants pour continuer</p>
            </div>

            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="block">
                <span className="text-neutral-800 mb-2 block">Adresse email</span>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                      <path d="M3 8l9 6 9-6" strokeLinecap="round" strokeLinejoin="round"></path>
                      <path d="M21 8v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8" strokeLinecap="round" strokeLinejoin="round"></path>
                    </svg>
                  </span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    className="pl-10 pr-3 py-2 w-full rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-sky-300 focus:border-transparent bg-white disabled:bg-gray-50"
                    placeholder="exemple@email.com"
                  />
                </div>
              </label>

              <label className="block">
                <span className="text-neutral-800 mb-2 block">Mot de passe</span>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                      <rect x="3" y="11" width="18" height="10" rx="2" strokeLinecap="round" strokeLinejoin="round"></rect>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" strokeLinecap="round" strokeLinejoin="round"></path>
                    </svg>
                  </span>

                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    className="pl-10 pr-12 py-2 w-full rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-sky-300 focus:border-transparent bg-white disabled:bg-gray-50"
                    placeholder="Votre mot de passe"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    disabled={isLoading}
                    className="absolute inset-y-0 right-2 flex items-center text-slate-500 px-2"
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M3 3l18 18" strokeLinecap="round" strokeLinejoin="round"></path>
                        <path d="M10.58 10.58A3 3 0 0113.42 13.42" strokeLinecap="round" strokeLinejoin="round"></path>
                        <path d="M9.88 5.07A9 9 0 0121 12a9.4 9.4 0 01-3.2 4.2" strokeLinecap="round" strokeLinejoin="round"></path>
                        <path d="M6.2 6.2A9.4 9.4 0 003 12a9 9 0 004.76 6.37" strokeLinecap="round" strokeLinejoin="round"></path>
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" strokeLinecap="round" strokeLinejoin="round"></path>
                        <circle cx="12" cy="12" r="3" strokeLinecap="round" strokeLinejoin="round"></circle>
                      </svg>
                    )}
                  </button>
                </div>
              </label>

              <div className="flex items-center justify-between text-sm">
                <label className="inline-flex items-center gap-2 text-slate-600">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={() => setRemember((r) => !r)}
                    disabled={isLoading}
                    className="h-4 w-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                  />
                  Se souvenir de moi
                </label>
                <a href="/forgot-password" className="text-sky-600 hover:underline">
                  Mot de passe oublié ?
                </a>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-500 text-white py-2 rounded-lg font-semibold hover:bg-blue-600 disabled:opacity-50 transition-colors"
              >
                {isLoading ? 'Connexion...' : 'Se connecter'}
              </button>
            </form>

            <div className="mt-6 text-center text-sm">
              <span className="text-slate-600">Pas encore de compte ? </span>
              <a href="/signup" className="text-sky-600 font-medium hover:underline">
                Créer un compte
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}