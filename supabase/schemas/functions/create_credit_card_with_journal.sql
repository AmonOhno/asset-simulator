-- クレジットカードと勘定科目を同時に作成する関数

CREATE OR REPLACE FUNCTION "public"."create_credit_card_with_journal"("card_data" "jsonb", "journal_account_data" "jsonb") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
  insert into credit_cards select * from jsonb_populate_record(null::credit_cards, card_data);
  insert into journal_accounts select * from jsonb_populate_record(null::journal_accounts, journal_account_data);
end;
$$;

ALTER FUNCTION "public"."create_credit_card_with_journal"("card_data" "jsonb", "journal_account_data" "jsonb") OWNER TO "postgres";

GRANT ALL ON FUNCTION "public"."create_credit_card_with_journal"("card_data" "jsonb", "journal_account_data" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."create_credit_card_with_journal"("card_data" "jsonb", "journal_account_data" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_credit_card_with_journal"("card_data" "jsonb", "journal_account_data" "jsonb") TO "service_role";
