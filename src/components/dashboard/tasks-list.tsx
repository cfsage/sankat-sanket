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
  const { role, orgVerified, isAuthenticated } = useUserRole();
  const canManage = isAuthenticated && (role === 'admin' || (role === 'org' && orgVerified === true));
  const [filter, setFilter] = useState<'all' | typeof STATUS[number]>('all');

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="text-sm text-muted-foreground">Tasks</div>
          <Select value={filter} onValueChange={(v) => setFilter(v as any)}>
            <SelectTrigger className="w-full sm:w-[160px]">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {STATUS.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {canManage && (
          <CreateTaskModal disabled={!canManage} onCreated={() => { /* tasks list updates via realtime */ }} />
        )}
      </div>
      {!canManage && (
        <div className="text-xs text-muted-foreground">You don’t have permission to manage tasks. {role === 'org' ? 'Your organization must be verified by an admin.' : 'Contact an org coordinator.'}</div>
      )}
      {tasks.length === 0 && (
        <div className="text-sm text-muted-foreground">No tasks yet.</div>
      )}
      {tasks.filter((t) => filter === 'all' ? true : t.status === filter).map((t) => (
        <div key={t.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between rounded border p-3 gap-3">
          <div>
            <div className="font-medium">{t.title ?? 'Untitled Task'}</div>
            <div className="text-xs text-muted-foreground">Status: {t.status}</div>
            {(t.assigned_team_id || t.assigned_member_id) && (
              <div className="text-xs text-muted-foreground">
                Assigned {t.assigned_team_id ? `team ${t.assigned_team_id}` : ''}{t.assigned_team_id && t.assigned_member_id ? ' • ' : ''}{t.assigned_member_id ? `member ${t.assigned_member_id}` : ''}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 sm:self-end sm:ml-auto">
            {canManage ? (
              <Select value={t.status} onValueChange={(v) => updateStatus(t.id, v as any)}>
                <SelectTrigger className="w-full sm:w-[160px]">
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
            <Button size="sm" variant="ghost" className="w-full sm:w-auto" onClick={() => setSelectedTaskId(t.id)}>View</Button>
          </div>
        </div>
      ))}
      <TaskDetailsDrawer task={selectedTask} open={Boolean(selectedTask)} onOpenChange={(open) => { if (!open) setSelectedTaskId(null); }} />
    </div>
  );
}