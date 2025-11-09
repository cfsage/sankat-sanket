import { NextResponse } from 'next/server';

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  // Mask the anon key to avoid leaking secrets in logs
  const mask = (val: string) => (val ? `${val.slice(0, 6)}...${val.slice(-4)}` : '');

  return NextResponse.json({
    hasUrl: Boolean(url),
    hasAnon: Boolean(anon),
    url,
    anonMasked: mask(anon),
  });
}