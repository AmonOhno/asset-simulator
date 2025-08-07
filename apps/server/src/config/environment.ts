import path from 'path';
import dotenv from 'dotenv';

// ルートの .env ファイルを読み込む
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

console.log('Environment variables loaded from apps/server/src/config/environment.ts');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? 'Set' : 'Not Set');
console.log('SUPABASE_KEY:', process.env.SUPABASE_KEY ? 'Set' : 'Not Set');
