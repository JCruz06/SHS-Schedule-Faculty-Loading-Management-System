import { createBrowserClient } from '@supabase/ssr';

// Browser/Client Client (used in client-side hooks/components)
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';
  
  return createBrowserClient(url, key);
}
