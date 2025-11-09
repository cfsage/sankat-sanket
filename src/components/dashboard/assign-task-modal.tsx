'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase';

type Props = {
  taskId: string;
  onAssigned?: () => void;
  disabled?: boolean;
};

type Team = { id: string; name: string };

export default function AssignTaskModal({ taskId, onAssigned, disabled }: Props) {
  const { toast } = useToast();
  const ready = isSupabaseConfigured();
  const supabase = ready ? getSupabaseClient() : null;
  const [open, setOpen] = useState(false);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    (async () => {
      const { data, error } = await supabase.from('teams').select('id, name').order('name');
      if (error) {
        toast({ variant: 'destructive', title: 'Load teams failed', description: error.message });
      } else {
        setTeams((data ?? []) as Team[]);
      }
    })();
  }, [supabase]);

  const assign = async () => {
    if (!supabase || !selectedTeam) return;
    try {
      setLoading(true);
      const { error } = await supabase
        .from('tasks')
        .update({ status: 'assigned', assigned_team_id: selectedTeam })
        .eq('id', taskId);
      if (error) throw error;
      // Attempt to notify team via API (best-effort)
      try {
        await fetch('/api/notify-assignment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ taskId, teamId: selectedTeam }),
        });
      } catch (e) {
        // silently ignore notification failures but keep UX responsive
      }
      toast({ title: 'Task assigned', description: 'Team assignment updated.' });
      setOpen(false);
      onAssigned?.();
    } catch (err) {
      toast({ variant: 'destructive', title: 'Assign failed', description: err instanceof Error ? err.message : 'Unknown error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="secondary" disabled={!ready || disabled}>
          Assign
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Task to Team</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <label className="text-sm">Team</label>
          <Select value={selectedTeam} onValueChange={(v) => setSelectedTeam(v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select team" />
            </SelectTrigger>
            <SelectContent>
              {teams.map((t) => (
                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button onClick={assign} disabled={!selectedTeam || loading}>
            {loading ? 'Assigning…' : 'Assign'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}