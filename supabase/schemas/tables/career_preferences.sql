-- 希望条件（業務内容 / 業務内容以外、1 ユーザー 1 行）

CREATE TABLE IF NOT EXISTS "public"."career_preferences" (
    "id" "text" NOT NULL,
    "user_id" "uuid" NOT NULL,
    -- 業務内容における希望条件
    "desired_job_titles" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "desired_roles" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "desired_industries" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "desired_project_types" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "desired_tech_stack" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "avoid_tech_stack" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "desired_phases" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "desired_team_style" "text" DEFAULT ''::"text" NOT NULL,
    -- 業務内容以外の希望条件
    "income_floor" numeric,
    "desired_income_min" numeric,
    "desired_income_ideal" numeric DEFAULT 10000000 NOT NULL,
    "desired_locations" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "remote_preference" "text" DEFAULT 'any'::"text" NOT NULL,
    "max_commute_minutes" integer,
    "acceptable_overtime_hours" integer,
    "min_holidays" integer,
    "side_job_required" boolean DEFAULT false NOT NULL,
    "flextime_required" boolean DEFAULT false NOT NULL,
    "desired_benefits" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "desired_company_sizes" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "desired_employment_types" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    -- 優先順位
    "must_have_conditions" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "nice_to_have_conditions" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "deal_breakers" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "job_change_reason" "text" DEFAULT ''::"text" NOT NULL,
    "note" "text" DEFAULT ''::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "career_preferences_remote_preference_check" CHECK (("remote_preference" = ANY (ARRAY['full_remote'::"text", 'hybrid'::"text", 'onsite'::"text", 'any'::"text"])))
);

ALTER TABLE "public"."career_preferences" OWNER TO "postgres";

COMMENT ON TABLE "public"."career_preferences" IS '希望条件。業務内容の希望と業務内容以外（年収・勤務地・福利厚生）の希望をまとめて保持する。ユーザーごとに 1 行。id はクライアント側で pref_<uuid> 形式を発行する。';

COMMENT ON COLUMN "public"."career_preferences"."income_floor" IS '提示されたら受ける最低ライン（円）。下回る求人はマッチ度計算で警告になる。';

COMMENT ON COLUMN "public"."career_preferences"."desired_income_ideal" IS '理想年収（円）。既定は 1000 万円。';

COMMENT ON COLUMN "public"."career_preferences"."must_have_conditions" IS '絶対条件。求人情報に含まれない条件は未充足として警告する。';

ALTER TABLE ONLY "public"."career_preferences"
    ADD CONSTRAINT "career_preferences_pkey" PRIMARY KEY ("id");

-- ユーザーごとに 1 行。upsert の onConflict 対象。
ALTER TABLE ONLY "public"."career_preferences"
    ADD CONSTRAINT "career_preferences_user_id_key" UNIQUE ("user_id");

ALTER TABLE ONLY "public"."career_preferences"
    ADD CONSTRAINT "career_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

GRANT ALL ON TABLE "public"."career_preferences" TO "anon";

GRANT ALL ON TABLE "public"."career_preferences" TO "authenticated";

GRANT ALL ON TABLE "public"."career_preferences" TO "service_role";
