"use client";

import React from "react";

export default function RegisterSW() {
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;
    const swUrl = '/sw.js';
    const register = async () => {
      try {
        const reg = await navigator.serviceWorker.register(swUrl);
        console.info('Service worker registered:', reg.scope);
        // Optional: register background sync events if supported
        // One-off sync on connectivity changes
        // @ts-ignore
        if (reg.sync && typeof reg.sync.register === 'function') {
          try { /* @ts-ignore */ await reg.sync.register('offline-queue-sync'); } catch {}
        }
        // Periodic sync (not widely supported)
        // @ts-ignore
        if (reg.periodicSync && typeof reg.periodicSync.register === 'function') {
          try { /* @ts-ignore */ await reg.periodicSync.register('offline-queue-periodic', { minInterval: 60 * 60 * 1000 }); } catch {}
        }
      } catch (e) {
        console.warn('Service worker registration failed:', e);
      }
    };
    register();
  }, []);
  return null;
}