import { createClient } from '@supabase/supabase-js';
import './environment'; // 環境変数を先に読み込む

const supabaseUrl: string = process.env.SUPABASE_URL!;
const supabaseKey: string = process.env.SUPABASE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

export { supabase };
