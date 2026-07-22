-- スケジュールイベントテーブル

CREATE TABLE IF NOT EXISTS "public"."schedule_events" (
    "event_id" "text" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "title" "text",
    "all_day_flg" boolean,
    "start_date" "date" NOT NULL,
    "start_time" time without time zone,
    "end_date" "date" NOT NULL,
    "end_time" time without time zone,
    "description" "text"
);

ALTER TABLE "public"."schedule_events" OWNER TO "postgres";

ALTER TABLE ONLY "public"."schedule_events"
    ADD CONSTRAINT "schedule_events_pkey" PRIMARY KEY ("event_id", "user_id");

CREATE INDEX "idx_journal_schedule_events_user_id" ON "public"."schedule_events" USING "btree" ("user_id");

GRANT ALL ON TABLE "public"."schedule_events" TO "anon";
GRANT ALL ON TABLE "public"."schedule_events" TO "authenticated";
GRANT ALL ON TABLE "public"."schedule_events" TO "service_role";
