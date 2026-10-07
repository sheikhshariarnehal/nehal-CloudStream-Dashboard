import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayStartIso = todayStart.toISOString();

    // 1. Fetch Live Active Sessions (freshness window = last 2 minutes)
    const { data: liveSessions, error: liveError } = await supabaseAdmin
      .from('active_sessions')
      .select('*')
      .gte('last_active', twoMinutesAgo)
      .order('last_active', { ascending: false });

    // 2. Fetch Today's Event Aggregations
    const { data: todayEvents, error: eventsError } = await supabaseAdmin
      .from('telemetry_events')
      .select('id, provider, event_type, metadata, created_at, country, city')
      .gte('created_at', todayStartIso)
      .order('created_at', { ascending: false })
      .limit(100);

    // 3. Aggregate Metrics
    const totalLiveUsers = liveSessions?.length || 0;
    
    let totalSearchesToday = 0;
    let totalPlaysToday = 0;
    let totalErrorsToday = 0;
    const providerCounts: Record<string, number> = {};
    const searchQueries: Array<{ query: string; count: number; lastSeen: string }> = [];
    const searchMap: Record<string, { count: number; lastSeen: string }> = {};

    todayEvents?.forEach((event) => {
      // Provider popularity
      providerCounts[event.provider] = (providerCounts[event.provider] || 0) + 1;

      if (event.event_type === 'search') {
        totalSearchesToday++;
        const q = event.metadata?.query?.trim();
        if (q) {
          if (!searchMap[q]) {
            searchMap[q] = { count: 0, lastSeen: event.created_at };
          }
          searchMap[q].count++;
        }
      } else if (event.event_type === 'play') {
        totalPlaysToday++;
      } else if (event.event_type === 'error') {
        totalErrorsToday++;
      }
    });

    const topSearches = Object.entries(searchMap)
      .map(([query, data]) => ({ query, count: data.count, lastSeen: data.lastSeen }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const providerRanking = Object.entries(providerCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          liveUsers: totalLiveUsers,
          searchesToday: totalSearchesToday,
          playsToday: totalPlaysToday,
          errorsToday: totalErrorsToday,
          activeProvidersCount: Object.keys(providerCounts).length,
        },
        liveSessions: liveSessions || [],
        recentEvents: (todayEvents || []).slice(0, 30),
        topSearches,
        providerRanking,
        timestamp: Date.now(),
      },
    });
  } catch (error: any) {
    console.error('[Stats API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics', details: error?.message },
      { status: 500 }
    );
  }
}
