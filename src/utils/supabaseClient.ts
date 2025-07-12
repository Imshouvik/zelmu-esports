import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ijzkiuutjfmllnkdketi.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqemtpdXV0amZtbGxua2RrZXRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyNTU3MjQsImV4cCI6MjA2NTgzMTcyNH0.jY1MyjjQrG1bjqeHgVbbRemaXXM2b0PXrW_YG19vzO0';

export const supabase = typeof window !== 'undefined'
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: window.localStorage,
      },
    })
  : undefined;

// Server-side Supabase client with service role key
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
export const supabaseAdmin =
  typeof window === 'undefined' && supabaseServiceRoleKey
    ? createClient(supabaseUrl, supabaseServiceRoleKey)
    : undefined; 