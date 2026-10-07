'use client';

import {
  Database,
  Github,
  Radio,
} from 'lucide-react';
import { toAbsoluteUrl } from '@/lib/helpers';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UserDropdownMenu } from '../../layout-1/shared/topbar/user-dropdown-menu';
import Link from 'next/link';

export function HeaderTopbar() {
  return (
    <div className="flex items-center gap-2 lg:gap-3">
      {/* GitHub Repo Link */}
      <Button variant="outline" size="sm" asChild className="hidden sm:inline-flex gap-1.5 text-xs">
        <Link
          href="https://github.com/nehalDIU/nehal-CloudStream"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Github className="size-3.5" />
          <span>GitHub Repo</span>
        </Link>
      </Button>

      {/* Supabase Link */}
      <Button variant="outline" size="sm" asChild className="hidden md:inline-flex gap-1.5 text-xs">
        <Link
          href="https://supabase.com/dashboard/project/zxghphjvwjmvrdjouziq"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Database className="size-3.5 text-emerald-500" />
          <span>Supabase DB</span>
        </Link>
      </Button>

      {/* User Avatar */}
      <UserDropdownMenu
        trigger={
          <img
            className="size-8 rounded-full border border-border shrink-0 cursor-pointer hover:ring-2 hover:ring-primary transition-all"
            src={toAbsoluteUrl('/media/avatars/gray/5.png')}
            alt="User Avatar"
          />
        }
      />
    </div>
  );
}
