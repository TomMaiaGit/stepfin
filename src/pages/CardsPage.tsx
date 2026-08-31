import { FormEvent, useEffect, useState } from "react";
import { Check, CreditCard, Pencil, Plus } from "lucide-react";
import { Modal } from "../components/Modal";
import { EmptyState, ErrorMessage, PageHeader } from "../components/Ui";
import { money, shortDate } from "../lib/format";
import { supabase } from "../lib/supabase";
import { useAuth } from "../state/AuthContext";

export function CardsPage() {
  const { membership } = useAuth();
  const [cards, setCards] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [modal, setModal] = useState<null | "card" | "pay">(null);
  const [selected, setSelected] = useState<any>(null);
  const [error, setError] = useState("");
  const refresh = async () => {
    if (!membership) return;
    const [cardsResult, invoicesResult, accountsResult] = await Promise.all([
      supabase.from("cards").select("*").eq("group_id", membership.group_id).order("created_at"),
      supabase.from("card_invoices").select("*").eq("group_id", membership.group_id).order("due_date", { ascending: false }),
      supabase.from("financial_accounts").select("id,name").eq("group_id", membership.group_id).eq("is_active", true)
    ]);
    setCards(cardsResult.data ?? []); setInvoices(invoicesResult.data ?? []); setAccounts(accountsResult.data ?? []);
  };
  useEffect(() => { void refresh(); }, [membership]);

  async function saveCard(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); if (!membership) return; const f = new FormData(e.currentTarget);
    const values = { name: String(f.get("name")),
      card_type: "credit", issuer: String(f.get("issuer") || "") || null,
      last_four: String(f.get("lastFour") || "") || null, brand: String(f.get("brand") || "") || null,
      closing_day: Number(f.get("closing")), due_day: Number(f.get("due")),
      credit_limit: Number(f.get("limit")), payment_account_id: String(f.get("account") || "") || null,
      color: String(f.get("color")), is_active: true };
    const result = selected?.card_type ? await supabase.from("cards").update(values).eq("id", selected.id) : await supabase.from("cards").insert({ ...values, group_id: membership.group_id, owner_member_id: membership.id });
    if (result.error) return setError(result.error.message); setModal(null); setSelected(null); await refresh();
  }
  async function payInvoice(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); const f = new FormData(e.currentTarget);
    const { error } = await supabase.rpc("pay_card_invoice", {
      p_invoice_id: selected.id, p_account_id: String(f.get("account")), p_payment_date: String(f.get("date"))
    });
    if (error) return setError(error.message); setModal(null); await refresh();
  }
  return <>
    <PageHeader eyebrow="Crédito sob controle" title="Cartões"
      description="Compras entram na fatura; o saldo da conta muda somente no pagamento."
      action={<button className="button primary" onClick={() => { setSelected(null); setModal("card"); }}><Plus />Novo cartão</button>} />
    <div className="card-grid">{cards.length ? cards.map(card => {
      const openInvoices = invoices.filter(item => item.card_id === card.id && item.status !== "paid");
      const used = openInvoices.reduce((sum, item) => sum + Number(item.total_amount), 0);
      const limit = Number(card.credit_limit ?? 0);
      return <article className="credit-card" key={card.id} style={{ background: card.color }}>
        <div><span>StepFin • {card.brand || "Crédito"}</span><CreditCard /></div>
        <h2>{card.name}</h2><p>•••• {card.last_four || "0000"}</p>
        <div className="limit-line"><span>Usado {money.format(used)}</span><span>Disponível {money.format(Math.max(0, limit - used))}</span></div>
        <div className="progress"><i style={{ width: `${limit ? Math.min(100, used / limit * 100) : 0}%` }} /></div>
        <small>Fecha dia {card.closing_day} • vence dia {card.due_day}</small><button className="card-edit" title="Editar cartão" onClick={() => { setSelected(card); setModal("card"); }}><Pencil /></button>
      </article>;
    }) : <div className="panel span-all"><EmptyState icon={<CreditCard />} title="Nenhum cartão cadastrado" text="Cadastre um cartão para associar compras e acompanhar faturas." /></div>}</div>

    {invoices.length > 0 && <section className="panel section-gap"><h2>Faturas</h2><div className="data-list">
      {invoices.map(invoice => <article key={invoice.id}><span className="transaction-icon"><CreditCard /></span>
        <div><strong>{cards.find(card => card.id === invoice.card_id)?.name ?? "Cartão"} • {new Date(invoice.reference_month + "T12:00:00").toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}</strong><small>Vence {shortDate(invoice.due_date)} • {invoice.status}</small></div>
        <div className="list-actions"><strong>{money.format(invoice.total_amount)}</strong>{invoice.status !== "paid" && <button className="mini-button" onClick={() => { setSelected(invoice); setModal("pay"); }}><Check />Pagar</button>}</div>
      </article>)}
    </div></section>}

    {modal === "card" && <Modal title={selected ? "Editar cartão" : "Novo cartão"} onClose={() => { setModal(null); setSelected(null); }}><form className="form-grid" onSubmit={saveCard}>
      <label>Nome do cartão<input name="name" required placeholder="Ex.: Nubank Roxinho" defaultValue={selected?.name} /></label>
      <div className="two-cols"><label>Instituição<input name="issuer" defaultValue={selected?.issuer ?? ""} /></label><label>Últimos 4 dígitos<input name="lastFour" inputMode="numeric" minLength={4} maxLength={4} defaultValue={selected?.last_four ?? ""} /></label></div>
      <div className="two-cols"><label>Bandeira<input name="brand" placeholder="Mastercard" defaultValue={selected?.brand ?? ""} /></label><label>Limite<input name="limit" type="number" step=".01" min="0" required defaultValue={selected?.credit_limit ?? 0} /></label></div>
      <div className="two-cols"><label>Fechamento<input name="closing" type="number" min="1" max="31" required defaultValue={selected?.closing_day} /></label><label>Vencimento<input name="due" type="number" min="1" max="31" required defaultValue={selected?.due_day} /></label></div>
      <label>Conta para pagar a fatura<select name="account" defaultValue={selected?.payment_account_id ?? ""}><option value="">Definir depois</option>{accounts.map(account => <option value={account.id} key={account.id}>{account.name}</option>)}</select></label>
      <label>Cor<input name="color" type="color" defaultValue={selected?.color ?? "#6f5bd3"} /></label>{error && <ErrorMessage>{error}</ErrorMessage>}<button className="button primary">Salvar cartão</button>
    </form></Modal>}
    {modal === "pay" && <Modal title="Pagar fatura" description="O pagamento reduz a conta, sem duplicar as despesas das compras." onClose={() => setModal(null)}><form className="form-grid" onSubmit={payInvoice}>
      <label>Conta utilizada<select name="account" required><option value="">Selecione</option>{accounts.map(account => <option value={account.id} key={account.id}>{account.name}</option>)}</select></label>
      <label>Data do pagamento<input name="date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required /></label>
      {error && <ErrorMessage>{error}</ErrorMessage>}<button className="button primary">Confirmar pagamento</button>
    </form></Modal>}
  </>;
}
