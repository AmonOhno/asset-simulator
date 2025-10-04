import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dfqtsogrhkrayfixnbtz.supabase.co';
// const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRmcXRzb2dyaGtyYXlmaXhuYnR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5MzExNjIsImV4cCI6MjA2ODUwNzE2Mn0.n7y1XSWiTwrTyOibOVCfQXqP97zAAmP7u9blhqJohdY';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL and Anon Key must be provided in environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
