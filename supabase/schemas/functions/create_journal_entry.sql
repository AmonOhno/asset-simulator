-- 仕訳エントリーを作成し、必要に応じて残高を更新する関数

CREATE OR REPLACE FUNCTION "public"."create_journal_entry"("entry_data" "jsonb", "update_balances" boolean) RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$declare
  v_entry journal_entries;
begin
  -- スネークケースのカラム名に合わせて仕訳データを変換
  entry_data = entry_data || jsonb_build_object(
    'debit_account_id', entry_data->>'debitAccountId',
    'credit_account_id', entry_data->>'creditAccountId'
  );
  entry_data = entry_data - 'debitAccountId' - 'creditAccountId';

  -- 仕訳データの挿入
  insert into journal_entries 
  select * from jsonb_populate_record(null::journal_entries, entry_data)
  returning * into v_entry;

  -- 残高の更新
  if update_balances then
    -- 借方科目の残高更新
    update journal_accounts
    set balance = coalesce(balance, 0) + v_entry.amount
    where id = v_entry.debit_account_id;

    -- 貸方科目の残高更新
    update journal_accounts
    set balance = coalesce(balance, 0) - v_entry.amount
    where id = v_entry.credit_account_id;
  end if;
end;$$;

ALTER FUNCTION "public"."create_journal_entry"("entry_data" "jsonb", "update_balances" boolean) OWNER TO "postgres";

GRANT ALL ON FUNCTION "public"."create_journal_entry"("entry_data" "jsonb", "update_balances" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."create_journal_entry"("entry_data" "jsonb", "update_balances" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_journal_entry"("entry_data" "jsonb", "update_balances" boolean) TO "service_role";
