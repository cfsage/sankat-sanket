-- Supabase schema and RLS policies
-- Run this in the Supabase SQL editor.

-- Enums
create type incident_status as enum ('unverified','verified','in_progress','resolved');
create type task_status as enum ('pending','assigned','in_progress','completed','cancelled');

-- Users (metadata for roles)
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('public','volunteer','org','team-member')) default 'public',
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

-- Tasks
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  incident_id uuid not null references public.incidents(id) on delete cascade,
  status task_status not null default 'pending',
  assigned_team_id uuid references public.teams(id) on delete set null,
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
      where u.id = auth.uid() and u.role in ('volunteer','org','team-member')
    )
  )
  with check (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role in ('volunteer','org','team-member')
    )
  );

-- Teams policies: org can manage, authenticated can read
create policy "Teams read" on public.teams
  for select to authenticated
  using (true);

create policy "Teams manage by org" on public.teams
  for insert to authenticated
  with check (exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'org'));

create policy "Teams update by org" on public.teams
  for update to authenticated
  using (exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'org'))
  with check (exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'org'));

-- Tasks policies: org manages tasks; authenticated can read
create policy "Tasks read" on public.tasks
  for select to authenticated
  using (true);

create policy "Tasks insert by org" on public.tasks
  for insert to authenticated
  with check (exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'org'));

create policy "Tasks update by org" on public.tasks
  for update to authenticated
  using (exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'org'))
  with check (exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'org'));

-- Notes:
-- - Extend policies for team-members to update tasks assigned to their team when a team membership table exists.
-- - Storage bucket policies for photos should allow public upload to a dedicated bucket with appropriate security.