-- 支出目標テーブル（対象勘定科目の合計・期間ごとの目標金額）
-- 対象勘定科目は goal_accounts（中間テーブル）で 1 件以上を紐づける。

CREATE TABLE IF NOT EXISTS "public"."goals" (
    "id" "text" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" "text" DEFAULT ''::"text" NOT NULL,
    "period" "text" NOT NULL,
    "amount" numeric NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "goals_amount_check" CHECK (("amount" >= (0)::numeric)),
    CONSTRAINT "goals_period_check" CHECK (("period" = ANY (ARRAY['day'::"text", 'month'::"text"])))
);

ALTER TABLE "public"."goals" OWNER TO "postgres";

COMMENT ON TABLE "public"."goals" IS '対象勘定科目（goal_accounts）の合計に対する期間（日次/月次）ごとの支出目標。id はクライアント側で goal_<uuid> 形式を発行する。';

COMMENT ON COLUMN "public"."goals"."name" IS '目標の表示名。空文字の場合は UI 側で対象勘定科目名から表示名を生成する。';

COMMENT ON COLUMN "public"."goals"."period" IS '目標期間。day は日次、month は月次。';

COMMENT ON COLUMN "public"."goals"."amount" IS '目標金額（円）。';

ALTER TABLE ONLY "public"."goals"
    ADD CONSTRAINT "goals_pkey" PRIMARY KEY ("id");

-- goal_accounts からの複合 FK（goal_id, user_id）用
ALTER TABLE ONLY "public"."goals"
    ADD CONSTRAINT "goals_id_user_id_key" UNIQUE ("id", "user_id");

ALTER TABLE ONLY "public"."goals"
    ADD CONSTRAINT "goals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

CREATE INDEX "idx_goals_user_id" ON "public"."goals" USING "btree" ("user_id");

GRANT ALL ON TABLE "public"."goals" TO "anon";
GRANT ALL ON TABLE "public"."goals" TO "authenticated";
GRANT ALL ON TABLE "public"."goals" TO "service_role";
