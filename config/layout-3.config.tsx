import {
  Activity,
  Boxes,
  Database,
  Flame,
  Github,
  Radio,
  Search,
  ShieldCheck,
} from 'lucide-react';
import { type MenuConfig } from './types';

export const MENU_SIDEBAR: MenuConfig = [
  {
    title: 'Command Center',
    icon: Activity,
    path: '/layout-3',
    children: [
      { title: 'Live Presence', path: '/layout-3' },
      { title: 'Providers Radar', path: '/layout-3' },
      { title: 'Search Trends', path: '/layout-3' },
    ],
  },
  { heading: 'Monitoring' },
  {
    title: 'Live Telemetry',
    icon: Radio,
    path: '/layout-3',
  },
  {
    title: 'Providers (23)',
    icon: Boxes,
    path: '/layout-3',
  },
  {
    title: 'Content Trends',
    icon: Flame,
    path: '/layout-3',
  },
  { heading: 'Infrastructure' },
  {
    title: 'Supabase DB',
    icon: Database,
    path: 'https://supabase.com/dashboard/project/zxghphjvwjmvrdjouziq',
  },
  {
    title: 'GitHub Repo',
    icon: Github,
    path: 'https://github.com/nehalDIU/nehal-CloudStream',
  },
];

export const MENU_ROOT: MenuConfig = [
  {
    title: 'Live Analytics',
    icon: Activity,
    rootPath: '/layout-3',
    path: '/layout-3',
    childrenIndex: 0,
  },
  {
    title: 'Providers Radar',
    icon: ShieldCheck,
    rootPath: '/layout-3',
    path: '/layout-3',
    childrenIndex: 0,
  },
  {
    title: 'Search Trends',
    icon: Search,
    rootPath: '/layout-3',
    path: '/layout-3',
    childrenIndex: 0,
  },
];
