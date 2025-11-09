'use client';

import { useIncidentsRealtime } from '@/hooks/use-incidents-realtime';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase';
import { useUserRole } from '@/hooks/use-user-role';
import CreateTaskModal from './create-task-modal';

export default function IncidentsList() {
  const { incidents, loading, error, supabaseReady } = useIncidentsRealtime();
  const { toast } = useToast();
  const { role } = useUserRole();
  const canVerify = role === 'volunteer' || role === 'org' || role === 'team-member';
  const canCreateTask = role === 'org';

  const handleVerify = async (id: string) => {
    if (!supabaseReady) return;
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from('incidents')
      .update({ status: 'verified' })
      .eq('id', id);
    if (error) {
      toast({ variant: 'destructive', title: 'Verify failed', description: error.message });
    } else {
      toast({ title: 'Incident verified', description: 'Status updated to verified.' });
    }
  };

  if (!supabaseReady) {
    return (
      <div className="rounded-md border bg-muted/30 p-3 text-sm">Supabase is not configured.</div>
    );
  }
  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading incidents…</div>;
  }
  if (error) {
    return <div className="text-sm text-destructive">Error: {error}</div>;
  }

  return (
    <div className="space-y-2">
      {incidents.length === 0 && (
        <div className="text-sm text-muted-foreground">No incidents yet.</div>
      )}
      {incidents.map((inc) => (
        <div key={inc.id} className="flex items-center justify-between rounded border p-3">
          <div>
            <div className="font-medium">{inc.type}</div>
            <div className="text-xs text-muted-foreground">
              {inc.status} • Lat {inc.latitude.toFixed(4)}, Lng {inc.longitude.toFixed(4)}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {inc.status === 'unverified' && (
              canVerify ? (
                <Button size="sm" variant="outline" onClick={() => handleVerify(inc.id)}>
                  Verify
                </Button>
              ) : (
                <div className="text-xs text-muted-foreground">Unverified</div>
              )
            )}
            {canCreateTask && (
              <CreateTaskModal
                disabled={!canCreateTask}
                defaultIncidentId={inc.id}
                lockIncident
                onCreated={() => toast({ title: 'Task created', description: 'Linked to selected incident.' })}
              />
            )}
          </div>
        </div>
      ))}
      {!canVerify && (
        <div className="text-xs text-muted-foreground">You don’t have permission to verify incidents.</div>
      )}
    </div>
  );
}