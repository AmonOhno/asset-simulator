-- 支出目標と勘定科目の中間テーブル
-- 1 つの目標に複数の勘定科目を紐づけ、その合計を目標の実績集計対象とする。

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
