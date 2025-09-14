import { createClient } from '@supabase/supabase-js';
import { supabaseUrl, supabaseKey} from './environment'; // 環境変数を先に読み込む

const supabase = createClient(supabaseUrl, supabaseKey);

export { supabase };
