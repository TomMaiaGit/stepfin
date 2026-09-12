import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { ArrowRightLeft, Pencil, Plus, ReceiptText } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Modal } from "../components/Modal";
import { ReceiptPreview } from "../components/ReceiptPreview";
import { EmptyState, ErrorMessage, PageHeader } from "../components/Ui";
import { loadFinanceOptions } from "../hooks/useFinanceData";
import { money, shortDate } from "../lib/format";
import { receiptAccept, removeReceipt, uploadReceipt } from "../lib/receipts";
import { supabase } from "../lib/supabase";
import { useAuth } from "../state/AuthContext";

const today = () => new Date().toISOString().slice(0, 10);
const monthStart = () => today().slice(0, 8) + "01";
const isCommitmentPayment = (transaction: any) => Array.isArray(transaction.bills) ? transaction.bills.length > 0 : Boolean(transaction.bills);

export function TransactionsPage() {
  const { membership } = useAuth();
  const [rows, setRows] = useState<any[]>([]);
  const [options, setOptions] = useState<any>({ accounts: [], cards: [], categories: [] });
  const [editing, setEditing] = useState<any | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [filters, setFilters] = useState({ from: monthStart(), to: today(), kind: "all", account: "", category: "", status: "", search: "" });

  const refresh = useCallback(async () => {
    if (!membership) return;
    let query = supabase.from("transactions")
      .select("*,financial_accounts!transactions_account_id_fkey(name),cards(name),categories(name),bills!bills_paid_transaction_id_fkey(id)")
      .eq("group_id", membership.group_id).order("transaction_date", { ascending: false });
    if (filters.from) query = query.gte("transaction_date", filters.from);
    if (filters.to) query = query.lte("transaction_date", filters.to);
    if (filters.kind !== "all") query = query.eq("kind", filters.kind);
    if (filters.account) query = query.or(`account_id.eq.${filters.account},destination_account_id.eq.${filters.account}`);
    if (filters.category) query = query.eq("category_id", filters.category);
    if (filters.status) query = query.eq("status", filters.status);
    if (filters.search) query = query.ilike("description", `%${filters.search}%`);
    const [{ data, error: queryError }, financeOptions] = await Promise.all([query, loadFinanceOptions(membership.group_id)]);
    setRows(data ?? []);
    setOptions(financeOptions);
    setError(queryError?.message ?? "");
  }, [membership, filters]);

  useEffect(() => { void refresh(); }, [refresh]);

  async function saveEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing || !membership) return;
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const file = form.get("receipt") as File;
    const managesEvidence = editing.kind === "expense" && !isCommitmentPayment(editing);
    const removeEvidence = managesEvidence && form.get("removeReceipt") === "on";
    const previousPath = editing.receipt_file_path as string | null;
    let nextPath = removeEvidence ? null : previousPath;
    let uploadedPath: string | null = null;

    if (managesEvidence && file?.size) {
      const upload = await uploadReceipt(membership.group_id, "transactions", editing.id, file);
      if (upload.error || !upload.path) { setError(upload.error); setBusy(false); return; }
      uploadedPath = upload.path;
      nextPath = upload.path;
    }

    const { error: updateError } = await supabase.from("transactions").update({
      description: String(form.get("description")),
      amount: Number(form.get("amount")),
      transaction_date: String(form.get("date")),
      category_id: String(form.get("category") || "") || null,
      status: String(form.get("status")),
      notes: String(form.get("notes") || "") || null,
      receipt_file_path: nextPath
    }).eq("id", editing.id);

    if (updateError) {
      if (uploadedPath) await removeReceipt(uploadedPath);
      setError(updateError.message);
      setBusy(false);
      return;
    }
    if (previousPath && previousPath !== nextPath) await removeReceipt(previousPath);
    setEditing(null);
    setBusy(false);
    await refresh();
  }

  return <>
    <PageHeader eyebrow="Movimentações" title="Lançamentos" description="Receitas, despesas e transferências realizadas ou previstas." action={<Link className="button primary" to="/transactions/new"><Plus />Novo lançamento</Link>} />
    <section className="panel filter-panel"><div className="filter-grid">
      <label>De<input type="date" value={filters.from} onChange={event => setFilters({ ...filters, from: event.target.value })} /></label>
      <label>Até<input type="date" value={filters.to} onChange={event => setFilters({ ...filters, to: event.target.value })} /></label>
      <label>Tipo<select value={filters.kind} onChange={event => setFilters({ ...filters, kind: event.target.value })}><option value="all">Todos</option><option value="expense">Despesas</option><option value="income">Receitas</option><option value="transfer">Transferências</option><option value="card_payment">Pagamentos de fatura</option></select></label>
      <label>Conta financeira<select value={filters.account} onChange={event => setFilters({ ...filters, account: event.target.value })}><option value="">Todas</option>{options.accounts.map((item: any) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
      <label>Categoria<select value={filters.category} onChange={event => setFilters({ ...filters, category: event.target.value })}><option value="">Todas</option>{options.categories.map((item: any) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
      <label>Status<select value={filters.status} onChange={event => setFilters({ ...filters, status: event.target.value })}><option value="">Todos</option><option value="cleared">Efetivado</option><option value="pending">Pendente</option><option value="scheduled">Previsto</option><option value="cancelled">Cancelado</option></select></label>
      <label className="search-field">Buscar<input value={filters.search} onChange={event => setFilters({ ...filters, search: event.target.value })} placeholder="Descrição" /></label>
    </div></section>
    <div className="panel">{!rows.length ? <EmptyState icon={<ReceiptText />} title="Nenhum lançamento no período" text="Altere os filtros ou registre um novo movimento." /> : <div className="data-list">{rows.map(row =>
      <article key={row.id}>
        <div className={`transaction-icon ${row.kind}`}>{row.kind === "income" ? "↑" : row.kind === "transfer" ? <ArrowRightLeft /> : "↓"}</div>
        <div><strong>{row.description}</strong><small>{shortDate(row.transaction_date)} • {row.cards?.name ?? row.financial_accounts?.name ?? row.payment_method ?? "sem conta financeira"}{row.categories?.name && ` • ${row.categories.name}`}</small></div>
        <div className="list-actions">{row.receipt_file_path && <ReceiptPreview path={row.receipt_file_path} />}<strong className={row.kind === "income" ? "positive" : row.kind === "expense" ? "negative" : ""}>{row.kind === "income" ? "+ " : row.kind === "expense" ? "− " : ""}{money.format(row.amount)}</strong><button className="icon-action" title="Editar" onClick={() => { setError(""); setEditing(row); }}><Pencil /></button></div>
      </article>)}</div>}</div>
    {editing && <Modal title="Editar lançamento" description="O saldo e a alteração do anexo serão validados antes de salvar." onClose={() => setEditing(null)}>
      <form className="form-grid" onSubmit={saveEdit}>
        <label>Descrição<input name="description" defaultValue={editing.description} required /></label>
        <div className="two-cols"><label>Valor<input name="amount" type="number" min=".01" step=".01" defaultValue={editing.amount} required /></label><label>Data<input name="date" type="date" defaultValue={editing.transaction_date} required /></label></div>
        <label>Categoria<select name="category" defaultValue={editing.category_id ?? ""}><option value="">Sem categoria</option>{options.categories.filter((item: any) => item.is_active !== false).map((item: any) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <label>Status<select name="status" defaultValue={editing.status}><option value="cleared">Efetivado</option><option value="pending">Pendente</option><option value="scheduled">Previsto</option><option value="cancelled">Cancelado</option></select></label>
        <label>Observações<textarea name="notes" defaultValue={editing.notes ?? ""} /></label>
        {editing.kind === "expense" && !isCommitmentPayment(editing) && <div className="attachment-field"><strong>Evidência ou comprovante</strong>{editing.receipt_file_path && <div className="current-attachment"><ReceiptPreview path={editing.receipt_file_path} /><span>Arquivo atual</span><label className="check-row"><input name="removeReceipt" type="checkbox" />Remover ao salvar</label></div>}<input name="receipt" type="file" accept={receiptAccept} /><small className="form-note">Novo arquivo substitui o atual. JPG, PNG, WebP ou PDF, até 10 MB.</small></div>}
        {isCommitmentPayment(editing) && editing.receipt_file_path && <p className="form-note">O comprovante pertence ao pagamento de um compromisso e deve ser consultado naquele módulo.</p>}
        {error && <ErrorMessage>{error}</ErrorMessage>}
        <button className="button primary" disabled={busy}>{busy ? "Salvando…" : "Salvar alteração"}</button>
      </form>
    </Modal>}
  </>;
}

export function NewTransactionPage() {
  const { membership } = useAuth();
  const navigate = useNavigate();
  const [kind, setKind] = useState("expense");
  const [method, setMethod] = useState("pix");
  const [options, setOptions] = useState<any>({ accounts: [], cards: [], categories: [] });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (membership) void loadFinanceOptions(membership.group_id).then(setOptions); }, [membership]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!membership) return;
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const transactionId = crypto.randomUUID();
    const file = form.get("receipt") as File;
    let receiptPath: string | null = null;
    if (kind === "expense" && file?.size) {
      const upload = await uploadReceipt(membership.group_id, "transactions", transactionId, file);
      if (upload.error || !upload.path) { setError(upload.error); setBusy(false); return; }
      receiptPath = upload.path;
    }
    const account = String(form.get("account") || "") || null;
    const destination = String(form.get("destination") || "") || null;
    const card = String(form.get("card") || "") || null;
    const payload: any = {
      id: transactionId, group_id: membership.group_id, member_id: membership.id,
      description: String(form.get("description")), amount: Number(form.get("amount")),
      transaction_date: String(form.get("date")), kind, entry_method: "manual",
      status: String(form.get("status")), category_id: String(form.get("category") || "") || null,
      notes: String(form.get("notes") || "") || null, receipt_file_path: receiptPath,
      payment_method: kind === "transfer" || kind === "income" ? "transfer" : method,
      account_id: kind === "transfer" || kind === "income" ? account : method === "credit" ? null : account,
      destination_account_id: kind === "transfer" ? destination : null,
      card_id: kind === "expense" && method === "credit" ? card : null
    };
    const { error: insertError } = await supabase.from("transactions").insert(payload);
    if (insertError) {
      if (receiptPath) await removeReceipt(receiptPath);
      setError(insertError.message);
      setBusy(false);
      return;
    }
    navigate("/transactions");
  }

  const categories = useMemo(() => options.categories.filter((item: any) => item.is_active !== false && item.kind === (kind === "income" ? "income" : "expense")), [options, kind]);
  return <div className="narrow">
    <PageHeader eyebrow="Novo lançamento" title="Registre o movimento completo" description="Despesas e transferências são recusadas se a conta financeira não tiver saldo." />
    <form className="panel form-grid" onSubmit={submit}>
      <div className="segmented three"><button type="button" className={kind === "expense" ? "active" : ""} onClick={() => setKind("expense")}>Despesa</button><button type="button" className={kind === "income" ? "active" : ""} onClick={() => setKind("income")}>Receita</button><button type="button" className={kind === "transfer" ? "active" : ""} onClick={() => setKind("transfer")}>Transferência</button></div>
      <label>Descrição<input name="description" required /></label>
      <div className="two-cols"><label>Valor<input name="amount" type="number" min=".01" step=".01" required /></label><label>Data<input name="date" type="date" required defaultValue={today()} /></label></div>
      {kind !== "transfer" && <label>Categoria<select name="category"><option value="">Sem categoria</option>{categories.map((item: any) => <option value={item.id} key={item.id}>{item.name}</option>)}</select><Link className="field-link" to="/categories">+ Criar categoria</Link></label>}
      {kind === "expense" && <label>Meio de pagamento<select value={method} onChange={event => setMethod(event.target.value)}><option value="pix">Pix</option><option value="debit">Débito</option><option value="credit">Crédito</option><option value="cash">Dinheiro</option><option value="bank_slip">Boleto</option><option value="other">Outro</option></select></label>}
      <label>{kind === "income" ? "Conta financeira de destino" : kind === "transfer" ? "Conta financeira de origem" : method === "credit" ? "Cartão" : "Conta financeira de origem"}{method === "credit" && kind === "expense" ? <select name="card" required><option value="">Selecione</option>{options.cards.map((item: any) => <option value={item.id} key={item.id}>{item.name}</option>)}</select> : <select name="account" required><option value="">Selecione</option>{options.accounts.map((item: any) => <option value={item.id} key={item.id}>{item.name}</option>)}</select>}</label>
      {kind === "transfer" && <label>Conta financeira de destino<select name="destination" required><option value="">Selecione</option>{options.accounts.map((item: any) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label>}
      <label>Status<select name="status"><option value="cleared">Efetivado</option><option value="pending">Pendente</option><option value="scheduled">Previsto</option></select></label>
      <label>Observações<textarea name="notes" /></label>
      {kind === "expense" && <label>Evidência ou comprovante (opcional)<input name="receipt" type="file" accept={receiptAccept} /><small className="form-note">Nota fiscal, recibo ou comprovante em JPG, PNG, WebP ou PDF, até 10 MB.</small></label>}
      {error && <ErrorMessage>{error}</ErrorMessage>}
      <div className="form-actions"><button className="button ghost" type="button" onClick={() => navigate(-1)}>Cancelar</button><button className="button primary" disabled={busy}>{busy ? "Salvando…" : "Salvar lançamento"}</button></div>
    </form>
  </div>;
}
