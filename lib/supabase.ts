import { createClient } from '@supabase/supabase-js';

const defaultUrl = 'https://zxghphjvwjmvrdjouziq.supabase.co';
const defaultKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp4Z2hwaGp2d2ptdnJkam91emlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEzNzk0OTcsImV4cCI6MjEwNjk1NTQ5N30.KT17uOHS50iftM90gEQZpXWgZGEFE9oP_XMGtj0uJyw';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || defaultUrl;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || defaultKey;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;

// Client for frontend WebSocket subscriptions
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client for backend API routes
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
