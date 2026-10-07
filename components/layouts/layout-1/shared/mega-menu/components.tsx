import { MenuItem } from '@/config/types';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ExternalLink } from 'lucide-react';

export function MegaMenuSubDefault(items: MenuItem[]) {
  return (
    <>
      {items.map((item, index) => {
        if (item.disabled) return null;
        return (
          <div key={`default-${index}`} className="flex items-center">
            <Link
              href={item.path || '#'}
              className={cn(
                'text-xs font-normal text-muted-foreground hover:text-primary py-1.5 px-2.5 rounded-md flex items-center justify-between w-full hover:bg-accent transition-colors',
              )}
            >
              <span>{item.title}</span>
              {item.badge && (
                <Badge variant="secondary" size="sm" className="ms-auto text-[10px] px-1.5 py-0">
                  {item.badge}
                </Badge>
              )}
            </Link>
          </div>
        );
      })}
    </>
  );
}

export function MegaMenuSubHighlighted(items: MenuItem[]) {
  return (
    <>
      {items.map((item, index) => {
        if (item.disabled) return null;
        return (
          <div key={`highlighted-${index}`} className="flex items-center">
            <Link
              href={item.path || '#'}
              className="text-xs font-medium text-foreground hover:text-primary py-1.5 px-2.5 rounded-md flex items-center justify-between w-full hover:bg-accent/60 transition-colors"
            >
              <span>{item.title}</span>
              {item.badge && (
                <Badge variant="primary" appearance="light" size="sm" className="ms-auto text-[10px] px-1.5 py-0">
                  {item.badge}
                </Badge>
              )}
            </Link>
          </div>
        );
      })}
    </>
  );
}

export function MegaMenuFooter() {
  return (
    <div className="flex items-center justify-between px-7.5 py-4 bg-accent/40 border-t border-border rounded-b-xl">
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground">
          Looking for custom solutions or help?
        </span>
      </div>
      <Link
        href="https://keenthemes.com/metronic"
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
      >
        <span>Documentation</span>
        <ExternalLink className="size-3" />
      </Link>
    </div>
  );
}
