-- api_tokens テーブルの RLS ポリシー

ALTER TABLE "public"."api_tokens" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "api_tokens_select_own" ON "public"."api_tokens" FOR SELECT USING (("auth"."uid"() = "user_id"));
