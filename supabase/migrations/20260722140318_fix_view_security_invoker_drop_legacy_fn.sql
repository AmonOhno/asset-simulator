SET check_function_bodies = false;
DROP FUNCTION public.create_account_with_journal(account_data jsonb, journal_account_data jsonb);
DROP FUNCTION public.create_credit_card_with_journal(card_data jsonb, journal_account_data jsonb);
ALTER VIEW public.v_balance_sheet SET (security_invoker=true);
ALTER VIEW public.v_journal_entries_for_calendar SET (security_invoker=true);
ALTER VIEW public.v_journal_entries2 SET (security_invoker=true);
ALTER VIEW public.v_profit_loss_statement SET (security_invoker=true);
