-- 学歴（履歴書の年表欄に転記）

CREATE TABLE IF NOT EXISTS "public"."career_educations" (
    "id" "text" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "school_name" "text" NOT NULL,
    "faculty" "text" DEFAULT ''::"text" NOT NULL,
    "degree" "text" DEFAULT ''::"text" NOT NULL,
    "started_on" "date",
    "ended_on" "date",
    "status" "text" DEFAULT '卒業'::"text" NOT NULL,
    "note" "text" DEFAULT ''::"text" NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE "public"."career_educations" OWNER TO "postgres";

COMMENT ON TABLE "public"."career_educations" IS '学歴。履歴書の「学歴・職歴」欄に年表として出力する。id はクライアント側で edu_<uuid> 形式を発行する。';

COMMENT ON COLUMN "public"."career_educations"."status" IS '卒業 / 中退 / 在学中 など。履歴書の卒業行に転記する。';

ALTER TABLE ONLY "public"."career_educations"
    ADD CONSTRAINT "career_educations_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."career_educations"
    ADD CONSTRAINT "career_educations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

CREATE INDEX "idx_career_educations_user_id" ON "public"."career_educations" USING "btree" ("user_id");

GRANT ALL ON TABLE "public"."career_educations" TO "anon";

GRANT ALL ON TABLE "public"."career_educations" TO "authenticated";

GRANT ALL ON TABLE "public"."career_educations" TO "service_role";
