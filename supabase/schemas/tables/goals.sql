-- 支出目標テーブル（勘定科目ごと・期間ごとの目標金額）

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

ALTER TABLE ONLY "public"."goals"
    ADD CONSTRAINT "goals_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."goals"
    ADD CONSTRAINT "goals_user_id_account_id_period_key" UNIQUE ("user_id", "account_id", "period");

ALTER TABLE ONLY "public"."goals"
    ADD CONSTRAINT "goals_account_id_user_id_fkey" FOREIGN KEY ("account_id", "user_id") REFERENCES "public"."journal_accounts"("id", "user_id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."goals"
    ADD CONSTRAINT "goals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

CREATE INDEX "idx_goals_user_id" ON "public"."goals" USING "btree" ("user_id");

GRANT ALL ON TABLE "public"."goals" TO "anon";
GRANT ALL ON TABLE "public"."goals" TO "authenticated";
GRANT ALL ON TABLE "public"."goals" TO "service_role";
