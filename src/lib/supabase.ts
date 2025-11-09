'use client';

import { createClient } from '@supabase/supabase-js';

let supabaseSingleton: ReturnType<typeof createClient> | null = null;

export function getSupabaseClient() {
  if (supabaseSingleton) return supabaseSingleton;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      'Missing Supabase env. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'
    );
  }

  supabaseSingleton = createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });

  return supabaseSingleton;
}

export default getSupabaseClient;

export function isSupabaseConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}