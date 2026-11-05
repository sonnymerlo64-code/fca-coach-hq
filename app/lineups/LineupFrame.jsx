'use client';
import {useEffect,useRef} from 'react';
import {createClient} from '@supabase/supabase-js';
export default function LineupFrame(){const frame=useRef(null);async function sync(){const cfg=await (await fetch('/api/public-config',{cache:'no-store'})).json();if(!cfg.configured)return;const c=createClient(cfg.url,cfg.key);const {data:{session}}=await c.auth.getSession();if(session)frame.current?.contentWindow?.postMessage({type:'FCA_HQ_SESSION',session,config:cfg},location.origin)}useEffect(()=>{sync()},[]);return <iframe ref={frame} onLoad={sync} className="module-frame" title="Lineup Manager" src="/lineups/index.html"/>}
