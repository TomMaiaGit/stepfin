type ChatMessage = { role: "system" | "user"; content: unknown };
export async function askAI(messages: ChatMessage[], jsonMode = false) {
  const openRouterKey = Deno.env.get("OPENROUTER_API_KEY");
  const groqKey = Deno.env.get("GROQ_API_KEY");
  const attempts = [
    openRouterKey && { url: "https://openrouter.ai/api/v1/chat/completions", key: openRouterKey, model: Deno.env.get("OPENROUTER_MODEL") || "openai/gpt-4.1-mini" },
    groqKey && { url: "https://api.groq.com/openai/v1/chat/completions", key: groqKey, model: Deno.env.get("GROQ_MODEL") || "llama-3.3-70b-versatile" },
  ].filter(Boolean) as { url: string; key: string; model: string }[];
  if (!attempts.length) throw new Error("Configure OPENROUTER_API_KEY ou GROQ_API_KEY nos secrets do Supabase");
  let last = "Falha no provedor de IA";
  for (const provider of attempts) {
    const response = await fetch(provider.url, { method: "POST", headers: { Authorization: `Bearer ${provider.key}`, "Content-Type": "application/json", "HTTP-Referer": Deno.env.get("APP_URL") || "https://stepfin.app", "X-Title": "StepFin" }, body: JSON.stringify({ model: provider.model, messages, temperature: .2, ...(jsonMode ? { response_format: { type: "json_object" } } : {}) }) });
    if (response.ok) return (await response.json()).choices[0].message.content as string;
    last = `${response.status}: ${await response.text()}`;
  }
  throw new Error(last);
}
