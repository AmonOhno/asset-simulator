import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * ローカル Supabase（supabase start）への接続。
 * 環境変数が無い場合は null を返し、UI 側はフォールバックデータを表示する。
 * セキュリティルール: 環境変数の値そのものはログに出さない。
 */
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabase: SupabaseClient | null =
  url && anonKey ? createClient(url, anonKey) : null;

if (import.meta.env.DEV) {
  console.info(
    `[supabase] VITE_SUPABASE_URL: ${url ? "Set" : "Not Set"}, VITE_SUPABASE_ANON_KEY: ${anonKey ? "Set" : "Not Set"}`,
  );
}
