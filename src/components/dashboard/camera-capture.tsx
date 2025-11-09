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
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startCamera = async () => {
    setError(null);
    try {
      const media = await navigator.mediaDevices.getUserMedia({
        video: { facingMode },
        audio: false,
      });
      setStream(media);
      setIsActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = media;
        await videoRef.current.play();
      }
    } catch (e) {
      setError('Unable to access camera. Please check permissions.');
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

  const capture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, width, height);
    canvas.toBlob((blob) => {
      if (!blob) return;
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
          {error && <span className="text-sm text-destructive">{error}</span>}
        </div>
      )}
      {isActive && (
        <div className="space-y-2">
          <video ref={videoRef} className="w-full rounded-lg border bg-black" playsInline muted />
          <div className="flex gap-2">
            <Button type="button" onClick={capture} className="flex-1">
              Capture Photo
            </Button>
            <Button type="button" variant="outline" onClick={stopCamera}>
              <CameraOff className="mr-2 h-4 w-4" /> Stop
            </Button>
          </div>
        </div>
      )}
      <canvas ref={canvasRef} className="hidden" />
      {!isActive && stream === null && (
        <Button type="button" variant="ghost" onClick={startCamera} className="hidden md:inline-flex">
          <RefreshCw className="mr-2 h-4 w-4" /> Retry Camera
        </Button>
      )}
    </div>
  );
}