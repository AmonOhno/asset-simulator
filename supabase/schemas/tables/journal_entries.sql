-- 仕訳エントリーテーブル

CREATE TABLE IF NOT EXISTS "public"."journal_entries" (
    "id" "text" NOT NULL,
    "date" "date" NOT NULL,
    "description" "text" NOT NULL,
    "debit_account_id" "text",
    "credit_account_id" "text",
    "amount" numeric NOT NULL,
    "user_id" "uuid" NOT NULL
);

ALTER TABLE "public"."journal_entries" OWNER TO "postgres";

ALTER TABLE ONLY "public"."journal_entries"
    ADD CONSTRAINT "journal_entries_pkey" PRIMARY KEY ("id", "user_id");

CREATE INDEX "idx_journal_entries_user_id" ON "public"."journal_entries" USING "btree" ("user_id");

ALTER TABLE ONLY "public"."journal_entries"
    ADD CONSTRAINT "journal_entries_credit_account_id_user_id_fkey" FOREIGN KEY ("credit_account_id", "user_id") REFERENCES "public"."journal_accounts"("id", "user_id");

ALTER TABLE ONLY "public"."journal_entries"
    ADD CONSTRAINT "journal_entries_debit_account_id_user_id_fkey" FOREIGN KEY ("debit_account_id", "user_id") REFERENCES "public"."journal_accounts"("id", "user_id");

GRANT ALL ON TABLE "public"."journal_entries" TO "anon";
GRANT ALL ON TABLE "public"."journal_entries" TO "authenticated";
GRANT ALL ON TABLE "public"."journal_entries" TO "service_role";
