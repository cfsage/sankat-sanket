'use client';

import { useTasksRealtime } from '@/hooks/use-tasks-realtime';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase';
import AssignTaskModal from './assign-task-modal';
import CreateTaskModal from './create-task-modal';
import TaskDetailsDrawer from './task-details-drawer';
import { useState } from 'react';
import { useUserRole } from '@/hooks/use-user-role';

const STATUS: Array<'pending'|'assigned'|'in_progress'|'completed'|'cancelled'> = ['pending','assigned','in_progress','completed','cancelled'];

export default function TasksList() {
  const { tasks, loading, error, supabaseReady } = useTasksRealtime();
  const { toast } = useToast();
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const selectedTask = tasks.find((t) => t.id === selectedTaskId) ?? null;
  const { role } = useUserRole();
  const canManage = role === 'org';

  const updateStatus = async (id: string, status: (typeof STATUS)[number]) => {
    if (!supabaseReady) return;
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from('tasks')
      .update({ status })
      .eq('id', id);
    if (error) {
      toast({ variant: 'destructive', title: 'Update failed', description: error.message });
    } else {
      toast({ title: 'Task updated', description: `Status set to ${status}.` });
    }
  };

  if (!supabaseReady) {
    return <div className="rounded-md border bg-muted/30 p-3 text-sm">Supabase is not configured.</div>;
  }
  if (loading) return <div className="text-sm text-muted-foreground">Loading tasks…</div>;
  if (error) return <div className="text-sm text-destructive">Error: {error}</div>;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">Realtime tasks</div>
        <CreateTaskModal disabled={!canManage} onCreated={() => { /* tasks list updates via realtime */ }} />
      </div>
      {!canManage && (
        <div className="text-xs text-muted-foreground">You don’t have permission to manage tasks. Contact an org coordinator.</div>
      )}
      {tasks.length === 0 && (
        <div className="text-sm text-muted-foreground">No tasks yet.</div>
      )}
      {tasks.map((t) => (
        <div key={t.id} className="flex items-center justify-between rounded border p-3">
          <div>
            <div className="font-medium">{t.title ?? 'Untitled Task'}</div>
            <div className="text-xs text-muted-foreground">Status: {t.status}</div>
          </div>
          <div className="flex items-center gap-2">
            {canManage ? (
              <Select value={t.status} onValueChange={(v) => updateStatus(t.id, v as any)}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="text-xs text-muted-foreground">Status: {t.status}</div>
            )}
            <AssignTaskModal taskId={t.id} disabled={!canManage} />
            <Button size="sm" variant="ghost" onClick={() => setSelectedTaskId(t.id)}>View</Button>
          </div>
        </div>
      ))}
      <TaskDetailsDrawer task={selectedTask} open={Boolean(selectedTask)} onOpenChange={(open) => { if (!open) setSelectedTaskId(null); }} />
    </div>
  );
}