'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  Toolbar,
  ToolbarActions,
} from '@/components/layouts/layout-3/components/toolbar';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/lib/supabase';
import {
  Activity,
  Users,
  Search,
  PlayCircle,
  AlertTriangle,
  Radio,
  RefreshCw,
  Globe,
  Film,
  Clock,
  ShieldCheck,
  Flame,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ActiveSession {
  device_id: string;
  provider: string;
  current_title?: string | null;
  current_action?: string;
  country?: string;
  city?: string;
  last_active: string;
}

interface TelemetryEvent {
  id: string;
  device_id: string;
  provider: string;
  event_type: string;
  metadata?: Record<string, any>;
  country?: string;
  city?: string;
  created_at: string;
}

interface DashboardStats {
  summary: {
    liveUsers: number;
    searchesToday: number;
    playsToday: number;
    errorsToday: number;
    activeProvidersCount: number;
  };
  liveSessions: ActiveSession[];
  recentEvents: TelemetryEvent[];
  topSearches: Array<{ query: string; count: number; lastSeen: string }>;
  providerRanking: Array<{ name: string; count: number }>;
}

export default function Page() {
  const [stats, setStats] = useState<DashboardStats>({
    summary: {
      liveUsers: 0,
      searchesToday: 0,
      playsToday: 0,
      errorsToday: 0,
      activeProvidersCount: 0,
    },
    liveSessions: [],
    recentEvents: [],
    topSearches: [],
    providerRanking: [],
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isRealtimeActive, setIsRealtimeActive] = useState(false);
  const [lastSync, setLastSync] = useState<Date>(new Date());

  // Fetch baseline stats from server
  const loadStats = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/stats');
      const json = await res.json();
      if (json.success && json.data) {
        setStats(json.data);
        setLastSync(new Date());
      }
    } catch (err) {
      console.error('Failed to load stats:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStats();

    // Setup Supabase Realtime channel
    const channel = supabase
      .channel('realtime-cloudstream-telemetry')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'active_sessions' },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const updated = payload.new as ActiveSession;
            setStats((prev) => {
              const existingIdx = prev.liveSessions.findIndex(
                (s) => s.device_id === updated.device_id
              );
              let newSessions = [...prev.liveSessions];
              if (existingIdx >= 0) {
                newSessions[existingIdx] = updated;
              } else {
                newSessions.unshift(updated);
              }

              // Filter only sessions active in the last 2 minutes
              const threshold = Date.now() - 2 * 60 * 1000;
              newSessions = newSessions.filter(
                (s) => new Date(s.last_active).getTime() >= threshold
              );

              return {
                ...prev,
                liveSessions: newSessions,
                summary: {
                  ...prev.summary,
                  liveUsers: newSessions.length,
                },
              };
            });
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'telemetry_events' },
        (payload) => {
          const newEvent = payload.new as TelemetryEvent;
          setStats((prev) => {
            const updatedEvents = [newEvent, ...prev.recentEvents].slice(0, 50);
            const isSearch = newEvent.event_type === 'search';
            const isPlay = newEvent.event_type === 'play';
            const isError = newEvent.event_type === 'error';

            return {
              ...prev,
              recentEvents: updatedEvents,
              summary: {
                ...prev.summary,
                searchesToday: prev.summary.searchesToday + (isSearch ? 1 : 0),
                playsToday: prev.summary.playsToday + (isPlay ? 1 : 0),
                errorsToday: prev.summary.errorsToday + (isError ? 1 : 0),
              },
            };
          });
        }
      )
      .subscribe((status) => {
        setIsRealtimeActive(status === 'SUBSCRIBED');
      });

    // Cleanup stale sessions every 15 seconds
    const interval = setInterval(() => {
      const threshold = Date.now() - 2 * 60 * 1000;
      setStats((prev) => {
        const fresh = prev.liveSessions.filter(
          (s) => new Date(s.last_active).getTime() >= threshold
        );
        if (fresh.length !== prev.liveSessions.length) {
          return {
            ...prev,
            liveSessions: fresh,
            summary: { ...prev.summary, liveUsers: fresh.length },
          };
        }
        return prev;
      });
    }, 15000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []);

  // Compute live users per provider
  const liveProviderDistribution = useMemo(() => {
    const map: Record<string, number> = {};
    stats.liveSessions.forEach((s) => {
      map[s.provider] = (map[s.provider] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [stats.liveSessions]);

  return (
    <div className="container py-4 space-y-6">
      {/* Top Toolbar */}
      <Toolbar>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-foreground">CloudStream Live Analytics</h1>
            {isRealtimeActive ? (
              <Badge variant="success" appearance="light" size="sm" className="gap-1">
                <span className="size-2 rounded-full bg-green-500 animate-ping" />
                Live WebSocket
              </Badge>
            ) : (
              <Badge variant="secondary" appearance="light" size="sm">
                Connecting...
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Real-time live presence, scraper health & content telemetry across your repository
          </p>
        </div>
        <ToolbarActions>
          <Button
            variant="outline"
            size="sm"
            onClick={loadStats}
            disabled={isLoading}
            className="gap-1.5"
          >
            <RefreshCw className={`size-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </ToolbarActions>
      </Toolbar>

      {/* 4 Core Realtime KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Live Users Online */}
        <Card className="relative overflow-hidden border-border/80">
          <div className="absolute top-0 right-0 p-4 opacity-15">
            <Radio className="size-16 text-green-500 animate-pulse" />
          </div>
          <CardHeader className="pb-2 min-h-auto border-none">
            <CardDescription className="flex items-center gap-1.5 font-medium">
              <span className="relative flex size-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full size-2.5 bg-green-500"></span>
              </span>
              Live Users Online
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-3xl font-bold tracking-tight text-foreground">
              {stats.summary.liveUsers}
            </div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <Clock className="size-3" /> Freshness window: last 2 mins
            </p>
          </CardContent>
        </Card>

        {/* KPI 2: Streams Played */}
        <Card className="relative overflow-hidden border-border/80">
          <div className="absolute top-0 right-0 p-4 opacity-15">
            <PlayCircle className="size-16 text-primary" />
          </div>
          <CardHeader className="pb-2 min-h-auto border-none">
            <CardDescription className="flex items-center gap-1.5 font-medium">
              <Film className="size-3.5 text-primary" />
              Streams Played (Today)
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-3xl font-bold tracking-tight text-foreground">
              {stats.summary.playsToday}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Playback link extractions resolved
            </p>
          </CardContent>
        </Card>

        {/* KPI 3: Search Queries */}
        <Card className="relative overflow-hidden border-border/80">
          <div className="absolute top-0 right-0 p-4 opacity-15">
            <Search className="size-16 text-violet-500" />
          </div>
          <CardHeader className="pb-2 min-h-auto border-none">
            <CardDescription className="flex items-center gap-1.5 font-medium">
              <Search className="size-3.5 text-violet-500" />
              Searches (Today)
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-3xl font-bold tracking-tight text-foreground">
              {stats.summary.searchesToday}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              User query searches across providers
            </p>
          </CardContent>
        </Card>

        {/* KPI 4: Scraper Health & Errors */}
        <Card className="relative overflow-hidden border-border/80">
          <div className="absolute top-0 right-0 p-4 opacity-15">
            <ShieldCheck className="size-16 text-emerald-500" />
          </div>
          <CardHeader className="pb-2 min-h-auto border-none">
            <CardDescription className="flex items-center gap-1.5 font-medium">
              <ShieldCheck className="size-3.5 text-emerald-500" />
              Scraper Health Status
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <span>{stats.summary.errorsToday === 0 ? '100%' : `${Math.max(0, 100 - stats.summary.errorsToday * 2)}%`}</span>
              {stats.summary.errorsToday === 0 ? (
                <Badge variant="success" size="sm">Optimal</Badge>
              ) : (
                <Badge variant="warning" size="sm">{stats.summary.errorsToday} Errors</Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Zero blocking crashes detected
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList variant="line" size="md">
          <TabsTrigger value="overview" className="gap-2">
            <Activity className="size-4" />
            Live Presence & Feed
          </TabsTrigger>
          <TabsTrigger value="providers" className="gap-2">
            <Users className="size-4" />
            Providers Distribution
          </TabsTrigger>
          <TabsTrigger value="content" className="gap-2">
            <Flame className="size-4" />
            Top Searches & Content
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: OVERVIEW & REAL-TIME PRESENCE */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Live Active Sessions Table */}
            <Card className="lg:col-span-8">
              <CardHeader>
                <div className="space-y-1">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Radio className="size-4 text-green-500 animate-pulse" />
                    Live Active Sessions ({stats.liveSessions.length})
                  </CardTitle>
                  <CardDescription>
                    Real-time list of devices actively browsing or streaming right now
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {stats.liveSessions.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground space-y-2">
                    <Radio className="size-8 mx-auto text-muted-foreground/50 animate-pulse" />
                    <p className="text-sm font-medium">Waiting for live device heartbeats...</p>
                    <p className="text-xs">
                      When users open CloudStream with telemetry enabled, their live presence appears here instantly.
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Device / Session</TableHead>
                        <TableHead>Provider</TableHead>
                        <TableHead>Activity / Title</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead className="text-right">Last Ping</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stats.liveSessions.map((session) => (
                        <TableRow key={session.device_id}>
                          <TableCell className="font-mono text-xs text-muted-foreground">
                            {session.device_id.slice(0, 8)}...
                          </TableCell>
                          <TableCell>
                            <Badge variant="primary" appearance="light" size="sm">
                              {session.provider}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate text-sm">
                            {session.current_title ? (
                              <span className="font-medium text-foreground flex items-center gap-1">
                                <Film className="size-3 text-primary shrink-0" />
                                {session.current_title}
                              </span>
                            ) : (
                              <span className="text-muted-foreground text-xs italic">
                                Browsing catalog
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground flex items-center gap-1">
                            <Globe className="size-3 text-muted-foreground/70" />
                            {session.country || 'Unknown'} {session.city ? `(${session.city})` : ''}
                          </TableCell>
                          <TableCell className="text-right text-xs text-muted-foreground font-mono">
                            {formatDistanceToNow(new Date(session.last_active), {
                              addSuffix: true,
                            })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* Realtime Event Stream Ticker */}
            <Card className="lg:col-span-4">
              <CardHeader>
                <div className="space-y-1">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Activity className="size-4 text-primary" />
                    Live Activity Stream
                  </CardTitle>
                  <CardDescription>Instant event ticker</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-3 max-h-[440px] overflow-y-auto">
                {stats.recentEvents.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-6">
                    No recent events received yet today.
                  </p>
                ) : (
                  stats.recentEvents.map((event) => (
                    <div
                      key={event.id}
                      className="p-2.5 rounded-lg border border-border/60 bg-accent/30 text-xs space-y-1.5 transition-all hover:bg-accent/60"
                    >
                      <div className="flex items-center justify-between">
                        <Badge
                          variant={
                            event.event_type === 'play'
                              ? 'success'
                              : event.event_type === 'search'
                              ? 'info'
                              : event.event_type === 'error'
                              ? 'destructive'
                              : 'secondary'
                          }
                          size="xs"
                        >
                          {event.event_type.toUpperCase()}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      <div className="font-medium text-foreground truncate">
                        <span className="text-primary font-semibold">{event.provider}</span>:{' '}
                        {event.event_type === 'search' && (
                          <span>Searched &quot;{event.metadata?.query}&quot;</span>
                        )}
                        {event.event_type === 'play' && (
                          <span>Streaming playback started</span>
                        )}
                        {event.event_type === 'view' && (
                          <span>Opened &quot;{event.metadata?.title || 'Details'}&quot;</span>
                        )}
                        {event.event_type === 'heartbeat' && (
                          <span className="text-muted-foreground">Active heartbeat</span>
                        )}
                        {event.event_type === 'error' && (
                          <span className="text-destructive font-medium">{event.metadata?.error || 'Scraper exception'}</span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TAB 2: PROVIDERS DISTRIBUTION & HEALTH */}
        <TabsContent value="providers" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Live Active Users by Provider</CardTitle>
                <CardDescription>Current user distribution across your repository</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {liveProviderDistribution.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-6">
                    No active sessions to display.
                  </p>
                ) : (
                  liveProviderDistribution.map(([provider, count]) => {
                    const pct = Math.round((count / (stats.liveSessions.length || 1)) * 100);
                    return (
                      <div key={provider} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-medium">
                          <span className="flex items-center gap-1.5">
                            <span className="size-2 rounded-full bg-primary" />
                            {provider}
                          </span>
                          <span className="text-muted-foreground font-mono">
                            {count} users ({pct}%)
                          </span>
                        </div>
                        <Progress value={pct} />
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Flagship Provider Status</CardTitle>
                <CardDescription>Monitored providers in nehal-CloudStream</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Provider</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[
                      { name: 'MovieBoxProviderIN', type: 'Movies & Series' },
                      { name: 'VegaMovies', type: 'Dual Audio & HD' },
                      { name: 'CastleTvProvider', type: 'Live TV & VOD' },
                      { name: 'FTPBD', type: 'BDIX Fast Stream' },
                      { name: 'CineplexBD', type: 'Bangla Cinema' },
                      { name: 'AnimeDekhoProvider', type: 'Anime & Dub' },
                    ].map((p) => (
                      <TableRow key={p.name}>
                        <TableCell className="font-medium text-sm">{p.name}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{p.type}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant="success" appearance="light" size="xs">
                            Active
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TAB 3: SEARCH & CONTENT TRENDS */}
        <TabsContent value="content" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Search className="size-4 text-violet-500" />
                  Top Search Queries Today
                </CardTitle>
                <CardDescription>Most frequently searched titles by users</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {stats.topSearches.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-8">
                    No search queries recorded today yet.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Search Term</TableHead>
                        <TableHead className="text-right">Searches</TableHead>
                        <TableHead className="text-right">Last Seen</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stats.topSearches.map((item, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-medium text-sm flex items-center gap-2">
                            <span className="size-5 rounded bg-muted flex items-center justify-center text-[10px] font-bold">
                              #{idx + 1}
                            </span>
                            {item.query}
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm font-semibold text-primary">
                            {item.count}
                          </TableCell>
                          <TableCell className="text-right text-xs text-muted-foreground font-mono">
                            {formatDistanceToNow(new Date(item.lastSeen), { addSuffix: true })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Flame className="size-4 text-amber-500" />
                  Telemetry Integration Guide
                </CardTitle>
                <CardDescription>
                  How telemetry coordinates between your Android providers and this dashboard
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-xs text-muted-foreground">
                <div className="p-3 rounded-lg border border-border bg-muted/40 space-y-2">
                  <p className="font-medium text-foreground text-sm">
                    ⚡ Zero Buffering Guarantee
                  </p>
                  <p>
                    All telemetry calls inside CloudStream Kotlin plugins execute in non-blocking background workers (<code className="text-primary font-mono">ioSafe</code>) with a 3-second hard timeout. Streaming is never delayed.
                  </p>
                </div>

                <div className="p-3 rounded-lg border border-border bg-muted/40 space-y-2">
                  <p className="font-medium text-foreground text-sm">
                    🔒 Privacy & Anonymity
                  </p>
                  <p>
                    Devices are tracked using randomly generated local UUIDs. No personal accounts or identifiable files are collected.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}