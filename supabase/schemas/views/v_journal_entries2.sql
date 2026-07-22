-- 仕訳一覧表示用ビュー（借方・貸方の勘定科目名を結合）

CREATE OR REPLACE VIEW "public"."v_journal_entries2" AS
 SELECT "ent"."date",
    "ent"."description",
    "deb"."category" AS "debit_category",
    "deb"."name" AS "debit_name",
    "cre"."category" AS "credit_category",
    "cre"."name" AS "credit_name",
    "ent"."amount",
    "ent"."id" AS "entries_id",
    "cre"."id" AS "credit_id",
    "deb"."id" AS "debit_id",
    "ent"."user_id"
   FROM (("public"."journal_entries" "ent"
     LEFT JOIN "public"."journal_accounts" "cre" ON ((("cre"."id" = "ent"."credit_account_id") AND ("cre"."user_id" = "ent"."user_id"))))
     LEFT JOIN "public"."journal_accounts" "deb" ON ((("deb"."id" = "ent"."debit_account_id") AND ("deb"."user_id" = "ent"."user_id"))))
  ORDER BY "ent"."date", "ent"."amount" DESC;

ALTER VIEW "public"."v_journal_entries2" OWNER TO "postgres";

GRANT ALL ON TABLE "public"."v_journal_entries2" TO "anon";
GRANT ALL ON TABLE "public"."v_journal_entries2" TO "authenticated";
GRANT ALL ON TABLE "public"."v_journal_entries2" TO "service_role";
