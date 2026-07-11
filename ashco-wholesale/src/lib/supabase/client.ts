import { createBrowserClient } from '@supabase/ssr';

// Used in Client Components — talks to Supabase with the public anon key.
// Row Level Security policies decide what this key is allowed to touch.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
