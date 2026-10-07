import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// CORS headers for Android & web clients
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET() {
  return NextResponse.json(
    { status: 'online', service: 'CloudStream Ingestion API' },
    { headers: corsHeaders }
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { deviceId, provider, event, data, timestamp } = body;

    if (!deviceId || !provider || !event) {
      return NextResponse.json(
        { error: 'Missing required fields (deviceId, provider, event)' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Extract Geographic metadata from Vercel / Cloudflare headers
    const country =
      req.headers.get('x-vercel-ip-country') ||
      req.headers.get('cf-ipcountry') ||
      'Unknown';
    const city =
      req.headers.get('x-vercel-ip-city') ||
      'Unknown';

    const currentTitle = data?.title || data?.name || null;
    const nowIso = new Date().toISOString();

    // 1. Upsert Active Session for Live Presence
    const { error: sessionError } = await supabaseAdmin
      .from('active_sessions')
      .upsert(
        {
          device_id: deviceId,
          provider: provider,
          current_title: currentTitle,
          current_action: event,
          country: country,
          city: city,
          last_active: nowIso,
        },
        { onConflict: 'device_id' }
      );

    if (sessionError) {
      console.error('[Telemetry] Session upsert error:', sessionError);
    }

    // 2. Insert into Historical Telemetry Events
    const { error: eventError } = await supabaseAdmin
      .from('telemetry_events')
      .insert({
        device_id: deviceId,
        provider: provider,
        event_type: event,
        metadata: data || {},
        country: country,
        city: city,
        created_at: nowIso,
      });

    if (eventError) {
      console.error('[Telemetry] Event insert error:', eventError);
    }

    return NextResponse.json(
      { success: true, receivedAt: Date.now() },
      { status: 200, headers: corsHeaders }
    );
  } catch (error: any) {
    console.error('[Telemetry] Ingestion exception:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error?.message },
      { status: 500, headers: corsHeaders }
    );
  }
}
