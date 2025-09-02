import path from 'path';
import dotenv from 'dotenv';

const envPath = path.resolve(__dirname, '../../../../.env');
const result = dotenv.config({ path: envPath });

if (result.error) {
  console.warn('Warning: Could not load .env file in development');
}

export const supabaseUrl = 'https://dfqtsogrhkrayfixnbtz.supabase.co';
export const supabaseKey = process.env.SUPABASE_KEY!;
export const defaultUserId = process.env.DEFAULT_USER_ID!;

// 環境変数の状態をログ出力
console.log('Environment variables status:');
console.log('Environment:', process.env.NODE_ENV);
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? 'Set ' + process.env.SUPABASE_URL : 'Not Set');
console.log('SUPABASE_KEY:', process.env.SUPABASE_KEY ? 'Set ' + process.env.SUPABASE_KEY : 'Not Set');
console.log('DEFAULT_USER_ID:', process.env.DEFAULT_USER_ID ? 'Set ' + process.env.DEFAULT_USER_ID : 'Using fallback');

