'use client';

import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase';

export default function AuthPage() {
  const { toast } = useToast();
  const ready = isSupabaseConfigured();
  const supabase = ready ? getSupabaseClient() : null;
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) return;
    (async () => {
      const { data } = await supabase.auth.getUser();
      setUserId(data.user?.id ?? null);
    })();
  }, [supabase]);

  const sendMagicLink = async () => {
    if (!supabase) return;
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin + '/dashboard' } });
      if (error) throw error;
      toast({ title: 'Check your email', description: 'We sent a magic link to sign you in.' });
    } catch (err) {
      toast({ variant: 'destructive', title: 'Sign-in failed', description: err instanceof Error ? err.message : 'Unknown error' });
    } finally {
      setLoading(false);
    }
  };

  const ensureUserRow = async () => {
    if (!supabase) return;
    const { data } = await supabase.auth.getUser();
    const uid = data.user?.id;
    if (!uid) return;
    await supabase
      .from('users')
      .upsert({ id: uid, role: 'public' }, { onConflict: 'id' });
  };

  const signOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setUserId(null);
  };

  useEffect(() => {
    if (!supabase) return;
    const { data: sub } = supabase.auth.onAuthStateChange(async (event) => {
      const { data } = await supabase.auth.getUser();
      setUserId(data.user?.id ?? null);
      if (event === 'SIGNED_IN') {
        await ensureUserRow();
        toast({ title: 'Signed in', description: 'Welcome!' });
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [supabase]);

  return (
    <div className="container mx-auto max-w-md p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Sign In</h1>
      {!ready && (
        <div className="rounded-md border bg-muted/30 p-4 text-sm">
          Supabase is not configured. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to `.env.local`.
        </div>
      )}
      {userId ? (
        <div className="flex items-center justify-between rounded border p-3">
          <div className="text-sm">Signed in as <span className="font-mono">{userId}</span></div>
          <Button variant="outline" size="sm" onClick={signOut}>Sign out</Button>
        </div>
      ) : (
        <div className="space-y-3">
          <Input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Button onClick={sendMagicLink} disabled={!ready || loading || !email}>
            {loading ? 'Sending…' : 'Send Magic Link'}
          </Button>
        </div>
      )}
    </div>
  );
}