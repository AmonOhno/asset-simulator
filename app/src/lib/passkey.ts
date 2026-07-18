import {
  startRegistration,
  startAuthentication,
} from "@simplewebauthn/browser";
import { supabase } from "./supabase";

/**
 * パスキー（WebAuthn）認証クライアント。
 *
 * フロー（docs/auth-passkey.md 参照）:
 * 1. Edge Function `passkey-register` / `passkey-auth` が
 *    @simplewebauthn/server で options 生成と検証を行う
 * 2. 検証成功時、Edge Function が Supabase の JWT を発行して返す
 * 3. クライアントは supabase.auth.setSession() でセッションを確立する
 */

const functionsBase = () => {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  if (!url) throw new Error("Supabase not configured");
  return `${url}/functions/v1`;
};

async function callFunction<T>(name: string, body: unknown): Promise<T> {
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
  const res = await fetch(`${functionsBase()}/${name}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${anonKey}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `${name} failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

export const passkeyAvailable = () =>
  typeof window !== "undefined" && !!window.PublicKeyCredential && !!supabase;

/** パスキー登録（サインアップ） */
export async function registerPasskey(username: string): Promise<void> {
  const { options, challengeId } = await callFunction<{
    options: Parameters<typeof startRegistration>[0]["optionsJSON"];
    challengeId: string;
  }>("passkey-register", { step: "options", username });

  const attestation = await startRegistration({ optionsJSON: options });

  await callFunction("passkey-register", {
    step: "verify",
    username,
    challengeId,
    attestation,
  });
}

/** パスキー認証（ログイン）。成功時に Supabase セッションを確立する */
export async function authenticateWithPasskey(): Promise<string> {
  const { options, challengeId } = await callFunction<{
    options: Parameters<typeof startAuthentication>[0]["optionsJSON"];
    challengeId: string;
  }>("passkey-auth", { step: "options" });

  const assertion = await startAuthentication({ optionsJSON: options });

  const { accessToken, refreshToken, username } = await callFunction<{
    accessToken: string;
    refreshToken: string;
    username: string;
  }>("passkey-auth", { step: "verify", challengeId, assertion });

  if (!supabase) throw new Error("Supabase not configured");
  const { error } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });
  if (error) throw error;
  return username;
}

export async function signOut(): Promise<void> {
  await supabase?.auth.signOut();
}
