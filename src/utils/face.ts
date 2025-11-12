"use client";

// Use the modern browser-friendly fork to avoid Node-specific deps
import * as faceapi from '@vladmandic/face-api';

let modelsLoaded = false;

export async function loadFaceModels(modelPath: string = '/models') {
  if (modelsLoaded) return;
  // Load required models: detector, landmarks, and recognition
  await Promise.all([
    faceapi.nets.ssdMobilenetv1.loadFromUri(modelPath),
    faceapi.nets.faceLandmark68Net.loadFromUri(modelPath),
    faceapi.nets.faceRecognitionNet.loadFromUri(modelPath),
  ]);
  modelsLoaded = true;
}

export async function startCamera(videoEl: HTMLVideoElement): Promise<MediaStream> {
  const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
  videoEl.srcObject = stream;
  await videoEl.play();
  return stream;
}

export function stopCamera(videoEl: HTMLVideoElement) {
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
  // Try multiple frames to get a stable detection
  for (let i = 0; i < maxAttempts; i++) {
    const detection = await faceapi
      .detectSingleFace(videoEl, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
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
  const detection = await faceapi
    .detectSingleFace(imgEl, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
    .withFaceLandmarks()
    .withFaceDescriptor();
  return detection?.descriptor ? Array.from(detection.descriptor) : null;
}

export function hasMediaDevices(): boolean {
  return typeof navigator !== 'undefined' && !!navigator.mediaDevices && !!navigator.mediaDevices.getUserMedia;
}