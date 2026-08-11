-- 対象勘定科目が 1 件もなくなった支出目標を削除するトリガー
-- 勘定科目を削除すると goal_accounts が CASCADE で消えるため、対象が空の目標が残らないようにする
-- （goals.account_id 時代は勘定科目削除で目標自体が CASCADE 削除されていた挙動を維持する）。

CREATE OR REPLACE FUNCTION "public"."fn_delete_orphan_goals"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
  DELETE FROM public.goals g
  WHERE g.id = OLD.goal_id
    AND NOT EXISTS (
      SELECT 1 FROM public.goal_accounts ga WHERE ga.goal_id = g.id
    );
  RETURN OLD;
END;
$$;

ALTER FUNCTION "public"."fn_delete_orphan_goals"() OWNER TO "postgres";

CREATE TRIGGER "trg_goal_accounts_delete_orphan_goals"
    AFTER DELETE ON "public"."goal_accounts"
    FOR EACH ROW EXECUTE FUNCTION "public"."fn_delete_orphan_goals"();

GRANT ALL ON FUNCTION "public"."fn_delete_orphan_goals"() TO "anon";
GRANT ALL ON FUNCTION "public"."fn_delete_orphan_goals"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_delete_orphan_goals"() TO "service_role";
