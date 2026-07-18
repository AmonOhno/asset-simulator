import {
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from "npm:@simplewebauthn/server@13";
import { isoBase64URL } from "npm:@simplewebauthn/server@13/helpers";
import { createClient } from "npm:@supabase/supabase-js@2";
import {
  adminClient,
  consumeChallenge,
  handleOptions,
  json,
  ORIGIN,
  RP_ID,
  storeChallenge,
} from "../_shared/webauthn.ts";

/**
 * パスキー認証 Edge Function
 * step: "options" — 認証オプション生成（discoverable credential 前提）
 * step: "verify"  — assertion 検証後、Supabase セッションを発行して返す
 *
 * セッション発行は admin.generateLink(magiclink) → verifyOtp(token_hash) の
 * 公式 API のみで行い、JWT secret を直接扱わない（docs/auth-passkey.md）。
 */
Deno.serve(async (req) => {
  const preflight = handleOptions(req);
  if (preflight) return preflight;

  try {
    const body = await req.json();
    const admin = adminClient();

    if (body.step === "options") {
      const options = await generateAuthenticationOptions({
        rpID: RP_ID,
        userVerification: "preferred",
      });
      const challengeId = await storeChallenge(
        admin,
        options.challenge,
        "authentication",
      );
      return json({ options, challengeId });
    }

    if (body.step === "verify") {
      const { challengeId, assertion } = body;
      const { challenge } = await consumeChallenge(
        admin,
        challengeId,
        "authentication",
      );

      const { data: cred, error: credErr } = await admin
        .from("webauthn_credentials")
        .select("user_id, credential_id, public_key, counter, transports")
        .eq("credential_id", assertion.id)
        .single();
      if (credErr || !cred) return json({ error: "unknown credential" }, 400);

      const verification = await verifyAuthenticationResponse({
        response: assertion,
        expectedChallenge: challenge,
        expectedOrigin: ORIGIN,
        expectedRPID: RP_ID,
        credential: {
          id: cred.credential_id,
          publicKey: isoBase64URL.toBuffer(cred.public_key),
          counter: Number(cred.counter),
          transports: cred.transports,
        },
      });
      if (!verification.verified) return json({ error: "verification failed" }, 400);

      // クローン検知用カウンター更新
      await admin
        .from("webauthn_credentials")
        .update({ counter: verification.authenticationInfo.newCounter })
        .eq("credential_id", cred.credential_id);

      // セッション発行
      const { data: userData, error: userErr } =
        await admin.auth.admin.getUserById(cred.user_id);
      if (userErr || !userData.user?.email) {
        return json({ error: "user not found" }, 400);
      }

      const { data: linkData, error: linkErr } =
        await admin.auth.admin.generateLink({
          type: "magiclink",
          email: userData.user.email,
        });
      if (linkErr) throw linkErr;

      const anon = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
        { auth: { persistSession: false } },
      );
      const { data: sessionData, error: otpErr } = await anon.auth.verifyOtp({
        type: "email",
        token_hash: linkData.properties.hashed_token,
      });
      if (otpErr || !sessionData.session) {
        throw otpErr ?? new Error("session creation failed");
      }

      return json({
        accessToken: sessionData.session.access_token,
        refreshToken: sessionData.session.refresh_token,
        username: userData.user.user_metadata?.username ?? userData.user.email,
      });
    }

    return json({ error: "unknown step" }, 400);
  } catch (err) {
    return json({ error: (err as Error).message }, 500);
  }
});
