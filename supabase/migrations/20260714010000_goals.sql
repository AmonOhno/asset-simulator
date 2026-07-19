-- 目標設定機能: 勘定科目ごと・期間（日次/月次）ごとの支出目標
-- Issue #117: 「取引入力」「ダッシュボード」画面から勘定科目ごとにその日・その月の支出目標を設定できるようにする

create table if not exists goals (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  account_id text not null,
  period text not null check (period in ('day', 'month')),
  amount numeric not null check (amount >= 0),
  created_at timestamptz not null default now(),
  unique (user_id, account_id, period),
  foreign key (account_id, user_id) references journal_accounts (id, user_id) on delete cascade
);

comment on table goals is '勘定科目ごと・期間（日次/月次）ごとの支出目標。id はクライアント側で goal_<uuid> 形式を発行する。';
comment on column goals.period is '目標期間。day は日次、month は月次。';
comment on column goals.amount is '目標金額（円）。';

alter table goals enable row level security;

create policy "goals_select_own" on goals
  for select
  using (auth.uid() = user_id);

create policy "goals_insert_own" on goals
  for insert
  with check (auth.uid() = user_id);

create policy "goals_update_own" on goals
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "goals_delete_own" on goals
  for delete
  using (auth.uid() = user_id);

create index if not exists idx_goals_user_id on goals(user_id);
