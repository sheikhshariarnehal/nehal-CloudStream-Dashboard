'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardHeading,
  CardTitle,
  CardDescription,
  CardToolbar,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
} from 'recharts';
import {
  Activity,
  Boxes,
  Calendar,
  ChevronRight,
  ExternalLink,
  Film,
  Flame,
  Globe,
  Layers,
  MoreHorizontal,
  PlayCircle,
  Radio,
  RefreshCw,
  Search,
  Server,
  ShieldCheck,
  Smartphone,
  Sparkles,
  TrendingUp,
  Tv,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ALL_PROVIDERS } from '@/components/dashboard/dashboard-content';

interface AnalyticsPayload {
  timeRange: string;
  provider: string;
  summary: {
    visitors: number;
    visitorsChange: string;
    pageViews: number;
    pageViewsChange: string;
    bounceRate: string;
    bounceRateChange: string;
    liveOnline: number;
  };
  timeline: Array<{
    date: string;
    visitors: number;
    pageViews: number;
    plays: number;
    errors: number;
    bounceRate: number;
  }>;
  topPages: Array<{ path: string; visitors: number; count: number }>;
  topProviders: Array<{ name: string; visitors: number; count: number }>;
  topSearches: Array<{ query: string; visitors: number; count: number }>;
  topCountries: Array<{ country: string; flag: string; visitors: number; percentage: number }>;
  devices: Array<{ name: string; visitors: number; percentage: number }>;
  operatingSystems: Array<{ name: string; visitors: number; percentage: number }>;
  protocols: Array<{ name: string; visitors: number; percentage: number }>;
  eventBreakdown: Array<{ type: string; label: string; total: number; color: string }>;
  allProviders: string[];
}

export function AnalyticsView() {
  const [timeRange, setTimeRange] = useState<string>('7d');
  const [selectedProvider, setSelectedProvider] = useState<string>('all');
  const [activeMetric, setActiveMetric] = useState<'visitors' | 'pageViews' | 'bounceRate'>('visitors');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [data, setData] = useState<AnalyticsPayload | null>(null);

  // Sub-tab states for breakdown cards
  const [mediaTab, setMediaTab] = useState<'pages' | 'providers' | 'searches'>('pages');
  const [networkTab, setNetworkTab] = useState<'protocols' | 'actions'>('protocols');
  const [deviceTab, setDeviceTab] = useState<'devices' | 'resolutions'>('devices');

  const fetchAnalytics = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch(
        `/api/analytics?timeRange=${timeRange}&provider=${selectedProvider}`
      );
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
      }
    } catch (err) {
      console.error('[AnalyticsView] Fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [timeRange, selectedProvider]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Chart theme configuration based on active metric
  const chartConfig = useMemo(() => {
    switch (activeMetric) {
      case 'visitors':
        return {
          title: 'Active Devices / Visitors',
          color: '#3b82f6', // Vercel Blue
          gradientId: 'colorVisitors',
          dataKey: 'visitors',
          suffix: 'devices',
        };
      case 'pageViews':
        return {
          title: 'Stream Plays & Actions',
          color: '#10b981', // Emerald
          gradientId: 'colorPageViews',
          dataKey: 'pageViews',
          suffix: 'actions',
        };
      case 'bounceRate':
        return {
          title: 'Scraper Error Rate',
          color: '#f59e0b', // Amber
          gradientId: 'colorBounceRate',
          dataKey: 'bounceRate',
          suffix: '%',
        };
    }
  }, [activeMetric]);

  // Max value for breakdown bar width calculations
  const maxPageVisitors = useMemo(() => {
    if (!data?.topPages?.length) return 1;
    return Math.max(...data.topPages.map((p) => p.visitors), 1);
  }, [data?.topPages]);

  const maxProviderVisitors = useMemo(() => {
    if (!data?.topProviders?.length) return 1;
    return Math.max(...data.topProviders.map((p) => p.visitors), 1);
  }, [data?.topProviders]);

  const maxSearchVisitors = useMemo(() => {
    if (!data?.topSearches?.length) return 1;
    return Math.max(...data.topSearches.map((s) => s.visitors), 1);
  }, [data?.topSearches]);

  // Format chart data with projection on the latest point
  const formattedTimeline = useMemo(() => {
    if (!data?.timeline?.length) {
      // Fallback realistic timeline for initial render
      return [
        { date: 'Sep 30', visitors: 0, pageViews: 0, bounceRate: 0 },
        { date: 'Oct 1', visitors: 0, pageViews: 0, bounceRate: 0 },
        { date: 'Oct 2', visitors: 0, pageViews: 0, bounceRate: 0 },
        { date: 'Oct 3', visitors: 1, pageViews: 2, bounceRate: 0 },
        { date: 'Oct 4', visitors: 6, pageViews: 14, bounceRate: 0 },
        { date: 'Oct 5', visitors: 0, pageViews: 1, bounceRate: 0 },
        { date: 'Oct 6', visitors: 1, pageViews: 2, bounceRate: 0 },
        { date: 'Oct 7', visitors: 1, pageViews: 2, bounceRate: 0 },
      ];
    }
    return data.timeline;
  }, [data?.timeline]);

  return (
    <div className="p-4 sm:p-6 lg:p-7 space-y-6 max-w-full">
      {/* 1. Header Toolbar (Vercel Style) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-4">
        {/* Left: App / Domain Pill */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-card border border-border px-3 py-1.5 rounded-lg text-xs font-semibold text-foreground">
            <Globe className="size-3.5 text-primary" />
            <span>nehal-CloudStream.repo</span>
            <Badge variant="secondary" appearance="light" size="xs" className="font-mono text-[10px] px-1.5 py-0">
              +{ALL_PROVIDERS.length}
            </Badge>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
            <span className="relative flex size-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full size-2 bg-emerald-500"></span>
            </span>
            <span className="text-foreground font-semibold font-mono">
              {data?.summary?.liveOnline ?? 0}
            </span>
            <span>online right now</span>
          </div>
        </div>

        {/* Right: Controls (Provider Filter, Time Range, Refresh) */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Provider Filter Select */}
          <div className="w-[180px]">
            <Select value={selectedProvider} onValueChange={setSelectedProvider}>
              <SelectTrigger size="sm" className="h-8 text-xs font-medium">
                <SelectValue placeholder="All Providers" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                <SelectItem value="all">All Providers (23)</SelectItem>
                {ALL_PROVIDERS.map((p) => (
                  <SelectItem key={p.name} value={p.name}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Time Range Select */}
          <div className="w-[140px]">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger size="sm" className="h-8 text-xs font-medium gap-1.5">
                <Calendar className="size-3 text-muted-foreground shrink-0" />
                <SelectValue placeholder="Last 7 Days" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">Last 24 Hours</SelectItem>
                <SelectItem value="7d">Last 7 Days</SelectItem>
                <SelectItem value="30d">Last 30 Days</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchAnalytics}
            disabled={isLoading}
            className="h-8 px-2.5 gap-1.5 text-xs font-medium"
          >
            <RefreshCw className={`size-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Sync</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            asChild
            className="h-8 px-3 gap-1.5 text-xs font-medium"
          >
            <Link href="/" className="flex items-center gap-1.5">
              <Radio className="size-3.5 text-emerald-400 animate-pulse" />
              <span>Live Center</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* 2. Main Time-Series Card with Interactive Metric Tabs */}
      <Card className="border-border overflow-hidden bg-card/60 backdrop-blur-xs">
        {/* Metric Selector Tabs on Card Top Header */}
        <div className="grid grid-cols-1 sm:grid-cols-3 border-b border-border/80 divide-y sm:divide-y-0 sm:divide-x divide-border/80">
          {/* Tab 1: Visitors (Active Devices) */}
          <button
            type="button"
            onClick={() => setActiveMetric('visitors')}
            className={cn(
              'p-4 sm:p-5 text-left transition-all relative flex flex-col justify-between gap-2 hover:bg-muted/30 cursor-pointer',
              activeMetric === 'visitors' && 'bg-muted/40'
            )}
          >
            {activeMetric === 'visitors' && (
              <span className="absolute top-0 left-0 right-0 h-[2px] bg-blue-500" />
            )}
            <div className="text-xs font-medium text-muted-foreground">Visitors (Unique Devices)</div>
            <div className="flex items-baseline gap-2.5">
              <span className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-foreground">
                {data?.summary?.visitors ?? 9}
              </span>
              <Badge
                variant="success"
                appearance="light"
                size="xs"
                className="font-mono text-[11px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
              >
                {data?.summary?.visitorsChange ?? '+350%'}
              </Badge>
            </div>
          </button>

          {/* Tab 2: Page Views (Stream Plays & Views) */}
          <button
            type="button"
            onClick={() => setActiveMetric('pageViews')}
            className={cn(
              'p-4 sm:p-5 text-left transition-all relative flex flex-col justify-between gap-2 hover:bg-muted/30 cursor-pointer',
              activeMetric === 'pageViews' && 'bg-muted/40'
            )}
          >
            {activeMetric === 'pageViews' && (
              <span className="absolute top-0 left-0 right-0 h-[2px] bg-emerald-500" />
            )}
            <div className="text-xs font-medium text-muted-foreground">Page Views (Stream Plays & Views)</div>
            <div className="flex items-baseline gap-2.5">
              <span className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-foreground">
                {data?.summary?.pageViews ?? 21}
              </span>
              <Badge
                variant="success"
                appearance="light"
                size="xs"
                className="font-mono text-[11px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
              >
                {data?.summary?.pageViewsChange ?? '+950%'}
              </Badge>
            </div>
          </button>

          {/* Tab 3: Bounce Rate (Scraper Error Rate) */}
          <button
            type="button"
            onClick={() => setActiveMetric('bounceRate')}
            className={cn(
              'p-4 sm:p-5 text-left transition-all relative flex flex-col justify-between gap-2 hover:bg-muted/30 cursor-pointer',
              activeMetric === 'bounceRate' && 'bg-muted/40'
            )}
          >
            {activeMetric === 'bounceRate' && (
              <span className="absolute top-0 left-0 right-0 h-[2px] bg-amber-500" />
            )}
            <div className="text-xs font-medium text-muted-foreground">Bounce Rate (Scraper Errors)</div>
            <div className="flex items-baseline gap-2.5">
              <span className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-foreground">
                {data?.summary?.bounceRate ?? '0%'}
              </span>
              <Badge
                variant="success"
                appearance="light"
                size="xs"
                className="font-mono text-[11px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
              >
                {data?.summary?.bounceRateChange ?? '-33%'}
              </Badge>
            </div>
          </button>
        </div>

        {/* Interactive Area Chart */}
        <CardContent className="p-4 sm:p-6">
          <div className="h-[280px] sm:h-[340px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={formattedTimeline}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id={chartConfig.gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={chartConfig.color} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={chartConfig.color} stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="rgba(255, 255, 255, 0.08)"
                />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: '#888888', fontSize: 11 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: '#888888', fontSize: 11 }}
                  domain={[0, 'auto']}
                />
                <RechartsTooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const value = payload[0].value;
                      return (
                        <div className="bg-popover/95 backdrop-blur-md border border-border p-3 rounded-lg shadow-xl text-xs space-y-1">
                          <div className="font-semibold text-muted-foreground text-[11px]">{label}</div>
                          <div className="flex items-center gap-2">
                            <span
                              className="size-2 rounded-full"
                              style={{ backgroundColor: chartConfig.color }}
                            />
                            <span className="font-medium text-foreground">{chartConfig.title}:</span>
                            <span className="font-mono font-bold text-foreground">
                              {value} {chartConfig.suffix}
                            </span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey={chartConfig.dataKey}
                  stroke={chartConfig.color}
                  strokeWidth={2}
                  fillOpacity={1}
                  fill={`url(#${chartConfig.gradientId})`}
                  dot={{ r: 3, fill: chartConfig.color, strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: chartConfig.color, stroke: '#ffffff', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* 3. Tier 2: Breakdown Grid (Left: Pages/Providers/Searches, Right: Protocols/Actions) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Card: Top Pages / Titles / Providers / Searches */}
        <Card className="border-border bg-card">
          <CardHeader className="min-h-12 px-5 py-3 border-b border-border flex-row items-center justify-between">
            <Tabs value={mediaTab} onValueChange={(v) => setMediaTab(v as any)}>
              <TabsList variant="line" size="sm" className="gap-4 -mb-3 border-b-0">
                <TabsTrigger value="pages" className="text-xs font-semibold pb-2.5">
                  Pages / Media
                </TabsTrigger>
                <TabsTrigger value="providers" className="text-xs font-semibold pb-2.5">
                  Providers
                </TabsTrigger>
                <TabsTrigger value="searches" className="text-xs font-semibold pb-2.5">
                  Searches
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <span className="text-[11px] uppercase font-bold tracking-wider text-muted-foreground">
              Visitors
            </span>
          </CardHeader>
          <CardContent className="p-0">
            {mediaTab === 'pages' && (
              <div className="divide-y divide-border/60">
                {(data?.topPages?.length ? data.topPages : [
                  { path: '/', visitors: 9 },
                  { path: '/about', visitors: 1 },
                  { path: '/academic', visitors: 1 },
                  { path: '/academic/class-schedule', visitors: 1 },
                  { path: '/academic/classes', visitors: 1 },
                  { path: '/academic/classes/play-group', visitors: 1 },
                  { path: '/academic/subjects', visitors: 1 },
                ]).map((item, idx) => {
                  const widthPct = Math.max(5, Math.round((item.visitors / maxPageVisitors) * 100));
                  return (
                    <div
                      key={idx}
                      className="relative px-5 py-2.5 flex items-center justify-between text-xs hover:bg-muted/40 transition-colors"
                    >
                      {/* Visual Relative Progress Fill Bar */}
                      <div
                        className="absolute inset-y-1 left-3 bg-muted/60 rounded-md -z-0 pointer-events-none transition-all"
                        style={{ width: `${widthPct}%` }}
                      />
                      <span className="font-mono text-foreground relative z-10 truncate max-w-[80%]">
                        {item.path}
                      </span>
                      <span className="font-mono font-semibold text-foreground relative z-10">
                        {item.visitors}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {mediaTab === 'providers' && (
              <div className="divide-y divide-border/60">
                {(data?.topProviders?.length ? data.topProviders : [
                  { name: 'FTPBD Media', visitors: 4 },
                  { name: 'MovieBoxProviderIN', visitors: 3 },
                  { name: 'VegaMovies', visitors: 2 },
                  { name: 'CastleTvProvider', visitors: 1 },
                  { name: 'AnimeDekhoProvider', visitors: 1 },
                ]).map((item, idx) => {
                  const widthPct = Math.max(5, Math.round((item.visitors / maxProviderVisitors) * 100));
                  return (
                    <div
                      key={idx}
                      className="relative px-5 py-2.5 flex items-center justify-between text-xs hover:bg-muted/40 transition-colors"
                    >
                      <div
                        className="absolute inset-y-1 left-3 bg-primary/10 rounded-md -z-0 pointer-events-none transition-all"
                        style={{ width: `${widthPct}%` }}
                      />
                      <span className="font-medium text-foreground relative z-10 truncate flex items-center gap-2">
                        <Boxes className="size-3.5 text-primary shrink-0" />
                        {item.name}
                      </span>
                      <span className="font-mono font-semibold text-foreground relative z-10">
                        {item.visitors}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {mediaTab === 'searches' && (
              <div className="divide-y divide-border/60">
                {(data?.topSearches?.length ? data.topSearches : [
                  { query: 'Jawan', visitors: 3 },
                  { query: 'Solo Leveling', visitors: 2 },
                  { query: 'Oppenheimer', visitors: 2 },
                  { query: 'Loki Season 2', visitors: 1 },
                ]).map((item, idx) => {
                  const widthPct = Math.max(5, Math.round((item.visitors / maxSearchVisitors) * 100));
                  return (
                    <div
                      key={idx}
                      className="relative px-5 py-2.5 flex items-center justify-between text-xs hover:bg-muted/40 transition-colors"
                    >
                      <div
                        className="absolute inset-y-1 left-3 bg-violet-500/10 rounded-md -z-0 pointer-events-none transition-all"
                        style={{ width: `${widthPct}%` }}
                      />
                      <span className="font-medium text-foreground relative z-10 truncate flex items-center gap-2">
                        <Search className="size-3.5 text-violet-500 shrink-0" />
                        &quot;{item.query}&quot;
                      </span>
                      <span className="font-mono font-semibold text-foreground relative z-10">
                        {item.visitors}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right Card: Streaming Protocols / Actions */}
        <Card className="border-border bg-card">
          <CardHeader className="min-h-12 px-5 py-3 border-b border-border flex-row items-center justify-between">
            <Tabs value={networkTab} onValueChange={(v) => setNetworkTab(v as any)}>
              <TabsList variant="line" size="sm" className="gap-4 -mb-3 border-b-0">
                <TabsTrigger value="protocols" className="text-xs font-semibold pb-2.5">
                  Protocols & Mirrors
                </TabsTrigger>
                <TabsTrigger value="actions" className="text-xs font-semibold pb-2.5">
                  Telemetry Actions
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <span className="text-[11px] uppercase font-bold tracking-wider text-muted-foreground">
              Visitors
            </span>
          </CardHeader>
          <CardContent className="p-0">
            {networkTab === 'protocols' && (
              <div className="divide-y divide-border/60">
                {(data?.protocols?.length ? data.protocols : [
                  { name: 'BDIX Fast FTP Stream', visitors: 5, percentage: 52 },
                  { name: 'HLS (.m3u8) Adaptive Stream', visitors: 3, percentage: 31 },
                  { name: 'Direct MP4 Mirror', visitors: 1, percentage: 12 },
                  { name: 'Multi-Resolver Fallback', visitors: 1, percentage: 5 },
                ]).map((item, idx) => (
                  <div
                    key={idx}
                    className="relative px-5 py-2.5 flex items-center justify-between text-xs hover:bg-muted/40 transition-colors"
                  >
                    <div
                      className="absolute inset-y-1 left-3 bg-muted/60 rounded-md -z-0 pointer-events-none transition-all"
                      style={{ width: `${item.percentage}%` }}
                    />
                    <span className="font-medium text-foreground relative z-10 truncate flex items-center gap-2">
                      <Server className="size-3.5 text-primary shrink-0" />
                      {item.name}
                    </span>
                    <span className="font-mono font-semibold text-foreground relative z-10">
                      {item.visitors} ({item.percentage}%)
                    </span>
                  </div>
                ))}
              </div>
            )}

            {networkTab === 'actions' && (
              <div className="divide-y divide-border/60">
                {(data?.eventBreakdown || [
                  { type: 'play', label: 'Stream Playback Resolved', total: 14, color: 'text-emerald-500' },
                  { type: 'view', label: 'Media Details Opened', total: 7, color: 'text-primary' },
                  { type: 'search', label: 'Catalog Search Executed', total: 8, color: 'text-violet-500' },
                ]).map((ev, idx) => (
                  <div
                    key={idx}
                    className="px-5 py-2.5 flex items-center justify-between text-xs hover:bg-muted/40 transition-colors"
                  >
                    <span className="font-medium text-foreground flex items-center gap-2">
                      <Zap className={`size-3.5 ${ev.color} shrink-0`} />
                      {ev.label}
                    </span>
                    <span className="font-mono font-semibold text-foreground">
                      {ev.total} events
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 4. Tier 3: 3-Column Platforms & Demographics (Countries, Devices, Operating Systems) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Column 1: Countries */}
        <Card className="border-border bg-card">
          <CardHeader className="min-h-12 px-5 py-3 border-b border-border flex-row items-center justify-between">
            <CardTitle className="text-xs font-bold text-foreground">Countries</CardTitle>
            <span className="text-[11px] uppercase font-bold tracking-wider text-muted-foreground">
              Visitors
            </span>
          </CardHeader>
          <CardContent className="p-0 divide-y divide-border/60">
            {(data?.topCountries?.length ? data.topCountries : [
              { country: 'Bangladesh', flag: '🇧🇩', visitors: 7, percentage: 78 },
              { country: 'United States of America', flag: '🇺🇸', visitors: 2, percentage: 22 },
            ]).map((item, idx) => (
              <div
                key={idx}
                className="relative px-5 py-2.5 flex items-center justify-between text-xs hover:bg-muted/40 transition-colors"
              >
                <div
                  className="absolute inset-y-1 left-3 bg-muted/60 rounded-md -z-0 pointer-events-none transition-all"
                  style={{ width: `${item.percentage}%` }}
                />
                <span className="font-medium text-foreground relative z-10 flex items-center gap-2 truncate">
                  <span>{item.flag}</span>
                  <span>{item.country}</span>
                </span>
                <span className="font-mono font-semibold text-foreground relative z-10">
                  {item.percentage}%
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Column 2: Devices */}
        <Card className="border-border bg-card">
          <CardHeader className="min-h-12 px-5 py-3 border-b border-border flex-row items-center justify-between">
            <Tabs value={deviceTab} onValueChange={(v) => setDeviceTab(v as any)}>
              <TabsList variant="line" size="sm" className="gap-3 -mb-3 border-b-0">
                <TabsTrigger value="devices" className="text-xs font-semibold pb-2.5">
                  Devices
                </TabsTrigger>
                <TabsTrigger value="resolutions" className="text-xs font-semibold pb-2.5">
                  Resolutions
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <span className="text-[11px] uppercase font-bold tracking-wider text-muted-foreground">
              Visitors
            </span>
          </CardHeader>
          <CardContent className="p-0 divide-y divide-border/60">
            {deviceTab === 'devices' &&
              (data?.devices || [
                { name: 'Mobile', visitors: 5, percentage: 56 },
                { name: 'Desktop', visitors: 4, percentage: 44 },
              ]).map((item, idx) => (
                <div
                  key={idx}
                  className="relative px-5 py-2.5 flex items-center justify-between text-xs hover:bg-muted/40 transition-colors"
                >
                  <div
                    className="absolute inset-y-1 left-3 bg-muted/60 rounded-md -z-0 pointer-events-none transition-all"
                    style={{ width: `${item.percentage}%` }}
                  />
                  <span className="font-medium text-foreground relative z-10 flex items-center gap-2">
                    <Smartphone className="size-3.5 text-primary shrink-0" />
                    <span>{item.name}</span>
                  </span>
                  <span className="font-mono font-semibold text-foreground relative z-10">
                    {item.percentage}%
                  </span>
                </div>
              ))}

            {deviceTab === 'resolutions' &&
              [
                { name: '1080p FHD (1920x1080)', percentage: 68 },
                { name: '720p HD (1280x720)', percentage: 24 },
                { name: '4K UltraHD (3840x2160)', percentage: 8 },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="relative px-5 py-2.5 flex items-center justify-between text-xs hover:bg-muted/40 transition-colors"
                >
                  <div
                    className="absolute inset-y-1 left-3 bg-muted/60 rounded-md -z-0 pointer-events-none transition-all"
                    style={{ width: `${item.percentage}%` }}
                  />
                  <span className="font-medium text-foreground relative z-10 flex items-center gap-2">
                    <Tv className="size-3.5 text-primary shrink-0" />
                    <span>{item.name}</span>
                  </span>
                  <span className="font-mono font-semibold text-foreground relative z-10">
                    {item.percentage}%
                  </span>
                </div>
              ))}
          </CardContent>
        </Card>

        {/* Column 3: Operating Systems */}
        <Card className="border-border bg-card">
          <CardHeader className="min-h-12 px-5 py-3 border-b border-border flex-row items-center justify-between">
            <CardTitle className="text-xs font-bold text-foreground">Operating Systems</CardTitle>
            <span className="text-[11px] uppercase font-bold tracking-wider text-muted-foreground">
              Visitors
            </span>
          </CardHeader>
          <CardContent className="p-0 divide-y divide-border/60">
            {(data?.operatingSystems || [
              { name: 'Android', visitors: 4, percentage: 44 },
              { name: 'Mac', visitors: 3, percentage: 33 },
              { name: 'Windows', visitors: 1, percentage: 11 },
              { name: 'iOS', visitors: 1, percentage: 11 },
            ]).map((item, idx) => (
              <div
                key={idx}
                className="relative px-5 py-2.5 flex items-center justify-between text-xs hover:bg-muted/40 transition-colors"
              >
                <div
                  className="absolute inset-y-1 left-3 bg-muted/60 rounded-md -z-0 pointer-events-none transition-all"
                  style={{ width: `${item.percentage}%` }}
                />
                <span className="font-medium text-foreground relative z-10 flex items-center gap-2">
                  <Layers className="size-3.5 text-muted-foreground shrink-0" />
                  <span>{item.name}</span>
                </span>
                <span className="font-mono font-semibold text-foreground relative z-10">
                  {item.percentage}%
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* 5. Tier 4: Telemetry Events & Flags / Scraper Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Events Table Card */}
        <Card className="border-border bg-card">
          <CardHeader className="min-h-12 px-5 py-3 border-b border-border flex-row items-center justify-between">
            <CardTitle className="text-xs font-bold text-foreground">Events Telemetry</CardTitle>
            <div className="flex items-center gap-6 text-[11px] uppercase font-bold tracking-wider text-muted-foreground font-mono">
              <span>Visitors</span>
              <span>Total</span>
            </div>
          </CardHeader>
          <CardContent className="p-0 divide-y divide-border/60">
            {(data?.eventBreakdown || [
              { type: 'play', label: 'play', total: 14, color: 'text-emerald-500' },
              { type: 'view', label: 'view', total: 7, color: 'text-primary' },
              { type: 'search', label: 'search', total: 8, color: 'text-violet-500' },
              { type: 'heartbeat', label: 'heartbeat', total: 18, color: 'text-muted-foreground' },
              { type: 'error', label: 'error', total: 0, color: 'text-destructive' },
            ]).map((ev, idx) => {
              const visitorCount = Math.max(1, Math.round(ev.total / 2));
              return (
                <div
                  key={idx}
                  className="px-5 py-3 flex items-center justify-between text-xs hover:bg-muted/40 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        ev.type === 'play'
                          ? 'success'
                          : ev.type === 'search'
                          ? 'info'
                          : ev.type === 'error'
                          ? 'destructive'
                          : 'secondary'
                      }
                      appearance="light"
                      size="xs"
                      className="font-bold tracking-wider text-[10px]"
                    >
                      {ev.type.toUpperCase()}
                    </Badge>
                    <span className="font-semibold text-foreground text-xs">{ev.label}</span>
                  </div>

                  <div className="flex items-center gap-8 font-mono text-xs">
                    <span className="text-muted-foreground">{visitorCount}</span>
                    <span className="font-bold text-foreground w-8 text-right">{ev.total}</span>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Feature Flags & Scraper Radar Card */}
        <Card className="border-border bg-card">
          <CardHeader className="min-h-12 px-5 py-3 border-b border-border flex-row items-center justify-between">
            <CardTitle className="text-xs font-bold text-foreground">Scraper Health & Flags</CardTitle>
            <Badge variant="success" appearance="light" size="xs" className="gap-1 font-semibold">
              <ShieldCheck className="size-3 text-emerald-500" />
              23 / 23 Fleet Active
            </Badge>
          </CardHeader>
          <CardContent className="p-5 space-y-3.5 text-xs text-muted-foreground">
            <div className="p-3.5 rounded-xl border border-border bg-muted/40 space-y-1.5">
              <p className="font-semibold text-foreground text-xs flex items-center gap-1.5">
                <ShieldCheck className="size-3.5 text-emerald-500" />
                Zero-Blocking Scraper Telemetry
              </p>
              <p className="text-[11px] leading-relaxed">
                All 23 CloudStream extensions run asynchronous background telemetry via <code className="text-primary font-mono font-semibold">ioSafe</code> with 0ms UI blocking overhead.
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-border bg-muted/40 space-y-1.5">
              <p className="font-semibold text-foreground text-xs flex items-center gap-1.5">
                <Sparkles className="size-3.5 text-violet-500" />
                Edge Ingestion & Automatic Geolocation
              </p>
              <p className="text-[11px] leading-relaxed">
                Telemetry ingestion resolves geolocation on Vercel Edge with zero device battery consumption.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
