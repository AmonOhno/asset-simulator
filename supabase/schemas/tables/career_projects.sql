-- 経験プロジェクト（課題・施策・成果を STAR 形式で保持）

CREATE TABLE IF NOT EXISTS "public"."career_projects" (
    "id" "text" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "experience_id" "text",
    "name" "text" NOT NULL,
    "started_on" "date",
    "ended_on" "date",
    "role" "text" DEFAULT ''::"text" NOT NULL,
    "team_size" integer,
    "industry" "text" DEFAULT ''::"text" NOT NULL,
    "overview" "text" DEFAULT ''::"text" NOT NULL,
    "responsibilities" "text" DEFAULT ''::"text" NOT NULL,
    "challenge" "text" DEFAULT ''::"text" NOT NULL,
    "action" "text" DEFAULT ''::"text" NOT NULL,
    "result" "text" DEFAULT ''::"text" NOT NULL,
    "impact_metric" "text" DEFAULT ''::"text" NOT NULL,
    "tech_stack" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "phases" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "is_highlighted" boolean DEFAULT false NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "career_projects_period_check" CHECK (("ended_on" IS NULL OR "started_on" IS NULL OR "ended_on" >= "started_on"))
);

ALTER TABLE "public"."career_projects" OWNER TO "postgres";

COMMENT ON TABLE "public"."career_projects" IS '経験プロジェクト。課題（challenge）→ 施策（action）→ 成果（result）で保持する。id はクライアント側で proj_<uuid> 形式を発行する。';

COMMENT ON COLUMN "public"."career_projects"."experience_id" IS '紐づく職歴。個人開発・社外活動は NULL。';

COMMENT ON COLUMN "public"."career_projects"."impact_metric" IS '定量成果。高年収レンジの評価軸となるため、数値のみを抜き出して保持する。';

COMMENT ON COLUMN "public"."career_projects"."phases" IS '担当工程（requirements / basic_design / detail_design / implementation / test / release / operation / management）。';

ALTER TABLE ONLY "public"."career_projects"
    ADD CONSTRAINT "career_projects_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."career_projects"
    ADD CONSTRAINT "career_projects_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

-- 職歴を削除してもプロジェクトの記録は残す（紐づけだけ外す）
ALTER TABLE ONLY "public"."career_projects"
    ADD CONSTRAINT "career_projects_experience_id_fkey" FOREIGN KEY ("experience_id") REFERENCES "public"."career_experiences"("id") ON DELETE SET NULL;

CREATE INDEX "idx_career_projects_user_id" ON "public"."career_projects" USING "btree" ("user_id");

CREATE INDEX "idx_career_projects_experience_id" ON "public"."career_projects" USING "btree" ("experience_id");

GRANT ALL ON TABLE "public"."career_projects" TO "anon";

GRANT ALL ON TABLE "public"."career_projects" TO "authenticated";

GRANT ALL ON TABLE "public"."career_projects" TO "service_role";
