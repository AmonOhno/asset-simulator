-- career_highlights テーブルの RLS ポリシー（自分の行のみ）

ALTER TABLE "public"."career_highlights" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "career_highlights_select_own" ON "public"."career_highlights" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));

CREATE POLICY "career_highlights_insert_own" ON "public"."career_highlights" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));

CREATE POLICY "career_highlights_update_own" ON "public"."career_highlights" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));

CREATE POLICY "career_highlights_delete_own" ON "public"."career_highlights" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));
