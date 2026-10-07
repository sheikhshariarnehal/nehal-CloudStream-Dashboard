'use client';

import React from 'react';
import Link from 'next/link';
import { toAbsoluteUrl } from '@/lib/helpers';

export interface NotificationItemProps {
  userName?: string;
  avatar?: string;
  badgeColor?: string;
  description?: string;
  link?: string;
  label?: string;
  time?: string;
  date?: string;
  day?: string;
  specialist?: string;
  text?: string;
  info?: string;
}

export default function Item6({
  userName = 'User',
  avatar = '300-1.png',
  description = 'has sent an update',
  link = 'Project',
  time = 'Just now',
  date,
  text,
  info,
}: NotificationItemProps) {
  return (
    <div className="flex items-start gap-3 p-3 hover:bg-muted/50 rounded-lg transition-colors">
      <img
        src={toAbsoluteUrl('/media/avatars/' + avatar)}
        alt={userName}
        className="size-8 rounded-full shrink-0"
      />
      <div className="flex flex-col gap-1 grow">
        <div className="text-xs text-foreground">
          <span className="font-medium text-foreground">{userName}</span>{' '}
          <span className="text-muted-foreground">{description}</span>{' '}
          {link && <Link href="#" className="text-primary hover:underline">{link}</Link>}
        </div>
        {text && <p className="text-xs text-muted-foreground bg-muted/60 p-2 rounded">{text}</p>}
        <span className="text-[11px] text-muted-foreground">{time || date}</span>
      </div>
    </div>
  );
}
