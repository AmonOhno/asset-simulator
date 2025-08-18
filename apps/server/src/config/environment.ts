import path from 'path';
import dotenv from 'dotenv';

// 環境変数の読み込み（優先順位: 環境変数 > .env）
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
  const envPath = path.resolve(__dirname, '../../../../.env');
  const result = dotenv.config({ path: envPath });
  
  if (result.error) {
    console.warn('Warning: Could not load .env file');
  }
}

console.log('Environment variables status from environment.ts:');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? 'Set' : 'Not Set');
console.log('SUPABASE_KEY:', process.env.SUPABASE_KEY ? 'Set' : 'Not Set');
