import { Download } from 'lucide-react';
import { useBodyClass } from '@/hooks/use-body-class';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Footer } from './footer';
import { Header } from './header';
import { Navbar } from './navbar';
import { Sidebar } from './sidebar';
import { Toolbar, ToolbarActions, ToolbarHeading } from './toolbar';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

export function Main({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isMobileMode = useIsMobile();

  useBodyClass(`
    [--header-height:58px] 
    [--sidebar-width:58px] 
    bg-muted!
  `);

  return (
    <div className="flex grow min-h-screen">
      <Header />

      <div className="flex flex-col lg:flex-row grow pt-(--header-height)">
        {!isMobileMode && <Sidebar />}

        <div className="flex grow rounded-xl bg-background border border-border mt-3 mx-3 sm:mx-4 lg:ms-[66px] mb-4 shadow-xs">
          <div className="flex flex-col grow kt-scrollable-y">
            <main className="grow" role="content">
              {children}
            </main>
            <Footer />
          </div>
        </div>
      </div>
    </div>
  );
}
