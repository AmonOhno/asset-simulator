-- 保有スキル（分類・レベル・経験年数・最終使用年月）

CREATE TABLE IF NOT EXISTS "public"."career_skills" (
    "id" "text" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "category" "text" NOT NULL,
    "name" "text" NOT NULL,
    "level" integer DEFAULT 3 NOT NULL,
    "years_of_experience" numeric,
    "last_used_on" "date",
    "is_core" boolean DEFAULT false NOT NULL,
    "note" "text" DEFAULT ''::"text" NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "career_skills_level_check" CHECK (("level" >= 1 AND "level" <= 5)),
    CONSTRAINT "career_skills_category_check" CHECK (("category" = ANY (ARRAY['language'::"text", 'framework'::"text", 'cloud'::"text", 'database'::"text", 'infra'::"text", 'data'::"text", 'security'::"text", 'tool'::"text", 'domain'::"text", 'management'::"text"])))
);

ALTER TABLE "public"."career_skills" OWNER TO "postgres";

COMMENT ON TABLE "public"."career_skills" IS '保有スキル。id はクライアント側で skill_<uuid> 形式を発行する。';

COMMENT ON COLUMN "public"."career_skills"."level" IS '1: 学習中 〜 5: 他者を指導できる。';

COMMENT ON COLUMN "public"."career_skills"."last_used_on" IS '最終使用年月。2 年以上前のスキルは書類での訴求力が落ちるため、鮮度スコアの算出に使う。';

COMMENT ON COLUMN "public"."career_skills"."is_core" IS '書類の前面に出す主力スキル。';

ALTER TABLE ONLY "public"."career_skills"
    ADD CONSTRAINT "career_skills_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."career_skills"
    ADD CONSTRAINT "career_skills_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

CREATE INDEX "idx_career_skills_user_id" ON "public"."career_skills" USING "btree" ("user_id");

GRANT ALL ON TABLE "public"."career_skills" TO "anon";

GRANT ALL ON TABLE "public"."career_skills" TO "authenticated";

GRANT ALL ON TABLE "public"."career_skills" TO "service_role";
