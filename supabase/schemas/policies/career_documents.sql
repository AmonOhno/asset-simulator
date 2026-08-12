-- career_documents テーブルの RLS ポリシー（自分の行のみ）

ALTER TABLE "public"."career_documents" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "career_documents_select_own" ON "public"."career_documents" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));

CREATE POLICY "career_documents_insert_own" ON "public"."career_documents" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));

CREATE POLICY "career_documents_update_own" ON "public"."career_documents" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));

CREATE POLICY "career_documents_delete_own" ON "public"."career_documents" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));
