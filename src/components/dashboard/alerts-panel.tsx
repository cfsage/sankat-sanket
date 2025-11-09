'use client';

import { useMemo, useState } from 'react';
import { useIncidentsRealtime } from '@/hooks/use-incidents-realtime';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Bell, AlertTriangle } from 'lucide-react';
import { registerPush } from '@/lib/push';

function isUrgent(inc: { type: any; status: any }) {
  const highTypes = new Set(['Fire', 'Earthquake', 'Flood']);
  return (highTypes.has(inc.type) || inc.status === 'in_progress') && inc.status !== 'resolved';
}

export default function AlertsPanel() {
  const { incidents, supabaseReady, loading, error } = useIncidentsRealtime();
  const [urgentOnly, setUrgentOnly] = useState<boolean>(true);
  const [deptFilter, setDeptFilter] = useState<string>('all');
  const { toast } = useToast();

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

  const shown = useMemo(() => {
    const base = urgentOnly ? incidents.filter(isUrgent) : incidents;
    const filtered = deptFilter === 'all' ? base : base.filter((i: any) => matchesDept(i.notify_department, deptFilter));
    return filtered.slice(0, 20);
  }, [incidents, urgentOnly, deptFilter]);

  const handleEnablePush = async () => {
    const ok = await registerPush();
    if (ok) {
      toast({ title: 'Push enabled', description: 'You will receive browser alerts.' });
    } else {
      toast({ variant: 'destructive', title: 'Push not available', description: 'Check HTTPS and VAPID key config.' });
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <span>Realtime Alerts</span>
          {supabaseReady ? (
            <Badge variant="secondary">Live</Badge>
          ) : (
            <Badge variant="outline">Demo</Badge>
          )}
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <label className="flex items-center gap-1 text-xs">
            <input type="checkbox" checked={urgentOnly} onChange={(e) => setUrgentOnly(e.target.checked)} />
            Urgent only
          </label>
          <Select value={deptFilter} onValueChange={(v) => setDeptFilter(v)}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
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
          <Button size="sm" variant="secondary" onClick={handleEnablePush} className="w-full sm:w-auto">
            <Bell className="h-4 w-4 mr-1" /> Enable Push
          </Button>
        </div>
      </div>

      {loading && <div className="text-xs text-muted-foreground">Loading alerts…</div>}
      {error && <div className="text-xs text-destructive">{error}</div>}

      <ul className="divide-y rounded border bg-muted/20">
        {shown.length === 0 && (
          <li className="p-3 text-xs text-muted-foreground">No alerts.</li>
        )}
        {shown.map((i) => (
          <li key={i.id} className="p-3 text-sm flex items-center justify-between">
            <div>
              <div className="font-medium">{i.type}</div>
              <div className="text-xs text-muted-foreground">{i.status} · {new Date(i.created_at).toLocaleString()}</div>
              {(i as any).notify_department && (
                (() => {
                  const raw = (i as any).notify_department;
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
            </div>
            {isUrgent(i) ? (
              <Badge className="bg-destructive text-destructive-foreground">Urgent</Badge>
            ) : (
              <Badge variant="outline">General</Badge>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}