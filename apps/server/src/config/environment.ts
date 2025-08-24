import path from 'path';
import dotenv from 'dotenv';

// 本番環境では環境変数のみを使用し、開発環境では.envファイルも使用する
if (process.env.NODE_ENV !== 'production') {
  // 開発環境での.envファイルの読み込み
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
    const envPath = path.resolve(__dirname, '../../../../.env');
    const result = dotenv.config({ path: envPath });
    
    if (result.error) {
      console.warn('Warning: Could not load .env file in development');
    }
  }
} else {
  console.log('Running in production mode - using environment variables only');
}

export const supabaseUrl = process.env.SUPABASE_URL!;
export const supabaseKey = process.env.SUPABASE_KEY!;

// 環境変数の状態をログ出力
console.log('Environment variables status:');
console.log('Environment:', process.env.NODE_ENV);
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? 'Set' : 'Not Set');
console.log('SUPABASE_KEY:', process.env.SUPABASE_KEY ? 'Set' : 'Not Set');

