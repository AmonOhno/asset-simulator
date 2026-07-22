-- API トークンを発行する関数（SQL Editor 専用、anon/authenticated には未許可）

CREATE OR REPLACE FUNCTION "public"."fn_issue_api_token"("p_user_id" "uuid", "p_name" "text") RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions'
    AS $$
declare
  v_token text;
begin
  v_token := 'ast_' || encode(gen_random_bytes(32), 'hex');

  insert into api_tokens (user_id, name, token_hash)
  values (p_user_id, p_name, encode(digest(v_token, 'sha256'), 'hex'));

  return v_token;
end;
$$;

ALTER FUNCTION "public"."fn_issue_api_token"("p_user_id" "uuid", "p_name" "text") OWNER TO "postgres";

COMMENT ON FUNCTION "public"."fn_issue_api_token"("p_user_id" "uuid", "p_name" "text") IS 'API トークンを発行し平文を一度だけ返す。SQL Editor からのみ実行可能（anon/authenticated には EXECUTE を許可しない）。';

REVOKE ALL ON FUNCTION "public"."fn_issue_api_token"("p_user_id" "uuid", "p_name" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."fn_issue_api_token"("p_user_id" "uuid", "p_name" "text") TO "service_role";
