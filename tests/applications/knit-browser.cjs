const {chromium,expect}=require('@playwright/test');
const fs=require('node:fs');
const {randomBytes}=require('node:crypto');
const {spawn}=require('node:child_process');
(async()=>{
 const {passwordHash}=await import('../../lib/applications/core.mjs');
 const {KNIT_QUESTIONS,KNIT_DESTINATION}=await import('../../lib/applications/knit.mjs');
 const password=fs.readFileSync('/Users/andrewsantamaria/Library/Application Support/Application Desk/access.txt','utf8').split('\n').find(l=>/^Password\s*:/i.test(l))?.replace(/^Password\s*:\s*/i,'').trim();if(!password)throw Error('Missing workspace access');
 const base=process.argv[2]||'http://127.0.0.1:3243';let server,browser;
 try{
  if(!process.argv[2]){process.loadEnvFile('.env.local');server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--port','3243'],{env:{...process.env,APPLICATION_DESK_ORIGIN:base,APPLICATION_DESK_PASSWORD_HASH:passwordHash(password),APPLICATION_DESK_SESSION_KEY:randomBytes(32).toString('hex')},stdio:'ignore'});let ready=false;for(let i=0;i<60;i++){try{if((await fetch(base+'/applications')).ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,500));}if(!ready)throw Error('Local server did not start');}
  browser=await chromium.launch({channel:'chrome',headless:true});const ctx=await browser.newContext({viewport:{width:1440,height:1000}}),page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  expect((await ctx.request.get(base+'/api/applications/state')).status()).toBe(401);
  await page.goto(base+'/applications');await page.locator('#password').fill(password);await page.getByRole('button',{name:'Sign in →'}).click();await expect(page.getByRole('heading',{name:'Review. Approve. Move forward.'})).toBeVisible({timeout:30000});
  const before=await (await ctx.request.get(base+'/api/applications/state')).json(),j=before.data.jobs.find(j=>j.company==='Knit');
  await page.locator('button.job').filter({has:page.getByText('Knit',{exact:true})}).click();
  await expect(page.getByRole('heading',{name:'Knit application answers'})).toBeVisible();
  await expect(page.getByRole('link',{name:'Open application form'})).toHaveAttribute('href',KNIT_DESTINATION);
  await expect(page.getByLabel('Preparation draft',{exact:true})).toHaveCount(0);await expect(page.getByLabel('Exact answer',{exact:true})).toHaveCount(0);
  await expect(page.locator('select')).toHaveCount(7);
  for(const q of KNIT_QUESTIONS){const el=page.getByLabel(q.label);await expect(el).toHaveValue(j.knitAnswers?.[q.key]||'');expect(await el.locator('option').allTextContents()).toEqual(['Choose your answer','Yes','No']);}
  await expect(page.getByLabel("Do you consent to Knit's Privacy Policy?")).toHaveValue('');
  await page.getByRole('button',{name:'Review application details →'}).click();const modal=page.getByRole('dialog');await expect(modal).toBeVisible();
  await expect(modal.getByText('First Name',{exact:true})).toBeVisible();await expect(modal.getByText('Andrew',{exact:true})).toBeVisible();
  await expect(modal.getByText(before.data.profile.linkedin,{exact:true})).toBeVisible();
  for(const q of KNIT_QUESTIONS)await expect(modal.getByText(q.label,{exact:true})).toBeVisible();
  await expect(modal.getByRole('button',{name:'Approve & submit'})).toHaveCount(0);expect(await modal.innerText()).not.toContain('AI-project answer is missing');
  await page.getByRole('button',{name:'Close review'}).click();
  let saved;await page.route('**/api/applications/state',async route=>{
   if(route.request().method()==='POST'&&route.request().postDataJSON().action==='edit'){saved=route.request().postDataJSON();const data=structuredClone(before.data);Object.assign(data.jobs.find(x=>x.id===j.id),{knitAnswers:saved.knitAnswers});return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({version:before.version,data})});}return route.continue();
  });
  await page.getByLabel(KNIT_QUESTIONS[4].label).selectOption('no');await page.getByRole('button',{name:'Save application answers'}).click();await expect(page.getByRole('status')).toHaveText('Saved.');expect(saved.knitAnswers.aiSystemsExperience).toBe('no');expect(saved.knitAnswers.privacyConsent||'').toBe('');
  await page.unroute('**/api/applications/state');await page.reload();await page.locator('button.job').filter({has:page.getByText('Knit',{exact:true})}).click();
  await page.getByRole('heading',{name:'Knit application answers'}).scrollIntoViewIfNeeded();await page.screenshot({path:'/private/tmp/knit-audit/desk-desktop.png'});
  await page.setViewportSize({width:390,height:844});await page.getByRole('heading',{name:'Knit application answers'}).scrollIntoViewIfNeeded();await page.screenshot({path:'/private/tmp/knit-audit/desk-mobile.png'});expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)).toBe(false);
  await page.locator('button.job').filter({has:page.getByText('The Browser Company',{exact:true})}).click();await expect(page.getByRole('heading',{name:'Required AI-project answer'})).toBeVisible();await expect(page.getByLabel('Exact answer',{exact:true})).toBeVisible();
  const after=await (await ctx.request.get(base+'/api/applications/state')).json();expect(after.version).toBe(before.version);expect(after.data).toEqual(before.data);expect(errors).toEqual([]);
  console.log('PASS: Knit exact seven controls, optional fields and profile reuse; no generic essay; review matches form; consent blank; save tested without persistence; Browser Company essay retained; mobile; no workspace changes or submission.');
 }finally{await browser?.close();server?.kill('SIGTERM');}
})().catch(e=>{console.error(e.message);process.exitCode=1});
