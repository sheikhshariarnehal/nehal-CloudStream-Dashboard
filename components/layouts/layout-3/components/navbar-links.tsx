'use client';

import { useEffect, useState } from 'react';
import { Clock, Radio } from 'lucide-react';
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
    <div className="flex items-center gap-3">
      <Badge variant="secondary" appearance="light" size="sm" className="gap-1.5 font-mono text-xs">
        <Clock className="size-3 text-muted-foreground" />
        <span>{timeStr || 'Live Sync'}</span>
      </Badge>

      <Badge variant="success" appearance="light" size="sm" className="hidden sm:inline-flex gap-1.5 font-medium">
        <Radio className="size-3 text-green-500 animate-pulse" />
        <span>Realtime Engine Active</span>
      </Badge>
    </div>
  );
}
