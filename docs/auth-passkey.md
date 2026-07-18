# パスキー認証（WebAuthn × Supabase）

## 構成

Supabase Auth はパスキーをファーストクラスでは提供していないため、
Edge Function + `@simplewebauthn` で WebAuthn を実装し、検証成功後に
Supabase の正規セッションを発行する構成にした。

```
[ブラウザ]                         [Supabase ローカル]
@simplewebauthn/browser            Edge Functions (Deno)
  │ 1. options 要求                  passkey-register / passkey-auth
  │ ──────────────────────────────▶   @simplewebauthn/server
  │ 2. navigator.credentials          challenge を webauthn_challenges に保存
  │    .create() / .get()
  │ 3. attestation/assertion 送信
  │ ──────────────────────────────▶   検証・webauthn_credentials 保存/照合
  │ 4. セッション受領                  admin.generateLink(magiclink)
  │ ◀──────────────────────────────   → verifyOtp(token_hash) でセッション発行
  │ 5. supabase.auth.setSession()
```

## 設計上のポイント

- **JWT secret を直接扱わない**: セッション発行は
  `auth.admin.generateLink({type:"magiclink"})` → `auth.verifyOtp({token_hash})`
  という公式 API の組み合わせで行う（自前 JWT 署名は不要）
- **チャレンジは使い捨て**: `webauthn_challenges` は 5 分で失効し、
  検証時に `DELETE ... RETURNING` で消費（リプレイ防止）
- **カウンター検証**: 認証成功ごとに `counter` を更新（クローン検知）
- **RLS**: クレデンシャルは本人のみ SELECT 可。書き込みは service_role
  （Edge Function）のみ
- **ユーザー名 → 内部メール**: Supabase Auth はメール必須のため
  `<username>@passkey.local` を内部用に生成（外部送信はしない）
- RP ID / origin は環境変数 `PASSKEY_RP_ID` / `PASSKEY_ORIGIN` で切替
  （ローカル既定: `localhost` / `http://localhost:5173`）

## ローカルでの動作確認手順

```bash
# 1. Supabase ローカルスタック起動（Docker 必須）
supabase start
# 出力された anon key を app/.env に設定（app/.env.example 参照）

# 2. Edge Functions 起動
supabase functions serve passkey-register passkey-auth

# 3. アプリ起動
npm run dev
# http://localhost:5173/login でユーザー名を入れて「パスキーを登録する」
# → OS の認証ダイアログ（Touch ID / Windows Hello 等）
# → 以後「パスキーでログイン」でログイン
```

注意: WebAuthn は secure context 必須（http://localhost は例外的に許可）。
LAN 内の別端末から試す場合は HTTPS + RP_ID の変更が必要。

## 制約・既知の課題

- リモート実行環境では Docker イメージ取得が egress 制限でブロックされ
  未検証（docs/missing-info.md）。コードはローカルマシンでの検証を前提とする
- `generateLink` フローはメール OTP の有効期限設定に依存する。
  本番運用では専用の Auth Hook（Supabase の Custom Access Token Hook）や
  サードパーティ認証基盤の検討が必要
- 複数デバイスのパスキー管理 UI（一覧・失効）は未実装
