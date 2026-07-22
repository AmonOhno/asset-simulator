-- 損益計算書用ビュー（収益・費用カテゴリごとの集計）

CREATE OR REPLACE VIEW "public"."v_profit_loss_statement" AS
 WITH "cre" AS (
         SELECT "ent"."user_id",
            "ent"."credit_account_id" AS "account_id",
            "sum"("ent"."amount") AS "cre_sum_amount"
           FROM "public"."journal_entries" "ent"
          GROUP BY "ent"."user_id", "ent"."credit_account_id"
        ), "cre_asset" AS (
         SELECT "c"."user_id",
            "c"."account_id",
            "a"."category",
            "a"."name",
            "c"."cre_sum_amount"
           FROM ("cre" "c"
             JOIN "public"."journal_accounts" "a" ON ((("a"."user_id" = "c"."user_id") AND ("a"."id" = "c"."account_id"))))
        ), "deb" AS (
         SELECT "ent"."user_id",
            "ent"."debit_account_id" AS "account_id",
            "sum"("ent"."amount") AS "deb_sum_amount"
           FROM "public"."journal_entries" "ent"
          GROUP BY "ent"."user_id", "ent"."debit_account_id"
        ), "deb_asset" AS (
         SELECT "d"."user_id",
            "d"."account_id",
            "a"."category",
            "a"."name",
            "d"."deb_sum_amount"
           FROM ("deb" "d"
             JOIN "public"."journal_accounts" "a" ON ((("a"."user_id" = "d"."user_id") AND ("a"."id" = "d"."account_id"))))
        )
 SELECT COALESCE("ca"."user_id", "da"."user_id") AS "user_id",
    COALESCE("ca"."account_id", "da"."account_id") AS "account_id",
    COALESCE("ca"."category", "da"."category") AS "category",
    COALESCE("ca"."name", "da"."name") AS "name",
        CASE
            WHEN (COALESCE("ca"."category", "da"."category") = 'Expense'::"text") THEN (COALESCE("da"."deb_sum_amount", (0)::numeric) - COALESCE("ca"."cre_sum_amount", (0)::numeric))
            ELSE (COALESCE("ca"."cre_sum_amount", (0)::numeric) - COALESCE("da"."deb_sum_amount", (0)::numeric))
        END AS "sum_amount"
   FROM ("cre_asset" "ca"
     FULL JOIN "deb_asset" "da" ON ((("ca"."user_id" = "da"."user_id") AND ("ca"."account_id" = "da"."account_id"))))
  WHERE (("ca"."category" = ANY (ARRAY['Revenue'::"text", 'Expense'::"text"])) AND ("da"."category" = ANY (ARRAY['Revenue'::"text", 'Expense'::"text"])))
  ORDER BY COALESCE("ca"."user_id", "da"."user_id"), COALESCE("ca"."name", "da"."name");

ALTER VIEW "public"."v_profit_loss_statement" OWNER TO "postgres";

GRANT ALL ON TABLE "public"."v_profit_loss_statement" TO "anon";
GRANT ALL ON TABLE "public"."v_profit_loss_statement" TO "authenticated";
GRANT ALL ON TABLE "public"."v_profit_loss_statement" TO "service_role";
