-- goal_accounts テーブルの RLS ポリシー

ALTER TABLE "public"."goal_accounts" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "goal_accounts_delete_own" ON "public"."goal_accounts" FOR DELETE USING (("auth"."uid"() = "user_id"));

CREATE POLICY "goal_accounts_insert_own" ON "public"."goal_accounts" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));

CREATE POLICY "goal_accounts_select_own" ON "public"."goal_accounts" FOR SELECT USING (("auth"."uid"() = "user_id"));

CREATE POLICY "goal_accounts_update_own" ON "public"."goal_accounts" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));
