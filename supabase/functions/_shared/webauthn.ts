import { createClient } from "npm:@supabase/supabase-js@2";

/** Edge Function 共通ヘルパー（パスキー認証用） */

export const RP_NAME = "さいたま市（モダナイゼーション学習デモ）";
// ローカル開発時: Vite dev サーバー（http://localhost:5173）を RP とする
export const RP_ID = Deno.env.get("PASSKEY_RP_ID") ?? "localhost";
export const ORIGIN =
  Deno.env.get("PASSKEY_ORIGIN") ?? "http://localhost:5173";

/** service_role クライアント（RLS をバイパスする。値はログに出さないこと） */
export function adminClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );
}

export const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("PASSKEY_ORIGIN") ?? "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

export function handleOptions(req: Request): Response | null {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  return null;
}

/** username から内部用メールアドレスを導出（Supabase Auth はメール必須のため） */
export function usernameToEmail(username: string): string {
  const normalized = username.toLowerCase().replace(/[^a-z0-9._-]/g, "-");
  return `${normalized}@passkey.local`;
}

/** チャレンジを保存して ID を返す */
export async function storeChallenge(
  admin: ReturnType<typeof adminClient>,
  challenge: string,
  kind: "registration" | "authentication",
  username?: string,
): Promise<string> {
  const { data, error } = await admin
    .from("webauthn_challenges")
    .insert({ challenge, kind, username })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

/** チャレンジを取得し、使い捨てにするため削除する */
export async function consumeChallenge(
  admin: ReturnType<typeof adminClient>,
  challengeId: string,
  kind: "registration" | "authentication",
): Promise<{ challenge: string; username: string | null }> {
  const { data, error } = await admin
    .from("webauthn_challenges")
    .delete()
    .eq("id", challengeId)
    .eq("kind", kind)
    .gt("expires_at", new Date().toISOString())
    .select("challenge, username")
    .single();
  if (error || !data) throw new Error("Challenge not found or expired");
  return data;
}
