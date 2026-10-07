'use client';

import { useEffect, useState } from 'react';
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

export function SidebarMenu() {
  const [activeTab, setActiveTab] = useState<string>('sessions');

  useEffect(() => {
    const parseRoute = () => {
      const hash = window.location.hash.toLowerCase().replace('#', '');
      const searchParams = new URLSearchParams(window.location.search);
      const tabParam = searchParams.get('tab')?.toLowerCase();
      const candidate = tabParam || hash || 'sessions';

      if (candidate === 'providers' || candidate === 'fleet') {
        setActiveTab('providers');
      } else if (candidate === 'content' || candidate === 'searches' || candidate === 'trending') {
        setActiveTab('content');
      } else {
        setActiveTab('sessions');
      }
    };

    parseRoute();
    window.addEventListener('hashchange', parseRoute);
    window.addEventListener('popstate', parseRoute);

    const handleSync = (e: CustomEvent<string>) => {
      if (e.detail) {
        const val = e.detail.toLowerCase().replace('#', '');
        if (val === 'providers' || val === 'fleet') {
          setActiveTab('providers');
        } else if (val === 'content' || val === 'searches' || val === 'trending') {
          setActiveTab('content');
        } else {
          setActiveTab('sessions');
        }
      }
    };
    window.addEventListener('dashboard-tab-change' as any, handleSync);

    return () => {
      window.removeEventListener('hashchange', parseRoute);
      window.removeEventListener('popstate', parseRoute);
      window.removeEventListener('dashboard-tab-change' as any, handleSync);
    };
  }, []);

  const items = [
    {
      icon: Activity,
      targetHash: 'sessions',
      title: 'Live Command Center',
      isActive: activeTab === 'sessions',
    },
    {
      icon: Radio,
      targetHash: 'sessions',
      title: 'Live Active Sessions & Feed',
      isActive: activeTab === 'sessions',
    },
    {
      icon: Boxes,
      targetHash: 'providers',
      title: 'Providers Radar (23 Fleet)',
      isActive: activeTab === 'providers',
    },
    {
      icon: Flame,
      targetHash: 'content',
      title: 'Top Searches & Trending Content',
      isActive: activeTab === 'content',
    },
    {
      icon: Database,
      href: 'https://supabase.com/dashboard/project/zxghphjvwjmvrdjouziq',
      title: 'Supabase PostgreSQL Console',
      newTab: true,
      isActive: false,
    },
    {
      icon: Github,
      href: 'https://github.com/nehalDIU/nehal-CloudStream',
      title: 'CloudStream GitHub Repo',
      newTab: true,
      isActive: false,
    },
  ];

  const handleItemClick = (item: typeof items[number]) => {
    if (item.newTab && item.href) {
      window.open(item.href, '_blank', 'noopener,noreferrer');
      return;
    }

    if (item.targetHash) {
      setActiveTab(item.targetHash);
      if (typeof window !== 'undefined') {
        window.history.replaceState(
          null,
          '',
          `${window.location.pathname}#${item.targetHash}`
        );
        window.dispatchEvent(
          new CustomEvent('dashboard-tab-change', { detail: item.targetHash })
        );
      }
    }
  };

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
                onClick={() => handleItemClick(item)}
                {...(item.isActive ? { 'data-state': 'open' } : {})}
                className={cn(
                  'data-[state=open]:bg-primary/10 data-[state=open]:border data-[state=open]:border-primary/30 data-[state=open]:text-primary',
                  'hover:bg-accent/60 hover:text-foreground transition-colors cursor-pointer',
                )}
              >
                <item.icon className="size-4.5!" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">{item.title}</TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
}
