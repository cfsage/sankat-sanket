# Sankat Sanket

From a voice in the dark — to a task in a hand.

This is a Next.js application for community-driven climate resilience.

To get started, open `src/app/page.tsx` and `http://localhost:9002/`.

## Supabase Setup

1. Environment variables
   - Create a `.env.local` in the project root with:
     - `NEXT_PUBLIC_SUPABASE_URL=your-project-url`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key`
     - Optional server-side: `SUPABASE_SERVICE_ROLE_KEY=your-service-role-key` (used by notification API)
     - Optional Twilio: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER`

2. Install dependencies
   - `npm install @supabase/supabase-js`

3. Database schema & RLS policies
   - In the Supabase dashboard → SQL editor, copy and run `docs/supabase.sql`.
   - This creates `users`, `teams`, `incidents`, and `tasks` tables with row-level security policies.

4. Storage bucket (optional)
   - Create a bucket `incident-photos` and configure storage policies to allow uploads for public reporting use cases.

 5. Using the client
   - Import `getSupabaseClient` from `src/lib/supabase.ts` in your components or pages.
   - Example:
     ```ts
     import { getSupabaseClient } from '@/lib/supabase';
     const supabase = getSupabaseClient();
     ```

 6. Auth & roles
   - On first login, insert a row in `public.users` with the user’s `id` and desired `role` (`public`, `volunteer`, `org`, `team-member`).
   - RLS policies rely on `auth.uid()` and `public.users.role` to gate actions.
   - Task creation is client-side via Supabase with RLS, so only `org` can create and manage tasks.

7. Storage policies (incident photos)
   - Create a bucket `incident-photos` and add a policy that allows authenticated users to upload and read images; optionally allow public read for demo purposes.
   - Example policy (adjust to your requirements):
     - Insert: authenticated users can upload to `incident-photos/*`.
     - Select: public read or authenticated read depending on privacy needs.

8. Map tiles configuration
   - Set `NEXT_PUBLIC_MAP_TILES_URL` to your preferred tile provider; components fall back to OpenStreetMap when unset.
   - `LiveMap`, `TaskMiniMap`, and `MapPicker` respect this env for consistency.
