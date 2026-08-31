-- A função de saldo é auxiliar interna; não deve ser exposta pela API.
revoke all on function public.calculate_account_balance(uuid,uuid) from public,anon,authenticated;
