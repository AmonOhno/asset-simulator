-- career_educations テーブルの RLS ポリシー（自分の行のみ）

ALTER TABLE "public"."career_educations" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "career_educations_select_own" ON "public"."career_educations" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));

CREATE POLICY "career_educations_insert_own" ON "public"."career_educations" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));

CREATE POLICY "career_educations_update_own" ON "public"."career_educations" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));

CREATE POLICY "career_educations_delete_own" ON "public"."career_educations" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));
