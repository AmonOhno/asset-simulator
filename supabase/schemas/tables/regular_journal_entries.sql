-- 定期仕訳テーブル

CREATE TABLE IF NOT EXISTS "public"."regular_journal_entries" (
    "user_id" "uuid" NOT NULL,
    "id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "debit_account_id" "text" NOT NULL,
    "credit_account_id" "text" NOT NULL,
    "amount" numeric,
    "start_date" "date",
    "end_date" "date",
    "frequency" "text" NOT NULL,
    "date_of_year" "text",
    "date_of_month" integer,
    "holiday_div_of_month" "text",
    "date_of_week" integer,
    "mon_flg_of_week" boolean,
    "tue_flg_of_week" boolean,
    "wed_flg_of_week" boolean,
    "thu_flg_of_week" boolean,
    "fri_flg_of_week" boolean,
    "sat_flg_of_week" boolean,
    "sun_flg_of_week" boolean,
    "public_holiday_ex_flg_of_week" boolean,
    "last_executed_date" "date"
);

ALTER TABLE "public"."regular_journal_entries" OWNER TO "postgres";

ALTER TABLE ONLY "public"."regular_journal_entries"
    ADD CONSTRAINT "regular_journal_entries_pkey" PRIMARY KEY ("user_id", "id");

ALTER TABLE ONLY "public"."regular_journal_entries"
    ADD CONSTRAINT "regular_journal_entries_user_id_credit_account_id_fkey" FOREIGN KEY ("user_id", "credit_account_id") REFERENCES "public"."journal_accounts"("user_id", "id");

ALTER TABLE ONLY "public"."regular_journal_entries"
    ADD CONSTRAINT "regular_journal_entries_user_id_debit_account_id_fkey" FOREIGN KEY ("user_id", "debit_account_id") REFERENCES "public"."journal_accounts"("user_id", "id");

GRANT ALL ON TABLE "public"."regular_journal_entries" TO "anon";
GRANT ALL ON TABLE "public"."regular_journal_entries" TO "authenticated";
GRANT ALL ON TABLE "public"."regular_journal_entries" TO "service_role";
