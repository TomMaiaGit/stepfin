import { Bell, Bot, ChartNoAxesCombined, CreditCard, House, Landmark, Menu, ReceiptText, Settings, Target, Users, WalletCards, X } from "lucide-react";
import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../state/AuthContext";
import { Brand } from "./Brand";
const links = [
  ["/dashboard", "Visão geral", House], ["/transactions", "Lançamentos", ReceiptText],
  ["/bills", "Contas", WalletCards], ["/cards", "Cartões", CreditCard],
  ["/fixed-expenses", "Gastos fixos", Landmark], ["/caixinhas", "Caixinhas", Target],
  ["/reports", "Relatórios", ChartNoAxesCombined], ["/ai-assistant", "Assistente IA", Bot],
  ["/members", "Membros", Users]
] as const;
export function AppShell() {
  const [open, setOpen] = useState(false); const { membership } = useAuth();
  return <div className="app-shell">
    <aside className={open ? "sidebar open" : "sidebar"}>
      <div className="sidebar-head"><Brand/><button className="icon-button mobile-only" onClick={() => setOpen(false)}><X/></button></div>
      <nav>{links.map(([to,label,Icon]) => <NavLink key={to} to={to} onClick={() => setOpen(false)}><Icon size={19}/><span>{label}</span></NavLink>)}</nav>
      <NavLink className="settings-link" to="/settings"><Settings size={19}/>Configurações</NavLink>
    </aside>
    <main className="main"><header className="topbar"><button className="icon-button mobile-only" onClick={() => setOpen(true)}><Menu/></button><div><small>Grupo atual</small><strong>{membership?.financial_groups?.name ?? "StepFin"}</strong></div><NavLink className="icon-button" to="/notifications"><Bell/></NavLink></header><div className="page"><Outlet/></div></main>
    <nav className="bottom-nav">{links.slice(0,4).map(([to,label,Icon]) => <NavLink key={to} to={to}><Icon/><span>{label}</span></NavLink>)}</nav>
  </div>;
}
