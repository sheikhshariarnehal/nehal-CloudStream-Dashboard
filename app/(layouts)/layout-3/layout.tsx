'use client';

import { Layout3 } from '@/components/layouts/layout-3';
import { ReactNode } from 'react';

export default function Layout({ children }: { children: ReactNode }) {
  return <Layout3>{children}</Layout3>;
}
