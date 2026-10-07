'use client';

import {
  Activity,
  Boxes,
  Database,
  Flame,
  Github,
  Radio,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import Link from 'next/link';

export interface Item {
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  title: string;
  newTab?: boolean;
  active?: boolean;
}

export function SidebarMenu() {
  const items: Item[] = [
    {
      icon: Activity,
      path: '/layout-3',
      title: 'Command Center',
      active: true,
    },
    {
      icon: Radio,
      path: '/layout-3#sessions',
      title: 'Live Active Sessions',
    },
    {
      icon: Boxes,
      path: '/layout-3#providers',
      title: 'Providers Radar (23)',
    },
    {
      icon: Flame,
      path: '/layout-3#content',
      title: 'Trending Content & Searches',
    },
    {
      icon: Database,
      path: 'https://supabase.com/dashboard/project/zxghphjvwjmvrdjouziq',
      title: 'Supabase PostgreSQL Console',
      newTab: true,
    },
    {
      icon: Github,
      path: 'https://github.com/nehalDIU/nehal-CloudStream',
      title: 'CloudStream GitHub Repo',
      newTab: true,
    },
  ];

  return (
    <TooltipProvider>
      <div className="flex flex-col grow items-center py-3.5 lg:py-0 gap-2">
        {items.map((item, index) => (
          <Tooltip key={index}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                shape="circle"
                mode="icon"
                {...(item.active ? { 'data-state': 'open' } : {})}
                className={cn(
                  'data-[state=open]:bg-primary/10 data-[state=open]:border data-[state=open]:border-primary/30 data-[state=open]:text-primary',
                  'hover:bg-accent/60 hover:text-foreground transition-colors',
                )}
              >
                <Link
                  href={item.path || ''}
                  {...(item.newTab
                    ? { target: '_blank', rel: 'noopener noreferrer' }
                    : {})}
                >
                  <item.icon className="size-4.5!" />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">{item.title}</TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
}
