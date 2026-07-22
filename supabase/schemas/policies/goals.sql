-- goals テーブルの RLS ポリシー

ALTER TABLE "public"."goals" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "goals_delete_own" ON "public"."goals" FOR DELETE USING (("auth"."uid"() = "user_id"));

CREATE POLICY "goals_insert_own" ON "public"."goals" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));

CREATE POLICY "goals_select_own" ON "public"."goals" FOR SELECT USING (("auth"."uid"() = "user_id"));

CREATE POLICY "goals_update_own" ON "public"."goals" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));
