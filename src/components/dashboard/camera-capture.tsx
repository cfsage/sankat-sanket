'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, CameraOff, RefreshCw } from 'lucide-react';

type Props = {
  onCapture: (file: File) => void;
  facingMode?: 'environment' | 'user';
};

export default function CameraCapture({ onCapture, facingMode = 'environment' }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const nativeInputRef = useRef<HTMLInputElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supportsMediaDevices = typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;

  const startCamera = async () => {
    setError(null);
    setIsReady(false);
    if (!supportsMediaDevices) {
      setError('Camera API not supported. Using device capture.');
      // Fallback to native device capture input
      nativeInputRef.current?.click();
      return;
    }
    try {
      const media = await navigator.mediaDevices.getUserMedia({
        video: { facingMode },
        audio: false,
      });
      setStream(media);
      setIsActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = media;
        // Ensure metadata is loaded so we have correct dimensions
        try {
          await videoRef.current.play();
        } catch (playErr) {
          console.warn('Video play() failed:', playErr);
        }
        if (videoRef.current.readyState >= 2 && videoRef.current.videoWidth > 0) {
          setIsReady(true);
        } else {
          await new Promise<void>((resolve) => {
            const onMeta = () => {
              setIsReady(true);
              videoRef.current?.removeEventListener('loadedmetadata', onMeta);
              resolve();
            };
            videoRef.current?.addEventListener('loadedmetadata', onMeta, { once: true });
          });
        }
      }
    } catch (e) {
      console.error('getUserMedia error:', e);
      setError('Unable to access camera. Check permissions or use device capture.');
    }
  };

  const stopCamera = () => {
    stream?.getTracks().forEach((t) => t.stop());
    setStream(null);
    setIsActive(false);
  };

  useEffect(() => {
    return () => stopCamera();
  }, []);

  const capture = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    if (!isReady) {
      setError('Camera not ready yet. Please wait a moment.');
      return;
    }

    // Prefer ImageCapture API when available for better quality
    try {
      const track = stream?.getVideoTracks?.()[0];
      // @ts-ignore - ImageCapture may not be typed in TS lib
      const ImageCaptureCtor = (window as any).ImageCapture;
      if (track && ImageCaptureCtor) {
        const ic = new ImageCaptureCtor(track);
        const blob: Blob = await ic.takePhoto();
        const file = new File([blob], `capture-${Date.now()}.jpg`, { type: blob.type || 'image/jpeg' });
        onCapture(file);
        stopCamera();
        return;
      }
    } catch (err) {
      // Fallback to canvas below
    }

    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, width, height);
    canvas.toBlob((blob) => {
      if (!blob) {
        // Fallback if toBlob returns null (some browsers)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
        const byteString = atob(dataUrl.split(',')[1]);
        const mimeString = dataUrl.split(';')[0].split(':')[1];
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
        const fallbackBlob = new Blob([ab], { type: mimeString });
        const file = new File([fallbackBlob], `capture-${Date.now()}.jpg`, { type: mimeString });
        onCapture(file);
        stopCamera();
        return;
      }
      const file = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
      onCapture(file);
      stopCamera();
    }, 'image/jpeg', 0.92);
  };

  return (
    <div className="w-full space-y-3">
      {!isActive && (
        <div className="flex items-center gap-3">
          <Button type="button" variant="secondary" onClick={startCamera}>
            <Camera className="mr-2 h-4 w-4" /> Start Camera
          </Button>
          <Button type="button" variant="outline" onClick={() => nativeInputRef.current?.click()}>
            Use Device Camera
          </Button>
          {error && <span className="text-sm text-destructive">{error}</span>}
        </div>
      )}
      {isActive && (
        <div className="space-y-2">
          <video ref={videoRef} className="w-full rounded-lg border bg-black" playsInline muted />
          <div className="flex gap-2">
            <Button type="button" onClick={capture} className="flex-1" disabled={!isReady}>
              {isReady ? 'Capture Photo' : 'Preparing camera…'}
            </Button>
            <Button type="button" variant="outline" onClick={stopCamera}>
              <CameraOff className="mr-2 h-4 w-4" /> Stop
            </Button>
          </div>
        </div>
      )}
      <canvas ref={canvasRef} className="hidden" />
      {/* Native device capture fallback */}
      <input
        ref={nativeInputRef}
        type="file"
        accept="image/*"
        capture={facingMode}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            onCapture(file);
          }
        }}
      />
      {!isActive && stream === null && (
        <Button type="button" variant="ghost" onClick={startCamera} className="hidden md:inline-flex">
          <RefreshCw className="mr-2 h-4 w-4" /> Retry Camera
        </Button>
      )}
    </div>
  );
}