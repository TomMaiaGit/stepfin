-- Fecha a exposição automática de funções criadas no schema public.
-- Somente RPCs de produto e helpers usados pelas policies ficam disponíveis
-- para usuários autenticados. Funções de trigger não são endpoints públicos.

alter function public.set_updated_at() set search_path = public, pg_temp;

revoke all on function public.set_updated_at() from public, anon, authenticated;
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.validate_group_member_role() from public, anon, authenticated;
revoke all on function public.initialize_caixinha_balance() from public, anon, authenticated;
revoke all on function public.sync_caixinha_balance() from public, anon, authenticated;
revoke all on function public.after_transaction_split_change() from public, anon, authenticated;

revoke all on function public.is_group_member(uuid) from public, anon, authenticated;
revoke all on function public.has_write_permission(uuid) from public, anon, authenticated;
revoke all on function public.is_group_owner(uuid) from public, anon, authenticated;
revoke all on function public.create_financial_group(text) from public, anon, authenticated;
revoke all on function public.accept_invitation(text) from public, anon, authenticated;
revoke all on function public.record_caixinha_deposit(uuid, numeric, date, text) from public, anon, authenticated;
revoke all on function public.mark_bill_paid(uuid) from public, anon, authenticated;
revoke all on function public.get_group_dashboard(uuid, date) from public, anon, authenticated;

grant execute on function public.is_group_member(uuid) to authenticated;
grant execute on function public.has_write_permission(uuid) to authenticated;
grant execute on function public.is_group_owner(uuid) to authenticated;
grant execute on function public.create_financial_group(text) to authenticated;
grant execute on function public.accept_invitation(text) to authenticated;
grant execute on function public.record_caixinha_deposit(uuid, numeric, date, text) to authenticated;
grant execute on function public.mark_bill_paid(uuid) to authenticated;
grant execute on function public.get_group_dashboard(uuid, date) to authenticated;
