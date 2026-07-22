

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."create_account_with_journal"("account_data" "jsonb", "journal_account_data" "jsonb") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
  insert into accounts select * from jsonb_populate_record(null::accounts, account_data);
  insert into journal_accounts select * from jsonb_populate_record(null::journal_accounts, journal_account_data);
end;
$$;


ALTER FUNCTION "public"."create_account_with_journal"("account_data" "jsonb", "journal_account_data" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_credit_card_with_journal"("card_data" "jsonb", "journal_account_data" "jsonb") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
  insert into credit_cards select * from jsonb_populate_record(null::credit_cards, card_data);
  insert into journal_accounts select * from jsonb_populate_record(null::journal_accounts, journal_account_data);
end;
$$;


ALTER FUNCTION "public"."create_credit_card_with_journal"("card_data" "jsonb", "journal_account_data" "jsonb") OWNER TO "postgres";


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


CREATE OR REPLACE FUNCTION "public"."fn_balance_sheet"("p_user_id" "uuid", "p_end_date" "date") RETURNS TABLE("user_id" "uuid", "account_id" "text", "category" "text", "name" "text", "sum_amount" numeric)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  WITH cre AS (
    SELECT
      ent.user_id,
      ent.credit_account_id AS account_id,
      SUM(ent.amount) AS cre_sum_amount
    FROM public.journal_entries ent
    WHERE ent."date" <= p_end_date
      AND ent.user_id = p_user_id
    GROUP BY ent.user_id, ent.credit_account_id
  ),
  cre_asset AS (
    SELECT c.user_id, c.account_id, a.category, a.name, c.cre_sum_amount
    FROM cre c
    JOIN public.journal_accounts a
      ON a.user_id = c.user_id
     AND a.id = c.account_id
  ),
  deb AS (
    SELECT
      ent.user_id,
      ent.debit_account_id AS account_id,
      SUM(ent.amount) AS deb_sum_amount
    FROM public.journal_entries ent
    WHERE ent."date" <= p_end_date
      AND ent.user_id = p_user_id
    GROUP BY ent.user_id, ent.debit_account_id
  ),
  deb_asset AS (
    SELECT d.user_id, d.account_id, a.category, a.name, d.deb_sum_amount
    FROM deb d
    JOIN public.journal_accounts a
      ON a.user_id = d.user_id
     AND a.id = d.account_id
  )
  SELECT
    COALESCE(ca.user_id, da.user_id) AS user_id,
    COALESCE(ca.account_id, da.account_id) AS account_id,
    COALESCE(ca.category, da.category)      AS category,
    COALESCE(ca.name, da.name)              AS name,
    CASE
      WHEN COALESCE(ca.category, da.category) IN ('Asset','Expense')
        THEN COALESCE(da.deb_sum_amount, 0) - COALESCE(ca.cre_sum_amount, 0)
      ELSE COALESCE(ca.cre_sum_amount, 0) - COALESCE(da.deb_sum_amount, 0)
    END AS sum_amount
  FROM cre_asset ca
  FULL OUTER JOIN deb_asset da
    ON ca.user_id = da.user_id
   AND ca.account_id = da.account_id
  WHERE COALESCE(ca.category, da.category) IN ('Asset','Liability','Equity')
  ORDER BY COALESCE(ca.user_id, da.user_id), COALESCE(ca.name, da.name);
END;
$$;


ALTER FUNCTION "public"."fn_balance_sheet"("p_user_id" "uuid", "p_end_date" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_issue_api_token"("p_user_id" "uuid", "p_name" "text") RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions'
    AS $$
declare
  v_token text;
begin
  v_token := 'ast_' || encode(gen_random_bytes(32), 'hex');

  insert into api_tokens (user_id, name, token_hash)
  values (p_user_id, p_name, encode(digest(v_token, 'sha256'), 'hex'));

  return v_token;
end;
$$;


ALTER FUNCTION "public"."fn_issue_api_token"("p_user_id" "uuid", "p_name" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."fn_issue_api_token"("p_user_id" "uuid", "p_name" "text") IS 'API トークンを発行し平文を一度だけ返す。SQL Editor からのみ実行可能（anon/authenticated には EXECUTE を許可しない）。';



CREATE OR REPLACE FUNCTION "public"."fn_profit_loss"("p_start_date" "date", "p_end_date" "date", "p_user_id" "uuid") RETURNS TABLE("user_id" "uuid", "account_id" "text", "category" "text", "name" "text", "sum_amount" numeric)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  WITH cre AS (
    SELECT
      ent.user_id,
      ent.credit_account_id AS account_id,
      SUM(ent.amount) AS cre_sum_amount
    FROM public.journal_entries ent
    WHERE ent."date" BETWEEN p_start_date AND p_end_date
      AND ent.user_id = p_user_id
    GROUP BY ent.user_id, ent.credit_account_id
  ),
  cre_asset AS (
    SELECT c.user_id, c.account_id, a.category, a.name, c.cre_sum_amount
    FROM cre c
    JOIN public.journal_accounts a
      ON a.user_id = c.user_id
     AND a.id = c.account_id
  ),
  deb AS (
    SELECT
      ent.user_id,
      ent.debit_account_id AS account_id,
      SUM(ent.amount) AS deb_sum_amount
    FROM public.journal_entries ent
    WHERE ent."date" BETWEEN p_start_date AND p_end_date
      AND ent.user_id = p_user_id
    GROUP BY ent.user_id, ent.debit_account_id
  ),
  deb_asset AS (
    SELECT d.user_id, d.account_id, a.category, a.name, d.deb_sum_amount
    FROM deb d
    JOIN public.journal_accounts a
      ON a.user_id = d.user_id
     AND a.id = d.account_id
  )
  SELECT
    COALESCE(ca.user_id, da.user_id) AS user_id,
    COALESCE(ca.account_id, da.account_id) AS account_id,
    COALESCE(ca.category, da.category)      AS category,
    COALESCE(ca.name, da.name)              AS name,
    CASE
      WHEN COALESCE(ca.category, da.category) = 'Expense'
        THEN COALESCE(da.deb_sum_amount, 0) - COALESCE(ca.cre_sum_amount, 0)
      ELSE -- Revenue
        COALESCE(ca.cre_sum_amount, 0) - COALESCE(da.deb_sum_amount, 0)
    END AS sum_amount
  FROM cre_asset ca
  FULL OUTER JOIN deb_asset da
    ON ca.user_id = da.user_id
   AND ca.account_id = da.account_id
  WHERE COALESCE(ca.category, da.category) IN ('Revenue','Expense')
  ORDER BY COALESCE(ca.user_id, da.user_id), COALESCE(ca.name, da.name);
END;
$$;


ALTER FUNCTION "public"."fn_profit_loss"("p_start_date" "date", "p_end_date" "date", "p_user_id" "uuid") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."api_tokens" (
    "id" "text" DEFAULT ('tok_'::"text" || "gen_random_uuid"()) NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "token_hash" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "last_used_at" timestamp with time zone
);


ALTER TABLE "public"."api_tokens" OWNER TO "postgres";


COMMENT ON TABLE "public"."api_tokens" IS 'MyOS 等の外部連携向け読み取り専用 API トークン。平文は発行時のみ返却し、以降は token_hash（SHA-256）で照合する。';



COMMENT ON COLUMN "public"."api_tokens"."token_hash" IS 'encode(digest(平文トークン, ''sha256''), ''hex'')';



COMMENT ON COLUMN "public"."api_tokens"."last_used_at" IS 'Edge Function から認証成功のたびに更新（失敗しても無視）';



CREATE TABLE IF NOT EXISTS "public"."goals" (
    "id" "text" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "account_id" "text" NOT NULL,
    "period" "text" NOT NULL,
    "amount" numeric NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "goals_amount_check" CHECK (("amount" >= (0)::numeric)),
    CONSTRAINT "goals_period_check" CHECK (("period" = ANY (ARRAY['day'::"text", 'month'::"text"])))
);


ALTER TABLE "public"."goals" OWNER TO "postgres";


COMMENT ON TABLE "public"."goals" IS '勘定科目ごと・期間（日次/月次）ごとの支出目標。id はクライアント側で goal_<uuid> 形式を発行する。';



COMMENT ON COLUMN "public"."goals"."period" IS '目標期間。day は日次、month は月次。';



COMMENT ON COLUMN "public"."goals"."amount" IS '目標金額（円）。';



CREATE TABLE IF NOT EXISTS "public"."journal_accounts" (
    "id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "category" "text" NOT NULL,
    "balance" numeric DEFAULT 0.0,
    "user_id" "uuid" NOT NULL,
    "include_in_summary" boolean DEFAULT true NOT NULL
);


ALTER TABLE "public"."journal_accounts" OWNER TO "postgres";


COMMENT ON COLUMN "public"."journal_accounts"."include_in_summary" IS 'false の場合、貸借対照表サマリー（fn_balance_sheet の集計結果）の表示・合計からこの勘定科目を除外する（変動資産など）。既定値は true。';



CREATE TABLE IF NOT EXISTS "public"."journal_entries" (
    "id" "text" NOT NULL,
    "date" "date" NOT NULL,
    "description" "text" NOT NULL,
    "debit_account_id" "text",
    "credit_account_id" "text",
    "amount" numeric NOT NULL,
    "user_id" "uuid" NOT NULL
);


ALTER TABLE "public"."journal_entries" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."regular_journal_entries" (
    "user_id" "uuid" NOT NULL,
    "id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "debit_account_id" "text" NOT NULL,
    "credit_account_id" "text" NOT NULL,
    "amount" numeric,
    "start_date" "date",
    "end_date" "date",
    "frequency" "text" NOT NULL,
    "date_of_year" "text",
    "date_of_month" integer,
    "holiday_div_of_month" "text",
    "date_of_week" integer,
    "mon_flg_of_week" boolean,
    "tue_flg_of_week" boolean,
    "wed_flg_of_week" boolean,
    "thu_flg_of_week" boolean,
    "fri_flg_of_week" boolean,
    "sat_flg_of_week" boolean,
    "sun_flg_of_week" boolean,
    "public_holiday_ex_flg_of_week" boolean,
    "last_executed_date" "date"
);


ALTER TABLE "public"."regular_journal_entries" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."schedule_events" (
    "event_id" "text" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "title" "text",
    "all_day_flg" boolean,
    "start_date" "date" NOT NULL,
    "start_time" time without time zone,
    "end_date" "date" NOT NULL,
    "end_time" time without time zone,
    "description" "text"
);


ALTER TABLE "public"."schedule_events" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_balance_sheet" AS
 WITH "cre" AS (
         SELECT "ent"."user_id",
            "ent"."credit_account_id" AS "account_id",
            "sum"("ent"."amount") AS "cre_sum_amount"
           FROM "public"."journal_entries" "ent"
          GROUP BY "ent"."user_id", "ent"."credit_account_id"
        ), "cre_asset" AS (
         SELECT "c"."user_id",
            "c"."account_id",
            "a"."category",
            "a"."name",
            "c"."cre_sum_amount"
           FROM ("cre" "c"
             JOIN "public"."journal_accounts" "a" ON ((("a"."user_id" = "c"."user_id") AND ("a"."id" = "c"."account_id"))))
        ), "deb" AS (
         SELECT "ent"."user_id",
            "ent"."debit_account_id" AS "account_id",
            "sum"("ent"."amount") AS "deb_sum_amount"
           FROM "public"."journal_entries" "ent"
          GROUP BY "ent"."user_id", "ent"."debit_account_id"
        ), "deb_asset" AS (
         SELECT "d"."user_id",
            "d"."account_id",
            "a"."category",
            "a"."name",
            "d"."deb_sum_amount"
           FROM ("deb" "d"
             JOIN "public"."journal_accounts" "a" ON ((("a"."user_id" = "d"."user_id") AND ("a"."id" = "d"."account_id"))))
        )
 SELECT COALESCE("ca"."user_id", "da"."user_id") AS "user_id",
    COALESCE("ca"."account_id", "da"."account_id") AS "account_id",
    COALESCE("ca"."category", "da"."category") AS "category",
    COALESCE("ca"."name", "da"."name") AS "name",
        CASE
            WHEN (COALESCE("ca"."category", "da"."category") = 'Asset'::"text") THEN (COALESCE("da"."deb_sum_amount", (0)::numeric) - COALESCE("ca"."cre_sum_amount", (0)::numeric))
            ELSE (COALESCE("ca"."cre_sum_amount", (0)::numeric) - COALESCE("da"."deb_sum_amount", (0)::numeric))
        END AS "sum_amount"
   FROM ("cre_asset" "ca"
     FULL JOIN "deb_asset" "da" ON ((("ca"."user_id" = "da"."user_id") AND ("ca"."account_id" = "da"."account_id"))))
  WHERE (("ca"."category" = ANY (ARRAY['Asset'::"text", 'Liability'::"text", 'Equity'::"text"])) AND ("da"."category" = ANY (ARRAY['Asset'::"text", 'Liability'::"text", 'Equity'::"text"])))
  ORDER BY COALESCE("ca"."user_id", "da"."user_id"), COALESCE("ca"."name", "da"."name");


ALTER VIEW "public"."v_balance_sheet" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_journal_entries2" AS
 SELECT "ent"."date",
    "ent"."description",
    "deb"."category" AS "debit_category",
    "deb"."name" AS "debit_name",
    "cre"."category" AS "credit_category",
    "cre"."name" AS "credit_name",
    "ent"."amount",
    "ent"."id" AS "entries_id",
    "cre"."id" AS "credit_id",
    "deb"."id" AS "debit_id",
    "ent"."user_id"
   FROM (("public"."journal_entries" "ent"
     LEFT JOIN "public"."journal_accounts" "cre" ON ((("cre"."id" = "ent"."credit_account_id") AND ("cre"."user_id" = "ent"."user_id"))))
     LEFT JOIN "public"."journal_accounts" "deb" ON ((("deb"."id" = "ent"."debit_account_id") AND ("deb"."user_id" = "ent"."user_id"))))
  ORDER BY "ent"."date", "ent"."amount" DESC;


ALTER VIEW "public"."v_journal_entries2" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_journal_entries_for_calendar" AS
 SELECT "ent"."id",
    "ent"."date",
    "ent"."description",
    "ent"."amount",
    "ent"."debit_account_id",
    "deb"."name" AS "debit_account_name",
    "deb"."category" AS "debit_account_category",
    "ent"."credit_account_id",
    "cre"."name" AS "credit_account_name",
    "cre"."category" AS "credit_account_category",
    "ent"."user_id"
   FROM (("public"."journal_entries" "ent"
     LEFT JOIN "public"."journal_accounts" "deb" ON ((("ent"."debit_account_id" = "deb"."id") AND ("deb"."user_id" = "ent"."user_id"))))
     LEFT JOIN "public"."journal_accounts" "cre" ON ((("ent"."credit_account_id" = "cre"."id") AND ("cre"."user_id" = "ent"."user_id"))))
  ORDER BY "ent"."date" DESC;


ALTER VIEW "public"."v_journal_entries_for_calendar" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_profit_loss_statement" AS
 WITH "cre" AS (
         SELECT "ent"."user_id",
            "ent"."credit_account_id" AS "account_id",
            "sum"("ent"."amount") AS "cre_sum_amount"
           FROM "public"."journal_entries" "ent"
          GROUP BY "ent"."user_id", "ent"."credit_account_id"
        ), "cre_asset" AS (
         SELECT "c"."user_id",
            "c"."account_id",
            "a"."category",
            "a"."name",
            "c"."cre_sum_amount"
           FROM ("cre" "c"
             JOIN "public"."journal_accounts" "a" ON ((("a"."user_id" = "c"."user_id") AND ("a"."id" = "c"."account_id"))))
        ), "deb" AS (
         SELECT "ent"."user_id",
            "ent"."debit_account_id" AS "account_id",
            "sum"("ent"."amount") AS "deb_sum_amount"
           FROM "public"."journal_entries" "ent"
          GROUP BY "ent"."user_id", "ent"."debit_account_id"
        ), "deb_asset" AS (
         SELECT "d"."user_id",
            "d"."account_id",
            "a"."category",
            "a"."name",
            "d"."deb_sum_amount"
           FROM ("deb" "d"
             JOIN "public"."journal_accounts" "a" ON ((("a"."user_id" = "d"."user_id") AND ("a"."id" = "d"."account_id"))))
        )
 SELECT COALESCE("ca"."user_id", "da"."user_id") AS "user_id",
    COALESCE("ca"."account_id", "da"."account_id") AS "account_id",
    COALESCE("ca"."category", "da"."category") AS "category",
    COALESCE("ca"."name", "da"."name") AS "name",
        CASE
            WHEN (COALESCE("ca"."category", "da"."category") = 'Expense'::"text") THEN (COALESCE("da"."deb_sum_amount", (0)::numeric) - COALESCE("ca"."cre_sum_amount", (0)::numeric))
            ELSE (COALESCE("ca"."cre_sum_amount", (0)::numeric) - COALESCE("da"."deb_sum_amount", (0)::numeric))
        END AS "sum_amount"
   FROM ("cre_asset" "ca"
     FULL JOIN "deb_asset" "da" ON ((("ca"."user_id" = "da"."user_id") AND ("ca"."account_id" = "da"."account_id"))))
  WHERE (("ca"."category" = ANY (ARRAY['Revenue'::"text", 'Expense'::"text"])) AND ("da"."category" = ANY (ARRAY['Revenue'::"text", 'Expense'::"text"])))
  ORDER BY COALESCE("ca"."user_id", "da"."user_id"), COALESCE("ca"."name", "da"."name");


ALTER VIEW "public"."v_profit_loss_statement" OWNER TO "postgres";


ALTER TABLE ONLY "public"."api_tokens"
    ADD CONSTRAINT "api_tokens_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."api_tokens"
    ADD CONSTRAINT "api_tokens_token_hash_key" UNIQUE ("token_hash");



ALTER TABLE ONLY "public"."goals"
    ADD CONSTRAINT "goals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."goals"
    ADD CONSTRAINT "goals_user_id_account_id_period_key" UNIQUE ("user_id", "account_id", "period");



ALTER TABLE ONLY "public"."journal_accounts"
    ADD CONSTRAINT "journal_accounts_pkey" PRIMARY KEY ("id", "user_id");



ALTER TABLE ONLY "public"."journal_entries"
    ADD CONSTRAINT "journal_entries_pkey" PRIMARY KEY ("id", "user_id");



ALTER TABLE ONLY "public"."regular_journal_entries"
    ADD CONSTRAINT "regular_journal_entries_pkey" PRIMARY KEY ("user_id", "id");



ALTER TABLE ONLY "public"."schedule_events"
    ADD CONSTRAINT "schedule_events_pkey" PRIMARY KEY ("event_id", "user_id");



CREATE INDEX "idx_goals_user_id" ON "public"."goals" USING "btree" ("user_id");



CREATE INDEX "idx_journal_accounts_user_id" ON "public"."journal_accounts" USING "btree" ("user_id");



CREATE INDEX "idx_journal_entries_user_id" ON "public"."journal_entries" USING "btree" ("user_id");



CREATE INDEX "idx_journal_schedule_events_user_id" ON "public"."schedule_events" USING "btree" ("user_id");



ALTER TABLE ONLY "public"."api_tokens"
    ADD CONSTRAINT "api_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."goals"
    ADD CONSTRAINT "goals_account_id_user_id_fkey" FOREIGN KEY ("account_id", "user_id") REFERENCES "public"."journal_accounts"("id", "user_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."goals"
    ADD CONSTRAINT "goals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."journal_entries"
    ADD CONSTRAINT "journal_entries_credit_account_id_user_id_fkey" FOREIGN KEY ("credit_account_id", "user_id") REFERENCES "public"."journal_accounts"("id", "user_id");



ALTER TABLE ONLY "public"."journal_entries"
    ADD CONSTRAINT "journal_entries_debit_account_id_user_id_fkey" FOREIGN KEY ("debit_account_id", "user_id") REFERENCES "public"."journal_accounts"("id", "user_id");



ALTER TABLE ONLY "public"."regular_journal_entries"
    ADD CONSTRAINT "regular_journal_entries_user_id_credit_account_id_fkey" FOREIGN KEY ("user_id", "credit_account_id") REFERENCES "public"."journal_accounts"("user_id", "id");



ALTER TABLE ONLY "public"."regular_journal_entries"
    ADD CONSTRAINT "regular_journal_entries_user_id_debit_account_id_fkey" FOREIGN KEY ("user_id", "debit_account_id") REFERENCES "public"."journal_accounts"("user_id", "id");



ALTER TABLE "public"."api_tokens" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "api_tokens_select_own" ON "public"."api_tokens" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."goals" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "goals_delete_own" ON "public"."goals" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "goals_insert_own" ON "public"."goals" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "goals_select_own" ON "public"."goals" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "goals_update_own" ON "public"."goals" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."journal_accounts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."journal_entries" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."regular_journal_entries" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."schedule_events" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "schedule_events_delete" ON "public"."schedule_events" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "schedule_events_insert" ON "public"."schedule_events" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "schedule_events_select" ON "public"."schedule_events" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "schedule_events_update" ON "public"."schedule_events" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "users can delete their own journal accounts" ON "public"."journal_accounts" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "users can delete their own journal entries" ON "public"."journal_entries" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "users can delete their own regular journal entries" ON "public"."regular_journal_entries" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "users can insert their own journal accounts" ON "public"."journal_accounts" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "users can insert their own journal entries" ON "public"."journal_entries" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "users can insert their own regular journal entries" ON "public"."regular_journal_entries" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "users can read their own journal accounts" ON "public"."journal_accounts" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "users can read their own journal entries" ON "public"."journal_entries" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "users can read their own regular journal entries" ON "public"."regular_journal_entries" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "users can update their own journal accounts" ON "public"."journal_accounts" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "users can update their own journal entries" ON "public"."journal_entries" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "users can update their own regular journal entries" ON "public"."regular_journal_entries" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";






















































































































































GRANT ALL ON FUNCTION "public"."create_account_with_journal"("account_data" "jsonb", "journal_account_data" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."create_account_with_journal"("account_data" "jsonb", "journal_account_data" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_account_with_journal"("account_data" "jsonb", "journal_account_data" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_credit_card_with_journal"("card_data" "jsonb", "journal_account_data" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."create_credit_card_with_journal"("card_data" "jsonb", "journal_account_data" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_credit_card_with_journal"("card_data" "jsonb", "journal_account_data" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_journal_entry"("entry_data" "jsonb", "update_balances" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."create_journal_entry"("entry_data" "jsonb", "update_balances" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_journal_entry"("entry_data" "jsonb", "update_balances" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_balance_sheet"("p_user_id" "uuid", "p_end_date" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."fn_balance_sheet"("p_user_id" "uuid", "p_end_date" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_balance_sheet"("p_user_id" "uuid", "p_end_date" "date") TO "service_role";



REVOKE ALL ON FUNCTION "public"."fn_issue_api_token"("p_user_id" "uuid", "p_name" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."fn_issue_api_token"("p_user_id" "uuid", "p_name" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_profit_loss"("p_start_date" "date", "p_end_date" "date", "p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."fn_profit_loss"("p_start_date" "date", "p_end_date" "date", "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_profit_loss"("p_start_date" "date", "p_end_date" "date", "p_user_id" "uuid") TO "service_role";


















GRANT ALL ON TABLE "public"."api_tokens" TO "anon";
GRANT ALL ON TABLE "public"."api_tokens" TO "authenticated";
GRANT ALL ON TABLE "public"."api_tokens" TO "service_role";



GRANT ALL ON TABLE "public"."goals" TO "anon";
GRANT ALL ON TABLE "public"."goals" TO "authenticated";
GRANT ALL ON TABLE "public"."goals" TO "service_role";



GRANT ALL ON TABLE "public"."journal_accounts" TO "anon";
GRANT ALL ON TABLE "public"."journal_accounts" TO "authenticated";
GRANT ALL ON TABLE "public"."journal_accounts" TO "service_role";



GRANT ALL ON TABLE "public"."journal_entries" TO "anon";
GRANT ALL ON TABLE "public"."journal_entries" TO "authenticated";
GRANT ALL ON TABLE "public"."journal_entries" TO "service_role";



GRANT ALL ON TABLE "public"."regular_journal_entries" TO "anon";
GRANT ALL ON TABLE "public"."regular_journal_entries" TO "authenticated";
GRANT ALL ON TABLE "public"."regular_journal_entries" TO "service_role";



GRANT ALL ON TABLE "public"."schedule_events" TO "anon";
GRANT ALL ON TABLE "public"."schedule_events" TO "authenticated";
GRANT ALL ON TABLE "public"."schedule_events" TO "service_role";



GRANT ALL ON TABLE "public"."v_balance_sheet" TO "anon";
GRANT ALL ON TABLE "public"."v_balance_sheet" TO "authenticated";
GRANT ALL ON TABLE "public"."v_balance_sheet" TO "service_role";



GRANT ALL ON TABLE "public"."v_journal_entries2" TO "anon";
GRANT ALL ON TABLE "public"."v_journal_entries2" TO "authenticated";
GRANT ALL ON TABLE "public"."v_journal_entries2" TO "service_role";



GRANT ALL ON TABLE "public"."v_journal_entries_for_calendar" TO "anon";
GRANT ALL ON TABLE "public"."v_journal_entries_for_calendar" TO "authenticated";
GRANT ALL ON TABLE "public"."v_journal_entries_for_calendar" TO "service_role";



GRANT ALL ON TABLE "public"."v_profit_loss_statement" TO "anon";
GRANT ALL ON TABLE "public"."v_profit_loss_statement" TO "authenticated";
GRANT ALL ON TABLE "public"."v_profit_loss_statement" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";






























