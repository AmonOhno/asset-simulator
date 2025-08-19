import { createClient } from '@supabase/supabase-js';
import './environment'; // 環境変数を先に読み込む

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

let supabase;

if (!supabaseUrl || !supabaseKey) {
  console.warn('Warning: Supabase URL and Key are not set. Some features may not work properly.');
  // 開発・テスト用のダミー値を使用
  const dummyUrl = 'https://dummy.supabase.co';
  const dummyKey = 'dummy-key';
  supabase = createClient(dummyUrl, dummyKey);
} else {
  supabase = createClient(supabaseUrl, supabaseKey);
}

export { supabase };
