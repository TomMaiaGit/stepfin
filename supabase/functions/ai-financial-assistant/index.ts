import { serve, json } from "../_shared/http.ts";
import { requireMembership } from "../_shared/auth.ts";
import { askAI } from "../_shared/ai.ts";
serve(async (req) => {
  const { groupId, question } = await req.json();
  if (!groupId || !question?.trim()) return json({ error: "groupId e question são obrigatórios" }, 422);
  const { admin, user } = await requireMembership(req, groupId);
  const since = new Date(); since.setMonth(since.getMonth() - 6);
  const [{ data: transactions }, { data: bills }, { data: boxes }] = await Promise.all([
    admin.from("transactions").select("description,amount,kind,transaction_date,categories(name)").eq("group_id", groupId).gte("transaction_date", since.toISOString().slice(0,10)).limit(500),
    admin.from("bills").select("description,amount,due_date,status").eq("group_id", groupId).limit(100),
    admin.from("caixinhas").select("name,current_balance").eq("group_id", groupId),
  ]);
  const context = JSON.stringify({ transactions, bills, caixinhas: boxes });
  const answer = await askAI([
    { role: "system", content: "Você é o assistente financeiro do StepFin. Responda em português do Brasil, de forma objetiva e prudente. Apenas analise e sugira; nunca afirme ter alterado dados. Não invente valores. Dados do grupo: " + context },
    { role: "user", content: question.slice(0, 2000) },
  ]);
  await admin.from("ai_conversations").insert({ group_id: groupId, user_id: user.id, question, answer, insight_type: "general" });
  return json({ answer });
});
