'use client';

import { useEffect, useState } from 'react';
import { getQueueCount, getLastSyncInfo, LastSyncInfo } from '@/lib/offline-queue';

export default function OfflineStatus() {
  const [count, setCount] = useState<number>(0);
  const [lastSync, setLastSync] = useState<LastSyncInfo>(null);

  const refresh = () => {
    try {
      setCount(getQueueCount());
      setLastSync(getLastSyncInfo());
    } catch {}
  };

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 5000);
    const onMessage = (event: MessageEvent) => {
      if (event?.data?.type === 'offline-queue-sync') {
        setTimeout(refresh, 1000);
      }
    };
    window.addEventListener('message', onMessage);
    return () => {
      clearInterval(id);
      window.removeEventListener('message', onMessage);
    };
  }, []);

  const ts = lastSync?.timestamp ? new Date(lastSync.timestamp) : null;
  const tsStr = ts ? `${ts.toLocaleDateString()} ${ts.toLocaleTimeString()}` : '—';
  const tsTimeStr = ts ? ts.toLocaleTimeString() : '—';

  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 z-[1000] text-xs">
      <div className="rounded-md border bg-background/90 backdrop-blur px-3 py-1 shadow max-w-[90vw]">
        <div className="flex items-center gap-2 whitespace-nowrap overflow-hidden">
          <span className="font-medium">Offline Sync</span>
          <span>•</span>
          <span>Q: {count}</span>
          <span>•</span>
          <span>Last: {tsTimeStr}</span>
          {lastSync && (lastSync.errors > 0 || lastSync.processed > 0) && (
            <>
              <span>•</span>
              <span className="text-muted-foreground">Proc: {lastSync.processed}</span>
              {lastSync.errors > 0 && (
                <>
                  <span>•</span>
                  <span className="text-muted-foreground">Err: {lastSync.errors}</span>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
