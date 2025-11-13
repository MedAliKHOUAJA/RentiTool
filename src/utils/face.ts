"use client";

// ❌ AVANT: import * as faceapi from '@vladmandic/face-api';
// ✅ MAINTENANT: Import dynamique pour éviter l'exécution côté serveur

let faceapi: any = null;
let modelsLoaded = false;

// Fonction pour charger face-api.js uniquement côté client
async function getFaceApi() {
  if (typeof window === 'undefined') {
    throw new Error('face-api.js ne peut être utilisé que côté client');
  }
  
  if (!faceapi) {
    faceapi = await import('@vladmandic/face-api');
  }
  
  return faceapi;
}

export async function loadFaceModels(modelPath: string = '/models') {
  if (typeof window === 'undefined') return;
  
  if (modelsLoaded) return;
  
  const api = await getFaceApi();
  
  // Load required models: detector, landmarks, and recognition
  await Promise.all([
    api.nets.ssdMobilenetv1.loadFromUri(modelPath),
    api.nets.faceLandmark68Net.loadFromUri(modelPath),
    api.nets.faceRecognitionNet.loadFromUri(modelPath),
  ]);
  
  modelsLoaded = true;
  console.log('✅ Modèles face-api.js chargés');
}

export async function startCamera(videoEl: HTMLVideoElement): Promise<MediaStream> {
  if (typeof window === 'undefined' || !navigator?.mediaDevices) {
    throw new Error('MediaDevices non disponible');
  }
  
  const stream = await navigator.mediaDevices.getUserMedia({ 
    video: { facingMode: 'user' }, 
    audio: false 
  });
  
  videoEl.srcObject = stream;
  await videoEl.play();
  
  return stream;
}

export function stopCamera(videoEl: HTMLVideoElement) {
  if (typeof window === 'undefined') return;
  
  const stream = videoEl.srcObject as MediaStream | null;
  if (stream) {
    stream.getTracks().forEach((t) => t.stop());
  }
  videoEl.srcObject = null;
}

export async function computeEmbeddingFromVideo(
  videoEl: HTMLVideoElement,
  maxAttempts: number = 20,
  intervalMs: number = 200
): Promise<number[] | null> {
  if (typeof window === 'undefined') return null;
  
  const api = await getFaceApi();
  
  // Try multiple frames to get a stable detection
  for (let i = 0; i < maxAttempts; i++) {
    const detection = await api
      .detectSingleFace(videoEl, new api.SsdMobilenetv1Options({ minConfidence: 0.5 }))
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (detection?.descriptor) {
      // Convert Float32Array to regular array for JSON
      return Array.from(detection.descriptor);
    }
    
    await new Promise((res) => setTimeout(res, intervalMs));
  }
  
  return null;
}

export async function computeEmbeddingFromImage(imgEl: HTMLImageElement): Promise<number[] | null> {
  if (typeof window === 'undefined') return null;
  
  const api = await getFaceApi();
  
  const detection = await api
    .detectSingleFace(imgEl, new api.SsdMobilenetv1Options({ minConfidence: 0.5 }))
    .withFaceLandmarks()
    .withFaceDescriptor();
    
  return detection?.descriptor ? Array.from(detection.descriptor) : null;
}

export function hasMediaDevices(): boolean {
  return typeof window !== 'undefined' && 
         typeof navigator !== 'undefined' && 
         !!navigator.mediaDevices && 
         !!navigator.mediaDevices.getUserMedia;
}