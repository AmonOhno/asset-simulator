-- career_certifications テーブルの RLS ポリシー（自分の行のみ）

ALTER TABLE "public"."career_certifications" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "career_certifications_select_own" ON "public"."career_certifications" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));

CREATE POLICY "career_certifications_insert_own" ON "public"."career_certifications" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));

CREATE POLICY "career_certifications_update_own" ON "public"."career_certifications" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));

CREATE POLICY "career_certifications_delete_own" ON "public"."career_certifications" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));
