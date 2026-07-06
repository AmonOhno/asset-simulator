-- MyOS 連携用の読み取り専用 API トークン管理
-- Issue #114: MyOS（別リポジトリの PWA）から Finance Edge Function を Bearer トークンで叩けるようにする

create extension if not exists pgcrypto;

-- API トークン本体は保存せず、SHA-256 ハッシュのみを保持する
create table if not exists api_tokens (
  id text primary key default ('tok_' || gen_random_uuid()),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  token_hash text not null unique,
  created_at timestamptz not null default now(),
  last_used_at timestamptz
);

comment on table api_tokens is 'MyOS 等の外部連携向け読み取り専用 API トークン。平文は発行時のみ返却し、以降は token_hash（SHA-256）で照合する。';
comment on column api_tokens.token_hash is 'encode(digest(平文トークン, ''sha256''), ''hex'')';
comment on column api_tokens.last_used_at is 'Edge Function から認証成功のたびに更新（失敗しても無視）';

alter table api_tokens enable row level security;

-- 本人のみ自分のトークン一覧を参照可能。発行・失効は SECURITY DEFINER 関数 / service role 経由のみとし、
-- insert/update/delete ポリシーはあえて設けない。
create policy "api_tokens_select_own" on api_tokens
  for select
  using (auth.uid() = user_id);

-- Supabase SQL Editor（postgres / service role）から手動実行し、API トークンを発行する。
-- 平文トークンはこの戻り値でのみ確認できる（以降は再表示不可）。
create or replace function fn_issue_api_token(p_user_id uuid, p_name text)
returns text
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_token text;
begin
  v_token := 'ast_' || encode(gen_random_bytes(32), 'hex');

  insert into api_tokens (user_id, name, token_hash)
  values (p_user_id, p_name, encode(digest(v_token, 'sha256'), 'hex'));

  return v_token;
end;
$$;

comment on function fn_issue_api_token(uuid, text) is 'API トークンを発行し平文を一度だけ返す。SQL Editor からのみ実行可能（anon/authenticated には EXECUTE を許可しない）。';

revoke execute on function fn_issue_api_token(uuid, text) from public, anon, authenticated;
