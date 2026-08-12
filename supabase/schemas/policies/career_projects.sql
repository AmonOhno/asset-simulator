-- career_projects テーブルの RLS ポリシー（自分の行のみ）

ALTER TABLE "public"."career_projects" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "career_projects_select_own" ON "public"."career_projects" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));

CREATE POLICY "career_projects_insert_own" ON "public"."career_projects" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));

CREATE POLICY "career_projects_update_own" ON "public"."career_projects" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));

CREATE POLICY "career_projects_delete_own" ON "public"."career_projects" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));
