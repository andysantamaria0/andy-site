const {chromium,expect}=require('@playwright/test');
const {createClient}=require('@supabase/supabase-js');
const {randomBytes}=require('node:crypto');
const {spawn}=require('node:child_process');
const fs=require('node:fs');
const assert=require('node:assert/strict');
(async()=>{
 process.loadEnvFile('.env.local');
 const {hash,passwordHash}=await import('../../lib/applications/core.mjs');
 const {ENGINE}=await import('../../lib/applications/forms.mjs');
 const {formHash,applicationPacket}=await import('../../lib/applications/workflow.mjs');
 const service=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false}});
 const live=process.argv[2]==='--live',base=live?'https://andysantamaria.com':'http://127.0.0.1:3245';
 const id='test-applications-v2-'+randomBytes(6).toString('hex'),workerId=id+'-worker',token=randomBytes(32).toString('hex');
 const password=live?fs.readFileSync('/Users/andrewsantamaria/Library/Application Support/Application Desk/access.txt','utf8').split('\n').find(l=>/^Password\s*:/i.test(l)).replace(/^Password\s*:\s*/i,'').trim():randomBytes(20).toString('hex');
 let server,browser,attempt;const pdf=Buffer.from('%PDF-1.4 original fixture resume'),cvPath=`tests/${id}.pdf`;
 const before=(await service.from('application_desk').select('version,data').eq('id','owner').single()).data;
 try {
  if(!live){
   const form=JSON.parse(fs.readFileSync('tests/applications/fixtures/knit-v2.json','utf8'));form.checkedAt=new Date().toISOString();
   const job={id:'fixture-knit',company:'Knit',title:'Senior Product Manager',source:form.destination,apply:form.destination,status:'draft',form,schemaHash:formHash(form),preparation:{state:'ready',draftedAt:new Date().toISOString()},answers:{},notes:'',fit:'Fixture fit',gap:'',checklist:[]};
   for(const f of form.fields)if(f.required&&f.options.length&&!/Privacy Policy/.test(f.label))job.answers[f.id]={value:f.options.find(o=>/United States/.test(o.label))?.label||f.options[0].label,source:'user'};
   const data={profile:{name:'Test Candidate',email:'fixture@example.com',phone:'+12125550123',years:'8',visa:'no',location:'New York, NY, USA',linkedin:'https://www.linkedin.com/in/test-candidate',github:'https://github.com/example',portfolio:'https://example.com'},resume:{sha256:hash(pdf),path:cvPath},candidate:{cvText:'Fixture candidate — no real application.'},jobs:[job,{id:'old-uncertain',company:'Old employer',title:'Earlier application',status:'uncertain',attempt:{id:'old'},issue:'Receipt verification pending',checklist:[]}],preferences:[],events:[],paused:false};
   const {error}=await service.from('application_desk').insert([{id,version:1,data},{id:workerId,version:1,data:{version:ENGINE,lastSeen:new Date().toISOString(),message:'Test worker connected'}}]);if(error)throw error;
   const upload=await service.storage.from('application-desk-private').upload(cvPath,pdf,{contentType:'application/pdf'});if(upload.error)throw upload.error;
   server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--port','3245'],{env:{...process.env,APPLICATION_DESK_OWNER_ID:id,APPLICATION_DESK_WORKER_ID:workerId,APPLICATION_DESK_ORIGIN:base,APPLICATION_DESK_PASSWORD_HASH:passwordHash(password),APPLICATION_DESK_SESSION_KEY:randomBytes(32).toString('hex'),APPLICATION_DESK_WORKER_KEY:token},stdio:'ignore'});
   for(let n=0;n<60;n++){try{if((await fetch(base+'/applications')).ok)break;}catch{}await new Promise(r=>setTimeout(r,500));}
  }
  browser=await chromium.launch({channel:'chrome',headless:true});const context=await browser.newContext({viewport:{width:1440,height:1000}}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  assert.equal((await context.request.get(base+'/api/applications/state')).status(),401);
  assert.equal((await context.request.get(base+'/api/applications/evidence?job=fixture-knit')).status(),401);
  await page.goto(base+'/applications');await page.getByLabel('Workspace password').fill(password);await page.getByRole('button',{name:'Sign in →'}).click();await expect(page.getByRole('heading',{name:'Your next application.'})).toBeVisible({timeout:30000});
  await page.locator('button.job').filter({has:page.getByText('Knit',{exact:true})}).click();await expect(page.getByRole('heading',{name:'Application answers',exact:true})).toBeVisible({timeout:30000});
  await expect(page.getByLabel('First Name',{exact:true})).toHaveValue(live?before.data.profile.name.split(' ')[0]:'Test');
  await expect(page.getByLabel('Email',{exact:true})).toHaveValue(live?before.data.profile.email:'fixture@example.com');
  await expect(page.getByLabel('Exact answer',{exact:true})).toHaveCount(0);
  if(!live){
   const act=async input=>{const r=await context.request.post(base+'/api/applications/state',{headers:{Origin:base},data:input});return {status:r.status(),body:await r.json()};};
   const wa=async(action,extra={})=>{const r=await context.request.post(base+'/api/applications/worker',{headers:{Authorization:'Bearer '+token},data:{action,version:ENGINE,...extra}});return {status:r.status(),body:await r.json()};};
   assert.equal((await context.request.post(base+'/api/applications/state',{headers:{Origin:'https://wrong.example'},data:{action:'pause',paused:true}})).status(),403);
   await page.getByLabel("Do you consent to Knit's Privacy Policy?",{exact:true}).selectOption('Yes');
   await page.getByLabel('Phone',{exact:true}).fill('+12125550124');
   await page.getByRole('button',{name:'Save & review application →'}).click();
   await expect(page.getByText(/Your final review will open when the check finishes/)).toBeVisible();
   const checking=await (await context.request.get(base+'/api/applications/state')).json(),checkedJob=checking.data.jobs.find(j=>j.id==='fixture-knit');
   assert.equal(checkedJob.preflight.state,'queued');const packetHash=hash(applicationPacket(checking.data,checkedJob));
   assert.equal((await act({action:'approve',jobId:'fixture-knit',packageHash:packetHash})).status,400);
   assert.equal((await wa('preflight-start',{jobId:'fixture-knit',packetHash})).status,200);
   assert.equal((await wa('preflight-result',{jobId:'fixture-knit',packetHash,ok:true})).status,200);
   await page.getByRole('button',{name:'Refresh',exact:true}).click();
   const dialog=page.getByRole('dialog');await expect(dialog).toBeVisible();
   await expect(dialog.getByText('+12125550124',{exact:true})).toBeVisible();await expect(dialog.getByRole('button',{name:'Approve & submit'})).toBeVisible();
   const current=await (await context.request.get(base+'/api/applications/state')).json();assert.equal(current.data.profile.phone,'+12125550124');
   const review=await act({action:'review',jobId:'fixture-knit'});assert.equal(review.status,200);assert.equal((await act({action:'approve',jobId:'fixture-knit',packageHash:'tampered'})).status,400);
   await dialog.getByRole('checkbox').check();await dialog.getByRole('button',{name:'Approve & submit'}).click();await expect(page.getByRole('heading',{name:'Approved and queued'})).toBeVisible();
   const claims=await Promise.all([wa('claim',{jobId:'fixture-knit'}),wa('claim',{jobId:'fixture-knit'})]);assert.equal(claims.filter(c=>c.body.claimed).length,1);attempt=claims.find(c=>c.body.claimed).body.attempt;
   assert.equal((await wa('begin-submit',{jobId:'fixture-knit',attempt})).status,200);
   const receipt={kind:'success',signal:'greenhouse-confirmation',destination:review.body.review.packet.destination,text:'Fixture employer confirmed receipt',at:new Date().toISOString()};
   assert.equal((await wa('result',{jobId:'fixture-knit',attempt,status:'submitted',receipt})).status,400);
   const proof=await context.request.post(`${base}/api/applications/evidence?job=fixture-knit&attempt=${attempt}&kind=json`,{headers:{Authorization:'Bearer '+token,'Content-Type':'application/octet-stream'},data:JSON.stringify({fixture:true,receipt})});assert.equal(proof.status(),200);const evidence=(await proof.json()).evidence;
   assert.equal((await wa('result',{jobId:'fixture-knit',attempt,status:'submitted',receipt,evidence})).status,200);
   assert.equal((await wa('result',{jobId:'fixture-knit',attempt,status:'submitted',receipt,evidence})).status,200);
   assert.equal((await wa('claim',{jobId:'fixture-knit'})).body.claimed,false);
   await page.getByRole('button',{name:'Refresh',exact:true}).click();await expect(page.getByRole('heading',{name:'Employer confirmation'})).toBeVisible();
   assert.equal((await context.request.get(base+'/api/applications/evidence?job=fixture-knit')).status(),200);
   await page.locator('button.job').filter({hasText:'Old employer'}).click();await expect(page.getByText(/No background receipt check is running/)).toBeVisible();assert.equal(await page.getByRole('button',{name:'Approve & submit'}).count(),0);
   const added=await act({action:'add',url:'https://jobs.ashbyhq.com/Example/7225dea4-ae91-46bf-9ecc-8bb7bbeb3914'});assert.equal(added.status,200);assert.equal(added.body.data.jobs.at(-1).preparation.state,'queued');
   assert.equal((await act({action:'add',url:'https://job-boards.greenhouse.io.evil.example/a/jobs/1'})).status,400);
  }
  await page.screenshot({path:'/private/tmp/application-desk-v2-desktop.png'});await page.setViewportSize({width:390,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await page.screenshot({path:'/private/tmp/application-desk-v2-mobile.png'});assert.deepEqual(errors,[]);
  const after=(await service.from('application_desk').select('version,data').eq('id','owner').single()).data;
  if(!live)assert.deepEqual(after,before);
  else {assert.equal(after.data.jobs.find(j=>j.company==='Siro').status,'uncertain');assert(!after.data.jobs.some(j=>j.status==='approved'||j.status==='submitting'));}
  console.log(live?'PASS live authenticated interface, saved contact reuse, truthful Siro status, mobile, no applications changed or sent.':'PASS isolated hosted API + UI: save-and-review, shared profile reuse, exact approval, concurrent single claim, original CV reference, evidence auth, idempotent receipt, uncertain lock, new URL ingestion, mobile; production owner untouched.');
 }finally{
  await browser?.close();server?.kill('SIGTERM');
  if(!live){await service.from('application_desk').delete().in('id',[id,workerId]);await service.storage.from('application-desk-private').remove([cvPath,...(attempt?[`attempts/${attempt}/browser.json`]:[])]);}
 }
})().catch(e=>{console.error(e.message);process.exitCode=1});
