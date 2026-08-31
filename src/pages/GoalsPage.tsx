import { FormEvent, useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Pencil, PiggyBank, Plus, Target } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { Modal } from "../components/Modal";
import { EmptyState, ErrorMessage, PageHeader } from "../components/Ui";
import { money, shortDate } from "../lib/format";
import { supabase } from "../lib/supabase";
import { useAuth } from "../state/AuthContext";

const goalLabels: Record<string, string> = {
  emergency: "Reserva de emergência", travel: "Viagem", purchase: "Compra planejada",
  education: "Educação", home: "Casa ou reforma", vehicle: "Veículo",
  investment: "Investimento", debt: "Quitar dívida", custom: "Outro objetivo"
};

export function GoalsPage() {
  const { membership } = useAuth();
  const [boxes, setBoxes] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const refresh = async () => {
    if (!membership) return;
    const [b, g, a] = await Promise.all([
      supabase.from("caixinhas").select("*").eq("group_id", membership.group_id).eq("is_active", true),
      supabase.from("caixinha_goals").select("*"),
      supabase.from("financial_accounts").select("id,name").eq("group_id", membership.group_id).eq("is_active", true)
    ]);
    setBoxes(b.data ?? []); setGoals(g.data ?? []); setAccounts(a.data ?? []);
  };
  useEffect(() => { void refresh(); }, [membership]);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); if (!membership) return;
    const f = new FormData(e.currentTarget);
    const { data, error } = await supabase.from("caixinhas").insert({
      group_id: membership.group_id, created_by: membership.id,
      name: String(f.get("name")), description: String(f.get("description") || "") || null,
      goal_type: String(f.get("type")), funding_account_id: String(f.get("account") || "") || null,
      color: String(f.get("color")), priority: Number(f.get("priority")),
      current_balance: 0, is_active: true
    }).select("id").single();
    if (error) return setError(error.message);
    const target = Number(f.get("target"));
    const date = String(f.get("date") || "") || null;
    if (target > 0) {
      const months = date ? Math.max(1, Math.ceil((new Date(date).getTime() - Date.now()) / (30.44 * 86400000))) : null;
      await supabase.from("caixinha_goals").insert({
        caixinha_id: data.id, goal_name: String(f.get("name")), target_amount: target,
        target_date: date, monthly_target: months ? target / months : null, status: "active"
      });
    }
    setOpen(false); await refresh();
  }

  return <>
    <PageHeader eyebrow="Planos que viram realidade" title="Caixinhas e objetivos"
      description="Reserve parte do dinheiro de uma conta sem duplicar seu patrimônio."
      action={<button className="button primary" onClick={() => setOpen(true)}><Plus />Nova caixinha</button>} />
    <div className="goal-grid">
      {boxes.length ? boxes.map(box => {
        const goal = goals.find(item => item.caixinha_id === box.id);
        const progress = goal ? Math.min(100, Number(box.current_balance) / Number(goal.target_amount) * 100) : 0;
        return <Link className="goal-card" to={`/caixinhas/${box.id}`} key={box.id}>
          <div className="goal-head"><span style={{ background: box.color }}><Target /></span><small>{goalLabels[box.goal_type]}</small></div>
          <h2>{box.name}</h2><strong>{money.format(Number(box.current_balance))}</strong>
          {goal && <><div className="progress"><i style={{ width: `${progress}%`, background: box.color }} /></div>
            <p>{Math.round(progress)}% de {money.format(goal.target_amount)}{goal.target_date ? ` • até ${shortDate(goal.target_date)}` : ""}</p></>}
        </Link>;
      }) : <div className="panel span-all"><EmptyState icon={<PiggyBank />} title="Crie seu primeiro objetivo" text="Viagem, emergência, geladeira ou investimento: acompanhe quanto falta." /></div>}
    </div>
    {open && <Modal title="Nova caixinha" description="O valor reservado continuará pertencendo à conta escolhida." onClose={() => setOpen(false)}>
      <form className="form-grid" onSubmit={submit}>
        <label>Nome<input name="name" required placeholder="Ex.: Viagem para Portugal" /></label>
        <label>Descrição<textarea name="description" /></label>
        <label>Tipo de objetivo<select name="type">{Object.entries(goalLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
        <div className="two-cols"><label>Valor-alvo<input name="target" type="number" step=".01" min="0" required /></label><label>Data desejada<input name="date" type="date" /></label></div>
        <label>Onde o dinheiro está<select name="account"><option value="">Definir depois</option>{accounts.map(account => <option value={account.id} key={account.id}>{account.name}</option>)}</select></label>
        <div className="two-cols"><label>Prioridade<select name="priority"><option value="1">Muito alta</option><option value="2">Alta</option><option value="3">Normal</option><option value="4">Baixa</option><option value="5">Algum dia</option></select></label><label>Cor<input name="color" type="color" defaultValue="#65dfb1" /></label></div>
        {error && <ErrorMessage>{error}</ErrorMessage>}<button className="button primary">Criar objetivo</button>
      </form>
    </Modal>}
  </>;
}

export function GoalDetailPage() {
  const { id } = useParams();
  const [box, setBox] = useState<any>(null);
  const [goal, setGoal] = useState<any>(null);
  const [moves, setMoves] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [error, setError] = useState("");
  const refresh = async () => {
    if (!id) return;
    const [b, g, m] = await Promise.all([
      supabase.from("caixinhas").select("*").eq("id", id).single(),
      supabase.from("caixinha_goals").select("*").eq("caixinha_id", id).eq("status", "active").maybeSingle(),
      supabase.from("caixinha_deposits").select("*").eq("caixinha_id", id).order("deposit_date", { ascending: false })
    ]);
    setBox(b.data); setGoal(g.data); setMoves(m.data ?? []);
  };
  useEffect(() => { void refresh(); }, [id]);
  async function move(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); const f = new FormData(e.currentTarget);
    let amount = Number(f.get("amount")); if (f.get("direction") === "withdraw") amount = -amount;
    const { error } = await supabase.rpc("record_caixinha_deposit", {
      caixinha_id: id ?? "", amount, deposit_date: String(f.get("date")), note: String(f.get("note") || "") || undefined
    });
    if (error) return setError(error.message); setOpen(false); await refresh();
  }
  async function edit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); const f = new FormData(e.currentTarget);
    const boxResult = await supabase.from("caixinhas").update({ name: String(f.get("name")), description: String(f.get("description") || "") || null, color: String(f.get("color")), is_active: f.get("active") === "on" }).eq("id", id ?? "");
    if (boxResult.error) return setError(boxResult.error.message);
    if (goal) { const goalResult = await supabase.from("caixinha_goals").update({ goal_name: String(f.get("name")), target_amount: Number(f.get("target")), target_date: String(f.get("date") || "") || null }).eq("id", goal.id); if (goalResult.error) return setError(goalResult.error.message); }
    setEditOpen(false); await refresh();
  }
  if (!box) return <div className="loading"><span /></div>;
  const progress = goal ? Math.min(100, Number(box.current_balance) / Number(goal.target_amount) * 100) : 0;
  return <>
    <PageHeader eyebrow={goalLabels[box.goal_type ?? "other"] ?? "Objetivo"} title={box.name} description={box.description || "Acompanhe cada passo do objetivo."}
      action={<div className="list-actions"><button className="button ghost" onClick={() => setEditOpen(true)}><Pencil />Editar</button><button className="button primary" onClick={() => setOpen(true)}><Plus />Movimentar</button></div>} />
    <section className="panel goal-hero"><strong>{money.format(Number(box.current_balance))}</strong>
      {goal && <><p>de {money.format(goal.target_amount)} • {Math.round(progress)}%</p><div className="progress large"><i style={{ width: `${progress}%`, background: box.color }} /></div>{goal.monthly_target && <small>Aporte sugerido: {money.format(goal.monthly_target)} por mês</small>}</>}
    </section>
    <div className="panel data-list">{moves.length ? moves.map(item => <article key={item.id}>
      <span className={`transaction-icon ${item.amount > 0 ? "income" : ""}`}>{item.amount > 0 ? <ArrowUp /> : <ArrowDown />}</span>
      <div><strong>{item.note || (item.amount > 0 ? "Aporte" : "Retirada")}</strong><small>{shortDate(item.deposit_date)}</small></div>
      <strong className={item.amount > 0 ? "positive" : "negative"}>{money.format(item.amount)}</strong>
    </article>) : <EmptyState icon={<PiggyBank />} title="Nenhum movimento" text="Registre o primeiro aporte para começar." />}</div>
    {open && <Modal title="Movimentar caixinha" onClose={() => setOpen(false)}><form className="form-grid" onSubmit={move}>
      <label>Operação<select name="direction"><option value="deposit">Aporte</option><option value="withdraw">Retirada</option></select></label>
      <div className="two-cols"><label>Valor<input name="amount" type="number" step=".01" min=".01" required /></label><label>Data<input name="date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required /></label></div>
      <label>Observação<input name="note" /></label>{error && <ErrorMessage>{error}</ErrorMessage>}<button className="button primary">Confirmar</button>
    </form></Modal>}
    {editOpen && <Modal title="Editar caixinha e objetivo" onClose={() => setEditOpen(false)}><form className="form-grid" onSubmit={edit}><label>Nome<input name="name" required defaultValue={box.name} /></label><label>Descrição<textarea name="description" defaultValue={box.description ?? ""} /></label>{goal && <div className="two-cols"><label>Valor-alvo<input name="target" type="number" min=".01" step=".01" defaultValue={goal.target_amount} required /></label><label>Prazo<input name="date" type="date" defaultValue={goal.target_date ?? ""} /></label></div>}<label>Cor<input name="color" type="color" defaultValue={box.color} /></label><label className="check-row"><input name="active" type="checkbox" defaultChecked={box.is_active} />Caixinha ativa</label>{error && <ErrorMessage>{error}</ErrorMessage>}<button className="button primary">Salvar alterações</button></form></Modal>}
  </>;
}

