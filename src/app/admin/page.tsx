'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase';
import { useUserRole } from '@/hooks/use-user-role';

type OrgUser = {
  id: string;
  created_at: string;
  org_verified: boolean | null;
};

type Team = {
  id: string;
  name: string;
  org_id: string | null;
  contact_phone: string | null;
};

export default function AdminPage() {
  const { role } = useUserRole();
  const { toast } = useToast();
  const ready = isSupabaseConfigured();
  const supabaseRef = useRef<ReturnType<typeof getSupabaseClient> | null>(null);
  const supabase = useMemo(() => {
    if (!ready) return null;
    if (!supabaseRef.current) supabaseRef.current = getSupabaseClient();
    return supabaseRef.current;
  }, [ready]);

  const [orgs, setOrgs] = useState<OrgUser[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      let usersData: any[] | null = null;
      let usersErr: any = null;
      try {
        const resp = await supabase
          .from('users')
          .select('id, created_at, org_verified')
          .eq('role', 'org')
          .order('created_at', { ascending: false })
          .limit(200);
        usersData = resp.data;
        usersErr = resp.error;
        if (usersErr && (usersErr.code === '42703' || String(usersErr.message).includes('org_verified'))) {
          const fallback = await supabase
            .from('users')
            .select('id, created_at')
            .eq('role', 'org')
            .order('created_at', { ascending: false })
            .limit(200);
          usersData = fallback.data;
          usersErr = fallback.error;
          // eslint-disable-next-line no-console
          console.warn('AdminPage: org_verified column missing; using fallback without verification flag');
        }
      } catch (err) {
        usersErr = err;
      }
      if (usersErr) throw usersErr;
      const orgUsers = ((usersData ?? []) as any[]).map((u) => ({
        id: u.id,
        created_at: u.created_at,
        org_verified: typeof u.org_verified === 'boolean' ? u.org_verified : null,
      })) as OrgUser[];
      setOrgs(orgUsers);
      const orgIds = orgUsers.map((u) => u.id);
      if (orgIds.length) {
        const { data: teamData } = await supabase
          .from('teams')
          .select('id, name, org_id, contact_phone')
          .in('org_id', orgIds)
          .limit(500);
        setTeams((teamData ?? []) as Team[]);
      } else {
        setTeams([]);
      }
    } catch (err) {
      toast({ variant: 'destructive', title: 'Failed to load data', description: err instanceof Error ? err.message : 'Unknown error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (supabase && role === 'admin') loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase, role]);

  const verifyOrg = async (id: string, flag: boolean) => {
    if (!supabase) return;
    try {
      const { error } = await supabase.from('users').update({ org_verified: flag }).eq('id', id);
      if (error) {
        if ((error as any)?.code === '42703' || String((error as any)?.message).includes('org_verified')) {
          toast({ variant: 'destructive', title: 'Verification unavailable', description: 'The org_verified column is missing in your Supabase schema. Run the migration in docs/supabase.sql.' });
          return;
        }
        throw error;
      }
      setOrgs((prev) => prev.map((o) => (o.id === id ? { ...o, org_verified: flag } : o)));
      toast({ title: flag ? 'Organization verified' : 'Organization unverified' });
    } catch (err) {
      toast({ variant: 'destructive', title: 'Verification failed', description: err instanceof Error ? err.message : 'Unknown error' });
    }
  };

  if (role !== 'admin') {
    return (
      <div className="container mx-auto max-w-3xl p-6">
        <Card>
          <CardHeader>
            <CardTitle>Access denied</CardTitle>
          </CardHeader>
          <CardContent>
            You need admin privileges to view this page.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-5xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Admin — Verify Organizations</h1>
        <Button variant="outline" onClick={loadData} disabled={loading}>{loading ? 'Refreshing…' : 'Refresh'}</Button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {orgs.map((org) => {
          const orgTeams = teams.filter((t) => t.org_id === org.id);
          const primaryTeam = orgTeams[0] ?? null;
          const verifiedFlag = org.org_verified === true;
          return (
            <Card key={org.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{primaryTeam?.name ?? 'Organization'}</span>
                  <span className="text-sm font-normal text-muted-foreground">{org.id}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm text-muted-foreground">Created: {new Date(org.created_at).toLocaleString()}</div>
                {primaryTeam?.contact_phone && (
                  <div className="text-sm">Contact: {primaryTeam.contact_phone}</div>
                )}
                <div className="border rounded-md p-3">
                  <div className="text-sm font-medium mb-2">Teams ({orgTeams.length})</div>
                  {orgTeams.length ? (
                    <ul className="space-y-1">
                      {orgTeams.map((t) => (
                        <li key={t.id} className="text-sm flex items-center justify-between">
                          <span>{t.name}</span>
                          {t.contact_phone && (
                            <span className="text-muted-foreground">{t.contact_phone}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-sm text-muted-foreground">No teams created yet.</div>
                  )}
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <span className={verifiedFlag ? 'text-green-600' : 'text-yellow-600'}>
                    {verifiedFlag ? 'Verified' : 'Pending verification'}
                  </span>
                  {verifiedFlag ? (
                    <Button variant="secondary" size="sm" onClick={() => verifyOrg(org.id, false)}>Unverify</Button>
                  ) : (
                    <Button size="sm" onClick={() => verifyOrg(org.id, true)}>Verify</Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
        {orgs.length === 0 && (
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">No organizations found.</CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}