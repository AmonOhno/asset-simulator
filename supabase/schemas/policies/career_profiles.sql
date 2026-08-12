-- career_profiles テーブルの RLS ポリシー（自分の行のみ）

-- ---------------------------------------------------------------------------
-- RLS（全テーブルで自分の行のみ）
-- ---------------------------------------------------------------------------
ALTER TABLE "public"."career_profiles" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "career_profiles_select_own" ON "public"."career_profiles" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));

CREATE POLICY "career_profiles_insert_own" ON "public"."career_profiles" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));

CREATE POLICY "career_profiles_update_own" ON "public"."career_profiles" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));

CREATE POLICY "career_profiles_delete_own" ON "public"."career_profiles" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));
