import { NextResponse } from 'next/server';

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  // Do not return or log any sensitive values; only expose booleans.
  return NextResponse.json({
    hasUrl: Boolean(url),
    hasAnon: Boolean(anon),
  });
}