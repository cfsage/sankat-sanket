import { NextRequest, NextResponse } from 'next/server';

// Twilio envs
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_FROM_NUMBER = process.env.TWILIO_FROM_NUMBER;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function fetchTeamPhone(teamId: string): Promise<string | null> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return null;
  const res = await fetch(`${SUPABASE_URL}/rest/v1/teams?id=eq.${teamId}&select=contact_phone`, {
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      Accept: 'application/json',
    },
  });
  if (!res.ok) return null;
  const data = await res.json();
  if (Array.isArray(data) && data.length && data[0].contact_phone) return data[0].contact_phone as string;
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { taskId, teamId, phone, message } = body || {};

    if (!taskId || !teamId) {
      return NextResponse.json({ error: 'taskId and teamId required' }, { status: 400 });
    }

    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_FROM_NUMBER) {
      // Graceful no-op: acknowledge request without sending SMS
      return NextResponse.json({ ok: false, message: 'Twilio not configured; notification skipped' });
    }

    const toPhone = phone || (await fetchTeamPhone(teamId));
    if (!toPhone) {
      return NextResponse.json({ error: 'Recipient phone not available' }, { status: 400 });
    }

    const smsBody = message || `Task ${taskId} assigned to your team.`;

    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
    const params = new URLSearchParams();
    params.append('To', toPhone);
    params.append('From', TWILIO_FROM_NUMBER);
    params.append('Body', smsBody);

    const resp = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: 'Basic ' + Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64'),
      },
      body: params.toString(),
    });

    if (!resp.ok) {
      const text = await resp.text();
      return NextResponse.json({ error: 'Twilio send failed', detail: text }, { status: 502 });
    }

    const json = await resp.json();
    return NextResponse.json({ ok: true, sid: json.sid });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}