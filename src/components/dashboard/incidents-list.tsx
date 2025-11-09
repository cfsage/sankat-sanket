'use client';

import { useIncidentsRealtime } from '@/hooks/use-incidents-realtime';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase';
import { useUserRole } from '@/hooks/use-user-role';
import CreateTaskModal from './create-task-modal';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';

export default function IncidentsList() {
  const { incidents, loading, error, supabaseReady } = useIncidentsRealtime();
  const { toast } = useToast();
  const { role, orgVerified, isAuthenticated } = useUserRole();
  const canVerify = role === 'volunteer' || role === 'org' || role === 'team-member' || role === 'admin';
  const canCreateTask = isAuthenticated && (role === 'admin' || (role === 'org' && orgVerified === true));
  const [filter, setFilter] = useState<'all' | 'unverified' | 'verified' | 'in_progress' | 'resolved'>('all');
  const [deptFilter, setDeptFilter] = useState<string>('all');

  const matchesDept = (val: any, dept: string) => {
    if (!val) return false;
    if (Array.isArray(val)) return val.includes(dept);
    if (typeof val === 'string') {
      try {
        const arr = JSON.parse(val);
        if (Array.isArray(arr)) return arr.includes(dept);
      } catch {}
      return val.split(',').map((s) => s.trim()).includes(dept);
    }
    return false;
  };

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="text-sm text-muted-foreground">Incidents</div>
          <Select value={filter} onValueChange={(v) => setFilter(v as any)}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="unverified">Unverified</SelectItem>
              <SelectItem value="verified">Verified</SelectItem>
              <SelectItem value="in_progress">In progress</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>
          <Select value={deptFilter} onValueChange={(v) => setDeptFilter(v)}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              <SelectItem value="Admin">Admin</SelectItem>
              <SelectItem value="Verified Organizations">Verified Organizations</SelectItem>
              <SelectItem value="Police">Police</SelectItem>
              <SelectItem value="Fire Brigade">Fire Brigade</SelectItem>
              <SelectItem value="Medical/EMS">Medical/EMS</SelectItem>
              <SelectItem value="Municipal Services">Municipal Services</SelectItem>
              <SelectItem value="Disaster Response">Disaster Response</SelectItem>
              <SelectItem value="NGO">NGO</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      {incidents.length === 0 && (
        <div className="text-sm text-muted-foreground">No incidents yet.</div>
      )}
      {incidents
        .filter((i) => filter === 'all' ? true : i.status === filter)
        .filter((i) => deptFilter === 'all' ? true : matchesDept((i as any).notify_department, deptFilter))
        .map((inc) => (
        <div key={inc.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between rounded border p-3 gap-3">
          <div>
            <div className="font-medium">{inc.type}</div>
            <div className="text-xs text-muted-foreground">
              {inc.status} • Lat {inc.latitude.toFixed(4)}, Lng {inc.longitude.toFixed(4)}
            </div>
            {(inc as any).notify_department && (
              (() => {
                const raw = (inc as any).notify_department;
                let arr: string[] | null = null;
                if (Array.isArray(raw)) arr = raw;
                else if (typeof raw === 'string') {
                  try { const parsed = JSON.parse(raw); if (Array.isArray(parsed)) arr = parsed; } catch {}
                  if (!arr) arr = raw.split(',').map((s: string) => s.trim());
                }
                return (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {(arr ?? []).map((d) => (
                      <Badge key={d} variant="secondary">{d}</Badge>
                    ))}
                  </div>
                );
              })()
            )}
            {(inc as any).notify_contact && (
              <div className="text-xs text-muted-foreground">Contact: {(inc as any).notify_contact}</div>
            )}
          </div>
          <div className="flex items-center gap-2 sm:self-end sm:ml-auto">
            {inc.status === 'unverified' && (
              canVerify ? (
                <Button size="sm" variant="outline" className="w-full sm:w-auto" onClick={() => handleVerify(inc.id)}>
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