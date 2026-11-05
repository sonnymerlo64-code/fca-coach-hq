'use client';
import {useEffect,useState} from 'react';
import {createClient} from '@supabase/supabase-js';
let clientSingleton;
export default function AuthGate({children}){
 const [client,setClient]=useState(null),[session,setSession]=useState(null),[ready,setReady]=useState(false),[error,setError]=useState(''),[email,setEmail]=useState(''),[password,setPassword]=useState('');
 useEffect(()=>{let active=true;let subscription;(async()=>{try{const res=await fetch('/api/public-config',{cache:'no-store'});const cfg=await res.json();if(!cfg.configured)throw Error('Supabase settings are missing in Vercel.');clientSingleton ||= createClient(cfg.url,cfg.key,{auth:{persistSession:true,autoRefreshToken:true}});const c=clientSingleton;const {data:{session:s}}=await c.auth.getSession();if(!active)return;setClient(c);setSession(s);const auth=c.auth.onAuthStateChange((_event,next)=>setSession(next));subscription=auth.data.subscription;}catch(e){if(active)setError(e.message)}finally{if(active)setReady(true)}})();return()=>{active=false;subscription?.unsubscribe()}},[]);
 async function login(e){e.preventDefault();setError('');const {error:err}=await client.auth.signInWithPassword({email:email.trim(),password});if(err)setError(err.message);setPassword('')}
 async function logout(){await client.auth.signOut();localStorage.removeItem('fca_sb_session_v20');sessionStorage.removeItem('fca_token');location.href='/'}
 if(!ready)return <main className="home">Connecting…</main>;
 if(!client)return <main className="home"><h1>Connection unavailable</h1><p>{error}</p></main>;
 if(!session)return <main className="home" style={{maxWidth:470}}><h1>Coach Sign In</h1><form onSubmit={login} className="login"><label>Email<input type="email" required value={email} onChange={e=>setEmail(e.target.value)}/></label><label>Password<input type="password" required value={password} onChange={e=>setPassword(e.target.value)}/></label><button type="submit">Sign In</button>{error&&<p role="alert">{error}</p>}</form><p className="notice">Coach accounts are managed by FCA administrators.</p></main>;
 return <><div className="session-bar"><span>Signed in: {session.user.email}</span><button onClick={logout}>Sign Out</button></div>{typeof children==='function'?children(session):children}</>;
}
