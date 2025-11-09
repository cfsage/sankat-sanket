'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase';

export type Task = {
  id: string;
  created_at: string;
  incident_id: string;
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  assigned_team_id: string | null;
  title: string | null;
  notes: string | null;
};

export function useTasksRealtime() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const supabaseReady = isSupabaseConfigured();
  const supabaseRef = useRef<ReturnType<typeof getSupabaseClient> | null>(null);

  const supabase = useMemo(() => {
    if (!supabaseReady) return null;
    if (!supabaseRef.current) supabaseRef.current = getSupabaseClient();
    return supabaseRef.current;
  }, [supabaseReady]);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) {
        setError(error.message);
      } else {
        setTasks((data ?? []) as Task[]);
      }
      setLoading(false);
    })();
  }, [supabase]);

  useEffect(() => {
    if (!supabase) return;
    const channel = supabase
      .channel('tasks-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, (payload) => {
        setTasks((prev) => {
          if (payload.eventType === 'INSERT') {
            const newRow = payload.new as Task;
            const exists = prev.some((t) => t.id === newRow.id);
            return exists ? prev.map((t) => (t.id === newRow.id ? newRow : t)) : [newRow, ...prev];
          }
          if (payload.eventType === 'UPDATE') {
            const newRow = payload.new as Task;
            return prev.map((t) => (t.id === newRow.id ? newRow : t));
          }
          if (payload.eventType === 'DELETE') {
            const oldRow = payload.old as Task;
            return prev.filter((t) => t.id !== oldRow.id);
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

  return { tasks, error, loading, supabaseReady };
}