(()=>{let recorder,chunks=[],audio,selected=null;const panel=document.createElement('div');panel.className='card';panel.innerHTML='<h2>AI Voice Evaluation</h2><label>Player</label><select id="voicePlayer"></select><p><button id="voiceRecord">Record</button> <button id="voiceStop" disabled>Stop</button></p><label>Or upload audio (max 4 MB)</label><input id="voiceFile" type="file" accept="audio/*"><button id="voiceGenerate" class="primary">Generate Evaluation</button><label>Transcript</label><textarea id="voiceTranscript"></textarea><label>Evaluation / Parent Email</label><textarea id="voiceReport" style="min-height:250px"></textarea><label>Parent email</label><input id="voiceEmail" type="email"><p><button id="voiceSave">Save Draft</button> <button id="voiceSubmit" class="primary">Submit for Approval</button></p><p id="voiceStatus" role="status"></p><h3>Voice Evaluations / Approvals</h3><div id="voiceList"></div>';panel.hidden=true;document.getElementById('app').prepend(panel);const toggle=document.createElement('button');toggle.textContent='AI Voice Evaluation';document.getElementById('app').prepend(toggle);const v=id=>document.getElementById('voice'+id);const status=s=>v('Status').textContent=s;const run=fn=>async()=>{try{await fn()}catch(e){status('Error: '+(e.message||String(e)))}};async function api(form){const {data:{session:s}}=await db.auth.getSession();if(!s?.access_token)throw Error('Your session expired. Sign in again.');const r=await fetch('/api/voice-evaluation',{method:'POST',headers:{Authorization:'Bearer '+s.access_token},body:form});const data=await r.json();if(!r.ok)throw Error(data.error||'Request failed');return data}
toggle.onclick=run(async()=>{panel.hidden=!panel.hidden;if(!panel.hidden){options('voicePlayer');await list()}});
v('Record').onclick=run(async()=>{
 if(!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder)throw Error('This browser cannot record audio. Try Safari or Chrome, or use Upload Audio.');
 let stream;
 try{stream=await navigator.mediaDevices.getUserMedia({audio:true});}
 catch(e){throw Error('Microphone access denied or unavailable. Allow microphone access in your browser settings, then try again. ('+e.name+')');}
 try{
  const preferred=['audio/mp4','audio/webm;codecs=opus','audio/webm'];
  const format=preferred.find(m=>MediaRecorder.isTypeSupported?.(m));
  recorder=new MediaRecorder(stream,format?{mimeType:format}:undefined);
  chunks=[];audio=null;
  recorder.ondataavailable=e=>{if(e.data?.size)chunks.push(e.data)};
  recorder.onerror=e=>{status('Recording failed. Try Upload Audio instead.');stream.getTracks().forEach(t=>t.stop());v('Record').disabled=false;v('Stop').disabled=true};
  recorder.onstop=()=>{
   const mime=recorder.mimeType||format||'audio/mp4';
   const ext=mime.includes('mp4')?'m4a':mime.includes('ogg')?'ogg':'webm';
   const blob=new Blob(chunks,{type:mime});
   audio=new File([blob],'evaluation.'+ext,{type:mime});
   stream.getTracks().forEach(t=>t.stop());
   v('Record').disabled=false;
   v('Stop').disabled=true;
   v('Generate').disabled=false;
   status(blob.size?'Recording saved ('+Math.ceil(blob.size/1024)+' KB). Select Generate Evaluation.':'Recording was empty. Please try again.');
  };
  recorder.start(1000);
  v('Record').disabled=true;v('Stop').disabled=false;v('Generate').disabled=true;
  status('Recording in progress. Tap Stop when finished.');
 }catch(e){stream.getTracks().forEach(t=>t.stop());throw e}
});
v('Stop').onclick=()=>{if(recorder?.state==='recording'){v('Stop').disabled=true;status('Preparing recording…');recorder.stop();}};
v('File').onchange=()=>{audio=v('File').files?.[0]||null;status(audio?'Uploaded '+audio.name+' ('+Math.ceil(audio.size/1024)+' KB). Select Generate Evaluation.':'No file selected.')};
v('Generate').onclick=run(async()=>{if(!audio||!v('Player').value)throw Error('Select a player and record or upload audio first.');if(audio.size>4000000)throw Error('Recording is too large ('+Math.ceil(audio.size/1024/1024)+' MB). Keep it under 4 MB.');selected=null;const f=new FormData();f.append('audio',audio);f.append('player',v('Player').value);status('Uploading audio and transcribing…');v('Generate').disabled=true;let r;try{r=await api(f)}finally{v('Generate').disabled=false}v('Transcript').value=r.transcript;v('Report').value=r.report;status('Review and edit before submitting')});
async function save(submit){if(!v('Player').value||!v('Report').value.trim())throw Error('Player and evaluation required');const row={player_id:v('Player').value,transcript:v('Transcript').value,report:v('Report').value,parent_email:v('Email').value.trim()};if(selected){check(await db.from('pd_voice_evaluations').update({...row,...(submit?{status:'pending'}:{})}).eq('id',selected))}else{const r=check(await db.from('pd_voice_evaluations').insert(row).select().single());selected=r.id;if(submit)check(await db.from('pd_voice_evaluations').update({status:'pending'}).eq('id',selected))}status(submit?'Submitted for approval':'Draft saved');await list()}
v('Save').onclick=run(()=>save(false));v('Submit').onclick=run(()=>save(true));
async function list(){const rows=check(await db.from('pd_voice_evaluations').select('*').order('created_at',{ascending:false}));v('List').replaceChildren();for(const r of rows){const box=document.createElement('div');box.className='card';const p=players.find(p=>String(p.id)===r.player_id);box.textContent=(p?fullName(p):r.player_id)+' — '+r.status+' ';const btn=(label,fn)=>{const b=document.createElement('button');b.textContent=label;b.onclick=run(fn);box.append(b)};btn('View',()=>{selected=r.id;v('Player').value=r.player_id;v('Transcript').value=r.transcript;v('Report').value=r.report;v('Email').value=r.parent_email});if(isAdmin&&r.status==='pending'){btn('Return',async()=>{check(await db.from('pd_voice_evaluations').update({status:'returned'}).eq('id',r.id));await list()});btn('Approve',async()=>{if(selected!==r.id)throw Error('View and review this evaluation first');if(!v('Email').checkValidity()||!v('Email').value)throw Error('Enter a valid parent email');if(!confirm('Approve this evaluation for parent delivery?'))return;check(await db.from('pd_voice_evaluations').update({report:v('Report').value,parent_email:v('Email').value,status:'approved'}).eq('id',r.id).eq('status','pending'));await list()})}if(isAdmin&&r.status==='approved')btn('Send Email',async()=>{if(!confirm('Send approved email to '+r.parent_email+'?'))return;const f=new FormData();f.append('action','send');f.append('id',r.id);await api(f);status('Email accepted for delivery');await list()});v('List').append(box)}}

const transfer=document.createElement('button');
transfer.type='button';
transfer.textContent='Copy Notes into Detailed Evaluation';
transfer.title='Copies the AI report as notes; a coach must still enter and verify 1–5 skill ratings.';
v('Report').insertAdjacentElement('afterend',transfer);
transfer.onclick=run(async()=>{
 if(!v('Player').value || !v('Report').value.trim())throw Error('Choose a player and generate or open a report first');
 setTab('evaluation');
 $('evalPlayer').value=v('Player').value;
 $('coachNotes').value=v('Report').value;
 setEvalMode('detailed');
 status('Notes copied. Enter and verify 1–5 ratings before saving the standard evaluation.');
 message('Voice notes copied. Enter 1–5 ratings manually before saving.');
});
})();