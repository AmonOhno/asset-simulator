-- 応募・選考の管理（提示レンジ・オファー年収・次アクション）

CREATE TABLE IF NOT EXISTS "public"."career_applications" (
    "id" "text" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "company_name" "text" NOT NULL,
    "job_title" "text" DEFAULT ''::"text" NOT NULL,
    "source" "text" DEFAULT ''::"text" NOT NULL,
    "agent_name" "text" DEFAULT ''::"text" NOT NULL,
    "status" "text" DEFAULT 'wishlist'::"text" NOT NULL,
    "applied_on" "date",
    "next_action" "text" DEFAULT ''::"text" NOT NULL,
    "next_action_on" "date",
    "income_range_min" numeric,
    "income_range_max" numeric,
    "offered_income" numeric,
    "job_url" "text" DEFAULT ''::"text" NOT NULL,
    "location" "text" DEFAULT ''::"text" NOT NULL,
    "remote_policy" "text" DEFAULT ''::"text" NOT NULL,
    "industry" "text" DEFAULT ''::"text" NOT NULL,
    "tech_stack" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "benefits" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "memo" "text" DEFAULT ''::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "career_applications_status_check" CHECK (("status" = ANY (ARRAY['wishlist'::"text", 'applied'::"text", 'document_screening'::"text", 'interview_1'::"text", 'interview_2'::"text", 'interview_final'::"text", 'offer'::"text", 'accepted'::"text", 'rejected'::"text", 'declined'::"text"]))),
    CONSTRAINT "career_applications_remote_policy_check" CHECK (("remote_policy" = ANY (ARRAY[''::"text", 'full_remote'::"text", 'hybrid'::"text", 'onsite'::"text", 'any'::"text"]))),
    CONSTRAINT "career_applications_income_range_check" CHECK (("income_range_min" IS NULL OR "income_range_max" IS NULL OR "income_range_max" >= "income_range_min"))
);

ALTER TABLE "public"."career_applications" OWNER TO "postgres";

COMMENT ON TABLE "public"."career_applications" IS '応募・選考の管理。提示レンジと希望条件からマッチ度を算出する。id はクライアント側で app_<uuid> 形式を発行する。';

COMMENT ON COLUMN "public"."career_applications"."income_range_max" IS '求人票の提示レンジ上限（円）。目標年収に届く求人の本数を数えるのに使う。';

COMMENT ON COLUMN "public"."career_applications"."offered_income" IS '実際のオファー年収（円）。';

ALTER TABLE ONLY "public"."career_applications"
    ADD CONSTRAINT "career_applications_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."career_applications"
    ADD CONSTRAINT "career_applications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

CREATE INDEX "idx_career_applications_user_id" ON "public"."career_applications" USING "btree" ("user_id");

GRANT ALL ON TABLE "public"."career_applications" TO "anon";

GRANT ALL ON TABLE "public"."career_applications" TO "authenticated";

GRANT ALL ON TABLE "public"."career_applications" TO "service_role";
