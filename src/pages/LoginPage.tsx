import { FormEvent, useState } from "react";
import { Navigate } from "react-router-dom";
import { Brand } from "../components/Brand";
import { ErrorMessage } from "../components/Ui";
import { supabase } from "../lib/supabase";
import { useAuth } from "../state/AuthContext";
export function LoginPage() {
  const { user, membership } = useAuth(); const [email,setEmail]=useState(""); const [password,setPassword]=useState("");
  const [mode,setMode]=useState<"password"|"magic">("magic"); const [message,setMessage]=useState(""); const [busy,setBusy]=useState(false);
  if (user) return <Navigate to={membership?"/dashboard":"/onboarding"} replace/>;
  async function submit(e:FormEvent){e.preventDefault();setBusy(true);setMessage("");
    const result=mode==="magic"?await supabase.auth.signInWithOtp({email,options:{emailRedirectTo:`${location.origin}/dashboard`}}):await supabase.auth.signInWithPassword({email,password});
    setMessage(result.error?result.error.message:mode==="magic"?"Enviamos um link seguro para seu e-mail.":"Login realizado.");setBusy(false);
  }
  async function signUp(){setBusy(true);const {error}=await supabase.auth.signUp({email,password,options:{data:{full_name:email.split("@")[0]}}});setMessage(error?.message??"Confira seu e-mail para confirmar o cadastro.");setBusy(false);}
  return <main className="auth-page"><section className="auth-copy"><Brand/><div><span className="eyebrow">Seu dinheiro, com clareza</span><h1>Planeje hoje.<br/>Avance amanhã.</h1><p>Organize as finanças da família, acompanhe metas e tome decisões melhores em um só lugar.</p></div><small>Privacidade por padrão • Seus dados protegidos</small></section>
    <section className="auth-panel"><form className="auth-card" onSubmit={submit}><h2>Bem-vindo ao StepFin</h2><p>Acesse com link mágico ou sua senha.</p><div className="segmented"><button type="button" className={mode==="magic"?"active":""} onClick={()=>setMode("magic")}>Link mágico</button><button type="button" className={mode==="password"?"active":""} onClick={()=>setMode("password")}>Senha</button></div><label>E-mail<input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="voce@email.com"/></label>{mode==="password"&&<label>Senha<input type="password" minLength={6} required value={password} onChange={e=>setPassword(e.target.value)}/></label>}{message&&<ErrorMessage>{message}</ErrorMessage>}<button className="button primary" disabled={busy}>{busy?"Aguarde…":mode==="magic"?"Enviar link de acesso":"Entrar"}</button>{mode==="password"&&<button className="button ghost" type="button" disabled={busy} onClick={signUp}>Criar minha conta</button>}</form></section></main>;
}
