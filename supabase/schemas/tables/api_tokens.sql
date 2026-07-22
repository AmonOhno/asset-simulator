-- API トークンテーブル（MyOS 等の外部連携向け読み取り専用トークン）

CREATE TABLE IF NOT EXISTS "public"."api_tokens" (
    "id" "text" DEFAULT ('tok_'::"text" || "gen_random_uuid"()) NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "token_hash" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "last_used_at" timestamp with time zone
);

ALTER TABLE "public"."api_tokens" OWNER TO "postgres";

COMMENT ON TABLE "public"."api_tokens" IS 'MyOS 等の外部連携向け読み取り専用 API トークン。平文は発行時のみ返却し、以降は token_hash（SHA-256）で照合する。';

COMMENT ON COLUMN "public"."api_tokens"."token_hash" IS 'encode(digest(平文トークン, ''sha256''), ''hex'')';

COMMENT ON COLUMN "public"."api_tokens"."last_used_at" IS 'Edge Function から認証成功のたびに更新（失敗しても無視）';

ALTER TABLE ONLY "public"."api_tokens"
    ADD CONSTRAINT "api_tokens_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."api_tokens"
    ADD CONSTRAINT "api_tokens_token_hash_key" UNIQUE ("token_hash");

ALTER TABLE ONLY "public"."api_tokens"
    ADD CONSTRAINT "api_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

GRANT ALL ON TABLE "public"."api_tokens" TO "anon";
GRANT ALL ON TABLE "public"."api_tokens" TO "authenticated";
GRANT ALL ON TABLE "public"."api_tokens" TO "service_role";
