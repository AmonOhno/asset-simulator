-- さいたま市モダナイゼーション学習プロジェクト 初期スキーマ
-- 変数系コンテンツ（D01〜D03）と パスキー認証（WebAuthn）用テーブル

-- =========================================================
-- コンテンツ系
-- =========================================================

-- D02: 新着情報
create table public.news (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  url text not null,
  category text not null default 'お知らせ',
  published_at date not null default current_date,
  created_at timestamptz not null default now()
);

-- D01: 緊急情報
create table public.emergency_notices (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  url text,
  severity text not null default 'info'
    check (severity in ('info', 'warning', 'critical')),
  active boolean not null default true,
  published_at date not null default current_date,
  created_at timestamptz not null default now()
);

-- D03: イベント情報
create table public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  venue text not null default '',
  url text,
  starts_at date not null,
  created_at timestamptz not null default now()
);

-- 公開コンテンツ: 匿名を含む全員が読み取り可、書き込みは service_role のみ
alter table public.news enable row level security;
alter table public.emergency_notices enable row level security;
alter table public.events enable row level security;

create policy "news_public_read" on public.news
  for select using (true);
create policy "emergency_public_read" on public.emergency_notices
  for select using (true);
create policy "events_public_read" on public.events
  for select using (true);

-- =========================================================
-- パスキー（WebAuthn）認証系
-- =========================================================

-- 登録済みクレデンシャル（公開鍵）
create table public.webauthn_credentials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  credential_id text not null unique,      -- base64url
  public_key text not null,                -- base64url (COSE)
  counter bigint not null default 0,
  transports text[] not null default '{}',
  created_at timestamptz not null default now()
);

create index webauthn_credentials_user_id_idx
  on public.webauthn_credentials (user_id);

-- チャレンジ（リプレイ攻撃防止のため一時保存・短期失効）
create table public.webauthn_challenges (
  id uuid primary key default gen_random_uuid(),
  challenge text not null,                 -- base64url
  kind text not null check (kind in ('registration', 'authentication')),
  username text,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '5 minutes'
);

-- 認証系テーブルはクライアントから直接触らせない（Edge Function の
-- service_role 経由のみ）。本人による自分のクレデンシャル一覧参照のみ許可。
alter table public.webauthn_credentials enable row level security;
alter table public.webauthn_challenges enable row level security;

create policy "credentials_owner_read" on public.webauthn_credentials
  for select using (auth.uid() = user_id);
