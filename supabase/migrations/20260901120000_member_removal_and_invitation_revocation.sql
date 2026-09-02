-- Revoga convites e remove acesso de membros sem apagar o histórico financeiro.
alter table public.group_members
  add column if not exists is_active boolean not null default true,
  add column if not exists removed_at timestamptz;
create index if not exists idx_group_members_active_user on public.group_members(user_id,group_id) where is_active;

create or replace function public.is_group_member(p_group_id uuid)
returns boolean language sql security definer set search_path=public,pg_temp as $$
  select exists(select 1 from public.group_members gm
    where gm.group_id=p_group_id and gm.user_id=auth.uid() and gm.is_active);
$$;
create or replace function public.has_write_permission(p_group_id uuid)
returns boolean language sql security definer set search_path=public,pg_temp as $$
  select exists(select 1 from public.group_members gm
    where gm.group_id=p_group_id and gm.user_id=auth.uid() and gm.is_active
      and gm.permission_level='read_write');
$$;

create or replace function public.cancel_group_invitation(p_invitation_id uuid)
returns public.group_invitations language plpgsql security definer set search_path=public,pg_temp as $$
declare v public.group_invitations;
begin
  select * into v from public.group_invitations where id=p_invitation_id for update;
  if not found then raise exception 'Convite não encontrado';end if;
  if not public.is_group_owner(v.group_id) then raise exception 'Somente o titular pode cancelar convites';end if;
  if v.status<>'pending' then raise exception 'Somente convites pendentes podem ser cancelados';end if;
  update public.group_invitations set status='revoked' where id=v.id returning * into v;
  return v;
end;$$;

create or replace function public.remove_group_member(p_member_id uuid)
returns public.group_members language plpgsql security definer set search_path=public,pg_temp as $$
declare v public.group_members;
begin
  select * into v from public.group_members where id=p_member_id for update;
  if not found then raise exception 'Membro não encontrado';end if;
  if not public.is_group_owner(v.group_id) then raise exception 'Somente o titular pode remover membros';end if;
  if v.role='owner' or v.user_id=auth.uid() then raise exception 'O titular não pode remover a si próprio';end if;
  update public.group_members set is_active=false,removed_at=now() where id=v.id returning * into v;
  return v;
end;$$;

create or replace function public.accept_invitation(token text)
returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
declare v_invitation public.group_invitations%rowtype;v_email text;
begin
  if auth.uid() is null then raise exception 'Autenticação necessária';end if;
  select lower(email) into v_email from public.profiles where id=auth.uid();
  select * into v_invitation from public.group_invitations gi where gi.token=$1 for update;
  if not found then raise exception 'Convite inválido';end if;
  if v_invitation.status<>'pending' then raise exception 'Convite não está pendente';end if;
  if v_invitation.expires_at<=now() then update public.group_invitations set status='expired' where id=v_invitation.id;raise exception 'Convite expirado';end if;
  if lower(v_invitation.invited_email)<>v_email then raise exception 'Convite destinado a outro usuário';end if;
  insert into public.group_members(group_id,user_id,role,permission_level,is_active,removed_at)
  values(v_invitation.group_id,auth.uid(),'member',v_invitation.permission_level,true,null)
  on conflict(group_id,user_id) do update set permission_level=excluded.permission_level,is_active=true,removed_at=null,updated_at=now();
  update public.group_invitations set status='accepted' where id=v_invitation.id;
  return v_invitation.group_id;
end;$$;

revoke all on function public.cancel_group_invitation(uuid) from public,anon;
revoke all on function public.remove_group_member(uuid) from public,anon;
grant execute on function public.cancel_group_invitation(uuid) to authenticated;
grant execute on function public.remove_group_member(uuid) to authenticated;
