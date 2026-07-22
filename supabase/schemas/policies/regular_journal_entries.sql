-- regular_journal_entries テーブルの RLS ポリシー

ALTER TABLE "public"."regular_journal_entries" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users can delete their own regular journal entries" ON "public"."regular_journal_entries" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));

CREATE POLICY "users can insert their own regular journal entries" ON "public"."regular_journal_entries" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));

CREATE POLICY "users can read their own regular journal entries" ON "public"."regular_journal_entries" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));

CREATE POLICY "users can update their own regular journal entries" ON "public"."regular_journal_entries" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));
