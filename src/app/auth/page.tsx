'use client';

import { useEffect, useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type DesiredRole = 'volunteer' | 'org';

const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? '')
  .split(',')
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

const LS_KEYS = {
  role: 'onboarding.role',
  orgName: 'onboarding.orgName',
  phone: 'onboarding.phone',
  skills: 'onboarding.skills',
} as const;

const stripToNepalDigits = (value: string) => value.replace(/[^\d+]/g, '');
const ensurePrefix = (value: string) => (value.startsWith('+977') ? value : `+977${value.startsWith('+') ? value.replace(/^\+/, '') : value}`);
const formatNepalPhonePartial = (value: string) => {
  let v = stripToNepalDigits(value);
  v = ensurePrefix(v);
  const rest = v.replace(/^\+977/, '');
  const digits = rest.replace(/\D/g, '').slice(0, 10);
  if (!digits) return '+977 ';
  if (digits.startsWith('9')) {
    const p1 = digits.slice(0, 3);
    const p2 = digits.slice(3, 6);
    const p3 = digits.slice(6, 10);
    return `+977 ${p1}${p2 ? ' ' + p2 : ''}${p3 ? ' ' + p3 : ''}`.trimEnd();
  }
  if (digits.startsWith('1')) {
    const p1 = digits.slice(0, 1);
    const p2 = digits.slice(1, 4);
    const p3 = digits.slice(4, 8);
    return `+977 ${p1}${p2 ? ' ' + p2 : ''}${p3 ? ' ' + p3 : ''}`.trimEnd();
  }
  const p1 = digits.slice(0, 2);
  const p2 = digits.slice(2, 5);
  const p3 = digits.slice(5, 8);
  return `+977 ${p1}${p2 ? ' ' + p2 : ''}${p3 ? ' ' + p3 : ''}`.trimEnd();
};

export default function AuthPage() {
  const { toast } = useToast();
  const ready = isSupabaseConfigured();
  const supabase = ready ? getSupabaseClient() : null;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [desiredRole, setDesiredRole] = useState<DesiredRole>('volunteer');
  const [orgName, setOrgName] = useState('');
  const [phone, setPhone] = useState('');
  const [skills, setSkills] = useState('');

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
      // Persist onboarding selections so we can apply them post-signin
      localStorage.setItem(LS_KEYS.role, desiredRole);
      localStorage.setItem(LS_KEYS.orgName, orgName);
      localStorage.setItem(LS_KEYS.phone, phone);
      localStorage.setItem(LS_KEYS.skills, skills);
      const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin + '/dashboard' } });
      if (error) throw error;
      toast({ title: 'Check your email', description: 'We sent a magic link to sign you in.' });
    } catch (err) {
      toast({ variant: 'destructive', title: 'Sign-in failed', description: err instanceof Error ? err.message : 'Unknown error' });
    } finally {
      setLoading(false);
    }
  };

  const signInWithPassword = async () => {
    if (!supabase) return;
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast({ title: 'Signed in', description: 'Welcome back!' });
    } catch (err) {
      toast({ variant: 'destructive', title: 'Sign-in failed', description: err instanceof Error ? err.message : 'Unknown error' });
    } finally {
      setLoading(false);
    }
  };

  const signUpWithPassword = async () => {
    if (!supabase) return;
    try {
      setLoading(true);
      // Persist onboarding selections so we can apply them post-signup
      localStorage.setItem(LS_KEYS.role, desiredRole);
      localStorage.setItem(LS_KEYS.orgName, orgName);
      localStorage.setItem(LS_KEYS.phone, phone);
      localStorage.setItem(LS_KEYS.skills, skills);
      const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin + '/dashboard' } });
      if (error) throw error;
      toast({ title: 'Account created', description: 'You can sign in now.' });
    } catch (err) {
      toast({ variant: 'destructive', title: 'Sign-up failed', description: err instanceof Error ? err.message : 'Unknown error' });
    } finally {
      setLoading(false);
    }
  };

  const ensureUserRow = async () => {
    if (!supabase) return;
    const { data } = await supabase.auth.getUser();
    const uid = data.user?.id;
    const userEmail = (data.user?.email as string | null)?.toLowerCase() ?? null;
    if (!uid) return;
    const savedRole = (localStorage.getItem(LS_KEYS.role) as DesiredRole | null) ?? null;
    const nextRole: DesiredRole | 'public' | 'admin' =
      userEmail && ADMIN_EMAILS.includes(userEmail) ? 'admin' : (savedRole ?? 'public');
    await supabase.from('users').upsert({ id: uid, role: nextRole }, { onConflict: 'id' });
    // If org, attempt to create a default team with contact phone
    if (nextRole === 'org') {
      const savedOrgName = localStorage.getItem(LS_KEYS.orgName) || '';
      const savedPhone = localStorage.getItem(LS_KEYS.phone) || '';
      if (savedOrgName) {
        await supabase.from('teams').insert({ name: savedOrgName, org_id: uid, contact_phone: savedPhone || null }).catch(() => {});
      }
    }
    // Clear onboarding cache
    localStorage.removeItem(LS_KEYS.role);
    localStorage.removeItem(LS_KEYS.orgName);
    localStorage.removeItem(LS_KEYS.phone);
    localStorage.removeItem(LS_KEYS.skills);
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
      <h1 className="text-2xl font-semibold">Sign In / Sign Up</h1>
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
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Button variant={mode === 'signin' ? 'default' : 'outline'} size="sm" onClick={() => setMode('signin')}>Sign In</Button>
            <Button variant={mode === 'signup' ? 'default' : 'outline'} size="sm" onClick={() => setMode('signup')}>Sign Up</Button>
          </div>
          <Input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />

          <div className="grid grid-cols-1 gap-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Register as</label>
              <Select value={desiredRole} onValueChange={(v) => setDesiredRole(v as DesiredRole)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="volunteer">Volunteer</SelectItem>
                  <SelectItem value="org">Organization</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {desiredRole === 'org' ? (
              <div className="space-y-2">
                <label className="text-sm font-medium">Organization Name</label>
                <Input placeholder="e.g., Community Relief Network" value={orgName} onChange={(e) => setOrgName(e.target.value)} />
                <label className="text-sm font-medium">Contact Phone</label>
                <Input
                  type="tel"
                  inputMode="tel"
                  placeholder="e.g., +977 1 234 5678 or +977 980 123 4567"
                  value={phone}
                  onChange={(e) => setPhone(formatNepalPhonePartial(e.target.value))}
                  onFocus={() => { if (!phone) setPhone('+977 '); }}
                />
              </div>
            ) : (
              <div className="space-y-2">
                <label className="text-sm font-medium">Contact Phone</label>
                <Input
                  type="tel"
                  inputMode="tel"
                  placeholder="e.g., +977 980 123 4567"
                  value={phone}
                  onChange={(e) => setPhone(formatNepalPhonePartial(e.target.value))}
                  onFocus={() => { if (!phone) setPhone('+977 '); }}
                />
                <label className="text-sm font-medium">Skills / Notes</label>
                <Input placeholder="e.g., First aid, search & rescue" value={skills} onChange={(e) => setSkills(e.target.value)} />
              </div>
            )}
          </div>

          {mode === 'signin' ? (
            <Button onClick={signInWithPassword} disabled={!ready || loading || !email || !password}>
              {loading ? 'Signing in…' : 'Sign In with Password'}
            </Button>
          ) : (
            <Button onClick={signUpWithPassword} disabled={!ready || loading || !email || !password}>
              {loading ? 'Creating…' : 'Sign Up with Password'}
            </Button>
          )}
          <div className="text-xs text-muted-foreground">Prefer email link? <button className="underline" onClick={sendMagicLink}>Send magic link</button></div>
        </div>
      )}
    </div>
  );
}