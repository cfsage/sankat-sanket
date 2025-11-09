'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useUserRole } from '@/hooks/use-user-role';
import CreateTaskModal from './create-task-modal';
import { ClipboardPlus, Users, Siren } from 'lucide-react';

export default function QuickActions() {
  const { role, orgVerified, isAuthenticated } = useUserRole();
  const canCreateTask = isAuthenticated && (role === 'admin' || (role === 'org' && orgVerified === true));
  const showManageLink = isAuthenticated; // hide in guest mode

  return (
    <Card>
      <CardContent className="p-3">
        <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2 sm:gap-3">
          <Link href="/dashboard/report" className="inline-flex items-center w-full sm:w-auto">
            <Button variant="secondary" size="sm" className="gap-2 w-full sm:w-auto">
              <Siren className="h-4 w-4" />
              Report Incident
            </Button>
          </Link>
          {canCreateTask && (
            <CreateTaskModal
              disabled={!canCreateTask}
              trigger={(props) => (
                <Button {...props} size="sm" className="gap-2 w-full sm:w-auto">
                  <ClipboardPlus className="h-4 w-4" />
                  Create Task
                </Button>
              )}
            />
          )}
          {showManageLink && (
            <Link href="/dashboard/profile" className="inline-flex items-center w-full sm:w-auto">
              <Button variant="outline" size="sm" className="gap-2 w-full sm:w-auto">
                <Users className="h-4 w-4" />
                Manage Teams & Profile
              </Button>
            </Link>
          )}
          {!canCreateTask && isAuthenticated && role === 'org' && (
            <span className="text-xs text-muted-foreground">Your organization must be verified by an admin to create tasks.</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}