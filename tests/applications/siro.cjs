const {chromium,expect}=require('@playwright/test');
const {createHash,randomBytes}=require('node:crypto');
const {spawn}=require('node:child_process');
const fs=require('node:fs');

// Read-only against the live desk. The save interaction is intercepted below.
(async()=>{
 const {passwordHash,packet,hash,blockers}=await import('../../lib/applications/core.mjs');
 const accessFile=process.env.DESK_ACCESS_FILE||'/Users/andrewsantamaria/Library/Application Support/Application Desk/access.txt';
 const password=fs.readFileSync(accessFile,'utf8').split('\n').find(l=>/^Password\s*:/i.test(l))?.replace(/^Password\s*:\s*/i,'').trim();
 if(!password)throw Error('Workspace password is not available in the access file');
 const base=process.argv[2]||'http://127.0.0.1:3243';
 let server,browser;
 try{
  if(!process.argv[2]){
   process.loadEnvFile('.env.local');
   server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--port','3243'],{env:{...process.env,APPLICATION_DESK_ORIGIN:base,APPLICATION_DESK_PASSWORD_HASH:passwordHash(password),APPLICATION_DESK_SESSION_KEY:randomBytes(32).toString('hex')},stdio:'ignore'});
   let ready=false;for(let n=0;n<60;n++){try{const r=await fetch(base+'/applications');if(r.ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,500));}if(!ready)throw Error('Local production server failed to start');
  }
  browser=await chromium.launch({channel:'chrome',headless:true});
  const ctx=await browser.newContext({viewport:{width:1440,height:1000}}),page=await ctx.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  for(const endpoint of ['state','resume','worker'])expect((await ctx.request.get(base+'/api/applications/'+endpoint)).status()).toBe(401);
  const pub=await ctx.request.get(base+'/applications'),html=await pub.text();
  expect(pub.status()).toBe(200);expect(pub.headers()['x-robots-tag']).toContain('noindex');expect(pub.headers()['cache-control']).toContain('no-store');expect(html).not.toContain('andyjsantamaria@gmail.com');
  await page.goto(base+'/applications');await page.locator('#password').fill(password);await page.getByRole('button',{name:'Sign in →'}).click();
  await expect(page.getByRole('heading',{name:'Review. Approve. Move forward.'})).toBeVisible({timeout:30000});
  const before=await (await ctx.request.get(base+'/api/applications/state')).json();
  await page.locator('button.job').filter({has:page.getByText('Siro',{exact:true})}).click();
  await expect(page.getByRole('heading',{name:'Application answers',exact:true})).toBeVisible();
  await expect(page.getByLabel('Exact answer',{exact:true})).toHaveCount(0);
  const office=page.getByLabel('I understand that Siro is in-office'),visa=page.getByLabel('Do you require visa sponsorship');
  const j=before.data.jobs.find(j=>j.id==='siro-senior-pm');
  await expect(office).toHaveValue(j.officeCommitment||'');await expect(visa).toHaveValue(j.sponsorship||'');
  await expect(page.locator('details')).not.toHaveAttribute('open','');
  await page.getByRole('button',{name:'Review complete application →'}).click();
  const dialog=page.getByRole('dialog');await expect(dialog).toBeVisible();
  await expect(dialog.getByText('NYC office: Tuesday–Thursday',{exact:true})).toBeVisible();
  await expect(dialog.getByText('U.S. visa sponsorship',{exact:true})).toBeVisible();
  expect(await dialog.innerText()).not.toContain(j.answer);expect(await dialog.innerText()).not.toContain('Phone number');
  await expect(page.getByRole('button',{name:'Approve & submit',exact:true})).toHaveCount(0);
  await page.getByRole('button',{name:'Close review'}).click();
  const pdf=await ctx.request.get(base+'/api/applications/resume');expect(pdf.ok()).toBe(true);
  expect(createHash('sha256').update(await pdf.body()).digest('hex')).toBe('5c910868c79d6cc1143b385beb395481574fe2e73e06da83deadf274f18283aa');
  const denied=await ctx.request.post(base+'/api/applications/state',{headers:{Origin:'https://attacker.example'},data:{action:'pause',paused:true}});expect(denied.status()).toBe(403);
  // Exercise the controls without persisting invented candidate answers.
  let saved;
  await page.route('**/api/applications/state',async route=>{
   if(route.request().method()==='POST'&&route.request().postDataJSON().action==='edit'){
    saved=route.request().postDataJSON();const data=structuredClone(before.data);Object.assign(data.jobs.find(x=>x.id===j.id),saved);
    await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({version:before.version,data})});
   }else await route.continue();
  });
  await office.selectOption('no');await visa.selectOption('other');await page.getByRole('button',{name:'Save application answers'}).click();await expect(page.getByRole('status')).toHaveText('Saved.');
  expect(saved.officeCommitment).toBe('no');expect(saved.sponsorship).toBe('other');expect(saved.answer).toBe(j.answer);
  await page.unroute('**/api/applications/state');await page.reload();
  await page.locator('button.job').filter({has:page.getByText('Siro',{exact:true})}).click();await expect(office).toHaveValue(j.officeCommitment||'');await expect(visa).toHaveValue(j.sponsorship||'');
  // Test final approval UX against an intercepted package; never queue a real application.
  const previewData=structuredClone(before.data),previewJob=previewData.jobs.find(x=>x.id===j.id);
  previewData.profile.linkedin='https://www.linkedin.com/in/test-candidate';previewData.paused=false;
  Object.assign(previewJob,{officeCommitment:'yes',sponsorship:'none',schemaHash:'a'.repeat(64),verifiedAt:new Date().toISOString()});
  const proposed=packet(previewData,previewJob);expect(blockers(previewData,previewJob)).toEqual([]);let approvalIntercepted=false;
  await page.route('**/api/applications/state',async route=>{
   if(route.request().method()!=='POST')return route.continue();
   const input=route.request().postDataJSON();
   if(input.action==='review')return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({packet:proposed,packageHash:hash(proposed),blockers:[],supported:true})});
   if(input.action==='approve'){
    expect(input.jobId).toBe(j.id);expect(input.packageHash).toBe(hash(proposed));approvalIntercepted=true;previewJob.status='approved';
    return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({version:before.version,data:previewData})});
   }
   throw Error('Unexpected write during simulated approval');
  });
  await page.getByRole('button',{name:'Review complete application →'}).click();
  await expect(page.getByRole('heading',{name:'Final application review'})).toBeVisible();
  await expect(page.getByRole('dialog').getByText('No visa requirements',{exact:true})).toBeVisible();
  await page.getByRole('checkbox',{name:'I reviewed the original CV and every answer and authorize this submission.'}).check();
  await page.getByRole('button',{name:'Approve & submit',exact:true}).click();await expect(page.getByRole('status')).toContainText('Application approved and queued.');expect(approvalIntercepted).toBe(true);
  await page.unroute('**/api/applications/state');await page.reload();
  await page.locator('button.job').filter({has:page.getByText('Siro',{exact:true})}).click();
  await page.getByRole('heading',{name:'Application answers',exact:true}).scrollIntoViewIfNeeded();
  await page.screenshot({path:'/private/tmp/pip-film-work/siro-desk-desktop.png'});
  await page.setViewportSize({width:390,height:844});await office.scrollIntoViewIfNeeded();await page.screenshot({path:'/private/tmp/pip-film-work/siro-desk-mobile.png'});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)).toBe(false);
  const after=await (await ctx.request.get(base+'/api/applications/state')).json();expect(after.version).toBe(before.version);expect(after.data).toEqual(before.data);
  await page.getByRole('button',{name:'Sign out',exact:true}).click();await expect(page.locator('#password')).toBeVisible();expect((await ctx.request.get(base+'/api/applications/state')).status()).toBe(401);
  expect(errors).toEqual([]);
  console.log('PASS: private desk restored; Siro uses real form fields; intro excluded; original CV bytes verified; save controls tested without persisting; simulated approval without queueing; CSRF; mobile; logout; workspace data unchanged.');
 }finally{await browser?.close();if(server)server.kill('SIGTERM');}
})().catch(e=>{console.error(e.message);process.exitCode=1});
