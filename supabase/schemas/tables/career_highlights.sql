-- 職務要約・自己PR・志望動機などの文章ブロック

CREATE TABLE IF NOT EXISTS "public"."career_highlights" (
    "id" "text" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "kind" "text" NOT NULL,
    "title" "text" DEFAULT ''::"text" NOT NULL,
    "body" "text" DEFAULT ''::"text" NOT NULL,
    "is_default" boolean DEFAULT true NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "career_highlights_kind_check" CHECK (("kind" = ANY (ARRAY['summary'::"text", 'self_pr'::"text", 'motivation'::"text", 'strength'::"text", 'future'::"text"])))
);

ALTER TABLE "public"."career_highlights" OWNER TO "postgres";

COMMENT ON TABLE "public"."career_highlights" IS '職務要約・自己PR・志望動機などの文章ブロック。応募先ごとに書き分けられるよう種別ごとに複数持てる。id はクライアント側で pr_<uuid> 形式を発行する。';

COMMENT ON COLUMN "public"."career_highlights"."is_default" IS '書類生成時に既定で使うブロック。種別ごとに 1 件を想定する。';

ALTER TABLE ONLY "public"."career_highlights"
    ADD CONSTRAINT "career_highlights_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."career_highlights"
    ADD CONSTRAINT "career_highlights_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

CREATE INDEX "idx_career_highlights_user_id" ON "public"."career_highlights" USING "btree" ("user_id");

GRANT ALL ON TABLE "public"."career_highlights" TO "anon";

GRANT ALL ON TABLE "public"."career_highlights" TO "authenticated";

GRANT ALL ON TABLE "public"."career_highlights" TO "service_role";
