import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
} from "npm:@simplewebauthn/server@13";
import { isoBase64URL } from "npm:@simplewebauthn/server@13/helpers";
import {
  adminClient,
  consumeChallenge,
  handleOptions,
  json,
  ORIGIN,
  RP_ID,
  RP_NAME,
  storeChallenge,
  usernameToEmail,
} from "../_shared/webauthn.ts";

/**
 * パスキー登録 Edge Function
 * step: "options" — 登録オプション生成（チャレンジ発行）
 * step: "verify"  — attestation 検証・ユーザー作成・クレデンシャル保存
 */
Deno.serve(async (req) => {
  const preflight = handleOptions(req);
  if (preflight) return preflight;

  try {
    const body = await req.json();
    const admin = adminClient();

    if (body.step === "options") {
      const username = String(body.username ?? "").trim();
      if (!username) return json({ error: "username required" }, 400);

      const options = await generateRegistrationOptions({
        rpName: RP_NAME,
        rpID: RP_ID,
        userName: username,
        attestationType: "none",
        authenticatorSelection: {
          residentKey: "preferred",
          userVerification: "preferred",
        },
      });

      const challengeId = await storeChallenge(
        admin,
        options.challenge,
        "registration",
        username,
      );
      return json({ options, challengeId });
    }

    if (body.step === "verify") {
      const { challengeId, attestation } = body;
      const { challenge, username } = await consumeChallenge(
        admin,
        challengeId,
        "registration",
      );
      if (!username) return json({ error: "username missing" }, 400);

      const verification = await verifyRegistrationResponse({
        response: attestation,
        expectedChallenge: challenge,
        expectedOrigin: ORIGIN,
        expectedRPID: RP_ID,
      });
      if (!verification.verified || !verification.registrationInfo) {
        return json({ error: "verification failed" }, 400);
      }

      // Supabase Auth ユーザー作成（既存ならそのまま利用）
      const email = usernameToEmail(username);
      let userId: string;
      const created = await admin.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: { username },
      });
      if (created.data.user) {
        userId = created.data.user.id;
      } else {
        const { data: list } = await admin.auth.admin.listUsers();
        const existing = list.users.find((u) => u.email === email);
        if (!existing) throw created.error ?? new Error("user create failed");
        userId = existing.id;
      }

      const { credential } = verification.registrationInfo;
      const { error } = await admin.from("webauthn_credentials").insert({
        user_id: userId,
        credential_id: credential.id,
        public_key: isoBase64URL.fromBuffer(credential.publicKey),
        counter: credential.counter,
        transports: credential.transports ?? [],
      });
      if (error) throw error;

      return json({ verified: true });
    }

    return json({ error: "unknown step" }, 400);
  } catch (err) {
    return json({ error: (err as Error).message }, 500);
  }
});
