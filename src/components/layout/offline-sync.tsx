'use client';

import { useEffect } from 'react';
import { installOnlineSyncListener, processQueueIfPossible } from '@/lib/offline-queue';

export default function OfflineSync() {
  useEffect(() => {
    installOnlineSyncListener();
    // Attempt periodic sync every 60s while online
    const id = setInterval(() => {
      processQueueIfPossible();
    }, 60000);
    // Listen to service worker messages to trigger sync
    const onMessage = (event: MessageEvent) => {
      if (event?.data?.type === 'offline-queue-sync') {
        processQueueIfPossible();
      }
    };
    window.addEventListener('message', onMessage);
    return () => clearInterval(id);
  }, []);
  return null;
}