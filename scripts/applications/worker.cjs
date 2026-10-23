// Deterministic, approval-bound adapter. No model controls the final submit click.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {chromium}=require('playwright');
const ID='browser-company-model-behavior';
const DEST='https://jobs.ashbyhq.com/The%20Browser%20Company/7225dea4-ae91-46bf-9ecc-8bb7bbeb3914/application';
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
async function main(){const configPath=process.env.APPLICATION_WORKER_CONFIG;if(!configPath)throw Error('Missing worker configuration');const cfg=JSON.parse(fs.readFileSync(configPath,'utf8'));if(cfg.origin!=='https://andysantamaria.com'&&!cfg.test)throw Error('Unexpected workspace origin');
 const api=async(action,extra={})=>{const r=await fetch(cfg.origin+'/api/applications/worker',{method:'POST',headers:{Authorization:'Bearer '+cfg.token,'Content-Type':'application/json'},body:JSON.stringify({action,jobId:ID,...extra})});const d=await r.json();if(!r.ok)throw Error(d.error||'Worker request failed');return d;};
 await api('heartbeat');await api('recover');const r=await fetch(cfg.origin+'/api/applications/worker',{headers:{Authorization:'Bearer '+cfg.token}});if(!r.ok)throw Error('Unable to load queue');const state=await r.json(),j=state.jobs.find(j=>j.id===ID);if(!j||state.paused||['submitted','uncertain','submitting'].includes(j.status))return;
 if(j.status!=='approved'&&j.verifiedAt&&Date.now()-Date.parse(j.verifiedAt)<6*3600000)return;
 const browser=await chromium.launch({channel:'chrome',headless:true});let attempt=null;
 try{const page=await browser.newPage({viewport:{width:1280,height:1000}});await page.goto(DEST,{waitUntil:'domcontentloaded',timeout:45000});const observed=await schema(page);
  if(j.status!=='approved'){await api('verify',{schemaHash:observed});return;}
  const claim=await api('claim');if(!claim.claimed)return;attempt=claim.attempt;const p=claim.approval.packet;
  if(claim.approval.hash!==sha(JSON.stringify(canonical(p)))||p.destination!==DEST||p.jobId!==ID||observed!==p.schemaHash||Date.parse(claim.approval.expiresAt)<Date.now())throw Error('The form or approved package changed. Review again.');
  const pdfResponse=await fetch(cfg.origin+'/api/applications/resume',{headers:{Authorization:'Bearer '+cfg.token}});if(!pdfResponse.ok)throw Error('Unable to load original CV');const pdf=Buffer.from(await pdfResponse.arrayBuffer());if(sha(pdf)!==p.resume.sha256)throw Error('Original CV checksum mismatch');
  await fill(page,pdf,p);
  // A visible challenge needs human participation; never solve or bypass it.
  for(const frame of await page.locator('iframe[title*="challenge"]').all())if(await frame.isVisible())throw Error('CAPTCHA requires your participation.');
  if(await page.locator('input:invalid,textarea:invalid,select:invalid').count())throw Error('An application field requires review.');
  await api('begin-submit',{attempt});
  await page.getByRole('button',{name:'Submit Application',exact:true}).click();
  await page.getByText(/Thank you for applying|application has been (submitted|received)|application was (submitted|received)/i).first().waitFor({timeout:30000});
  const confirmation=(await page.locator('body').innerText()).slice(0,1500);
  if(cfg.receiptsDir){fs.mkdirSync(cfg.receiptsDir,{recursive:true,mode:0o700});await page.screenshot({path:path.join(cfg.receiptsDir,attempt+'.png'),fullPage:true});}
  await api('result',{attempt,status:'submitted',confirmation});console.log('Approved application submitted; receipt recorded.');
 }catch(error){if(attempt){try{await api('result',{attempt,status:'failed',issue:error.message});}catch{console.error('Attempt requires reconciliation; no retry performed.');}}else console.error('Form inspection unavailable; nothing sent.');}
 finally{await browser.close();}
}
if(require.main===module)main().catch(()=>{console.error('Worker unavailable; no new submission attempted.');process.exitCode=1;});
module.exports={schema,fill};
