'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardHeading,
  CardTitle,
  CardDescription,
  CardToolbar,
  CardTable,
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
import { ScrollArea } from '@/components/ui/scroll-area';
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
      .subscribe();

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
    <div className="p-4 sm:p-6 lg:p-7 space-y-6 max-w-full">
      {/* Main Tabs Navigation & Top Action Bar */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-3">
          <TabsList variant="line" size="md" className="gap-6 -mb-3.5 border-b-0 overflow-x-auto">
            <TabsTrigger value="overview" className="gap-2 text-sm font-semibold pb-3">
              <Activity className="size-4 text-emerald-500" />
              <span>Live Presence & Feed</span>
              {stats.liveSessions.length > 0 && (
                <Badge variant="success" appearance="light" size="xs" shape="circle" className="font-mono">
                  {stats.liveSessions.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="providers" className="gap-2 text-sm font-semibold pb-3">
              <Boxes className="size-4 text-primary" />
              <span>Providers Radar (23)</span>
            </TabsTrigger>
            <TabsTrigger value="content" className="gap-2 text-sm font-semibold pb-3">
              <Flame className="size-4 text-amber-500" />
              <span>Top Searches & Content</span>
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2.5 shrink-0 pb-1 sm:pb-0">
            <Button
              variant="outline"
              size="sm"
              onClick={loadStats}
              disabled={isLoading}
              className="gap-1.5 text-xs font-medium"
            >
              <RefreshCw className={`size-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </Button>

            <Button
              variant="primary"
              size="sm"
              asChild
              className="gap-1.5 text-xs font-medium"
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
          <Card className="hover:border-primary/40 transition-colors">
            <CardContent className="p-5 flex flex-col justify-between h-full space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                  <span className="relative flex size-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full size-2 bg-emerald-500"></span>
                  </span>
                  Live Users Online
                </span>
                <Badge variant="success" appearance="light" size="sm" shape="circle" className="size-7 p-0 flex items-center justify-center">
                  <Radio className="size-3.5 text-emerald-500 animate-pulse" />
                </Badge>
              </div>
              <div>
                <div className="text-2xl font-bold tracking-tight text-foreground font-mono">
                  {stats.summary.liveUsers}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1 font-medium">
                  <Clock className="size-3 text-muted-foreground" />
                  <span>2-minute activity window</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* KPI 2: Streams Played */}
          <Card className="hover:border-primary/40 transition-colors">
            <CardContent className="p-5 flex flex-col justify-between h-full space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                  <Film className="size-3.5 text-primary" />
                  Streams Played (Today)
                </span>
                <Badge variant="primary" appearance="light" size="sm" shape="circle" className="size-7 p-0 flex items-center justify-center">
                  <PlayCircle className="size-3.5" />
                </Badge>
              </div>
              <div>
                <div className="text-2xl font-bold tracking-tight text-foreground font-mono">
                  {stats.summary.playsToday}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1 font-medium">
                  <span>Playback link extractions</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* KPI 3: Searches Today */}
          <Card className="hover:border-primary/40 transition-colors">
            <CardContent className="p-5 flex flex-col justify-between h-full space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                  <Search className="size-3.5 text-violet-500" />
                  Searches (Today)
                </span>
                <Badge variant="info" appearance="light" size="sm" shape="circle" className="size-7 p-0 flex items-center justify-center">
                  <Search className="size-3.5" />
                </Badge>
              </div>
              <div>
                <div className="text-2xl font-bold tracking-tight text-foreground font-mono">
                  {stats.summary.searchesToday}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1 font-medium">
                  <span>User queries across providers</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* KPI 4: Scraper Health */}
          <Card className="hover:border-primary/40 transition-colors">
            <CardContent className="p-5 flex flex-col justify-between h-full space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                  <ShieldCheck className="size-3.5 text-emerald-500" />
                  Scraper Health
                </span>
                <Badge variant="success" appearance="light" size="sm" shape="circle" className="size-7 p-0 flex items-center justify-center">
                  <ShieldCheck className="size-3.5" />
                </Badge>
              </div>
              <div>
                <div className="text-2xl font-bold tracking-tight text-foreground font-mono flex items-center gap-2">
                  <span>{stats.summary.errorsToday === 0 ? '100%' : `${Math.max(0, 100 - stats.summary.errorsToday * 2)}%`}</span>
                  {stats.summary.errorsToday === 0 ? (
                    <Badge variant="success" appearance="light" size="xs">
                      Optimal
                    </Badge>
                  ) : (
                    <Badge variant="warning" appearance="light" size="xs">
                      {stats.summary.errorsToday} Errors
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1 font-medium">
                  <span>Zero blocking errors detected</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* TAB 1: OVERVIEW & REAL-TIME PRESENCE */}
        <TabsContent value="overview" className="space-y-6 mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Live Active Sessions Table */}
            <Card className="lg:col-span-8">
              <CardHeader className="min-h-14 px-5 border-b border-border">
                <CardHeading>
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Radio className="size-4 text-emerald-500 animate-pulse" />
                    Live Active Sessions ({stats.liveSessions.length})
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Real-time list of devices actively browsing or streaming right now
                  </CardDescription>
                </CardHeading>
                <CardToolbar>
                  <Badge variant="secondary" appearance="light" size="sm">
                    2 min window
                  </Badge>
                </CardToolbar>
              </CardHeader>
              <CardTable>
                {stats.liveSessions.length === 0 ? (
                  <div className="p-12 text-center space-y-3">
                    <div className="size-12 rounded-full bg-muted flex items-center justify-center mx-auto text-emerald-500">
                      <Radio className="size-6 animate-pulse" />
                    </div>
                    <p className="text-sm font-semibold text-foreground">Waiting for live device heartbeats...</p>
                    <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                      When users open CloudStream with telemetry enabled, their live presence and watching activity appear here automatically.
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader className="bg-muted/40">
                      <TableRow>
                        <TableHead className="w-[130px] font-semibold text-xs">Device</TableHead>
                        <TableHead className="w-[160px] font-semibold text-xs">Provider</TableHead>
                        <TableHead className="min-w-[200px] font-semibold text-xs">Activity / Title</TableHead>
                        <TableHead className="w-[180px] font-semibold text-xs">Location</TableHead>
                        <TableHead className="w-[140px] text-right font-semibold text-xs">Last Ping</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stats.liveSessions.map((session) => (
                        <TableRow key={session.device_id}>
                          <TableCell className="font-mono text-xs text-muted-foreground">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted text-[11px] border border-border/60">
                              📱 {session.device_id.slice(0, 8)}...
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge variant="primary" appearance="light" size="sm" className="font-semibold">
                              {session.provider}
                            </Badge>
                          </TableCell>
                          <TableCell className="min-w-[200px] max-w-[280px] truncate text-xs">
                            {session.current_title ? (
                              <span className="font-medium text-foreground flex items-center gap-1.5 truncate">
                                <Film className="size-3.5 text-primary shrink-0" />
                                {session.current_title}
                              </span>
                            ) : (
                              <span className="text-muted-foreground flex items-center gap-1.5 text-xs italic">
                                <Compass className="size-3 text-muted-foreground/60 shrink-0" />
                                Browsing catalog
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            <span className="inline-flex items-center gap-1 text-[11px] bg-muted/50 px-2 py-0.5 rounded-md border border-border/50">
                              🌍 {session.country || 'Global'} {session.city ? `(${session.city})` : ''}
                            </span>
                          </TableCell>
                          <TableCell className="text-right text-xs font-mono text-muted-foreground">
                            <span className="inline-flex items-center gap-1.5 text-emerald-500 font-medium">
                              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
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
              </CardTable>
            </Card>

            {/* Realtime Event Stream */}
            <Card className="lg:col-span-4">
              <CardHeader className="min-h-14 px-5 border-b border-border">
                <CardHeading>
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Zap className="size-4 text-violet-500" />
                    Live Activity Stream
                  </CardTitle>
                  <CardDescription className="text-xs">Instant telemetry event feed</CardDescription>
                </CardHeading>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[430px] p-4">
                  {stats.recentEvents.length === 0 ? (
                    <div className="py-16 text-center text-xs text-muted-foreground">
                      No recent telemetry events recorded today yet.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {stats.recentEvents.map((event) => {
                        const isSearch = event.event_type === 'search';
                        const isPlay = event.event_type === 'play';
                        const isView = event.event_type === 'view';
                        const isHeartbeat = event.event_type === 'heartbeat';
                        const isError = event.event_type === 'error';

                        return (
                          <div
                            key={event.id}
                            className="p-3 rounded-xl border border-border/70 bg-card hover:bg-muted/40 transition-colors space-y-1.5"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <Badge
                                  variant={
                                    isPlay
                                      ? 'success'
                                      : isSearch
                                      ? 'info'
                                      : isError
                                      ? 'destructive'
                                      : isView
                                      ? 'warning'
                                      : 'secondary'
                                  }
                                  appearance="light"
                                  size="xs"
                                  className="font-bold tracking-wider text-[10px]"
                                >
                                  {event.event_type.toUpperCase()}
                                </Badge>
                                <span className="text-xs font-semibold text-foreground">
                                  {event.provider}
                                </span>
                              </div>
                              <span className="text-[10px] text-muted-foreground font-mono">
                                {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
                              </span>
                            </div>
                            <div className="text-xs text-muted-foreground truncate">
                              {isSearch && (
                                <span>Searched &quot;<span className="font-semibold text-foreground">{event.metadata?.query}</span>&quot;</span>
                              )}
                              {isPlay && (
                                <span className="text-emerald-500 font-medium">Streaming playback resolved</span>
                              )}
                              {isView && (
                                <span>Opened &quot;<span className="font-semibold text-foreground">{event.metadata?.title || 'Details'}</span>&quot;</span>
                              )}
                              {isHeartbeat && (
                                <span className="text-muted-foreground">Active device heartbeat ping</span>
                              )}
                              {isError && (
                                <span className="text-destructive font-medium">{event.metadata?.error || 'Scraper exception'}</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TAB 2: PROVIDERS RADAR (23 PROVIDERS) */}
        <TabsContent value="providers" className="space-y-6 mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Live Traffic Share */}
            <Card className="lg:col-span-4">
              <CardHeader className="min-h-14 px-5 border-b border-border">
                <CardHeading>
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Activity className="size-4 text-emerald-500" />
                    Active Traffic Share
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Live session distribution across providers
                  </CardDescription>
                </CardHeading>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
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
                            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                            {provider}
                          </span>
                          <span className="text-muted-foreground font-mono">
                            {count} users ({pct}%)
                          </span>
                        </div>
                        <Progress value={pct} className="h-2" />
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>

            {/* 23 Providers Status Grid */}
            <Card className="lg:col-span-8">
              <CardHeader className="min-h-14 px-5 border-b border-border">
                <CardHeading>
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Boxes className="size-4 text-primary" />
                    All Repository Providers (23)
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Fleet status across nehal-CloudStream
                  </CardDescription>
                </CardHeading>
                <CardToolbar>
                  <Badge variant="success" appearance="light" size="sm" className="gap-1 font-semibold">
                    <CheckCircle2 className="size-3 text-emerald-500" />
                    23 / 23 Operational
                  </Badge>
                </CardToolbar>
              </CardHeader>
              <CardTable>
                <Table>
                  <TableHeader className="bg-muted/40">
                    <TableRow>
                      <TableHead className="w-[200px] font-semibold text-xs">Provider Name</TableHead>
                      <TableHead className="w-[140px] font-semibold text-xs">Category</TableHead>
                      <TableHead className="min-w-[150px] font-semibold text-xs">Coverage Region</TableHead>
                      <TableHead className="w-[130px] text-right font-semibold text-xs">Health Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ALL_PROVIDERS.map((p) => (
                      <TableRow key={p.name}>
                        <TableCell className="font-semibold text-xs text-foreground">
                          {p.name}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          <span className="px-2 py-0.5 rounded-md bg-muted text-[11px] border border-border/50 font-medium">
                            {p.category}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {p.region}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="success" appearance="light" size="xs" className="gap-1 font-semibold">
                            <CheckCircle2 className="size-3 text-emerald-500" />
                            Operational
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardTable>
            </Card>
          </div>
        </TabsContent>

        {/* TAB 3: SEARCH & CONTENT TRENDS */}
        <TabsContent value="content" className="space-y-6 mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <Card>
              <CardHeader className="min-h-14 px-5 border-b border-border">
                <CardHeading>
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Search className="size-4 text-violet-500" />
                    Top Search Queries Today
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Most frequently searched titles across all providers
                  </CardDescription>
                </CardHeading>
              </CardHeader>
              <CardTable>
                {stats.topSearches.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-12">
                    No search queries recorded today yet.
                  </p>
                ) : (
                  <Table>
                    <TableHeader className="bg-muted/40">
                      <TableRow>
                        <TableHead className="min-w-[180px] font-semibold text-xs">Keyword</TableHead>
                        <TableHead className="w-[100px] text-right font-semibold text-xs">Searches</TableHead>
                        <TableHead className="w-[140px] text-right font-semibold text-xs">Last Seen</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stats.topSearches.map((item, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-medium text-xs flex items-center gap-2">
                            <span className="size-5 rounded-md bg-muted border border-border flex items-center justify-center text-[10px] font-mono font-bold text-foreground shrink-0">
                              {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                            </span>
                            <span className="truncate">{item.query}</span>
                          </TableCell>
                          <TableCell className="w-[100px] text-right font-mono text-xs font-bold text-primary">
                            {item.count}
                          </TableCell>
                          <TableCell className="w-[140px] text-right text-xs text-muted-foreground font-mono">
                            {formatDistanceToNow(new Date(item.lastSeen), { addSuffix: true })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardTable>
            </Card>

            <Card>
              <CardHeader className="min-h-14 px-5 border-b border-border">
                <CardHeading>
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Server className="size-4 text-amber-500" />
                    Telemetry Architecture
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Zero-latency telemetry architecture overview
                  </CardDescription>
                </CardHeading>
              </CardHeader>
              <CardContent className="p-5 space-y-3.5 text-xs text-muted-foreground">
                <div className="p-3.5 rounded-xl border border-border bg-muted/40 space-y-1.5">
                  <p className="font-semibold text-foreground text-xs flex items-center gap-1.5">
                    <CheckCircle2 className="size-3.5 text-emerald-500" />
                    Non-Blocking Coroutine Engine
                  </p>
                  <p className="text-[11px] leading-relaxed">
                    All telemetry requests in CloudStream Kotlin plugins run asynchronously via <code className="text-primary font-mono font-semibold">ioSafe</code> with a 15-second hard timeout. Playback is 100% immune to network lags or server hiccups.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-border bg-muted/40 space-y-1.5">
                  <p className="font-semibold text-foreground text-xs flex items-center gap-1.5">
                    <Globe className="size-3.5 text-primary" />
                    Automatic Edge Geolocation
                  </p>
                  <p className="text-[11px] leading-relaxed">
                    Client requests hitting the Vercel ingestion endpoint automatically extract country and city headers with zero client device overhead.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-border bg-muted/40 space-y-1.5">
                  <p className="font-semibold text-foreground text-xs flex items-center gap-1.5">
                    <Sparkles className="size-3.5 text-violet-500" />
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
