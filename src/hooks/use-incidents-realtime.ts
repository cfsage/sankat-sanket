'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase';

export type Incident = {
  id: string;
  created_at: string;
  reporter_id: string | null;
  status: 'unverified' | 'verified' | 'in_progress' | 'resolved';
  type: 'Flood' | 'Fire' | 'Storm' | 'Earthquake' | 'Landslide' | 'Other';
  description: string | null;
  photo_url: string | null;
  latitude: number;
  longitude: number;
  notify_department?: string | null;
  notify_contact?: string | null;
};

export function useIncidentsRealtime() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const supabaseReady = isSupabaseConfigured();
  const supabaseRef = useRef<ReturnType<typeof getSupabaseClient> | null>(null);

  const supabase = useMemo(() => {
    if (!supabaseReady) return null;
    if (!supabaseRef.current) supabaseRef.current = getSupabaseClient();
    return supabaseRef.current;
  }, [supabaseReady]);

  // Initial fetch
  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('incidents')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) {
        setError(error.message);
      } else {
        setIncidents((data ?? []) as Incident[]);
      }
      setLoading(false);
    })();
  }, [supabase]);

  // Realtime subscription
  useEffect(() => {
    if (!supabase) return;
    const channel = supabase
      .channel('incidents-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'incidents' }, (payload) => {
        setIncidents((prev) => {
          if (payload.eventType === 'INSERT') {
            const newRow = payload.new as Incident;
            const exists = prev.some((i) => i.id === newRow.id);
            return exists ? prev.map((i) => (i.id === newRow.id ? newRow : i)) : [newRow, ...prev];
          }
          if (payload.eventType === 'UPDATE') {
            const newRow = payload.new as Incident;
            return prev.map((i) => (i.id === newRow.id ? newRow : i));
          }
          if (payload.eventType === 'DELETE') {
            const oldRow = payload.old as Incident;
            return prev.filter((i) => i.id !== oldRow.id);
          }
          return prev;
        });
      })
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setError('Realtime subscription error');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  return { incidents, error, loading, supabaseReady };
}