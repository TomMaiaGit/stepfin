import { createClient } from "npm:@supabase/supabase-js@2";
export function clients(req: Request) {
  const url = Deno.env.get("SUPABASE_URL")!;
  const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return {
    userClient: createClient(url, anon, { global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } } }),
    admin: createClient(url, service),
  };
}
export async function requireUser(req: Request) {
  const { userClient, admin } = clients(req);
  const { data, error } = await userClient.auth.getUser();
  if (error || !data.user) throw new Error("Não autenticado");
  return { user: data.user, userClient, admin };
}
export async function requireMembership(req: Request, groupId: string, write = false) {
  const context = await requireUser(req);
  const { data } = await context.admin.from("group_members").select("id,permission_level,role").eq("group_id", groupId).eq("user_id", context.user.id).eq("is_active", true).single();
  if (!data || (write && data.permission_level !== "read_write")) throw new Error("Sem permissão para este grupo");
  return { ...context, membership: data };
}
