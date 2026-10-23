// Deterministic, approval-bound adapter. No model controls the final submit click.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {chromium}=require('playwright');
const ID='browser-company-model-behavior';
const DEST='https://jobs.ashbyhq.com/The%20Browser%20Company/7225dea4-ae91-46bf-9ecc-8bb7bbeb3914/application';
const SIRO_ID='siro-senior-pm';
const SIRO_DEST='https://jobs.ashbyhq.com/siro/89967d63-9647-4d6a-9ef1-8c07e7e0da7b/application';
const VERSION='2026-10-23-siro-2';
const OFFICE='I understand that Siro is in-office in NY (Flatiron) on Tues, Wed, and Thurs and can commit to being in-person.';
const SPONSORSHIP='Do you require visa sponsorship to work in the U.S.?';
const VISA_CHOICES=['I require H1B sponsorship or transfer','I require another visa (TN, OPT, etc.)','No visa requirements'];
const canonical=v=>Array.isArray(v)?v.map(canonical):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,canonical(v[k])])):v;
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
async function schema(page){await page.getByRole('button',{name:'Submit Application',exact:true}).waitFor({timeout:30000});const text=(await page.locator('body').innerText()).replace(/\s+/g,' ').trim();const controls=await page.locator('input,textarea,select').evaluateAll(es=>es.filter(e=>e.type!=='hidden'&&e.name!=='g-recaptcha-response').map(e=>({type:e.type,required:e.required,labels:[...(e.labels||[])].map(l=>l.innerText.trim()),options:e.options?[...e.options].map(o=>o.text):[]})));return sha(JSON.stringify({text,controls}));}
async function fill(page,pdf,p){
 if(!/^New York(?: City)?(?:,|$)/i.test(p.fields.location))throw Error('Location requires a reviewed adapter.');
 await page.getByLabel('Resume',{exact:true}).setInputFiles({name:'CV_A_Santamaria_A.pdf',mimeType:'application/pdf',buffer:pdf});
 await page.getByLabel('Full Name',{exact:true}).fill(p.fields.name);await page.getByLabel('Email',{exact:true}).fill(p.fields.email);await page.getByLabel('Phone',{exact:true}).fill(p.fields.phone);
 await page.getByLabel('How many years of professional experience do you have?',{exact:true}).fill(p.fields.years);
 await page.getByLabel('Share a link or video to something you’ve built with AI. In 2-3 sentences, tell us why you built it and what you learned.',{exact:true}).fill(p.fields.answer);
 for(const [label,key]of [['LinkedIn','linkedin'],['Github','github'],['Portfolio','portfolio']])if(p.fields[key])await page.getByLabel(label,{exact:true}).fill(p.fields[key]);
 const location=page.getByRole('combobox');if(await location.count()!==1)throw Error('Location field changed; manual review required.');await location.fill(p.fields.location);const option=page.getByRole('option').filter({hasText:/New York.*(NY|United States|USA)/i}).first();await option.waitFor({timeout:15000});await option.click();
 const q=page.getByText('Do you require any visas or work authorizations to work for BCNY in the location you are applying to?',{exact:true});const group=q.locator('..');await group.getByRole('button',{name:p.fields.visa==='yes'?'Yes':'No',exact:true}).click();
 for(const [label,key]of [['Full Name','name'],['Email','email'],['Phone','phone'],['How many years of professional experience do you have?','years'],['Share a link or video to something you’ve built with AI. In 2-3 sentences, tell us why you built it and what you learned.','answer'],['LinkedIn','linkedin'],['Github','github'],['Portfolio','portfolio']]){if(await page.getByLabel(label,{exact:true}).inputValue()!==(p.fields[key]||''))throw Error('Form values differ from the approved package.');}
 const files=await page.getByLabel('Resume',{exact:true}).evaluate(e=>[...e.files].map(f=>({name:f.name,size:f.size})));if(files.length!==1||files[0].name!=='CV_A_Santamaria_A.pdf'||files[0].size!==pdf.length)throw Error('Original CV attachment did not persist.');
}
async function fillSiro(page,pdf,p){
 const f=p.fields;
 if(!['Yes','No'].includes(f.officeCommitment)||!VISA_CHOICES.includes(f.sponsorship))throw Error('Siro application choices require review.');
 // Use the actual resume field, never Ashby's optional resume-autofill upload.
 await page.getByLabel('Resume',{exact:true}).setInputFiles({name:'CV_A_Santamaria_A.pdf',mimeType:'application/pdf',buffer:pdf});
 for(const [label,key]of [['Name','name'],['Email','email'],['LinkedIn URL','linkedin']])await page.getByLabel(label,{exact:true}).fill(f[key]);
 const office=page.getByText(OFFICE,{exact:true}).locator('..');
 await office.getByRole('button',{name:f.officeCommitment,exact:true}).click();
 const visa=page.getByText(SPONSORSHIP,{exact:true}).locator('..');
 await visa.getByRole('radio',{name:f.sponsorship,exact:true}).check();
 for(const [label,key]of [['Name','name'],['Email','email'],['LinkedIn URL','linkedin']])if(await page.getByLabel(label,{exact:true}).inputValue()!==f[key])throw Error('Siro form values differ from the approved package.');
 if(await office.getByRole('button',{name:f.officeCommitment,exact:true}).getAttribute('aria-pressed')!=='true'||await office.locator('button[aria-pressed="true"]').count()!==1)throw Error('Siro office answer did not persist.');
 if(!await visa.getByRole('radio',{name:f.sponsorship,exact:true}).isChecked()||await visa.locator('input[type="radio"]:checked').count()!==1)throw Error('Siro sponsorship answer did not persist.');
 const files=await page.getByLabel('Resume',{exact:true}).evaluate(e=>[...e.files].map(f=>({name:f.name,size:f.size})));
 if(files.length!==1||files[0].name!=='CV_A_Santamaria_A.pdf'||files[0].size!==pdf.length)throw Error('Original CV attachment did not persist.');
}
const ADAPTERS=[{id:ID,destination:DEST,fill},{id:SIRO_ID,destination:SIRO_DEST,fill:fillSiro}];
function validateApproval(approval,adapter,observed){
 const p=approval?.packet,expires=Date.parse(approval?.expiresAt);
 if(!p||approval.hash!==sha(JSON.stringify(canonical(p)))||p.destination!==adapter.destination||p.jobId!==adapter.id||observed!==p.schemaHash||!Number.isFinite(expires)||expires<=Date.now())throw Error('The form or approved package changed. Review again.');
 return p;
}
async function submissionOutcome(page,timeout=30000){
 // Ashby renders a dedicated outcome container. Its success text is customizable;
 // the default includes "was successfully submitted", not "was submitted".
 const handle=await page.waitForFunction(()=>{
  for(const [selector,kind]of [['.ashby-application-form-success-container','submitted'],['.ashby-application-form-failure-container','rejected'],['.ashby-application-form-blocked-application-container','rejected']]){
   const el=document.querySelector(selector);
   if(el&&el.getClientRects().length&&getComputedStyle(el).visibility!=='hidden')return {kind,text:el.innerText.trim()};
  }
  return false;
 },null,{timeout});
 const result=await handle.jsonValue();await handle.dispose();return result;
}
async function captureEvidence(page,dir,attempt,phase,error){
 fs.mkdirSync(dir,{recursive:true,mode:0o700});
 const base=path.join(dir,attempt+'-'+phase);
 const record={at:new Date().toISOString(),phase,url:page.url(),text:(await page.locator('body').innerText()).slice(0,30000),error:error?.message||null};
 fs.writeFileSync(base+'.json',JSON.stringify(record,null,2),{mode:0o600});
 await page.screenshot({path:base+'.png',fullPage:true});fs.chmodSync(base+'.png',0o600);
}
async function executeApproved({page,adapter,observed,api,loadCV,recordReceipt,recordFailure,confirmationTimeout=30000}){
 let attempt,submitStarted=false;
 try{
  const claim=await api('claim');if(!claim.claimed)return 'not-claimed';
  attempt=claim.attempt;if(typeof attempt!=='string'||!attempt)throw Error('Invalid application attempt.');
  const p=validateApproval(claim.approval,adapter,observed);
  const pdf=await loadCV();if(sha(pdf)!==p.resume.sha256)throw Error('Original CV checksum mismatch');
  await adapter.fill(page,pdf,p);
  // A visible challenge needs human participation; never solve or bypass it.
  for(const frame of await page.locator('iframe[title*="challenge"]').all())if(await frame.isVisible())throw Error('CAPTCHA requires your participation.');
  if(await page.locator('input:invalid,textarea:invalid,select:invalid').count())throw Error('An application field requires review.');
  // The server rechecks approval, expiry, pause state and attempt ownership.
  await api('begin-submit',{attempt});submitStarted=true;
  await page.getByRole('button',{name:'Submit Application',exact:true}).click();
  const outcome=await submissionOutcome(page,confirmationTimeout);
  if(outcome.kind!=='submitted')throw Error('The employer form reported: '+outcome.text.slice(0,1000));
  const confirmation=outcome.text.slice(0,1500);
  // A local screenshot failure must not hide a confirmed employer receipt.
  if(recordReceipt)try{await recordReceipt(page,attempt);}catch{console.error('Local receipt image unavailable; recording employer confirmation.');}
  await api('result',{attempt,status:'submitted',confirmation});
  console.log('Approved application submitted; receipt recorded.');return 'submitted';
 }catch(error){
  if(attempt&&recordFailure)try{await recordFailure(page,attempt,error);}catch{console.error('Could not save the browser evidence; manual verification is required.');}
  const issue=submitStarted?(error.message.startsWith('The employer form reported:')?error.message:'Submit was clicked, but the employer confirmation could not be captured. Check the saved browser evidence and your email before any retry. The agent will not submit again automatically.'):(error.message.startsWith('locator.')?'The agent could not complete the employer form. Review the saved browser evidence before trying again.':error.message);
  if(attempt){try{await api('result',{attempt,status:'failed',issue});}catch{console.error('Attempt requires reconciliation; no retry performed.');}}
  else console.error('Approved package unavailable; nothing sent.');
  return 'stopped';
 }
}
async function main(){
 const configPath=process.env.APPLICATION_WORKER_CONFIG;if(!configPath)throw Error('Missing worker configuration');
 const cfg=JSON.parse(fs.readFileSync(configPath,'utf8'));if(cfg.origin!=='https://andysantamaria.com'&&!cfg.test)throw Error('Unexpected workspace origin');
 const api=async(action,extra={})=>{const r=await fetch(cfg.origin+'/api/applications/worker',{method:'POST',headers:{Authorization:'Bearer '+cfg.token,'Content-Type':'application/json'},body:JSON.stringify({action,...extra})});const d=await r.json();if(!r.ok)throw Error(d.error||'Worker request failed');return d;};
 await api('heartbeat',{version:VERSION});
 for(const adapter of ADAPTERS)await api('recover',{jobId:adapter.id});
 const r=await fetch(cfg.origin+'/api/applications/worker',{headers:{Authorization:'Bearer '+cfg.token}});if(!r.ok)throw Error('Unable to load queue');const state=await r.json();
 if(state.paused)return;
 const pending=ADAPTERS.filter(a=>{const j=state.jobs.find(j=>j.id===a.id);return j&&j.apply===a.destination&&!['submitted','uncertain','submitting'].includes(j.status)&&(j.status==='approved'||!j.schemaHash||!j.verifiedAt||Date.now()-Date.parse(j.verifiedAt)>=6*3600000);});
 if(!pending.length)return;
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try{for(const adapter of pending){
  const j=state.jobs.find(j=>j.id===adapter.id),page=await browser.newPage({viewport:{width:1280,height:1000}});
  try{
   await page.goto(adapter.destination,{waitUntil:'domcontentloaded',timeout:45000});
   if(page.url()!==adapter.destination)throw Error('Application destination changed.');
   const observed=await schema(page),jobApi=(action,extra={})=>api(action,{jobId:adapter.id,...extra});
   if(j.status!=='approved'){await jobApi('verify',{schemaHash:observed});continue;}
   await executeApproved({page,adapter,observed,api:jobApi,loadCV:async()=>{
    const r=await fetch(cfg.origin+'/api/applications/resume',{headers:{Authorization:'Bearer '+cfg.token}});if(!r.ok)throw Error('Unable to load original CV');return Buffer.from(await r.arrayBuffer());
   },recordReceipt:cfg.receiptsDir?(page,attempt)=>captureEvidence(page,cfg.receiptsDir,attempt,'confirmed'):null,recordFailure:cfg.receiptsDir?(page,attempt,error)=>captureEvidence(page,cfg.receiptsDir,attempt,'needs-review',error):null});
  }catch{console.error('Form inspection unavailable; nothing sent.');}
  finally{await page.close();}
 }}finally{await browser.close();}
}
if(require.main===module)main().catch(()=>{console.error('Worker unavailable; no new submission attempted.');process.exitCode=1;});
module.exports={schema,fill,fillSiro,ADAPTERS,OFFICE,SPONSORSHIP,VISA_CHOICES,validateApproval,executeApproved,submissionOutcome,captureEvidence,VERSION};
