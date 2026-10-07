'use client';

import { Activity, Menu } from 'lucide-react';
import { toAbsoluteUrl } from '@/lib/helpers';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetHeader,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SidebarMenu } from './sidebar-menu';
import Link from 'next/link';

export function HeaderLogo() {
  return (
    <div className="flex items-center gap-3">
      {/* Logo and Mobile Menu Trigger */}
      <div className="flex items-center justify-center lg:w-(--sidebar-width) shrink-0">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" mode="icon" className="-ms-2 lg:hidden">
              <Menu className="size-4!" />
            </Button>
          </SheetTrigger>
          <SheetContent
            className="p-0 gap-0 w-(--sidebar-width)"
            side="left"
            close={false}
          >
            <SheetHeader className="p-0 space-y-0" />
            <SheetBody className="p-0 overflow-y-auto">
              <SidebarMenu />
            </SheetBody>
          </SheetContent>
        </Sheet>

        <Link href="/layout-3" className="mx-1 flex items-center gap-2">
          <img
            src={toAbsoluteUrl('/media/app/mini-logo-primary.svg')}
            className="dark:hidden min-h-[24px]"
            alt="logo"
          />
          <img
            src={toAbsoluteUrl('/media/app/mini-logo-primary-dark.svg')}
            className="hidden dark:inline-block min-h-[24px]"
            alt="logo"
          />
        </Link>
      </div>

      {/* Brand & Section Title */}
      <div className="flex items-center gap-2.5">
        <Link href="/layout-3" className="text-foreground font-bold text-base hover:text-primary transition-colors">
          Nehal CloudStream
        </Link>
        <span className="text-sm text-muted-foreground font-medium hidden md:inline">
          /
        </span>
        <div className="hidden md:flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">
            Analytics Command Center
          </span>
          <Badge variant="success" appearance="light" size="xs" className="gap-1">
            <span className="size-1.5 rounded-full bg-green-500 animate-ping" />
            v1.0 Live
          </Badge>
        </div>
      </div>
    </div>
  );
}
