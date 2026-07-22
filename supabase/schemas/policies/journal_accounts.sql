-- journal_accounts テーブルの RLS ポリシー

ALTER TABLE "public"."journal_accounts" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users can delete their own journal accounts" ON "public"."journal_accounts" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));

CREATE POLICY "users can insert their own journal accounts" ON "public"."journal_accounts" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));

CREATE POLICY "users can read their own journal accounts" ON "public"."journal_accounts" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));

CREATE POLICY "users can update their own journal accounts" ON "public"."journal_accounts" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));
