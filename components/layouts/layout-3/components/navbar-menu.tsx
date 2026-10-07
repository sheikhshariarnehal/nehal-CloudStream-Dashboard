'use client';

import { Activity, Boxes, Radio, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function NavbarMenu() {
  return (
    <div className="flex items-center gap-2 overflow-x-auto py-1.5 scrollbar-none">
      <Badge
        variant="secondary"
        appearance="light"
        size="sm"
        className="gap-1.5 font-medium bg-muted/60 border border-border/80 text-foreground"
      >
        <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="font-semibold text-xs">23 Providers Monitored</span>
      </Badge>

      <Badge
        variant="secondary"
        appearance="light"
        size="sm"
        className="hidden md:inline-flex gap-1.5 font-medium bg-muted/60 border border-border/80 text-muted-foreground"
      >
        <Radio className="size-3 text-sky-400" />
        <span className="text-xs">Sub-second WebSocket Sync</span>
      </Badge>

      <Badge
        variant="secondary"
        appearance="light"
        size="sm"
        className="hidden lg:inline-flex gap-1.5 font-medium bg-muted/60 border border-border/80 text-muted-foreground"
      >
        <Sparkles className="size-3 text-violet-400" />
        <span className="text-xs">Automated 30-Day Retention</span>
      </Badge>
    </div>
  );
}
