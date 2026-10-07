'use client';

import { Bell, Search, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SearchDialog } from '../dialogs/search/search-dialog';
import { NotificationsSheet } from './notifications-sheet';

export function StoreClientTopbar() {
  return (
    <div className="flex items-center gap-2">
      <SearchDialog
        trigger={
          <Button variant="ghost" mode="icon" className="size-9">
            <Search className="size-4.5!" />
          </Button>
        }
      />
      <NotificationsSheet
        trigger={
          <Button variant="ghost" mode="icon" className="size-9">
            <Bell className="size-4.5!" />
          </Button>
        }
      />
      <Button variant="outline" size="sm" className="gap-2">
        <ShoppingBag className="size-4" />
        <span>Cart</span>
      </Button>
    </div>
  );
}
