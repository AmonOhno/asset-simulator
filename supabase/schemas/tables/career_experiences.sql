-- 職歴（会社単位の在籍期間・役職・年収）

CREATE TABLE IF NOT EXISTS "public"."career_experiences" (
    "id" "text" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "company_name" "text" NOT NULL,
    "employment_type" "text" DEFAULT 'full_time'::"text" NOT NULL,
    "started_on" "date" NOT NULL,
    "ended_on" "date",
    "job_title" "text" DEFAULT ''::"text" NOT NULL,
    "department" "text" DEFAULT ''::"text" NOT NULL,
    "industry" "text" DEFAULT ''::"text" NOT NULL,
    "headcount" integer,
    "annual_income" numeric,
    "business_description" "text" DEFAULT ''::"text" NOT NULL,
    "achievements" "text" DEFAULT ''::"text" NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "career_experiences_employment_type_check" CHECK (("employment_type" = ANY (ARRAY['full_time'::"text", 'contract'::"text", 'dispatch'::"text", 'freelance'::"text", 'part_time'::"text", 'internship'::"text"]))),
    CONSTRAINT "career_experiences_period_check" CHECK (("ended_on" IS NULL OR "ended_on" >= "started_on"))
);

ALTER TABLE "public"."career_experiences" OWNER TO "postgres";

COMMENT ON TABLE "public"."career_experiences" IS '職歴（会社単位）。id はクライアント側で exp_<uuid> 形式を発行する。';

COMMENT ON COLUMN "public"."career_experiences"."ended_on" IS 'NULL は在籍中。履歴書の「現在に至る」の判定に使う。';

COMMENT ON COLUMN "public"."career_experiences"."annual_income" IS '在籍時の年収（円）。年収推移の可視化と交渉材料に使う。';

ALTER TABLE ONLY "public"."career_experiences"
    ADD CONSTRAINT "career_experiences_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."career_experiences"
    ADD CONSTRAINT "career_experiences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

CREATE INDEX "idx_career_experiences_user_id" ON "public"."career_experiences" USING "btree" ("user_id");

GRANT ALL ON TABLE "public"."career_experiences" TO "anon";

GRANT ALL ON TABLE "public"."career_experiences" TO "authenticated";

GRANT ALL ON TABLE "public"."career_experiences" TO "service_role";
