-- 転職活動の基本情報（1 ユーザー 1 行）
-- 現年収・目標年収を保持し、年収ギャップの算出に使う。

-- キャリア設計アプリ（career/）のテーブル一式を追加する。
--
-- 資産シミュレーターとは独立したドメインだが、同じ Supabase プロジェクト・
-- 同じ auth.users を共有する。全テーブルで RLS により自分の行のみ参照可能。
-- id はクライアント側で `<prefix>_<uuid>` 形式を発行する（既存テーブルと同じ運用）。

CREATE TABLE IF NOT EXISTS "public"."career_profiles" (
    "id" "text" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "full_name" "text" DEFAULT ''::"text" NOT NULL,
    "full_name_kana" "text" DEFAULT ''::"text" NOT NULL,
    "birth_date" "date",
    "gender" "text" DEFAULT ''::"text" NOT NULL,
    "email" "text" DEFAULT ''::"text" NOT NULL,
    "phone" "text" DEFAULT ''::"text" NOT NULL,
    "postal_code" "text" DEFAULT ''::"text" NOT NULL,
    "address" "text" DEFAULT ''::"text" NOT NULL,
    "nearest_station" "text" DEFAULT ''::"text" NOT NULL,
    "headline" "text" DEFAULT ''::"text" NOT NULL,
    "current_company" "text" DEFAULT ''::"text" NOT NULL,
    "current_job_title" "text" DEFAULT ''::"text" NOT NULL,
    "years_of_experience" numeric,
    "current_annual_income" numeric,
    "target_annual_income" numeric DEFAULT 10000000 NOT NULL,
    "job_change_target_date" "date",
    "github_url" "text" DEFAULT ''::"text" NOT NULL,
    "portfolio_url" "text" DEFAULT ''::"text" NOT NULL,
    "linkedin_url" "text" DEFAULT ''::"text" NOT NULL,
    "blog_url" "text" DEFAULT ''::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "career_profiles_current_annual_income_check" CHECK (("current_annual_income" IS NULL OR "current_annual_income" >= (0)::numeric)),
    CONSTRAINT "career_profiles_target_annual_income_check" CHECK (("target_annual_income" >= (0)::numeric))
);

ALTER TABLE "public"."career_profiles" OWNER TO "postgres";

COMMENT ON TABLE "public"."career_profiles" IS '転職活動の基本情報。ユーザーごとに 1 行。id はクライアント側で prof_<uuid> 形式を発行する。';

COMMENT ON COLUMN "public"."career_profiles"."headline" IS '職務経歴書の冒頭に載せる一行キャッチ。';

COMMENT ON COLUMN "public"."career_profiles"."current_annual_income" IS '現年収（円）。年収ギャップの算出に使う。';

COMMENT ON COLUMN "public"."career_profiles"."target_annual_income" IS '目標年収（円）。既定は 1000 万円。';

ALTER TABLE ONLY "public"."career_profiles"
    ADD CONSTRAINT "career_profiles_pkey" PRIMARY KEY ("id");

-- ユーザーごとに 1 行。upsert の onConflict 対象。
ALTER TABLE ONLY "public"."career_profiles"
    ADD CONSTRAINT "career_profiles_user_id_key" UNIQUE ("user_id");

ALTER TABLE ONLY "public"."career_profiles"
    ADD CONSTRAINT "career_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

-- ---------------------------------------------------------------------------
-- 権限（既存テーブルと同じ付与方針）
-- ---------------------------------------------------------------------------
GRANT ALL ON TABLE "public"."career_profiles" TO "anon";

GRANT ALL ON TABLE "public"."career_profiles" TO "authenticated";

GRANT ALL ON TABLE "public"."career_profiles" TO "service_role";
