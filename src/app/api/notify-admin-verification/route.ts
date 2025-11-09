import { NextResponse } from 'next/server';

export async function POST() {
  const admins = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(',').map(s => s.trim()).filter(Boolean) ?? [];
  // TODO: integrate real email provider or Supabase function to notify admins
  console.log('[notify-admin-verification] New verification request. Notify admins:', admins);
  return NextResponse.json({ ok: true });
}