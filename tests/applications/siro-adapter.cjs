const {chromium,expect}=require('@playwright/test');
const assert=require('node:assert/strict');
const {createHash}=require('node:crypto');
const fs=require('node:fs');
const {fillSiro,schema,ADAPTERS,OFFICE,SPONSORSHIP,VISA_CHOICES,executeApproved,submissionOutcome,captureEvidence}=require('../../scripts/applications/worker.cjs');
const adapter=ADAPTERS.find(a=>a.id==='siro-senior-pm');
const sha=b=>createHash('sha256').update(b).digest('hex');
const pdf=Buffer.from('fixture PDF bytes; never sent to an employer');
function fixture(){return `<form onsubmit="event.preventDefault();window.sent=(window.sent||0)+1;window.received={name:document.querySelector('#name').value,email:document.querySelector('#email').value,linkedin:document.querySelector('#linkedin').value,office:document.querySelector('button[aria-pressed=true]').textContent,visa:document.querySelector('input[type=radio]:checked').value};document.body.innerHTML='<div class=ashby-application-form-success-container><h1>Success</h1><p>Your application was successfully submitted. We will contact you if there are next steps.</p></div>'">
 <label>Autofill from resume<input type="file" id="autofill"></label>
 <label for="name">Name</label><input id="name" required>
 <label for="email">Email</label><input id="email" type="email" required>
 <label for="linkedin">LinkedIn URL</label><input id="linkedin" required>
 <label for="resume">Resume</label><input id="resume" type="file" required>
 <div><label>${OFFICE}</label><div>${['Yes','No'].map(choice=>`<button type="button" aria-pressed="false" onclick="this.parentNode.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed','false'));this.setAttribute('aria-pressed','true')">${choice}</button>`).join('')}<input type="checkbox" tabindex="-1"></div></div>
 <fieldset><label>${SPONSORSHIP}</label>${VISA_CHOICES.map((v,i)=>`<label for="v${i}">${v}</label><input id="v${i}" name="visa" type="radio" value="${v}">`).join('')}</fieldset>
 <button type="submit">Submit Application</button></form>`;}
(async()=>{
 const {hash}=await import('../../lib/applications/core.mjs');
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try{
  const page=await browser.newPage();let requests=0;page.on('request',()=>requests++);
  const fields={name:'Test Candidate',email:'candidate@example.com',linkedin:'https://www.linkedin.com/in/test-candidate',officeCommitment:'Yes',sponsorship:VISA_CHOICES[2]};
  for(const officeCommitment of ['Yes','No'])for(const sponsorship of VISA_CHOICES){
   await page.setContent(fixture());await fillSiro(page,pdf,{fields:{...fields,officeCommitment,sponsorship}});
   assert.equal(await page.locator('#autofill').evaluate(e=>e.files.length),0);
   assert.equal(await page.locator('button[aria-pressed=true]').innerText(),officeCommitment);
   assert.equal(await page.locator('input[type=radio]:checked').inputValue(),sponsorship);
   assert.equal(await page.evaluate(()=>window.sent||0),0);
  }
  const run=async({change=()=>{},claimed=true,denyBegin=false,receiptFails=false,noReceipt=false}={})=>{
   await page.setContent(fixture());await page.evaluate(()=>{window.sent=0;window.received=null});
   if(noReceipt)await page.locator('form').evaluate(form=>form.onsubmit=e=>{e.preventDefault();window.sent=(window.sent||0)+1;document.body.innerHTML='<p>Pending employer response</p>';});
   const observed=await schema(page),p={jobId:adapter.id,destination:adapter.destination,schemaHash:observed,resume:{sha256:sha(pdf)},fields:{...fields}};
   const approval={packet:p,hash:hash(p),expiresAt:new Date(Date.now()+60000).toISOString()};let cv=pdf,cvLoads=0;
   change(approval);if(approval.corruptCV)cv=Buffer.from('changed');
   let evidence;const calls=[],api=async(action,data={})=>{calls.push({action,...data});if(action==='claim')return {claimed,attempt:'fixture-attempt',approval};if(action==='begin-submit'&&denyBegin)throw Error('Submission not authorized');return {ok:true};};
   const status=await executeApproved({page,adapter,observed,api,loadCV:async()=>{cvLoads++;return cv;},recordReceipt:receiptFails?async()=>{throw Error('Disk unavailable')}:null,confirmationTimeout:noReceipt?100:30000,recordFailure:async(page,attempt,error)=>{evidence={attempt,text:await page.locator('body').innerText(),error:error.message};}});
   return {status,calls,cvLoads,evidence,sent:await page.evaluate(()=>window.sent||0),received:await page.evaluate(()=>window.received)};
  };
  let r=await run();assert.equal(r.status,'submitted');assert.equal(r.sent,1);assert.deepEqual(r.calls.map(c=>c.action),['claim','begin-submit','result']);assert.equal(r.calls.at(-1).status,'submitted');assert.deepEqual(r.received,{name:fields.name,email:fields.email,linkedin:fields.linkedin,office:fields.officeCommitment,visa:fields.sponsorship});
  r=await run({claimed:false});assert.equal(r.sent,0);assert.equal(r.cvLoads,0);assert.deepEqual(r.calls.map(c=>c.action),['claim']);
  for(const change of [a=>{a.expiresAt='invalid'},a=>{a.expiresAt=new Date(0).toISOString()},a=>{a.packet.fields.email='different@example.com'},a=>{a.packet.schemaHash='changed';a.hash=hash(a.packet)},a=>{a.packet.destination='https://example.com';a.hash=hash(a.packet)}]){
   r=await run({change});assert.equal(r.sent,0);assert.equal(r.cvLoads,0);assert.equal(r.calls.at(-1).status,'failed');assert(!r.calls.some(c=>c.action==='begin-submit'));
  }
  r=await run({change:a=>{a.corruptCV=true}});assert.equal(r.sent,0);assert(!r.calls.some(c=>c.action==='begin-submit'));assert.match(r.calls.at(-1).issue,/checksum/);
  r=await run({denyBegin:true});assert.equal(r.sent,0);assert.equal(r.calls.at(-1).status,'failed');
  r=await run({receiptFails:true});assert.equal(r.status,'submitted');assert.equal(r.sent,1);assert.equal(r.calls.at(-1).status,'submitted');
  r=await run({noReceipt:true});assert.equal(r.sent,1);assert.equal(r.status,'stopped');assert.equal(r.calls.at(-1).status,'failed');assert.match(r.calls.at(-1).issue,/will not submit again automatically/);assert(!r.calls.at(-1).issue.includes('Timeout'));assert.equal(r.evidence.text,'Pending employer response');
  const evidenceDir=fs.mkdtempSync('/private/tmp/siro-receipt-test-');await captureEvidence(page,evidenceDir,'fixture','needs-review',Error('Test error'));
  assert.equal(JSON.parse(fs.readFileSync(evidenceDir+'/fixture-needs-review.json')).text,'Pending employer response');assert.equal(fs.statSync(evidenceDir+'/fixture-needs-review.json').mode&0o777,0o600);assert.equal(fs.statSync(evidenceDir+'/fixture-needs-review.png').mode&0o777,0o600);
  // Custom organization success copy must work without guessed phrases.
  await page.setContent('<div class="ashby-application-form-success-container" role="status">Success — we look forward to meeting you.</div>');
  assert.equal((await submissionOutcome(page,200)).kind,'submitted');
  await page.setContent('<div class="ashby-application-form-failure-container" role="alert">We could not submit your application.</div>');
  assert.equal((await submissionOutcome(page,200)).kind,'rejected');
  await page.setContent('<div class="ashby-application-form-blocked-application-container">Application limit reached.</div>');
  assert.equal((await submissionOutcome(page,200)).kind,'rejected');
  await page.setContent('<p>Thank you for applying is an example, not a receipt.</p>');
  await assert.rejects(()=>submissionOutcome(page,100));
  await page.setContent('<div hidden class="ashby-application-form-success-container">Success</div><div class="ashby-application-form-failure-container">We could not submit your application.</div>');
  assert.equal((await submissionOutcome(page,200)).kind,'rejected');
  assert.equal(requests,0);
  console.log('PASS: all six Siro choice combinations; exact approved fields and original CV; no autofill; approval claim and final authorization; expired/tampered/changed-form/CV rejection; one submit and employer receipt; actual Ashby default/custom success and rejected states; no network requests.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
