import { createClient } from '@supabase/supabase-js';
import './environment'; // 環境変数を先に読み込む

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

export { supabase };
