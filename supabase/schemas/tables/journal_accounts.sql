-- 勘定科目テーブル

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

ALTER TABLE ONLY "public"."journal_accounts"
    ADD CONSTRAINT "journal_accounts_pkey" PRIMARY KEY ("id", "user_id");

CREATE INDEX "idx_journal_accounts_user_id" ON "public"."journal_accounts" USING "btree" ("user_id");

GRANT ALL ON TABLE "public"."journal_accounts" TO "anon";
GRANT ALL ON TABLE "public"."journal_accounts" TO "authenticated";
GRANT ALL ON TABLE "public"."journal_accounts" TO "service_role";
