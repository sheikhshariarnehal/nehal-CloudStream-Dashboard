'use client';

import { useEffect, useState } from 'react';
import { Clock, Radio, Server } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function NavbarLinks() {
  const [timeStr, setTimeStr] = useState<string>('');

  useEffect(() => {
    const update = () => {
      setTimeStr(
        new Date().toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex items-center gap-2.5">
      <Badge
        variant="secondary"
        appearance="light"
        size="sm"
        className="gap-1.5 font-mono text-xs bg-muted/60 border border-border/80 text-foreground"
      >
        <Clock className="size-3 text-muted-foreground" />
        <span>{timeStr || 'Live Sync'}</span>
      </Badge>

      <Badge
        variant="success"
        appearance="light"
        size="sm"
        className="hidden sm:inline-flex gap-1.5 font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
      >
        <Radio className="size-3 text-emerald-400 animate-pulse" />
        <span>Live Engine Active</span>
      </Badge>
    </div>
  );
}
