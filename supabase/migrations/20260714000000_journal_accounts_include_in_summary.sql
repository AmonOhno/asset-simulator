-- 変動資産等を貸借対照表サマリーに含めるか自由に選択できるようにする
-- Issue #118: 株など価値が常に変化する変動資産を管理対象にしつつ、サマリー（BS）に含めるか否かを選択可能にする

alter table journal_accounts
  add column if not exists include_in_summary boolean not null default true;

comment on column journal_accounts.include_in_summary is 'false の場合、貸借対照表サマリー（fn_balance_sheet の集計結果）の表示・合計からこの勘定科目を除外する（変動資産など）。既定値は true。';
