import { createClient } from '@supabase/supabase-js';
import path from 'path';
import dotenv from 'dotenv';

if (process.env.NODE_ENV !== 'production') {
  const envPath = path.resolve(__dirname, '../../../.env');
  const result = dotenv.config({ path: envPath });

  if (result.error) {
    console.warn('Warning: Could not load .env file in development');
  }
} else {
  const envPath = path.resolve(__dirname, '/etc/secrets/.env');
  const result = dotenv.config({ path: envPath });

  if (result.error) {
    console.warn('Warning: Could not load .env file in production');
  }
}

const supabaseUrl = 'https://dfqtsogrhkrayfixnbtz.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL and Anon Key must be provided in environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
