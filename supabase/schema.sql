-- =========================================================
-- CloudStream Telemetry & Live Monitoring Schema for Supabase
-- =========================================================

-- 1. Create Active Sessions Table (For Real-Time Presence & Live Users)
CREATE TABLE IF NOT EXISTS public.active_sessions (
    device_id TEXT PRIMARY KEY,
    provider TEXT NOT NULL,
    current_title TEXT,
    current_action TEXT DEFAULT 'heartbeat',
    country TEXT DEFAULT 'Unknown',
    city TEXT DEFAULT 'Unknown',
    ip_hash TEXT,
    last_active TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for ultra-fast live user queries (freshness window check)
CREATE INDEX IF NOT EXISTS idx_active_sessions_last_active ON public.active_sessions (last_active DESC);
CREATE INDEX IF NOT EXISTS idx_active_sessions_provider ON public.active_sessions (provider);

-- 2. Create Historical Telemetry Events Table (For Logs, Trends, and Error Radar)
CREATE TABLE IF NOT EXISTS public.telemetry_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id TEXT NOT NULL,
    provider TEXT NOT NULL,
    event_type TEXT NOT NULL, -- 'heartbeat', 'search', 'view', 'play', 'error'
    metadata JSONB DEFAULT '{}'::jsonb,
    country TEXT DEFAULT 'Unknown',
    city TEXT DEFAULT 'Unknown',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_telemetry_events_created_at ON public.telemetry_events (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_telemetry_events_provider ON public.telemetry_events (provider);
CREATE INDEX IF NOT EXISTS idx_telemetry_events_event_type ON public.telemetry_events (event_type);

-- 3. Enable Row Level Security (RLS) & Public Read/Write for Ingestion API
ALTER TABLE public.active_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telemetry_events ENABLE ROW LEVEL SECURITY;

-- Allow anon read/write (protected by app logic / service role if preferred)
CREATE POLICY "Allow public read active_sessions" ON public.active_sessions FOR SELECT USING (true);
CREATE POLICY "Allow public insert active_sessions" ON public.active_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update active_sessions" ON public.active_sessions FOR UPDATE USING (true);

CREATE POLICY "Allow public read telemetry_events" ON public.telemetry_events FOR SELECT USING (true);
CREATE POLICY "Allow public insert telemetry_events" ON public.telemetry_events FOR INSERT WITH CHECK (true);

-- 4. Enable Supabase Realtime for Live WebSocket Streams
ALTER PUBLICATION supabase_realtime ADD TABLE public.active_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.telemetry_events;

-- 5. Automated 30-Day Retention Policy (Cleans up stale events to stay in free tier)
CREATE OR REPLACE FUNCTION public.prune_stale_telemetry()
RETURNS void AS $$
BEGIN
    -- Delete telemetry events older than 30 days
    DELETE FROM public.telemetry_events WHERE created_at < NOW() - INTERVAL '30 days';
    
    -- Delete inactive session records older than 7 days
    DELETE FROM public.active_sessions WHERE last_active < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
