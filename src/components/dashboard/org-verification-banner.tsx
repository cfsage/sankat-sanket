'use client';

import { AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useUserRole } from '@/hooks/use-user-role';
import { useToast } from '@/hooks/use-toast';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase';
import { useMemo } from 'react';

export default function OrgVerificationBanner() {
  const { role, orgVerified } = useUserRole();
  const { toast } = useToast();
  const ready = isSupabaseConfigured();
  const supabase = useMemo(() => (ready ? getSupabaseClient() : null), [ready]);

  if (role !== 'org' || orgVerified === true) return null;

  const requestVerification = async () => {
    if (!supabase) return;
    try {
      const { data: userResp } = await supabase.auth.getUser();
      const uid = userResp.user?.id;
      if (!uid) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('verification_requests')
        .insert({ org_id: uid, status: 'pending' });
      if (error) throw error;
      toast({ title: 'Verification requested', description: 'An admin has been notified.' });
      // Best-effort notify server-side (can hook email provider later)
      try {
        await fetch('/api/notify-admin-verification', { method: 'POST' });
      } catch {}
    } catch (err) {
      toast({ variant: 'destructive', title: 'Request failed', description: err instanceof Error ? err.message : 'Unknown error' });
    }
  };

  return (
    <Card className="border-yellow-300 bg-yellow-50">
      <CardContent className="flex items-center justify-between p-3">
        <div className="flex items-center gap-2 text-yellow-800">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm">Your organization is not verified. You can browse, but managing tasks is disabled until verification.</span>
        </div>
        <Button size="sm" variant="secondary" onClick={requestVerification}>Request verification</Button>
      </CardContent>
    </Card>
  );
}