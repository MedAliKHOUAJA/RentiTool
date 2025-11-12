"use client";

import { useEffect, useRef, useState } from 'react';
import { loadFaceModels, startCamera, stopCamera, computeEmbeddingFromVideo, hasMediaDevices } from '@/utils/face';

export default function FaceSetupPage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [embedding, setEmbedding] = useState<number[] | null>(null);

  useEffect(() => {
    return () => {
      if (videoRef.current) stopCamera(videoRef.current);
    };
  }, []);

  const handleStartCamera = async () => {
    setError('');
    setMessage('');
    if (!hasMediaDevices()) {
      setError('La caméra n\'est pas disponible dans ce navigateur.');
      return;
    }
    try {
      setLoading(true);
      await loadFaceModels('/models');
      if (!videoRef.current) return;
      await startCamera(videoRef.current);
      setCameraOn(true);
      setMessage('Caméra démarrée. Regardez bien en face de l\'écran.');
    } catch (e) {
      console.error('Camera start error', e);
      setError('Impossible de démarrer la caméra. Autorisez l\'accès et réessayez.');
    } finally {
      setLoading(false);
    }
  };

  const handleCaptureFace = async () => {
    setError('');
    setMessage('');
    if (!videoRef.current) return;
    try {
      setLoading(true);
      const emb = await computeEmbeddingFromVideo(videoRef.current, 30, 150);
      if (!emb) {
        setError('Visage non détecté. Essayez avec une meilleure luminosité.');
        return;
      }
      setEmbedding(emb);
      setMessage('Visage détecté. Prêt à sauvegarder.');
    } catch (e) {
      console.error('Compute embedding error', e);
      setError('Erreur durant la détection du visage.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setError('');
    setMessage('');
    if (!embedding) {
      setError('Aucune empreinte faciale à sauvegarder.');
      return;
    }
    try {
      setLoading(true);
      const res = await fetch('/api/auth/face-setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ embedding }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erreur serveur');
      }
      setMessage('Reconnaissance faciale configurée avec succès.');
    } catch (e: any) {
      console.error('Save embedding error', e);
      setError(e?.message || 'Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  const handleStopCamera = () => {
    if (videoRef.current) stopCamera(videoRef.current);
    setCameraOn(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-xl mx-auto bg-white rounded-2xl shadow p-6">
        <h1 className="text-2xl font-bold mb-2">Configurer la reconnaissance faciale</h1>
        <p className="text-sm text-slate-600 mb-6">Capturez votre visage pour activer la connexion par reconnaissance faciale.</p>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
        )}
        {message && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">{message}</div>
        )}

        <div className="space-y-4">
          <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
            <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
          </div>

          <div className="flex gap-3">
            {!cameraOn ? (
              <button onClick={handleStartCamera} disabled={loading} className="px-4 py-2 rounded-lg bg-blue-600 text-white disabled:opacity-50">
                {loading ? 'Démarrage…' : 'Démarrer la caméra'}
              </button>
            ) : (
              <button onClick={handleStopCamera} className="px-4 py-2 rounded-lg bg-gray-200 text-gray-800">Arrêter la caméra</button>
            )}

            <button onClick={handleCaptureFace} disabled={loading || !cameraOn} className="px-4 py-2 rounded-lg bg-indigo-600 text-white disabled:opacity-50">
              {loading ? 'Analyse…' : 'Capturer le visage'}
            </button>

            <button onClick={handleSave} disabled={loading || !embedding} className="px-4 py-2 rounded-lg bg-green-600 text-white disabled:opacity-50">
              {loading ? 'Sauvegarde…' : 'Sauvegarder'}
            </button>
          </div>
        </div>

        <div className="mt-6 text-sm text-slate-500">
          Conseil: assurez-vous d\'être bien éclairé, face à la caméra, sans lunettes opaques.
        </div>
      </div>
    </div>
  );
}