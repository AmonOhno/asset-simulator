-- 支出目標を「複数勘定科目の合計」に対して設定できるようにする
--
-- - goals に表示名カラム name を追加
-- - 対象勘定科目を中間テーブル goal_accounts に移し、goals.account_id を廃止
-- - goals / goal_accounts を 1 トランザクションで保存する save_goal RPC を追加
--
-- 破壊的変更: goals.account_id を削除する。削除前に既存の値を goal_accounts へ移送する。

-- 1. 表示名カラム
ALTER TABLE "public"."goals"
    ADD COLUMN IF NOT EXISTS "name" "text" DEFAULT ''::"text" NOT NULL;

COMMENT ON COLUMN "public"."goals"."name" IS '目標の表示名。空文字の場合は UI 側で対象勘定科目名から表示名を生成する。';

-- 2. goal_accounts からの複合 FK 用に (id, user_id) の一意制約を追加
ALTER TABLE "public"."goals"
    ADD CONSTRAINT "goals_id_user_id_key" UNIQUE ("id", "user_id");

-- 3. 中間テーブル
CREATE TABLE IF NOT EXISTS "public"."goal_accounts" (
    "goal_id" "text" NOT NULL,
    "account_id" "text" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE "public"."goal_accounts" OWNER TO "postgres";

COMMENT ON TABLE "public"."goal_accounts" IS '支出目標の対象勘定科目。1 目標に複数科目を紐づけ、その合計を実績として集計する。';

ALTER TABLE ONLY "public"."goal_accounts"
    ADD CONSTRAINT "goal_accounts_pkey" PRIMARY KEY ("goal_id", "account_id");

ALTER TABLE ONLY "public"."goal_accounts"
    ADD CONSTRAINT "goal_accounts_goal_id_user_id_fkey" FOREIGN KEY ("goal_id", "user_id") REFERENCES "public"."goals"("id", "user_id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."goal_accounts"
    ADD CONSTRAINT "goal_accounts_account_id_user_id_fkey" FOREIGN KEY ("account_id", "user_id") REFERENCES "public"."journal_accounts"("id", "user_id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."goal_accounts"
    ADD CONSTRAINT "goal_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

CREATE INDEX "idx_goal_accounts_user_id" ON "public"."goal_accounts" USING "btree" ("user_id");

CREATE INDEX "idx_goal_accounts_goal_id" ON "public"."goal_accounts" USING "btree" ("goal_id");

GRANT ALL ON TABLE "public"."goal_accounts" TO "anon";
GRANT ALL ON TABLE "public"."goal_accounts" TO "authenticated";
GRANT ALL ON TABLE "public"."goal_accounts" TO "service_role";

ALTER TABLE "public"."goal_accounts" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "goal_accounts_delete_own" ON "public"."goal_accounts" FOR DELETE USING (("auth"."uid"() = "user_id"));

CREATE POLICY "goal_accounts_insert_own" ON "public"."goal_accounts" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));

CREATE POLICY "goal_accounts_select_own" ON "public"."goal_accounts" FOR SELECT USING (("auth"."uid"() = "user_id"));

CREATE POLICY "goal_accounts_update_own" ON "public"."goal_accounts" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));

-- 4. 既存データの移送（1 目標 = 1 科目 の関係をそのまま中間テーブルへ）
INSERT INTO "public"."goal_accounts" ("goal_id", "account_id", "user_id")
SELECT "id", "account_id", "user_id"
FROM "public"."goals"
WHERE "account_id" IS NOT NULL
ON CONFLICT ("goal_id", "account_id") DO NOTHING;

-- 5. 旧カラムと旧一意制約の削除
ALTER TABLE "public"."goals"
    DROP CONSTRAINT IF EXISTS "goals_user_id_account_id_period_key";

ALTER TABLE "public"."goals"
    DROP CONSTRAINT IF EXISTS "goals_account_id_user_id_fkey";

ALTER TABLE "public"."goals"
    DROP COLUMN IF EXISTS "account_id";

COMMENT ON TABLE "public"."goals" IS '対象勘定科目（goal_accounts）の合計に対する期間（日次/月次）ごとの支出目標。id はクライアント側で goal_<uuid> 形式を発行する。';

-- 6. goals + goal_accounts を 1 トランザクションで保存する RPC
CREATE OR REPLACE FUNCTION "public"."save_goal"("p_user_id" "uuid", "p_goal_id" "text", "p_name" "text", "p_period" "text", "p_amount" numeric, "p_account_ids" "text"[]) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY INVOKER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  IF p_account_ids IS NULL OR array_length(p_account_ids, 1) IS NULL THEN
    RAISE EXCEPTION '対象勘定科目が指定されていません';
  END IF;

  INSERT INTO public.goals (id, user_id, name, period, amount)
  VALUES (p_goal_id, p_user_id, COALESCE(p_name, ''), p_period, p_amount)
  ON CONFLICT (id) DO UPDATE
    SET name = EXCLUDED.name,
        period = EXCLUDED.period,
        amount = EXCLUDED.amount
    WHERE goals.user_id = p_user_id;

  -- 新たに選択された科目を追加してから、対象から外れた科目を削除する。
  -- （先に削除すると対象が一時的に 0 件となり、trg_goal_accounts_delete_orphan_goals が
  --   目標本体を削除してしまうため、この順序を守ること）
  INSERT INTO public.goal_accounts (goal_id, account_id, user_id)
  SELECT p_goal_id, account_id, p_user_id
  FROM unnest(p_account_ids) AS account_id
  ON CONFLICT (goal_id, account_id) DO NOTHING;

  DELETE FROM public.goal_accounts ga
  WHERE ga.goal_id = p_goal_id
    AND ga.user_id = p_user_id
    AND ga.account_id <> ALL (p_account_ids);
END;
$$;

ALTER FUNCTION "public"."save_goal"("p_user_id" "uuid", "p_goal_id" "text", "p_name" "text", "p_period" "text", "p_amount" numeric, "p_account_ids" "text"[]) OWNER TO "postgres";

GRANT ALL ON FUNCTION "public"."save_goal"("p_user_id" "uuid", "p_goal_id" "text", "p_name" "text", "p_period" "text", "p_amount" numeric, "p_account_ids" "text"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."save_goal"("p_user_id" "uuid", "p_goal_id" "text", "p_name" "text", "p_period" "text", "p_amount" numeric, "p_account_ids" "text"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."save_goal"("p_user_id" "uuid", "p_goal_id" "text", "p_name" "text", "p_period" "text", "p_amount" numeric, "p_account_ids" "text"[]) TO "service_role";

-- 7. 対象科目が 0 件になった目標を削除するトリガー
--    （goals.account_id 時代は勘定科目削除で目標自体が CASCADE 削除されていた挙動を維持する）
CREATE OR REPLACE FUNCTION "public"."fn_delete_orphan_goals"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
  DELETE FROM public.goals g
  WHERE g.id = OLD.goal_id
    AND NOT EXISTS (
      SELECT 1 FROM public.goal_accounts ga WHERE ga.goal_id = g.id
    );
  RETURN OLD;
END;
$$;

ALTER FUNCTION "public"."fn_delete_orphan_goals"() OWNER TO "postgres";

CREATE TRIGGER "trg_goal_accounts_delete_orphan_goals"
    AFTER DELETE ON "public"."goal_accounts"
    FOR EACH ROW EXECUTE FUNCTION "public"."fn_delete_orphan_goals"();

GRANT ALL ON FUNCTION "public"."fn_delete_orphan_goals"() TO "anon";
GRANT ALL ON FUNCTION "public"."fn_delete_orphan_goals"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_delete_orphan_goals"() TO "service_role";
