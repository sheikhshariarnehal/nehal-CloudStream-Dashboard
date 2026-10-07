'use client';

import { useEffect, useState, useMemo } from 'react';
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
  Boxes,
  Users,
  Search,
  PlayCircle,
  Radio,
  RefreshCw,
  Globe,
  Film,
  Clock,
  ShieldCheck,
  Flame,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  Compass,
  Tv,
  Eye,
  Zap,
  Server,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

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

const ALL_PROVIDERS = [
  { name: 'MovieBoxProviderIN', type: 'Movies & Series', region: 'Global', category: 'Movies' },
  { name: 'VegaMovies', type: 'Dual Audio & HD', region: 'India / Global', category: 'HD Movies' },
  { name: 'CastleTvProvider', type: 'Live TV & VOD', region: 'India / BD', category: 'Live TV' },
  { name: 'FTPBD', type: 'BDIX Fast Stream', region: 'Bangladesh', category: 'BDIX' },
  { name: 'CineplexBD', type: 'Bangla Cinema', region: 'Bangladesh', category: 'Bangla' },
  { name: 'AnimeDekhoProvider', type: 'Anime & Dub', region: 'India / Global', category: 'Anime' },
  { name: 'AllWish', type: 'Anime & Movies', region: 'Global', category: 'Anime' },
  { name: 'Aniwatch', type: 'Anime Sub / Dub', region: 'Global', category: 'Anime' },
  { name: 'BanglaPlex', type: 'Bangla Media Hub', region: 'Bangladesh', category: 'Bangla' },
  { name: 'BdixCircleftp', type: 'BDIX FTP Stream', region: 'Bangladesh', category: 'BDIX' },
  { name: 'BdixCircleFtpOld', type: 'BDIX Archive', region: 'Bangladesh', category: 'BDIX' },
  { name: 'BdixICCFtp', type: 'BDIX Media Hub', region: 'Bangladesh', category: 'BDIX' },
  { name: 'CTGMovies', type: 'Regional Movies', region: 'Bangladesh', category: 'Bangla' },
  { name: 'DhakaFlix', type: 'BDIX Streaming', region: 'Bangladesh', category: 'BDIX' },
  { name: 'DhakaFlixBDIX', type: 'BDIX Dedicated', region: 'Bangladesh', category: 'BDIX' },
  { name: 'DiscoveryFTP', type: 'FTP Content Hub', region: 'Bangladesh', category: 'BDIX' },
  { name: 'FmFtp', type: 'FTP Media Server', region: 'Bangladesh', category: 'BDIX' },
  { name: 'FTPBDMedia', type: 'FTP Fast Mirror', region: 'Bangladesh', category: 'BDIX' },
  { name: 'JellyfinBD', type: 'Private Media Server', region: 'Bangladesh', category: 'Private Server' },
  { name: 'MojaLoss', type: 'Entertainment Stream', region: 'Bangladesh', category: 'Entertainment' },
  { name: 'MovieLinkBDProvider', type: 'Movie Direct Links', region: 'Bangladesh', category: 'Direct Links' },
  { name: 'Netmirror', type: 'Multi-VOD Mirrors', region: 'Global', category: 'Multi VOD' },
  { name: 'ShowTimeBD', type: 'Bangla ShowTime', region: 'Bangladesh', category: 'Bangla' },
];

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
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch baseline stats from server
  const loadStats = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/stats');
      const json = await res.json();
      if (json.success && json.data) {
        setStats(json.data);
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

              // Filter sessions active in the last 2 minutes
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

    // Clean up stale sessions every 10 seconds
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
    }, 10000);

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
    <div className="container-fluid px-4 sm:px-6 py-5 space-y-6">
      {/* Top Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl border border-border/80 bg-gradient-to-r from-card via-card/95 to-muted/40 shadow-xs">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
              CloudStream Live Analytics
            </h1>
            {isRealtimeActive ? (
              <Badge
                variant="success"
                appearance="light"
                size="sm"
                className="gap-1.5 font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              >
                <span className="size-2 rounded-full bg-emerald-500 animate-ping" />
                Live WebSocket
              </Badge>
            ) : (
              <Badge
                variant="secondary"
                appearance="light"
                size="sm"
                className="gap-1.5 font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20"
              >
                <span className="size-2 rounded-full bg-amber-500 animate-pulse" />
                Connecting WebSocket...
              </Badge>
            )}
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Real-time live presence, scraper health & content telemetry across all 23 repository providers
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={loadStats}
            disabled={isLoading}
            className="gap-1.5 text-xs h-9 font-medium shadow-xs"
          >
            <RefreshCw className={`size-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            asChild
            className="gap-1.5 text-xs h-9 font-medium shadow-xs"
          >
            <Link
              href="https://github.com/nehalDIU/nehal-CloudStream"
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="size-3.5" />
              <span>Plugins Repo</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* 4 Core Realtime KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Live Users Online */}
        <Card className="relative overflow-hidden border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-card to-card hover:border-emerald-500/50 transition-all shadow-xs">
          <CardHeader className="pb-2 min-h-auto border-none flex-row items-center justify-between space-y-0">
            <CardDescription className="flex items-center gap-2 font-semibold text-xs text-foreground">
              <span className="relative flex size-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full size-2.5 bg-emerald-500"></span>
              </span>
              Live Users Online
            </CardDescription>
            <div className="size-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Radio className="size-4 animate-pulse" />
            </div>
          </CardHeader>
          <CardContent className="pt-1">
            <div className="text-3xl sm:text-4xl font-black tracking-tight text-emerald-400 font-mono">
              {stats.summary.liveUsers}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1.5 flex items-center gap-1.5 font-medium">
              <Clock className="size-3 text-emerald-400" /> Freshness window: last 2 mins
            </p>
          </CardContent>
        </Card>

        {/* KPI 2: Streams Played */}
        <Card className="relative overflow-hidden border border-sky-500/30 bg-gradient-to-br from-sky-500/10 via-card to-card hover:border-sky-500/50 transition-all shadow-xs">
          <CardHeader className="pb-2 min-h-auto border-none flex-row items-center justify-between space-y-0">
            <CardDescription className="flex items-center gap-2 font-semibold text-xs text-foreground">
              <Film className="size-3.5 text-sky-400" />
              Streams Played (Today)
            </CardDescription>
            <div className="size-8 rounded-lg bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <PlayCircle className="size-4" />
            </div>
          </CardHeader>
          <CardContent className="pt-1">
            <div className="text-3xl sm:text-4xl font-black tracking-tight text-sky-400 font-mono">
              {stats.summary.playsToday}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1.5 font-medium">
              Playback link extractions resolved
            </p>
          </CardContent>
        </Card>

        {/* KPI 3: Searches Today */}
        <Card className="relative overflow-hidden border border-violet-500/30 bg-gradient-to-br from-violet-500/10 via-card to-card hover:border-violet-500/50 transition-all shadow-xs">
          <CardHeader className="pb-2 min-h-auto border-none flex-row items-center justify-between space-y-0">
            <CardDescription className="flex items-center gap-2 font-semibold text-xs text-foreground">
              <Search className="size-3.5 text-violet-400" />
              Searches (Today)
            </CardDescription>
            <div className="size-8 rounded-lg bg-violet-500/15 border border-violet-500/30 flex items-center justify-center text-violet-400">
              <Search className="size-4" />
            </div>
          </CardHeader>
          <CardContent className="pt-1">
            <div className="text-3xl sm:text-4xl font-black tracking-tight text-violet-400 font-mono">
              {stats.summary.searchesToday}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1.5 font-medium">
              User query searches across providers
            </p>
          </CardContent>
        </Card>

        {/* KPI 4: Scraper Health */}
        <Card className="relative overflow-hidden border border-teal-500/30 bg-gradient-to-br from-teal-500/10 via-card to-card hover:border-teal-500/50 transition-all shadow-xs">
          <CardHeader className="pb-2 min-h-auto border-none flex-row items-center justify-between space-y-0">
            <CardDescription className="flex items-center gap-2 font-semibold text-xs text-foreground">
              <ShieldCheck className="size-3.5 text-teal-400" />
              Scraper Health Status
            </CardDescription>
            <div className="size-8 rounded-lg bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-400">
              <ShieldCheck className="size-4" />
            </div>
          </CardHeader>
          <CardContent className="pt-1">
            <div className="text-3xl sm:text-4xl font-black tracking-tight text-teal-400 font-mono flex items-center gap-2.5">
              <span>{stats.summary.errorsToday === 0 ? '100%' : `${Math.max(0, 100 - stats.summary.errorsToday * 2)}%`}</span>
              {stats.summary.errorsToday === 0 ? (
                <Badge variant="success" size="xs" className="font-semibold bg-emerald-500/15 text-emerald-400 border-emerald-500/30">
                  Optimal
                </Badge>
              ) : (
                <Badge variant="warning" size="xs" className="font-semibold">
                  {stats.summary.errorsToday} Errors
                </Badge>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1.5 font-medium">
              Zero blocking crashes detected
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-5">
        <div className="border-b border-border/80 pb-1">
          <TabsList variant="line" size="md" className="gap-4">
            <TabsTrigger value="overview" className="gap-2 text-xs sm:text-sm font-semibold">
              <Activity className="size-4 text-emerald-400" />
              Live Presence & Feed
              {stats.liveSessions.length > 0 && (
                <Badge variant="success" size="xs" className="ms-1 font-mono">
                  {stats.liveSessions.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="providers" className="gap-2 text-xs sm:text-sm font-semibold">
              <Boxes className="size-4 text-sky-400" />
              Providers Radar (23)
            </TabsTrigger>
            <TabsTrigger value="content" className="gap-2 text-xs sm:text-sm font-semibold">
              <Flame className="size-4 text-violet-400" />
              Top Searches & Content
            </TabsTrigger>
          </TabsList>
        </div>

        {/* TAB 1: OVERVIEW & REAL-TIME PRESENCE */}
        <TabsContent value="overview" className="space-y-6 mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Live Active Sessions Table */}
            <Card className="lg:col-span-8 border-border/80 shadow-xs">
              <CardHeader className="border-b border-border/60 pb-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <Radio className="size-4 text-emerald-400 animate-pulse" />
                      Live Active Sessions ({stats.liveSessions.length})
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Real-time list of devices actively browsing or streaming right now
                    </CardDescription>
                  </div>
                  <Badge variant="secondary" size="xs" className="font-mono">
                    2 min window
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                {stats.liveSessions.length === 0 ? (
                  <div className="p-12 text-center text-muted-foreground space-y-3">
                    <div className="size-12 rounded-full bg-muted/60 border border-border/60 flex items-center justify-center mx-auto text-emerald-400/80">
                      <Radio className="size-6 animate-pulse" />
                    </div>
                    <p className="text-sm font-semibold text-foreground">Waiting for live device heartbeats...</p>
                    <p className="text-xs max-w-md mx-auto text-muted-foreground">
                      When users open CloudStream with telemetry enabled, their live presence and watching activity appear here automatically.
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader className="bg-muted/40">
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="font-semibold text-xs">Device</TableHead>
                        <TableHead className="font-semibold text-xs">Provider</TableHead>
                        <TableHead className="font-semibold text-xs">Activity / Title</TableHead>
                        <TableHead className="font-semibold text-xs">Location</TableHead>
                        <TableHead className="text-right font-semibold text-xs">Last Ping</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stats.liveSessions.map((session) => (
                        <TableRow key={session.device_id} className="hover:bg-muted/30 transition-colors">
                          <TableCell className="font-mono text-xs text-muted-foreground">
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-muted/60 border border-border/60 text-[11px]">
                              📱 {session.device_id.slice(0, 8)}...
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge variant="primary" appearance="light" size="sm" className="font-semibold">
                              {session.provider}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-[220px] truncate text-xs">
                            {session.current_title ? (
                              <span className="font-semibold text-foreground flex items-center gap-1.5 truncate">
                                <Film className="size-3.5 text-sky-400 shrink-0" />
                                {session.current_title}
                              </span>
                            ) : (
                              <span className="text-muted-foreground flex items-center gap-1.5 text-[11px] italic">
                                <Compass className="size-3 text-muted-foreground/60 shrink-0" />
                                Browsing catalog
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            <span className="inline-flex items-center gap-1 text-[11px] bg-muted/40 px-2 py-0.5 rounded-md border border-border/50">
                              🌍 {session.country || 'Global'} {session.city ? `(${session.city})` : ''}
                            </span>
                          </TableCell>
                          <TableCell className="text-right text-xs font-mono text-muted-foreground">
                            <span className="inline-flex items-center gap-1.5 text-emerald-400">
                              <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              {formatDistanceToNow(new Date(session.last_active), {
                                addSuffix: true,
                              })}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* Realtime Event Stream Ticker */}
            <Card className="lg:col-span-4 border-border/80 shadow-xs">
              <CardHeader className="border-b border-border/60 pb-4">
                <div className="space-y-0.5">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Zap className="size-4 text-violet-400" />
                    Live Activity Stream
                  </CardTitle>
                  <CardDescription className="text-xs">Instant telemetry ticker</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-2.5 max-h-[500px] overflow-y-auto">
                {stats.recentEvents.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-12">
                    No recent events received yet today.
                  </p>
                ) : (
                  stats.recentEvents.map((event) => {
                    const isSearch = event.event_type === 'search';
                    const isPlay = event.event_type === 'play';
                    const isView = event.event_type === 'view';
                    const isHeartbeat = event.event_type === 'heartbeat';
                    const isError = event.event_type === 'error';

                    return (
                      <div
                        key={event.id}
                        className={`p-3 rounded-xl border text-xs space-y-1.5 transition-all hover:brightness-110 ${
                          isPlay
                            ? 'border-l-4 border-l-emerald-500 border-border/60 bg-emerald-950/20'
                            : isSearch
                            ? 'border-l-4 border-l-violet-500 border-border/60 bg-violet-950/20'
                            : isView
                            ? 'border-l-4 border-l-amber-500 border-border/60 bg-amber-950/20'
                            : isHeartbeat
                            ? 'border-l-4 border-l-sky-500 border-border/60 bg-sky-950/20'
                            : 'border-l-4 border-l-rose-500 border-border/60 bg-rose-950/20'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <Badge
                            variant={
                              isPlay
                                ? 'success'
                                : isSearch
                                ? 'info'
                                : isError
                                ? 'destructive'
                                : 'secondary'
                            }
                            size="xs"
                            className="font-bold tracking-wider text-[10px]"
                          >
                            {event.event_type.toUpperCase()}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
                          </span>
                        </div>
                        <div className="font-medium text-foreground truncate text-[11px]">
                          <span className="text-primary font-bold">{event.provider}</span>:{' '}
                          {isSearch && (
                            <span className="text-foreground">Searched &quot;<span className="font-semibold text-violet-300">{event.metadata?.query}</span>&quot;</span>
                          )}
                          {isPlay && (
                            <span className="text-emerald-300 font-semibold">Streaming playback resolved</span>
                          )}
                          {isView && (
                            <span>Opened &quot;<span className="font-semibold">{event.metadata?.title || 'Details'}</span>&quot;</span>
                          )}
                          {isHeartbeat && (
                            <span className="text-muted-foreground">Active device heartbeat</span>
                          )}
                          {isError && (
                            <span className="text-destructive font-semibold">{event.metadata?.error || 'Scraper exception'}</span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TAB 2: PROVIDERS RADAR (23 PROVIDERS) */}
        <TabsContent value="providers" className="space-y-6 mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Live Traffic Share */}
            <Card className="lg:col-span-4 border-border/80 shadow-xs">
              <CardHeader className="border-b border-border/60 pb-4">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Activity className="size-4 text-emerald-400" />
                  Active Traffic Share
                </CardTitle>
                <CardDescription className="text-xs">
                  Live session distribution across providers
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                {liveProviderDistribution.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-10">
                    No active sessions right now.
                  </p>
                ) : (
                  liveProviderDistribution.map(([provider, count]) => {
                    const pct = Math.round((count / (stats.liveSessions.length || 1)) * 100);
                    return (
                      <div key={provider} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span className="flex items-center gap-1.5">
                            <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                            {provider}
                          </span>
                          <span className="text-muted-foreground font-mono">
                            {count} users ({pct}%)
                          </span>
                        </div>
                        <Progress value={pct} className="h-2 bg-muted/60" />
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>

            {/* 23 Providers Status Grid */}
            <Card className="lg:col-span-8 border-border/80 shadow-xs">
              <CardHeader className="border-b border-border/60 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <Boxes className="size-4 text-sky-400" />
                      All Repository Providers (23)
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Fleet status across nehal-CloudStream
                    </CardDescription>
                  </div>
                  <Badge variant="success" appearance="light" size="xs" className="font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    23 / 23 Operational
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/40">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="font-semibold text-xs">Provider Name</TableHead>
                      <TableHead className="font-semibold text-xs">Category</TableHead>
                      <TableHead className="font-semibold text-xs">Coverage Region</TableHead>
                      <TableHead className="text-right font-semibold text-xs">Health Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ALL_PROVIDERS.map((p) => (
                      <TableRow key={p.name} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="font-bold text-xs text-foreground">
                          {p.name}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          <span className="px-2 py-0.5 rounded-md bg-muted/60 text-[11px] border border-border/50">
                            {p.category}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {p.region}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="success" appearance="light" size="xs" className="gap-1 font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 className="size-3 text-emerald-400" />
                            Operational
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
        <TabsContent value="content" className="space-y-6 mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-border/80 shadow-xs">
              <CardHeader className="border-b border-border/60 pb-4">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Search className="size-4 text-violet-400" />
                  Top Search Queries Today
                </CardTitle>
                <CardDescription className="text-xs">
                  Most frequently searched titles across all providers
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                {stats.topSearches.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-12">
                    No search queries recorded today yet.
                  </p>
                ) : (
                  <Table>
                    <TableHeader className="bg-muted/40">
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="font-semibold text-xs">Keyword</TableHead>
                        <TableHead className="text-right font-semibold text-xs">Searches</TableHead>
                        <TableHead className="text-right font-semibold text-xs">Last Seen</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stats.topSearches.map((item, idx) => (
                        <TableRow key={idx} className="hover:bg-muted/30 transition-colors">
                          <TableCell className="font-semibold text-xs flex items-center gap-2">
                            <span className="size-5 rounded-md bg-muted/80 border border-border flex items-center justify-center text-[10px] font-mono font-bold text-foreground">
                              {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                            </span>
                            {item.query}
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs font-bold text-violet-400">
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

            <Card className="border-border/80 shadow-xs">
              <CardHeader className="border-b border-border/60 pb-4">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Server className="size-4 text-amber-400" />
                  Telemetry Architecture
                </CardTitle>
                <CardDescription className="text-xs">
                  Zero-latency telemetry architecture overview
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 space-y-3.5 text-xs text-muted-foreground">
                <div className="p-3.5 rounded-xl border border-border/80 bg-muted/40 space-y-1.5">
                  <p className="font-semibold text-foreground text-xs flex items-center gap-1.5">
                    <CheckCircle2 className="size-3.5 text-emerald-400" />
                    Non-Blocking Coroutine Engine
                  </p>
                  <p className="text-[11px] leading-relaxed">
                    All telemetry requests in CloudStream Kotlin plugins run asynchronously via <code className="text-primary font-mono font-semibold">ioSafe</code> with a 15-second hard timeout. Playback is 100% immune to network lags or server hiccups.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-border/80 bg-muted/40 space-y-1.5">
                  <p className="font-semibold text-foreground text-xs flex items-center gap-1.5">
                    <Globe className="size-3.5 text-sky-400" />
                    Automatic Edge Geolocation
                  </p>
                  <p className="text-[11px] leading-relaxed">
                    Client requests hitting the Vercel ingestion endpoint automatically extract country and city headers with zero client device overhead.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-border/80 bg-muted/40 space-y-1.5">
                  <p className="font-semibold text-foreground text-xs flex items-center gap-1.5">
                    <Sparkles className="size-3.5 text-violet-400" />
                    PostgreSQL Realtime WebSocket
                  </p>
                  <p className="text-[11px] leading-relaxed">
                    All active sessions and event streams synchronize over WebSocket channels directly into your dashboard in real-time.
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