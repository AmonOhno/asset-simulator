-- career_applications テーブルの RLS ポリシー（自分の行のみ）

ALTER TABLE "public"."career_applications" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "career_applications_select_own" ON "public"."career_applications" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));

CREATE POLICY "career_applications_insert_own" ON "public"."career_applications" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));

CREATE POLICY "career_applications_update_own" ON "public"."career_applications" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));

CREATE POLICY "career_applications_delete_own" ON "public"."career_applications" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));
