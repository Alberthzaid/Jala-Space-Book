import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { env } from '@/shared/config/env';

export const supabase: SupabaseClient | null = env.supabase
  ? createClient(env.supabase.url, env.supabase.anonKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    })
  : null;

export const isSupabaseConfigured = supabase !== null;
export const supabaseConfigIssues: readonly string[] = env.supabaseIssues;
