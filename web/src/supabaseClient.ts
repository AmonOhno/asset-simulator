import { createClient } from '@supabase/supabase-js';

// In the browser (CRA) we should rely on build-time environment variables.
// Do not import `path` or `dotenv` here — those are server/node-only.

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://dfqtsogrhkrayfixnbtz.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Keep a runtime-safe check; builds in CI should ensure these are set.
  // Use console.error instead of throwing to avoid breaking certain bundlers during static analysis,
  // but throw in development to make missing config obvious.
  const msg = 'Supabase URL and/or Anon Key are missing. Please set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY.';
  if (process.env.NODE_ENV === 'development') {
    // Fail fast in dev so the developer notices configuration issues.
    throw new Error(msg);
  } else {
    console.error(msg);
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey as string);
