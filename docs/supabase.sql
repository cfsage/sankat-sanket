-- Supabase schema and RLS policies
-- Run this in the Supabase SQL editor.

-- Enums
create type incident_status as enum ('unverified','verified','in_progress','resolved');
create type task_status as enum ('pending','assigned','in_progress','completed','cancelled');

-- Users (metadata for roles)
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('public','volunteer','org','team-member','admin')) default 'public',
  org_verified boolean not null default false,
  created_at timestamptz not null default now()
);

-- Teams
create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  org_id uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Optional: contact phone for notifications
do $$ begin
  begin
    alter table public.teams add column contact_phone text;
  exception when duplicate_column then
    null; -- column already exists
  end;
  begin
    alter table public.teams add column department text;
  exception when duplicate_column then
    null;
  end;
end $$;

-- Incidents
create table if not exists public.incidents (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  reporter_id uuid null references public.users(id) on delete set null,
  status incident_status not null default 'unverified',
  type text not null check (type in ('Flood','Fire','Storm','Earthquake','Landslide','Other')),
  description text,
  photo_url text,
  latitude double precision not null,
  longitude double precision not null
);

-- Structured notification fields (idempotent)
do $$ begin
  begin
    alter table public.incidents add column notify_department text;
  exception when duplicate_column then null;
  end;
  begin
    alter table public.incidents add column notify_contact text;
  exception when duplicate_column then null;
  end;
end $$;

-- Tasks
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  incident_id uuid not null references public.incidents(id) on delete cascade,
  status task_status not null default 'pending',
  assigned_team_id uuid references public.teams(id) on delete set null,
  assigned_member_id uuid references public.users(id) on delete set null,
  title text,
  notes text
);

-- Enable RLS
alter table public.users enable row level security;
alter table public.teams enable row level security;
alter table public.incidents enable row level security;
alter table public.tasks enable row level security;

-- Users policies: self read/update
create policy "Users read own" on public.users
  for select to authenticated
  using (id = auth.uid());

create policy "Users update own" on public.users
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- Admin policies: allow admins to read and update any user
create policy "Users admin read all" on public.users
  for select to authenticated
  using (exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin'));

create policy "Users admin update any" on public.users
  for update to authenticated
  using (exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin'))
  with check (true);

-- Incidents policies
-- Allow public and authenticated to read all incidents
create policy "Incidents read all" on public.incidents
  for select to authenticated, anon
  using (true);

-- Allow public and authenticated to insert unverified incidents
create policy "Incidents public insert" on public.incidents
  for insert to authenticated, anon
  with check (
    status = 'unverified' and (reporter_id is null or reporter_id = auth.uid())
  );

-- Allow volunteers/org/team-member to update incidents (e.g., verification/status changes)
create policy "Incidents privileged update" on public.incidents
  for update to authenticated
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role in ('volunteer','org','team-member','admin')
    )
  )
  with check (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role in ('volunteer','org','team-member','admin')
    )
  );

-- Teams policies: org can manage, authenticated can read
create policy "Teams read" on public.teams
  for select to authenticated
  using (true);

create policy "Teams manage by org/admin" on public.teams
  for insert to authenticated
  with check (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and (
        u.role = 'admin' or (u.role = 'org' and u.org_verified = true)
      )
    )
  );

create policy "Teams update by org/admin" on public.teams
  for update to authenticated
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and (
        u.role = 'admin' or (u.role = 'org' and u.org_verified = true)
      )
    )
  )
  with check (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and (
        u.role = 'admin' or (u.role = 'org' and u.org_verified = true)
      )
    )
  );

-- Tasks policies: org manages tasks; authenticated can read
create policy "Tasks read" on public.tasks
  for select to authenticated
  using (true);

create policy "Tasks insert by org/admin" on public.tasks
  for insert to authenticated
  with check (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and (
        u.role = 'admin' or (u.role = 'org' and u.org_verified = true)
      )
    )
  );

create policy "Tasks update by org/admin" on public.tasks
  for update to authenticated
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and (
        u.role = 'admin' or (u.role = 'org' and u.org_verified = true)
      )
    )
  )
  with check (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and (
        u.role = 'admin' or (u.role = 'org' and u.org_verified = true)
      )
    )
  );

-- Allow assigned team members to update tasks assigned to their team or directly to them
create policy "Tasks update by assigned team-member" on public.tasks
  for update to authenticated
  using (
    exists (
      select 1 from public.team_members tm
      where tm.user_id = auth.uid() and tm.team_id = public.tasks.assigned_team_id
    )
    or public.tasks.assigned_member_id = auth.uid()
  )
  with check (
    exists (
      select 1 from public.team_members tm
      where tm.user_id = auth.uid() and tm.team_id = public.tasks.assigned_team_id
    )
    or public.tasks.assigned_member_id = auth.uid()
  );

-- Notes:
-- - Extend policies for team-members to update tasks assigned to their team when a team membership table exists.
-- - Storage bucket policies for photos should allow public upload to a dedicated bucket with appropriate security.

-- Verification Requests
create table if not exists public.verification_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  org_id uuid not null references public.users(id) on delete cascade,
  status text not null check (status in ('pending','approved','rejected')) default 'pending',
  note text
);

alter table public.verification_requests enable row level security;

-- Allow org to insert and view their own requests
create policy "Verification requests insert by org" on public.verification_requests
  for insert to authenticated
  with check (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role = 'org'
    ) and org_id = auth.uid()
  );

create policy "Verification requests read own" on public.verification_requests
  for select to authenticated
  using (org_id = auth.uid());

-- Admin can read, update all requests
create policy "Verification requests admin read all" on public.verification_requests
  for select to authenticated
  using (exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin'));

-- Pledges: resources offered by volunteers/orgs
create type pledge_status as enum ('open','matched','fulfilled','cancelled');

create table if not exists public.pledges (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  pledger_id uuid null references public.users(id) on delete set null,
  name text not null,
  contact text not null,
  contact_number text,
  resource_type text not null check (resource_type in ('Food','Shelter','Transport','Skills')),
  resource_details text not null,
  quantity integer not null check (quantity > 0),
  latitude double precision null,
  longitude double precision null,
  location_accuracy double precision null,
  location_landmark text null,
  status pledge_status not null default 'open'
);

alter table public.pledges enable row level security;

-- Read all pledges (for authenticated users)
create policy "Pledges read all" on public.pledges
  for select to authenticated, anon
  using (true);

-- Allow public and authenticated to insert pledges
create policy "Pledges public insert" on public.pledges
  for insert to authenticated, anon
  with check (true);

-- Allow pledger to update/cancel their own pledge
create policy "Pledges update own" on public.pledges
  for update to authenticated
  using (pledger_id = auth.uid())
  with check (pledger_id = auth.uid());

create policy "Verification requests admin update any" on public.verification_requests
  for update to authenticated
  using (exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin'))
  with check (true);

-- Team Members
create table if not exists public.team_members (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  team_id uuid not null references public.teams(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  role text not null default 'member'
);

alter table public.team_members enable row level security;

-- Team members can read their own memberships
create policy "Team members read own" on public.team_members
  for select to authenticated
  using (user_id = auth.uid());

-- Admin can read all memberships
create policy "Team members admin read all" on public.team_members
  for select to authenticated
  using (exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin'));

-- Org (verified) can manage memberships for teams they own; admin can manage all
create policy "Team members insert by org/admin" on public.team_members
  for insert to authenticated
  with check (
    exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin')
    or exists (
      select 1 from public.users u join public.teams t on t.org_id = u.id
      where u.id = auth.uid() and u.role = 'org' and u.org_verified = true and t.id = public.team_members.team_id
    )
  );

create policy "Team members update by org/admin" on public.team_members
  for update to authenticated
  using (
    exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin')
    or exists (
      select 1 from public.users u join public.teams t on t.org_id = u.id
      where u.id = auth.uid() and u.role = 'org' and u.org_verified = true and t.id = public.team_members.team_id
    )
  )
  with check (
    exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin')
    or exists (
      select 1 from public.users u join public.teams t on t.org_id = u.id
      where u.id = auth.uid() and u.role = 'org' and u.org_verified = true and t.id = public.team_members.team_id
    )
  );

create policy "Team members delete by org/admin" on public.team_members
  for delete to authenticated
  using (
    exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin')
    or exists (
      select 1 from public.users u join public.teams t on t.org_id = u.id
      where u.id = auth.uid() and u.role = 'org' and u.org_verified = true and t.id = public.team_members.team_id
    )
  );