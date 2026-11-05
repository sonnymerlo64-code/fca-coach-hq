'use client';
import {useRef} from 'react';
export default function CoachFrame({kind,session}){
 const frame=useRef(null);
 const send=()=>{if(frame.current?.contentWindow&&session?.access_token)frame.current.contentWindow.postMessage({type:'FCA_HQ_SESSION',access_token:session.access_token,refresh_token:session.refresh_token,expires_in:Math.max(60,Math.floor((session.expires_at||0)-Date.now()/1000))},location.origin)};
 return <iframe ref={frame} onLoad={send} className="module-frame" title={kind} src={'/'+kind+'/index.html'}/>;
}
