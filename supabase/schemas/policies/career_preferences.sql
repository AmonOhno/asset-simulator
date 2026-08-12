-- career_preferences テーブルの RLS ポリシー（自分の行のみ）

ALTER TABLE "public"."career_preferences" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "career_preferences_select_own" ON "public"."career_preferences" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));

CREATE POLICY "career_preferences_insert_own" ON "public"."career_preferences" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));

CREATE POLICY "career_preferences_update_own" ON "public"."career_preferences" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));

CREATE POLICY "career_preferences_delete_own" ON "public"."career_preferences" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));
