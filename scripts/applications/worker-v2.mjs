import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {ENGINE,destination,LOCKED,profileBinding} from '../../lib/applications/forms.mjs';
import {hash} from '../../lib/applications/core.mjs';
import {formHash,compatibleForm,applicationPacket,applicationBlockers} from '../../lib/applications/workflow.mjs';
import {inspect,fillApproved,outcome} from './browser.mjs';
import {prepare} from './prepare.mjs';
const require=createRequire(import.meta.url);
const {chromium}=require('playwright');
const delay=ms=>new Promise(r=>setTimeout(r,ms));
const report=(stage,error)=>console.error(JSON.stringify({at:new Date().toISOString(),stage,error:String(error?.message||error).slice(0,1500)}));

export async function atomicJSON(file,value) {
  await fs.mkdir(path.dirname(file),{recursive:true,mode:0o700});
  const temporary=file+'.next';await fs.writeFile(temporary,JSON.stringify(value,null,2),{mode:0o600});await fs.rename(temporary,file);
}
export function apiClient(cfg) {
  return async (action,extra={})=>{
    const r=await fetch(cfg.origin+'/api/applications/worker',{method:action?'POST':'GET',headers:{Authorization:'Bearer '+cfg.token,'Content-Type':'application/json'},...(action?{body:JSON.stringify({action,version:ENGINE,...extra})}:{}),signal:AbortSignal.timeout(30000)});
    const result=await r.json();if(!r.ok)throw Error(result.error||`Worker request failed (${r.status})`);return result;
  };
}
export async function flushOutbox({directory,api,upload}) {
  await fs.mkdir(directory,{recursive:true,mode:0o700});
  let pending=0;
  for(const file of (await fs.readdir(directory)).filter(f=>f.endsWith('.json'))) {
    const full=path.join(directory,file),item=JSON.parse(await fs.readFile(full,'utf8'));
    if(item.recorded)continue;
    try {
      let evidence;
      for(const [kind,evidenceFile]of Object.entries(item.files).sort(([a],[b])=>a==='json'?-1:b==='json'?1:0)) {
        try {const bytes=await fs.readFile(evidenceFile);if(kind!=='json'&&bytes.length>3_800_000)throw Error('Additional evidence exceeds the hosting upload limit; retained locally.');const r=await upload(item.jobId,item.attempt,kind,bytes);evidence=r.evidence;}
        catch(error){if(kind==='json')throw error;report('additional-evidence',error);}
      }
      await api('result',{jobId:item.jobId,attempt:item.attempt,status:item.status,receipt:item.receipt,issue:item.issue,evidence});
      item.recorded=true;item.recordedAt=new Date().toISOString();await atomicJSON(full,item);
    }catch(error){pending++;report('record-result',error);}
  }
  return pending;
}
export async function execute({page,job,api,loadCV,saveOutcome,checkpoint,waitForHuman,inspectForm=inspect,fillForm=fillApproved,waitOutcome=outcome}) {
  let attempt,begin=false,receipt=null,filled={},failure=null;
  const network=[];
  page.on('response',response=>{const request=response.request();if(request.method()==='POST'){let u;try{u=new URL(response.url());}catch{return;}network.push({url:u.origin+u.pathname,status:response.status(),at:new Date().toISOString()});}});
  try {
    const claim=await api('claim',{jobId:job.id});if(!claim.claimed)return {status:'not-claimed'};
    attempt=claim.attempt;
    const approved=claim.approval,p=approved.packet;
    if(p.version!==2||p.engine!==ENGINE||approved.hash!==hash(p)||p.jobId!==job.id||destination(p.destination)?.url!==job.apply||Date.parse(approved.expiresAt)<=Date.now())throw Error('The approved application changed or expired. Review again.');
    const locationField=p.form.fields.find(f=>profileBinding(f)==='location');
    const inspected=await inspectForm(page,p.destination,{location:locationField&&p.fields[locationField.id]});
    if(!compatibleForm(inspected.form,p.form))throw Error('The employer changed the application questions. Nothing was submitted. Recheck the application.');
    const pdf=await loadCV();if(hash(pdf)!==p.resume.sha256)throw Error('The original CV checksum did not match. Nothing was submitted.');
    filled=await fillForm(page,p,pdf,inspected.form);
    for(const frame of await page.locator('iframe[title*="challenge"]').all())if(await frame.isVisible())throw Error('The employer requires a CAPTCHA before submission. Nothing was submitted; browser assistance is needed.');
    const submit=page.getByRole('button',{name:/^Submit application$/i});
    await submit.waitFor({state:'visible',timeout:15000});
    // Await uploads and client-side validation before authorizing the single click.
    const deadline=Date.now()+30000;while(!await submit.isEnabled()&&Date.now()<deadline)await delay(250);
    if(!await submit.isEnabled())throw Error('The employer has not finished accepting the form or CV. Nothing was submitted.');
    if(checkpoint)await checkpoint({page,jobId:job.id,attempt,stage:'ready-to-submit',filled,approvalHash:approved.hash});
    await api('begin-submit',{jobId:job.id,attempt});begin=true;
    await submit.click({timeout:15000});
    let result=await waitOutcome(page,p.form.platform,45000,p.destination);
    if(result.kind==='challenge'&&waitForHuman) {
      await api('progress',{jobId:job.id,attempt,message:'Complete the CAPTCHA in the Chrome window on your Mac. The agent is waiting for confirmation.'});
      result=await waitForHuman(page,p.form.platform,p.destination);
    }
    if(result.kind!=='success')throw Error(result.text||'The employer did not confirm receipt.');
    receipt={...result,destination:p.destination,at:new Date().toISOString(),url:page.url()};
  }catch(error){failure=error;}
  if(!attempt)return {status:'not-claimed',error:failure?.message};
  const issue=receipt?null:begin?`The employer has not confirmed this attempt: ${failure?.message?.includes('Timeout')?'confirmation did not arrive before the check ended.':failure?.message||'unknown response.'} The outcome is unresolved. No automatic retry is running. Open the attempt evidence before taking further action.`:failure?.message||'The application stopped before submission. Nothing was submitted.';
  // Persist before recording remotely or closing the browser. Recovery only replays this result.
  await saveOutcome({page,jobId:job.id,attempt,status:receipt?'submitted':'failed',receipt,issue,begin,filled,network,error:failure?.message});
  return {status:receipt?'submitted':begin?'uncertain':'blocked',attempt};
}

export async function main() {
  if(process.argv[2]==='--inspect') {
    const browser=await chromium.launch({channel:'chrome',headless:true});
    try {
      const page=await browser.newPage();let result;
      try{result=await inspect(page,process.argv[3],{location:process.argv[5]});}catch(error){if(process.argv[4]){await page.screenshot({path:process.argv[4]+'.png',fullPage:true});await atomicJSON(process.argv[4]+'.error.json',{error:error.message,text:await page.locator('body').innerText(),menus:await page.getByRole('listbox').evaluateAll(es=>es.map(e=>e.outerHTML)),resources:await page.evaluate(()=>performance.getEntriesByType('resource').filter(e=>/geocode|pelias/.test(e.name)).map(e=>({name:e.name,status:e.responseStatus})))});}throw error;}
      if(process.argv[4])await atomicJSON(process.argv[4],result);
      console.log(JSON.stringify({company:result.company,title:result.title,fields:result.form.fields.map(f=>({id:f.id,label:f.label,type:f.type,required:f.required,options:f.options.length})),unsupported:result.form.unsupported,schemaHash:result.schemaHash},null,2));
    }finally{await browser.close();}return;
  }
  const configPath=process.env.APPLICATION_WORKER_CONFIG;if(!configPath)throw Error('Missing worker configuration');
  const cfg=JSON.parse(await fs.readFile(configPath,'utf8')),root=path.dirname(configPath);
  if(cfg.origin!=='https://andysantamaria.com'&&!(cfg.test&&/^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(cfg.origin)))throw Error('Unexpected workspace origin');
  const lock=path.join(root,'worker-v2.lock');
  try{await fs.writeFile(lock,String(process.pid),{flag:'wx',mode:0o600});}catch{
    const pid=Number(await fs.readFile(lock,'utf8'));try{process.kill(pid,0);return;}catch{await fs.unlink(lock);await fs.writeFile(lock,String(process.pid),{flag:'wx',mode:0o600});}
  }
  const api=apiClient(cfg),outbox=path.join(root,'outbox'),evidenceRoot=cfg.receiptsDir||path.join(root,'receipts');
  let message='Checking applications',heartbeat;
  const upload=async(job,attempt,kind,bytes)=>{
    const q=new URLSearchParams({job,attempt,kind});
    const r=await fetch(`${cfg.origin}/api/applications/evidence?${q}`,{method:'POST',headers:{Authorization:'Bearer '+cfg.token,'Content-Type':'application/octet-stream'},body:bytes,signal:AbortSignal.timeout(45000)});
    const result=await r.json();if(!r.ok)throw Error(result.error||'Unable to store evidence');return result;
  };
  let browser;
  try {
    await api('heartbeat',{message});heartbeat=setInterval(()=>api('heartbeat',{message}).catch(e=>report('heartbeat',e)),45000);
    let pendingResults=await flushOutbox({directory:outbox,api,upload});
    const state=await api();
    for(const job of state.jobs.filter(j=>j.status==='submitting'))await api('recover',{jobId:job.id});
    // A pending result must be reconciled before any new application is sent.
    const work=state.jobs.filter(j=>!['submitting','submitted','uncertain'].includes(j.status));
    for(const initial of work) {
      let data=await api(),job=data.jobs.find(j=>j.id===initial.id);
      const dest=destination(job.apply||job.source);
      if(!dest){if(job.preparation?.state!=='unsupported')await api('inspection',{jobId:job.id,unsupported:true,issue:'This employer uses a platform that needs browser assistance. Automatic submission is unavailable.'});continue;}
      const needsInspection=!LOCKED.includes(job.status)&&(job.preparation?.state==='queued'||job.preparation?.state==='inspecting'&&Date.now()-Date.parse(job.preparation.at)>10*60000||!job.form||job.form.engine!==ENGINE||Date.now()-Date.parse(job.form.checkedAt)>6*3600000);
      if(needsInspection) {
        if(job.preparation?.state==='failed'&&Date.now()-Date.parse(job.preparation.at)<30*60000)continue;
        message=`Inspecting ${job.company}`;await api('inspection-start',{jobId:job.id});
        browser ||= await chromium.launch({channel:'chrome',headless:true});
        const page=await browser.newPage({viewport:{width:1280,height:1000}});
        try{const inspected=await inspect(page,dest.url,{location:data.profile.location});await api('inspection',{jobId:job.id,...inspected});}
        catch(e){await api('inspection',{jobId:job.id,issue:`Inspection stopped: ${e.message.includes('Timeout')?'the employer form did not load completely.':e.message}`});}
        finally{await page.close();}
        data=await api();job=data.jobs.find(j=>j.id===initial.id);
      }
      if(job.form&&!LOCKED.includes(job.status)&&['ready','drafting'].includes(job.preparation?.state)&&!job.preparation.draftedAt) {
        message=`Preparing ${job.company} from saved candidate facts`;
        await api('draft-start',{jobId:job.id});
        const draft=await prepare(data,job,cfg,path.join(root,'drafts'));
        await api('prepared',{jobId:job.id,schemaHash:job.schemaHash,...draft});
      }
      data=await api();job=data.jobs.find(j=>j.id===initial.id);
      if(!LOCKED.includes(job.status)&&['queued','checking'].includes(job.preflight?.state)) {
        const packet=applicationPacket(data,job),packetHash=hash(packet);
        if(applicationBlockers(data,job,Date.now(),{requirePreflight:false}).length)continue;
        message=`Checking ${job.company} answers before approval`;
        const started=await api('preflight-start',{jobId:job.id,packetHash});if(started.skipped)continue;
        browser ||= await chromium.launch({channel:'chrome',headless:true});
        const context=await browser.newContext({serviceWorkers:'block'}),page=await context.newPage();let sealed=false;
        await context.route('**/*',route=>{
          const request=route.request();
          if(sealed&&(!['GET','HEAD','OPTIONS'].includes(request.method())||/email-address-validator/.test(request.url())))return route.abort();
          return route.continue();
        });
        try {
          const observed=await inspect(page,job.apply,{location:data.profile.location});sealed=true;
          if(!compatibleForm(observed.form,packet.form)){const error=Error('The employer changed this form. Review the updated questions.');error.form=observed.form;throw error;}
          await fillApproved(page,packet,Buffer.alloc(0),observed.form,{upload:false});
          await api('preflight-result',{jobId:job.id,packetHash,ok:true});
        }catch(error){await api('preflight-result',{jobId:job.id,packetHash,ok:false,issue:error.message,...(error.form?{form:error.form}:{})});}
        finally{await context.close();}
      }
      if(job.status==='approved'&&!data.paused&&!pendingResults) {
        message=`Applying to ${job.company}`;
        // An approved application opens its own window so a human can complete an employer CAPTCHA.
        const submissionBrowser=await chromium.launch({channel:'chrome',headless:cfg.headlessSubmissions===true});
        const context=await submissionBrowser.newContext({viewport:{width:1280,height:1000}}),page=await context.newPage();
        await context.tracing.start({screenshots:true,snapshots:true,sources:false});
        try {
          await execute({page,job,api,waitForHuman:(p,platform,dest)=>outcome(p,platform,10*60000,dest,{ignoreChallenge:true}),checkpoint:async item=>{
            const dir=path.join(evidenceRoot,item.attempt);await fs.mkdir(dir,{recursive:true,mode:0o700});
            const record={...item,page:undefined,at:new Date().toISOString(),url:page.url(),text:(await page.locator('body').innerText()).slice(0,50000)};
            const file=path.join(dir,'before-submit.json');await atomicJSON(file,record);await upload(item.jobId,item.attempt,'json',await fs.readFile(file));
            try{const png=path.join(dir,'before-submit.png');await page.screenshot({path:png,fullPage:true});await fs.chmod(png,0o600);const bytes=await fs.readFile(png);if(bytes.length<=3_800_000)await upload(item.jobId,item.attempt,'png',bytes);}catch(e){report('checkpoint-image',e);}
          },loadCV:async()=>{const r=await fetch(cfg.origin+'/api/applications/resume',{headers:{Authorization:'Bearer '+cfg.token},signal:AbortSignal.timeout(30000)});if(!r.ok)throw Error('The original CV could not be retrieved.');return Buffer.from(await r.arrayBuffer());},saveOutcome:async item=>{
            const base=path.join(evidenceRoot,item.attempt);await fs.mkdir(base,{recursive:true,mode:0o700});
            const record={...item,page:undefined,url:page.url(),text:(await page.locator('body').innerText().catch(()=>'' )).slice(0,50000),at:new Date().toISOString()},files={json:path.join(base,'browser.json')};
            await atomicJSON(files.json,record);
            // The durable outcome is saved first; screenshots and traces are additional evidence.
            const outboxFile=path.join(outbox,item.attempt+'.json');await atomicJSON(outboxFile,{...record,files,recorded:false});
            try{const file=path.join(base,'browser.png');await page.screenshot({path:file,fullPage:true,timeout:15000});await fs.chmod(file,0o600);files.png=file;}catch(e){report('screenshot',e);}
            try{const file=path.join(base,'browser.zip');await context.tracing.stop({path:file});await fs.chmod(file,0o600);files.zip=file;}catch(e){report('trace',e);}
            await atomicJSON(outboxFile,{...record,files,recorded:false});pendingResults=await flushOutbox({directory:outbox,api,upload});
          }});
        }catch(e){report('execute',e);}finally{await context.close();await submissionBrowser.close();}
      }
    }
    message='Ready for approved applications';await api('heartbeat',{message});
  }finally{clearInterval(heartbeat);if(browser)await browser.close();await fs.unlink(lock).catch(()=>{});}
}
if(process.argv[1]===fileURLToPath(import.meta.url))main().catch(e=>{report('worker',e);process.exitCode=1;});
