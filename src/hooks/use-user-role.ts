'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase';

export type UserRole = 'public' | 'volunteer' | 'org' | 'team-member' | null;

export function useUserRole() {
  const [role, setRole] = useState<UserRole>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
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
    let mounted = true;
    (async () => {
      setLoading(true);
      const { data: userResp } = await supabase.auth.getUser();
      const uid = userResp.user?.id || null;
      if (!mounted) return;
      setUserId(uid);
      if (!uid) {
        setRole(null);
        setLoading(false);
        return;
      }
      const { data, error } = await supabase.from('users').select('role').eq('id', uid).limit(1).maybeSingle();
      if (!mounted) return;
      if (error) {
        setRole(null);
      } else {
        setRole((data?.role as UserRole) ?? null);
      }
      setLoading(false);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const uid = session?.user?.id || null;
      setUserId(uid);
      if (!uid) {
        setRole(null);
        return;
      }
      supabase
        .from('users')
        .select('role')
        .eq('id', uid)
        .limit(1)
        .maybeSingle()
        .then(({ data }) => setRole((data?.role as UserRole) ?? null))
        .catch(() => setRole(null));
    });

    return () => {
      sub.subscription.unsubscribe();
      mounted = false;
    };
  }, [supabase]);

  return { role, userId, loading, supabaseReady, isAuthenticated: Boolean(userId) };
}