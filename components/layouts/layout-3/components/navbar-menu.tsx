'use client';

import { Activity, Boxes, Flame, Github, Radio } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export function NavbarMenu() {
  const navItems = [
    { title: 'Overview & Live Presence', icon: Activity, href: '/layout-3' },
    { title: 'Providers Radar (23)', icon: Boxes, href: '/layout-3#providers' },
    { title: 'Search & Content Trends', icon: Flame, href: '/layout-3#content' },
    { title: 'Live Stream Ticker', icon: Radio, href: '/layout-3#stream' },
    {
      title: 'GitHub Repo',
      icon: Github,
      href: 'https://github.com/nehalDIU/nehal-CloudStream',
      external: true,
    },
  ];

  return (
    <div className="flex items-center gap-1 overflow-x-auto py-1">
      {navItems.map((item, idx) => {
        const Icon = item.icon;
        return (
          <Link
            key={idx}
            href={item.href}
            target={item.external ? '_blank' : undefined}
            rel={item.external ? 'noopener noreferrer' : undefined}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-colors whitespace-nowrap',
              idx === 0 ? 'text-primary bg-primary/10 font-semibold' : ''
            )}
          >
            <Icon className="size-3.5 shrink-0" />
            <span>{item.title}</span>
          </Link>
        );
      })}
    </div>
  );
}
