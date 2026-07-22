-- カレンダー表示用の仕訳ビュー

CREATE OR REPLACE VIEW "public"."v_journal_entries_for_calendar" AS
 SELECT "ent"."id",
    "ent"."date",
    "ent"."description",
    "ent"."amount",
    "ent"."debit_account_id",
    "deb"."name" AS "debit_account_name",
    "deb"."category" AS "debit_account_category",
    "ent"."credit_account_id",
    "cre"."name" AS "credit_account_name",
    "cre"."category" AS "credit_account_category",
    "ent"."user_id"
   FROM (("public"."journal_entries" "ent"
     LEFT JOIN "public"."journal_accounts" "deb" ON ((("ent"."debit_account_id" = "deb"."id") AND ("deb"."user_id" = "ent"."user_id"))))
     LEFT JOIN "public"."journal_accounts" "cre" ON ((("ent"."credit_account_id" = "cre"."id") AND ("cre"."user_id" = "ent"."user_id"))))
  ORDER BY "ent"."date" DESC;

ALTER VIEW "public"."v_journal_entries_for_calendar" OWNER TO "postgres";

GRANT ALL ON TABLE "public"."v_journal_entries_for_calendar" TO "anon";
GRANT ALL ON TABLE "public"."v_journal_entries_for_calendar" TO "authenticated";
GRANT ALL ON TABLE "public"."v_journal_entries_for_calendar" TO "service_role";
