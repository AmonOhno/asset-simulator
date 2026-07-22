-- 貸借対照表集計を返す関数

CREATE OR REPLACE FUNCTION "public"."fn_balance_sheet"("p_user_id" "uuid", "p_end_date" "date") RETURNS TABLE("user_id" "uuid", "account_id" "text", "category" "text", "name" "text", "sum_amount" numeric)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  WITH cre AS (
    SELECT
      ent.user_id,
      ent.credit_account_id AS account_id,
      SUM(ent.amount) AS cre_sum_amount
    FROM public.journal_entries ent
    WHERE ent."date" <= p_end_date
      AND ent.user_id = p_user_id
    GROUP BY ent.user_id, ent.credit_account_id
  ),
  cre_asset AS (
    SELECT c.user_id, c.account_id, a.category, a.name, c.cre_sum_amount
    FROM cre c
    JOIN public.journal_accounts a
      ON a.user_id = c.user_id
     AND a.id = c.account_id
  ),
  deb AS (
    SELECT
      ent.user_id,
      ent.debit_account_id AS account_id,
      SUM(ent.amount) AS deb_sum_amount
    FROM public.journal_entries ent
    WHERE ent."date" <= p_end_date
      AND ent.user_id = p_user_id
    GROUP BY ent.user_id, ent.debit_account_id
  ),
  deb_asset AS (
    SELECT d.user_id, d.account_id, a.category, a.name, d.deb_sum_amount
    FROM deb d
    JOIN public.journal_accounts a
      ON a.user_id = d.user_id
     AND a.id = d.account_id
  )
  SELECT
    COALESCE(ca.user_id, da.user_id) AS user_id,
    COALESCE(ca.account_id, da.account_id) AS account_id,
    COALESCE(ca.category, da.category)      AS category,
    COALESCE(ca.name, da.name)              AS name,
    CASE
      WHEN COALESCE(ca.category, da.category) IN ('Asset','Expense')
        THEN COALESCE(da.deb_sum_amount, 0) - COALESCE(ca.cre_sum_amount, 0)
      ELSE COALESCE(ca.cre_sum_amount, 0) - COALESCE(da.deb_sum_amount, 0)
    END AS sum_amount
  FROM cre_asset ca
  FULL OUTER JOIN deb_asset da
    ON ca.user_id = da.user_id
   AND ca.account_id = da.account_id
  WHERE COALESCE(ca.category, da.category) IN ('Asset','Liability','Equity')
  ORDER BY COALESCE(ca.user_id, da.user_id), COALESCE(ca.name, da.name);
END;
$$;

ALTER FUNCTION "public"."fn_balance_sheet"("p_user_id" "uuid", "p_end_date" "date") OWNER TO "postgres";

GRANT ALL ON FUNCTION "public"."fn_balance_sheet"("p_user_id" "uuid", "p_end_date" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."fn_balance_sheet"("p_user_id" "uuid", "p_end_date" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_balance_sheet"("p_user_id" "uuid", "p_end_date" "date") TO "service_role";
