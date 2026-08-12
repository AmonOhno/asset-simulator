-- 生成した履歴書・職務経歴書・スキルシートのスナップショット

CREATE TABLE IF NOT EXISTS "public"."career_documents" (
    "id" "text" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "kind" "text" NOT NULL,
    "title" "text" DEFAULT ''::"text" NOT NULL,
    "format" "text" DEFAULT 'markdown'::"text" NOT NULL,
    "content" "text" DEFAULT ''::"text" NOT NULL,
    "application_id" "text",
    "generated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "career_documents_kind_check" CHECK (("kind" = ANY (ARRAY['resume'::"text", 'career_history'::"text", 'skill_sheet'::"text"]))),
    CONSTRAINT "career_documents_format_check" CHECK (("format" = ANY (ARRAY['markdown'::"text", 'html'::"text", 'text'::"text"])))
);

ALTER TABLE "public"."career_documents" OWNER TO "postgres";

COMMENT ON TABLE "public"."career_documents" IS '生成した履歴書・職務経歴書・スキルシートのスナップショット。提出時点の内容を残す。id はクライアント側で doc_<uuid> 形式を発行する。';

COMMENT ON COLUMN "public"."career_documents"."application_id" IS '応募先ごとに書き分けた場合の紐づけ。応募先を削除しても書類は残す。';

ALTER TABLE ONLY "public"."career_documents"
    ADD CONSTRAINT "career_documents_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."career_documents"
    ADD CONSTRAINT "career_documents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."career_documents"
    ADD CONSTRAINT "career_documents_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "public"."career_applications"("id") ON DELETE SET NULL;

CREATE INDEX "idx_career_documents_user_id" ON "public"."career_documents" USING "btree" ("user_id");

GRANT ALL ON TABLE "public"."career_documents" TO "anon";

GRANT ALL ON TABLE "public"."career_documents" TO "authenticated";

GRANT ALL ON TABLE "public"."career_documents" TO "service_role";
