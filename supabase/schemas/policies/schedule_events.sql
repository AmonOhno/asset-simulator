-- schedule_events テーブルの RLS ポリシー

ALTER TABLE "public"."schedule_events" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "schedule_events_delete" ON "public"."schedule_events" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));

CREATE POLICY "schedule_events_insert" ON "public"."schedule_events" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));

CREATE POLICY "schedule_events_select" ON "public"."schedule_events" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));

CREATE POLICY "schedule_events_update" ON "public"."schedule_events" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));
