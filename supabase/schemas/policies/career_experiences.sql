-- career_experiences テーブルの RLS ポリシー（自分の行のみ）

ALTER TABLE "public"."career_experiences" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "career_experiences_select_own" ON "public"."career_experiences" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));

CREATE POLICY "career_experiences_insert_own" ON "public"."career_experiences" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));

CREATE POLICY "career_experiences_update_own" ON "public"."career_experiences" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));

CREATE POLICY "career_experiences_delete_own" ON "public"."career_experiences" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));
