import { FormEvent, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { PageHeader, ErrorMessage } from "../components/Ui";
import { supabase } from "../lib/supabase";
import { useAuth } from "../state/AuthContext";
export function OnboardingPage(){
  const {membership,refreshMembership}=useAuth();const [name,setName]=useState("Finanças da família");const [error,setError]=useState("");const [busy,setBusy]=useState(false);const nav=useNavigate();
  if(membership)return <Navigate to="/dashboard" replace/>;
  async function submit(e:FormEvent){e.preventDefault();setBusy(true);const {error}=await supabase.rpc("create_financial_group",{group_name:name});if(error){setError(error.message);setBusy(false);return;}await refreshMembership();nav("/dashboard");}
  return <div className="narrow"><PageHeader eyebrow="Primeiros passos" title="Vamos criar seu espaço financeiro" description="O grupo mantém as finanças compartilhadas e separa seus dados de qualquer outra família."/><form className="panel form-grid" onSubmit={submit}><label>Nome do grupo<input required minLength={2} value={name} onChange={e=>setName(e.target.value)}/></label>{error&&<ErrorMessage>{error}</ErrorMessage>}<button className="button primary" disabled={busy}>{busy?"Criando…":"Criar grupo e continuar"}</button></form></div>;
}
