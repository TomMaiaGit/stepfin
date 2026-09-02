import { serve, json } from "../_shared/http.ts";
import { requireMembership } from "../_shared/auth.ts";

serve(async (req) => {
  const { groupId, email, permissionLevel = "read_write", invitationId } = await req.json();
  const { admin, user, membership } = await requireMembership(req, groupId, true);
  if (membership.role !== "owner") throw new Error("Somente o titular pode convidar");
  const token = crypto.randomUUID() + crypto.randomUUID();
  const expires = new Date(Date.now() + 7 * 86400000).toISOString();
  let recipient = String(email || "").toLowerCase();
  if (invitationId) {
    const { data: existing, error: readError } = await admin.from("group_invitations").select("invited_email,status").eq("id", invitationId).eq("group_id", groupId).single();
    if (readError || !existing) throw new Error("Convite não encontrado");
    if (existing.status !== "pending") throw new Error("Somente convites pendentes podem ser reenviados");
    recipient = existing.invited_email;
    const { error } = await admin.from("group_invitations").update({ token, expires_at: expires, updated_at: new Date().toISOString() }).eq("id", invitationId);
    if (error) throw error;
  } else {
    const { error } = await admin.from("group_invitations").insert({ group_id: groupId, invited_email: recipient, invited_by: user.id, permission_level: permissionLevel, token, expires_at: expires });
    if (error) throw error;
  }
  const resend = Deno.env.get("RESEND_API_KEY"); const appUrl = Deno.env.get("APP_URL");
  if (!resend || !appUrl) return json({ created: true, emailSent: false, reason: "Configure RESEND_API_KEY e APP_URL" });
  const response = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${resend}`, "Content-Type": "application/json" }, body: JSON.stringify({ from: Deno.env.get("RESEND_FROM") || "StepFin <onboarding@resend.dev>", to: [recipient], subject: "Você foi convidado para o StepFin", html: `<p>Você recebeu um convite para organizar as finanças em conjunto.</p><p><a href="${appUrl}/accept-invite?token=${encodeURIComponent(token)}">Aceitar convite</a></p><p>O convite expira em 7 dias.</p>` }) });
  if (!response.ok) { const detail = await response.text(); throw new Error(`Convite salvo, mas o e-mail não pôde ser enviado: ${detail}`); }
  return json({ created: true, emailSent: true });
});
