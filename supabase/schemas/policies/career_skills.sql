-- career_skills テーブルの RLS ポリシー（自分の行のみ）

ALTER TABLE "public"."career_skills" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "career_skills_select_own" ON "public"."career_skills" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));

CREATE POLICY "career_skills_insert_own" ON "public"."career_skills" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));

CREATE POLICY "career_skills_update_own" ON "public"."career_skills" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));

CREATE POLICY "career_skills_delete_own" ON "public"."career_skills" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));
