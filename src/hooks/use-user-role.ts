'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase';

export type UserRole = 'public' | 'volunteer' | 'org' | 'team-member' | 'admin' | null;

export type UserRoleInfo = {
  role: UserRole;
  orgVerified: boolean | null;
};

export function useUserRole() {
  const [role, setRole] = useState<UserRole>(null);
  const [orgVerified, setOrgVerified] = useState<boolean | null>(null);
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
      let data: any = null;
      let error: any = null;
      try {
        const resp = await supabase
          .from('users')
          .select('role, org_verified')
          .eq('id', uid)
          .limit(1)
          .maybeSingle();
        data = resp.data;
        error = resp.error;
        // If the column doesn't exist, fall back to fetching only role to avoid 400s
        if (error && (error.code === '42703' || String(error.message).includes('org_verified'))) {
          const roleOnly = await supabase
            .from('users')
            .select('role')
            .eq('id', uid)
            .limit(1)
            .maybeSingle();
          data = roleOnly.data;
          error = roleOnly.error;
          // eslint-disable-next-line no-console
          console.warn('useUserRole: org_verified column missing; using role-only fallback');
        }
      } catch (err) {
        error = err;
      }
      if (!mounted) return;
      if (error) {
        // Surface useful diagnostics in dev to understand 400s from PostgREST
        // (e.g., missing table, RLS, bad env key, invalid UUID filter, etc.)
        // Do not toast here to avoid UI noise; rely on console for debugging.
        // eslint-disable-next-line no-console
        console.error('useUserRole: failed to fetch user role', {
          message: (error as any)?.message,
          details: (error as any)?.details,
          hint: (error as any)?.hint,
          code: (error as any)?.code,
        });
        setRole(null);
        setOrgVerified(null);
      } else {
        setRole((data?.role as UserRole) ?? null);
        setOrgVerified(typeof data?.org_verified === 'boolean' ? data.org_verified : null);
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
      (async () => {
        try {
          let data: any = null;
          let error: any = null;
          const resp = await supabase
            .from('users')
            .select('role, org_verified')
            .eq('id', uid)
            .limit(1)
            .maybeSingle();
          data = resp.data;
          error = resp.error;
          if (error && (error.code === '42703' || String(error.message).includes('org_verified'))) {
            const roleOnly = await supabase
              .from('users')
              .select('role')
              .eq('id', uid)
              .limit(1)
              .maybeSingle();
            data = roleOnly.data;
            error = roleOnly.error;
            // eslint-disable-next-line no-console
            console.warn('useUserRole: org_verified column missing; using role-only fallback (auth change)');
          }
          if (error) {
            // eslint-disable-next-line no-console
            console.error('useUserRole: failed to fetch user role (auth change)', {
              message: (error as any)?.message,
              details: (error as any)?.details,
              hint: (error as any)?.hint,
              code: (error as any)?.code,
            });
          }
          setRole((data?.role as UserRole) ?? null);
          setOrgVerified(typeof data?.org_verified === 'boolean' ? data.org_verified : null);
        } catch (err) {
          // eslint-disable-next-line no-console
          console.error('useUserRole: unexpected error fetching role', err);
          setRole(null);
          setOrgVerified(null);
        }
      })();
    });

    return () => {
      sub.subscription.unsubscribe();
      mounted = false;
    };
  }, [supabase]);

  return { role, orgVerified, userId, loading, supabaseReady, isAuthenticated: Boolean(userId) };
}