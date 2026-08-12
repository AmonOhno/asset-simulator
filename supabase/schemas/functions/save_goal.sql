-- 支出目標（goals）と対象勘定科目（goal_accounts）を 1 トランザクションで保存する関数
-- 新規作成・更新の両方に対応する（p_goal_id が既存なら更新）。

CREATE OR REPLACE FUNCTION "public"."save_goal"("p_user_id" "uuid", "p_goal_id" "text", "p_name" "text", "p_period" "text", "p_amount" numeric, "p_account_ids" "text"[]) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY INVOKER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  IF p_account_ids IS NULL OR array_length(p_account_ids, 1) IS NULL THEN
    RAISE EXCEPTION '対象勘定科目が指定されていません';
  END IF;

  INSERT INTO public.goals (id, user_id, name, period, amount)
  VALUES (p_goal_id, p_user_id, COALESCE(p_name, ''), p_period, p_amount)
  ON CONFLICT (id) DO UPDATE
    SET name = EXCLUDED.name,
        period = EXCLUDED.period,
        amount = EXCLUDED.amount
    WHERE goals.user_id = p_user_id;

  -- 新たに選択された科目を追加してから、対象から外れた科目を削除する。
  -- （先に削除すると対象が一時的に 0 件となり、trg_goal_accounts_delete_orphan_goals が
  --   目標本体を削除してしまうため、この順序を守ること）
  INSERT INTO public.goal_accounts (goal_id, account_id, user_id)
  SELECT p_goal_id, account_id, p_user_id
  FROM unnest(p_account_ids) AS account_id
  ON CONFLICT (goal_id, account_id) DO NOTHING;

  DELETE FROM public.goal_accounts ga
  WHERE ga.goal_id = p_goal_id
    AND ga.user_id = p_user_id
    AND ga.account_id <> ALL (p_account_ids);
END;
$$;

ALTER FUNCTION "public"."save_goal"("p_user_id" "uuid", "p_goal_id" "text", "p_name" "text", "p_period" "text", "p_amount" numeric, "p_account_ids" "text"[]) OWNER TO "postgres";

GRANT ALL ON FUNCTION "public"."save_goal"("p_user_id" "uuid", "p_goal_id" "text", "p_name" "text", "p_period" "text", "p_amount" numeric, "p_account_ids" "text"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."save_goal"("p_user_id" "uuid", "p_goal_id" "text", "p_name" "text", "p_period" "text", "p_amount" numeric, "p_account_ids" "text"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."save_goal"("p_user_id" "uuid", "p_goal_id" "text", "p_name" "text", "p_period" "text", "p_amount" numeric, "p_account_ids" "text"[]) TO "service_role";
