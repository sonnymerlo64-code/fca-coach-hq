(()=>{let recorder,chunks=[],audio,selected=null;const panel=document.createElement('div');panel.className='card';panel.innerHTML='<h2>AI Voice Evaluation</h2><label>Player</label><select id="voicePlayer"></select><p><button id="voiceRecord">Record</button> <button id="voiceStop" disabled>Stop</button></p><label>Or upload audio (max 4 MB)</label><input id="voiceFile" type="file" accept="audio/*"><button id="voiceGenerate" class="primary">Generate Evaluation</button><label>Transcript (editable: correct any words the AI heard incorrectly)</label><textarea id="voiceTranscript" style="min-height:170px" placeholder="Correct the transcript before regenerating the evaluation"></textarea><p><button id="voiceRegenerate">Regenerate From Corrected Transcript</button></p><label>Player Evaluation (editable: coach reviews all sections)</label><textarea id="voiceReport" style="min-height:250px"></textarea><label>Parent email</label><input id="voiceEmail" type="email"><p class="muted">Coach: correct transcript and evaluation, then submit for director approval. Director: review, approve, preview PDF, then email the PDF to parents.</p><p><button id="voiceSave">Save Changes / Draft</button> <button id="voiceSubmit" class="primary">Submit for Director Approval</button> <button id="voicePreview">Preview Saved PDF</button></p><p id="voiceStatus" role="status"></p><h3>Voice Evaluations / Approvals</h3><div id="voiceList"></div>';panel.hidden=true;document.getElementById('app').prepend(panel);const toggle=document.createElement('button');toggle.textContent='AI Voice Evaluation';document.getElementById('app').prepend(toggle);const v=id=>document.getElementById('voice'+id);const status=s=>v('Status').textContent=s;const run=fn=>async()=>{try{await fn()}catch(e){status('Error: '+(e.message||String(e)))}};async function api(form){const {data:{session:s}}=await db.auth.getSession();if(!s?.access_token)throw Error('Your session expired. Sign in again.');const r=await fetch('/api/voice-evaluation',{method:'POST',headers:{Authorization:'Bearer '+s.access_token},body:form});const data=await r.json();if(!r.ok)throw Error(data.error||'Request failed');return data}
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
async function save(submit){if(!v('Player').value||!v('Report').value.trim())throw Error('Player and evaluation required');const row={player_id:v('Player').value,transcript:v('Transcript').value,report:v('Report').value,parent_email:v('Email').value.trim()};if(selected){const updated=check(await db.from('pd_voice_evaluations').update({...row,...(submit?{status:'pending'}:{})}).eq('id',selected).select('id'));if(!updated?.length)throw Error('Evaluation could not be edited. Pending or approved evaluations must be returned by the director before coach edits.');}else{const r=check(await db.from('pd_voice_evaluations').insert(row).select().single());selected=r.id;if(submit)check(await db.from('pd_voice_evaluations').update({status:'pending'}).eq('id',selected))}status(submit?'Submitted for approval':'Draft saved');await list()}
v('Save').onclick=run(()=>save(false));v('Submit').onclick=run(()=>save(true));
v('Regenerate').onclick=run(async()=>{
 if(!v('Player').value)throw Error('Select the player first');
 const txt=v('Transcript').value.trim();
 if(!txt)throw Error('Correct the transcript first');
 const f=new FormData();
 f.append('action','regenerate');f.append('player',v('Player').value);f.append('transcript',txt);
 if(selected)f.append('id',selected);
 if(!confirm('Regenerate the evaluation using the corrected transcript? This replaces the current report text; save any edits first.'))return;
 v('Regenerate').disabled=true;status('Building evaluation from your corrected transcript…');
 try{const r=await api(f);v('Report').value=r.report;status('Evaluation regenerated. Edit and save it before submitting for approval.');}
 finally{v('Regenerate').disabled=false}
});
async function previewPdf(id){
 if(!id)throw Error('Save the evaluation draft before previewing the PDF');
 const f=new FormData();f.append('action','preview-pdf');f.append('id',id);
 status('Preparing PDF…');
 const r=await api(f);
 const binary=atob(r.pdf),bytes=new Uint8Array(binary.length);
 for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
 const url=URL.createObjectURL(new Blob([bytes],{type:'application/pdf'}));
 // iOS Safari requires a direct user-initiated navigation, not a blocked popup.
 const a=document.createElement('a');a.href=url;a.target='_blank';a.rel='noopener';a.download=r.fileName||'FCA_Player_Evaluation.pdf';document.body.append(a);a.click();a.remove();
 status('PDF prepared. Check downloads or the new browser tab.');
 setTimeout(()=>URL.revokeObjectURL(url),60000);
}
v('Preview').onclick=run(()=>previewPdf(selected));
async function list(){const rows=check(await db.from('pd_voice_evaluations').select('*').order('created_at',{ascending:false}));v('List').replaceChildren();for(const r of rows){const box=document.createElement('div');box.className='card';const p=players.find(p=>String(p.id)===r.player_id);box.textContent=(p?fullName(p):r.player_id)+' — '+r.status+' ';const btn=(label,fn)=>{const b=document.createElement('button');b.textContent=label;b.onclick=run(fn);box.append(b)};btn('View',()=>{selected=r.id;v('Player').value=r.player_id;v('Transcript').value=r.transcript;v('Report').value=r.report;v('Email').value=r.parent_email});if(isAdmin&&r.status==='pending'){btn('Return',async()=>{check(await db.from('pd_voice_evaluations').update({status:'returned'}).eq('id',r.id));await list()});btn('Approve',async()=>{if(selected!==r.id)throw Error('View and review this evaluation first');if(!v('Email').checkValidity()||!v('Email').value)throw Error('Enter a valid parent email');if(!confirm('Approve this evaluation for parent delivery?'))return;check(await db.from('pd_voice_evaluations').update({transcript:v('Transcript').value,report:v('Report').value,parent_email:v('Email').value,status:'approved'}).eq('id',r.id).eq('status','pending'));await list()})}if(isAdmin&&['pending','approved','sent'].includes(r.status))btn('Preview PDF',()=>previewPdf(r.id));if(isAdmin&&r.status==='approved')btn('Send PDF Email',async()=>{if(!confirm('Send approved email to '+r.parent_email+'?'))return;const f=new FormData();f.append('action','send');f.append('id',r.id);await api(f);status('Approved evaluation PDF submitted for delivery to parent email.');await list()});v('List').append(box)}}

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