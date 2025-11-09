'use client';

import { useMemo, useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useIncidentsRealtime } from '@/hooks/use-incidents-realtime';
import dynamic from 'next/dynamic';

type Task = {
  id: string;
  created_at: string;
  incident_id: string;
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  assigned_team_id: string | null;
  title: string | null;
  notes: string | null;
};

type Props = {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const MiniMap = dynamic(() => import('./task-mini-map'), { ssr: false });

export default function TaskDetailsDrawer({ task, open, onOpenChange }: Props) {
  const { incidents } = useIncidentsRealtime();
  const incident = useMemo(() => incidents.find((i) => i.id === task?.incident_id), [incidents, task]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{task?.title ?? 'Task Details'}</SheetTitle>
          <SheetDescription>Review linked incident and context.</SheetDescription>
        </SheetHeader>
        <div className="mt-4 space-y-4">
          <div className="text-sm">
            <div><span className="text-muted-foreground">Status:</span> {task?.status}</div>
            {task?.notes && <div className="mt-1"><span className="text-muted-foreground">Notes:</span> {task.notes}</div>}
          </div>
          {incident ? (
            <div className="space-y-2">
              <div className="text-sm"><span className="text-muted-foreground">Incident:</span> {incident.type}</div>
              {incident.description && <div className="text-xs text-muted-foreground">{incident.description}</div>}
              <div className="h-64 rounded overflow-hidden border">
                <MiniMap latitude={incident.latitude} longitude={incident.longitude} />
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">Linked incident not found.</div>
          )}
          <div className="flex justify-end">
            <Button variant="secondary" onClick={() => onOpenChange(false)}>Close</Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}