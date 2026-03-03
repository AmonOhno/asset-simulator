import { create } from 'zustand';
import { createClient, Session, SupabaseClient } from '@supabase/supabase-js';

// 環境変数の統合
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL!;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY!;

// クライアントの初期化
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface AuthState {
  session: Session | null;
  userId: string | null;
  client: SupabaseClient;
  setSession: (session: Session | null) => void;
  refreshSession: () => Promise<Session | null>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  userId: null,
  client: supabase,

  setSession: (session) => {
    // レンダリングサイクル外で安全に更新
    set({ 
      session, 
      userId: session?.user?.id ?? null 
    });
  },

  refreshSession: async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) console.error('Session refresh error:', error.message);
    
    // get() を使って現在の setSession を呼び出す
    get().setSession(session);
    return session;
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null, userId: null });
  }
}));