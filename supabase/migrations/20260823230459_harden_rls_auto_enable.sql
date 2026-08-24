-- A função é usada internamente pelo event trigger do projeto e não deve ser
-- exposta como RPC para clientes anônimos ou autenticados.
revoke all on function public.rls_auto_enable() from public;
revoke all on function public.rls_auto_enable() from anon;
revoke all on function public.rls_auto_enable() from authenticated;
