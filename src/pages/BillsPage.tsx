import { FormEvent, useCallback, useEffect, useState } from "react";
import { CalendarClock, Check, Pencil, Plus, Repeat2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Modal } from "../components/Modal";
import { ReceiptPreview } from "../components/ReceiptPreview";
import { EmptyState, ErrorMessage, PageHeader } from "../components/Ui";
import { loadFinanceOptions } from "../hooks/useFinanceData";
import { money, shortDate } from "../lib/format";
import { receiptAccept, removeReceipt, uploadReceipt } from "../lib/receipts";
import { supabase } from "../lib/supabase";
import { useAuth } from "../state/AuthContext";

const today = new Date().toISOString().slice(0, 10);

export function BillsPage() {
  const { membership } = useAuth();
  const [bills, setBills] = useState<any[]>([]);
  const [recurrences, setRecurrences] = useState<any[]>([]);
  const [options, setOptions] = useState<any>({ accounts: [], cards: [], categories: [] });
  const [tab, setTab] = useState("bills");
  const [modal, setModal] = useState<string | null>(null);
  const [selected, setSelected] = useState<any>(null);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({ from: today.slice(0, 8) + "01", to: "", category: "", search: "" });

  const refresh = useCallback(async () => {
    if (!membership) return;
    let query = supabase.from("bills").select("*").eq("group_id", membership.group_id).order("due_date");
    if (filters.from) query = query.gte("due_date", filters.from);
    if (filters.to) query = query.lte("due_date", filters.to);
    if (filters.category) query = query.eq("category_id", filters.category);
    if (filters.search) query = query.ilike("description", `%${filters.search}%`);
    const [billResult, recurrenceResult, financeOptions] = await Promise.all([
      query,
      supabase.from("recurrences").select("*").eq("group_id", membership.group_id).order("description"),
      loadFinanceOptions(membership.group_id)
    ]);
    setBills(billResult.data ?? []);
    setRecurrences(recurrenceResult.data ?? []);
    setOptions(financeOptions);
  }, [membership, filters]);

  useEffect(() => { void refresh(); }, [refresh]);

  async function saveBill(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!membership) return;
    const form = new FormData(event.currentTarget);
    const values = {
      description: String(form.get("description")), amount: Number(form.get("amount")),
      due_date: String(form.get("due")), category_id: String(form.get("category") || "") || null,
      account_id: String(form.get("account") || "") || null, notes: String(form.get("notes") || "") || null
    };
    const result = selected
      ? await supabase.from("bills").update(values).eq("id", selected.id)
      : await supabase.from("bills").insert({ ...values, group_id: membership.group_id, created_by: membership.id, source_type: "manual", status: "pending" });
    if (result.error) return setError(result.error.message);
    close();
    await refresh();
  }

  async function saveRecurrence(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!membership) return;
    const form = new FormData(event.currentTarget);
    const due = String(form.get("start"));
    const values = {
      description: String(form.get("description")), amount: Number(form.get("amount")),
      recurrence_day: new Date(due + "T12:00:00").getDate(), recurrence_type: String(form.get("type")),
      frequency: String(form.get("frequency")), amount_mode: String(form.get("amountMode")),
      start_date: due, next_due_date: due, category_id: String(form.get("category") || "") || null,
      account_id: String(form.get("account") || "") || null, card_id: String(form.get("card") || "") || null,
      is_active: true, auto_generate: true
    };
    const result = selected
      ? await supabase.from("recurrences").update(values).eq("id", selected.id)
      : await supabase.from("recurrences").insert({ ...values, group_id: membership.group_id, created_by: membership.id });
    if (result.error) return setError(result.error.message);
    if (!selected) await supabase.rpc("generate_recurrence_bills", {});
    close();
    await refresh();
  }

  async function pay(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!membership || !selected) return;
    const form = new FormData(event.currentTarget);
    const file = form.get("receipt") as File;
    let path: string | null = null;
    if (file?.size) {
      const upload = await uploadReceipt(membership.group_id, "bills", selected.id, file);
      if (upload.error || !upload.path) return setError(upload.error);
      path = upload.path;
    }
    const { error: paymentError } = await supabase.rpc("mark_bill_paid", {
      bill_id: selected.id, p_account_id: String(form.get("account")),
      p_actual_amount: Number(form.get("amount")), p_payment_date: String(form.get("date")),
      p_receipt_file_path: path ?? undefined
    });
    if (paymentError) {
      if (path) await removeReceipt(path);
      return setError(paymentError.message);
    }
    close();
    await refresh();
  }

  function close() { setModal(null); setSelected(null); setError(""); }
  const visible = tab === "paid" ? bills.filter(item => item.status === "paid") : bills.filter(item => !["paid", "cancelled"].includes(item.status));

  return <>
    <PageHeader eyebrow="Planejamento e vencimentos" title="Compromissos e recorrências" description="Obrigações futuras ficam separadas das contas financeiras e das despesas já realizadas." action={<button className="button primary" onClick={() => { setSelected(null); setModal(tab === "recurrences" ? "recurrence" : "bill"); }}><Plus />{tab === "recurrences" ? "Nova recorrência" : "Novo compromisso"}</button>} />
    <div className="tabs"><button className={tab === "bills" ? "active" : ""} onClick={() => setTab("bills")}>A vencer</button><button className={tab === "paid" ? "active" : ""} onClick={() => setTab("paid")}>Pagos</button><button className={tab === "recurrences" ? "active" : ""} onClick={() => setTab("recurrences")}>Recorrências</button></div>
    {tab !== "recurrences" && <section className="panel filter-panel"><div className="filter-grid">
      <label>Vence de<input type="date" value={filters.from} onChange={event => setFilters({ ...filters, from: event.target.value })} /></label>
      <label>Até<input type="date" value={filters.to} onChange={event => setFilters({ ...filters, to: event.target.value })} /></label>
      <label>Categoria<select value={filters.category} onChange={event => setFilters({ ...filters, category: event.target.value })}><option value="">Todas</option>{options.categories.map((item: any) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
      <label>Buscar<input value={filters.search} onChange={event => setFilters({ ...filters, search: event.target.value })} placeholder="Descrição do compromisso" /></label>
    </div></section>}
    <div className="panel">{tab === "recurrences"
      ? recurrences.length ? <div className="data-list">{recurrences.map(item => <article key={item.id}><span className="transaction-icon income"><Repeat2 /></span><div><strong>{item.description}</strong><small>{item.frequency} • {item.amount_mode}</small></div><div className="list-actions"><strong>{money.format(item.amount)}</strong><button className="icon-action" title="Editar recorrência" onClick={() => { setSelected(item); setModal("recurrence"); }}><Pencil /></button></div></article>)}</div> : <EmptyState icon={<Repeat2 />} title="Nenhuma recorrência" text="Cadastre compromissos que se repetem." />
      : visible.length ? <div className="data-list">{visible.map(item => <article key={item.id}><span className="transaction-icon"><CalendarClock /></span><div><strong>{item.description}</strong><small>Vence {shortDate(item.due_date)} • {item.status}</small></div><div className="list-actions">{item.payment_receipt_path && <ReceiptPreview path={item.payment_receipt_path} label="Comprovante de pagamento" />}<strong>{money.format(item.actual_amount ?? item.amount)}</strong>{item.status !== "paid" && <button className="mini-button" onClick={() => { setSelected(item); setModal("pay"); }}><Check />Pagar</button>}<button className="icon-action" title="Editar compromisso" onClick={() => { setSelected(item); setModal("bill"); }}><Pencil /></button></div></article>)}</div>
      : <EmptyState icon={<CalendarClock />} title="Nenhum compromisso encontrado" text="Altere o período ou registre uma obrigação futura." />}</div>

    {(modal === "bill" || modal === "recurrence") && <Modal title={selected ? "Editar" : modal === "bill" ? "Novo compromisso" : "Nova recorrência"} onClose={close}>
      <form className="form-grid" onSubmit={modal === "bill" ? saveBill : saveRecurrence}>
        <label>Descrição<input name="description" required defaultValue={selected?.description} /></label>
        <div className="two-cols"><label>Valor<input name="amount" type="number" step=".01" min=".01" required defaultValue={selected?.amount} /></label><label>{modal === "bill" ? "Vencimento" : "Primeiro vencimento"}<input name={modal === "bill" ? "due" : "start"} type="date" required defaultValue={modal === "bill" ? selected?.due_date : selected?.start_date} /></label></div>
        {modal === "recurrence" && <><div className="two-cols"><label>Tipo<select name="type" defaultValue={selected?.recurrence_type ?? "expense"}><option value="expense">Despesa</option><option value="income">Receita</option></select></label><label>Frequência<select name="frequency" defaultValue={selected?.frequency ?? "monthly"}><option value="monthly">Mensal</option><option value="weekly">Semanal</option><option value="yearly">Anual</option></select></label></div><input type="hidden" name="amountMode" value={selected?.amount_mode ?? "fixed"} /></>}
        <label>Categoria<select name="category" defaultValue={selected?.category_id ?? ""}><option value="">Sem categoria</option>{options.categories.filter((item: any) => item.is_active !== false).map((item: any) => <option value={item.id} key={item.id}>{item.name}</option>)}</select><Link className="field-link" to="/categories">+ Criar categoria</Link></label>
        <label>{modal === "bill" ? "Conta prevista para pagamento" : "Conta financeira habitual"}<select name="account" defaultValue={selected?.account_id ?? ""}><option value="">Definir depois</option>{options.accounts.map((item: any) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label>
        {modal === "recurrence" && <label>Cartão habitual<select name="card" defaultValue={selected?.card_id ?? ""}><option value="">Nenhum</option>{options.cards.map((item: any) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label>}
        {modal === "bill" && <label>Observações<textarea name="notes" defaultValue={selected?.notes ?? ""} /></label>}
        {error && <ErrorMessage>{error}</ErrorMessage>}<button className="button primary">Salvar</button>
      </form>
    </Modal>}

    {modal === "pay" && selected && <Modal title="Confirmar pagamento" description="O saldo da conta financeira será validado antes da confirmação." onClose={close}>
      <form className="form-grid" onSubmit={pay}>
        <label>Pagar usando<select name="account" required><option value="">Selecione uma conta financeira</option>{options.accounts.map((item: any) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <div className="two-cols"><label>Valor<input name="amount" type="number" step=".01" min=".01" defaultValue={selected.amount} required /></label><label>Data<input name="date" type="date" defaultValue={today} required /></label></div>
        <label>Comprovante opcional<input name="receipt" type="file" accept={receiptAccept} /></label>
        <small className="form-note">JPG, PNG, WebP ou PDF, até 10 MB.</small>
        {error && <ErrorMessage>{error}</ErrorMessage>}<button className="button primary">Confirmar pagamento</button>
      </form>
    </Modal>}
  </>;
}
