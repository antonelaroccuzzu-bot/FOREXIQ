"use client";
import { useEffect, useState } from "react";
import { LogIn, LogOut, ShieldCheck, UserPlus } from "lucide-react";

type Session = { access_token: string; user: { id: string; email?: string } };
const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export default function AuthPanel() {
  const [email,setEmail]=useState(""); const [password,setPassword]=useState("");
  const [session,setSession]=useState<Session|null>(null); const [admin,setAdmin]=useState(false);
  const [busy,setBusy]=useState(false); const [message,setMessage]=useState("");
  useEffect(()=>{ try { const raw=localStorage.getItem("okx-session"); if(raw){const s=JSON.parse(raw) as Session; setSession(s); void checkAdmin(s);} } catch {} },[]);
  async function checkAdmin(s:Session){
    if(!URL||!KEY)return;
    try { const r=await fetch(URL+"/rest/v1/okx_admins?user_id=eq."+encodeURIComponent(s.user.id)+"&select=user_id",{headers:{apikey:KEY,Authorization:"Bearer "+s.access_token}}); const d=await r.json(); setAdmin(Array.isArray(d)&&d.length>0); } catch {}
  }
  async function submit(mode:"login"|"signup"){
    if(!URL||!KEY){setMessage("Supabase is not connected yet. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel.");return;}
    if(!email.trim()||!password){setMessage("Enter your email and password.");return;}
    setBusy(true);setMessage("");
    try{
      const endpoint=mode==="login"?"/auth/v1/token?grant_type=password":"/auth/v1/signup";
      const r=await fetch(URL+endpoint,{method:"POST",headers:{"Content-Type":"application/json",apikey:KEY},body:JSON.stringify({email:email.trim(),password})});
      const d=await r.json();
      if(!r.ok)throw new Error(d.msg||d.message||d.error_description||"Authentication failed");
      if(!d.access_token){setMessage("Account created. Check your email to confirm it, then sign in.");return;}
      const s:Session={access_token:d.access_token,user:d.user};localStorage.setItem("okx-session",JSON.stringify(s));setSession(s);await checkAdmin(s);setPassword("");setMessage("Signed in successfully.");
    }catch(e){setMessage(e instanceof Error?e.message:"Unable to connect.");}finally{setBusy(false);}
  }
  async function signOut(){if(URL&&KEY&&session)try{await fetch(URL+"/auth/v1/logout",{method:"POST",headers:{apikey:KEY,Authorization:"Bearer "+session.access_token}})}catch{}localStorage.removeItem("okx-session");setSession(null);setAdmin(false);setMessage("You have signed out.");}
  return <section className="section-block auth-section" id="account"><div className="section-heading"><div><h2>Account access</h2><p>Sign in to access your personal 0KX account.</p></div>{session&&<span className="section-tag">{admin?"ADMIN ACCOUNT":"SIGNED IN"}</span>}</div>
  {session?<div className="auth-signed"><div className="auth-user"><span className="auth-avatar">{admin?<ShieldCheck size={19}/>:<LogIn size={19}/>}</span><div><b>{session.user.email}</b><small>{admin?"Administrator access detected":"Customer account"}</small></div></div><button className="auth-submit secondary" onClick={signOut}><LogOut size={17}/> Sign out</button></div>:
  <div className="auth-form"><label>Email address<input type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={e=>setEmail(e.target.value)}/></label><label>Password<input type="password" autoComplete="current-password" placeholder="Enter your password" value={password} onChange={e=>setPassword(e.target.value)}/></label><div className="auth-actions"><button className="auth-submit" disabled={busy} onClick={()=>submit("login")}><LogIn size={17}/>{busy?"Please wait":"Sign in"}</button><button className="auth-submit secondary" disabled={busy} onClick={()=>submit("signup")}><UserPlus size={17}/> Create account</button></div></div>}
  {message&&<p className="auth-message" role="status">{message}</p>}</section>;
}