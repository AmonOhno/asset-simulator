-- 資格・免許

CREATE TABLE IF NOT EXISTS "public"."career_certifications" (
    "id" "text" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "issuer" "text" DEFAULT ''::"text" NOT NULL,
    "acquired_on" "date",
    "expires_on" "date",
    "score" "text" DEFAULT ''::"text" NOT NULL,
    "note" "text" DEFAULT ''::"text" NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE "public"."career_certifications" OWNER TO "postgres";

COMMENT ON TABLE "public"."career_certifications" IS '資格・免許。id はクライアント側で cert_<uuid> 形式を発行する。';

ALTER TABLE ONLY "public"."career_certifications"
    ADD CONSTRAINT "career_certifications_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."career_certifications"
    ADD CONSTRAINT "career_certifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

CREATE INDEX "idx_career_certifications_user_id" ON "public"."career_certifications" USING "btree" ("user_id");

GRANT ALL ON TABLE "public"."career_certifications" TO "anon";

GRANT ALL ON TABLE "public"."career_certifications" TO "authenticated";

GRANT ALL ON TABLE "public"."career_certifications" TO "service_role";
