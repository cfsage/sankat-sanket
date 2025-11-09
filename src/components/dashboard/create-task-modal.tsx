'use client';

import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase';
import { useIncidentsRealtime, type Incident } from '@/hooks/use-incidents-realtime';

type Props = {
  onCreated?: () => void;
  disabled?: boolean;
  defaultIncidentId?: string;
  lockIncident?: boolean;
};

export default function CreateTaskModal({ onCreated, disabled, defaultIncidentId, lockIncident }: Props) {
  const { toast } = useToast();
  const ready = isSupabaseConfigured();
  const supabase = useMemo(() => (ready ? getSupabaseClient() : null), [ready]);

  const { incidents, supabaseReady } = useIncidentsRealtime();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [incidentId, setIncidentId] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (defaultIncidentId) {
      setIncidentId(defaultIncidentId);
      return;
    }
    if (!incidentId && incidents.length > 0) {
      setIncidentId(incidents[0].id);
    }
  }, [incidents, defaultIncidentId]);

  const createTask = async () => {
    if (!title.trim()) {
      toast({ variant: 'destructive', title: 'Title required', description: 'Please provide a task title.' });
      return;
    }
    if (!incidentId) {
      toast({ variant: 'destructive', title: 'Incident required', description: 'Please select an incident to link this task.' });
      return;
    }
    if (!supabase) {
      toast({ variant: 'destructive', title: 'Supabase not ready', description: 'Please configure environment variables.' });
      return;
    }
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tasks')
        .insert({ title, notes: notes || null, status: 'pending', incident_id: incidentId })
        .select()
        .single();
      if (error) throw error;
      toast({ title: 'Task created', description: 'New task has been added.' });
      setOpen(false);
      setTitle('');
      setNotes('');
      onCreated?.();
    } catch (err) {
      toast({ variant: 'destructive', title: 'Create failed', description: err instanceof Error ? err.message : 'Unknown error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" disabled={!ready || disabled}>Create Task</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Task</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-2">
            <label className="text-sm">Title</label>
            <Input placeholder="e.g., Deliver supplies to shelter" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm">Notes</label>
            <Textarea placeholder="Optional details or instructions" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm">Linked Incident</label>
            {supabaseReady ? (
              <div>
                <Select value={incidentId} onValueChange={(v) => setIncidentId(v)}>
                  <SelectTrigger disabled={!!lockIncident}>
                    <SelectValue placeholder={incidents.length ? 'Select incident' : 'No incidents available'} />
                  </SelectTrigger>
                  <SelectContent>
                    {incidents.map((i: Incident) => (
                      <SelectItem key={i.id} value={i.id}>
                        {i.type} — {i.description?.slice(0, 32) || 'No description'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {lockIncident && (
                  <div className="mt-1 text-xs text-muted-foreground">Incident is locked for this task.</div>
                )}
              </div>
            ) : (
              <div className="text-xs text-muted-foreground">Supabase not configured.</div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button onClick={createTask} disabled={loading || !title.trim() || !incidentId}>
            {loading ? 'Creating…' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}