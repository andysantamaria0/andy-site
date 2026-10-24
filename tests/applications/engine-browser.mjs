import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createRequire} from 'node:module';
import {inspect,fillApproved,outcome} from '../../scripts/applications/browser.mjs';
import {execute,flushOutbox,atomicJSON} from '../../scripts/applications/worker-v2.mjs';
import {ENGINE} from '../../lib/applications/forms.mjs';
import {hash} from '../../lib/applications/core.mjs';
import {applicationPacket,applyWorkerAction,formHash} from '../../lib/applications/workflow.mjs';
const require=createRequire(import.meta.url),{chromium}=require('@playwright/test');
const escape=v=>String(v||'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
const pdf=Buffer.from('%PDF-1.4 fixture original PDF bytes — never sent to an employer');
function html(form,mode) {
 const fields=form.fields.map(f=>{
  const id=escape(form.platform==='ashby'&&f.type==='location'?'':f.locator.controlId||f.id),label=escape(f.label),required=f.required?'required':'',max=f.maxLength?`maxlength="${f.maxLength}"`:'';
  let input;
  if(f.type==='choice')input=f.options.map(o=>`<button type="button" data-option="${escape(o.value)}" aria-pressed="false" onclick="this.parentNode.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed','false'));this.setAttribute('aria-pressed','true')">${escape(o.label)}</button>`).join('')+`<input type="checkbox" tabindex="-1" style="display:none">`;
  else if(f.type==='radio')input=f.options.map(o=>`<label for="${escape(o.value)}">${escape(o.label)}</label><input id="${escape(o.value)}" type="radio" name="${escape(f.id)}" ${required}>`).join('');
  else if(['combobox','country','location'].includes(f.type))input=`<div class="select__container"><label for="${id}">${label}</label><span class="selected select__single-value"></span><input id="${id}" role="combobox" aria-required="${!!f.required}" data-combo="${escape(f.id)}"></div>`;
  else if(f.type==='file')input=`<div class="file-upload" role="group" aria-labelledby="upload-label-${escape(f.id)}" aria-required="${!!f.required}"><div class="upload-label">${label}</div><label for="${id}">Attach</label><input id="${id}" type="file" ${required}></div>`;
  else if(f.type==='textarea')input=`<textarea id="${id}" ${required} ${max}></textarea>`;
  else input=`<input id="${id}" type="${f.type}" ${required} ${max}>`;
  return form.platform==='ashby'?`<div class="ashby-application-form-field-entry" ${f.id==='conditional-extra'?'data-conditional style="display:none"':''}><label class="ashby-application-form-question-title ${f.required?'required':''}" for="${escape(f.id)}">${label}</label>${input}</div>`:`<div class="field-wrapper">${['combobox','country','location','file'].includes(f.type)?'':`<label for="${id}">${label}</label>`}${input}</div>`;
 }).join('');
 return `<html><body><main><h1>Fixture employer</h1><form>${fields}<button type="submit">Submit application</button></form></main><script>
 const form=${JSON.stringify(form)}, mode=${JSON.stringify(mode)};window.sent=0;window.uploads=0;
 setTimeout(()=>document.querySelectorAll('input').forEach(e=>e['__reactProps$fixture']={}),150);
 function closeMenus(){document.querySelectorAll('[role=listbox]').forEach(e=>e.remove())}
 for(const input of document.querySelectorAll('[data-combo]')){
  function openMenu(){closeMenus();const f=form.fields.find(f=>f.id===input.dataset.combo),menu=document.createElement('div');menu.setAttribute('role','listbox');const opts=f.type==='location'?[{label:'New York, New York, United States'}]:f.options;
   for(const o of opts){const option=document.createElement('div');option.setAttribute('role','option');option.textContent=o.label;if(f.type==='country'){const flag=document.createElement('span');flag.className='iti__flag iti__'+(/United States/.test(o.label)?'us':'zz');option.append(flag);}option.onclick=()=>{const selected=input.parentElement.querySelector('.selected');selected.textContent=f.type==='country'?'+1':o.label;if(f.type==='country'){const flag=document.createElement('span');flag.className='iti__flag iti__'+(/United States/.test(o.label)?'us':'zz');selected.append(flag);}input.value=form.platform==='ashby'?(f.type==='location'?o.label.replace('New York,','New York City,'):o.label):'';input.dataset.selected=o.label;closeMenus();};menu.append(option)}input.parentElement.append(menu)}
  input.addEventListener('click',openMenu);input.addEventListener('input',openMenu);
 }
 document.querySelector('input[id="_systemfield_name"]')?.addEventListener('input',()=>document.querySelector('[data-conditional]')?.removeAttribute('style'));
 document.querySelectorAll('input[type=tel]').forEach(e=>e.addEventListener('input',()=>{if(e.value==='+12125550123')e.value='+1 212-555-0123'}));
 document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenus()});
 for(const file of document.querySelectorAll('input[type=file]'))file.addEventListener('change',async()=>{window.uploads++;const root=file.closest('.file-upload');const bytes=await file.files[0].arrayBuffer();file.remove();const b=document.querySelector('button[type=submit]');b.disabled=true;const r=await fetch('/fixture-upload',{method:'POST',body:bytes});if(!r.ok){const e=document.createElement('p');e.className='helper-text--error';e.textContent='Resume upload failed';root.append(e);}else {const name=document.createElement('div');name.className='file-upload__filename';name.textContent='CV_A_Santamaria_A.pdf';root.append(name);b.disabled=false;}});
 document.querySelector('form').onsubmit=async e=>{e.preventDefault();window.sent++;window.submittedValues=Object.fromEntries([...document.querySelectorAll('input,textarea')].filter(e=>e.id).map(e=>[e.id,e.dataset.selected||e.value]));await fetch('/fixture-submit',{method:'POST',body:JSON.stringify(window.submittedValues)});
  if(mode==='missing')return;if(mode==='validation'){const p=document.createElement('p');p.setAttribute('role','alert');p.textContent='The employer rejected this application';document.body.append(p);return;}
  if(mode==='challenge'||mode==='challenge-resolved'){const iframe=document.createElement('iframe');iframe.title='recaptcha challenge';document.body.append(iframe);return;}
  if(form.platform==='ashby')document.querySelector('main').innerHTML='<div class="ashby-application-form-success-container">${mode==='custom'?'We received your details and look forward to reviewing them.':'Your application was successfully submitted. We will contact you if there are next steps.'}</div>';
  else{history.pushState({},'',location.pathname+'/confirmation');document.querySelector('main').innerHTML='<h1>Thanks for applying!</h1><p>Your application has been received.</p>'}
 };
 </script></body></html>`;
}
function apiData(form){return {title:'Fixture role',company_name:'Fixture employer',questions:form.fields.filter(f=>!['country','location'].includes(f.type)).map(f=>({label:f.label,required:f.required,description:f.description,fields:[{name:f.id,type:f.type==='combobox'?'multi_value_single_select':f.type==='file'?'input_file':'input_text',values:f.options||[]}]})),data_compliance:[]};}
const browser=await chromium.launch({channel:'chrome',headless:true});
let external=0;
try {
 for(const [name,mode] of [['siro','success'],['siro','custom'],['knit','success'],['browser','success'],['siro','missing'],['knit','validation'],['knit','challenge'],['siro','cv-mismatch'],['siro','changed-form'],['siro','expired'],['knit','upload-failed'],['knit','challenge-resolved'],['siro','checkpoint-failed'],['siro','conditional-reviewed'],['siro','conditional-new']]) {
  const original=JSON.parse(await fs.readFile(new URL(`./fixtures/${name}-v2.json`,import.meta.url),'utf8'));
  if(mode.startsWith('conditional'))original.fields.push({id:'conditional-extra',label:'Explain your choice',type:'textarea',required:true,options:[],locator:{kind:'ashby',id:'conditional-extra',controlId:'conditional-extra'}});
  const context=await browser.newContext(),page=await context.newPage();let posts=0,uploaded;
  await page.route('**/*',async route=>{const request=route.request(),url=new URL(request.url());if(url.pathname==='/fixture-upload'){uploaded=request.postDataBuffer();return route.fulfill({status:mode==='upload-failed'?500:200,body:'ok'});}if(url.pathname==='/fixture-submit'){posts++;return route.fulfill({status:200,body:'ok'});}if(request.isNavigationRequest())return route.fulfill({contentType:'text/html',body:html(original,mode)});external++;return route.abort();});
  const inspectForm=(p,url,options={})=>inspect(p,url,{...options,apiData:apiData(original)});
  const first=await inspectForm(page,original.destination);
  if(mode==='conditional-reviewed'){first.form.fields.push(original.fields.at(-1));first.schemaHash=formHash(first.form);}
  assert.deepEqual(first.form.unsupported,[],`${name}: unsupported control`);
  const job={id:'fixture-'+name,company:'Fixture',title:'Fixture',apply:original.destination,status:'approved',form:first.form,preparation:{state:'ready'},schemaHash:first.schemaHash,answers:{},historyConfirmed:true};
  const data={profile:{name:'Test Candidate',email:'candidate@example.com',phone:'+12125550123',location:'New York, NY, USA',linkedin:'https://www.linkedin.com/in/test-candidate',portfolio:'https://example.com',github:'https://github.com/example',years:'8'},resume:{path:'fixture.pdf',sha256:hash(pdf)},jobs:[job],events:[],paused:false};
  for(const f of job.form.fields){if(f.type==='file'||f.omit)continue;const value=f.type==='country'?f.options.find(o=>/United States/.test(o.label)).label:f.options.length?f.options[0].label:f.type==='location'?data.profile.location:f.type==='number'?'8':/email/i.test(f.label)?data.profile.email:/linkedin/i.test(f.label)?data.profile.linkedin:/phone/i.test(f.label)?data.profile.phone:'Fixture answer';job.answers[f.id]={value,source:'user'};}
  const packet=applicationPacket(data,job);job.approval={packet,hash:hash(packet),expiresAt:new Date(Date.now()+3600000).toISOString()};
  if(mode==='expired')job.approval.expiresAt='2000-01-01';
  if(mode==='changed-form')original.fields[0].label+=' CHANGED';
  let saved;
  const api=async(action,input)=>applyWorkerAction(data,{action,...input});
  const result=await execute({page,job,api,inspectForm,checkpoint:async()=>{if(mode==='checkpoint-failed')throw Error('Evidence storage unavailable');},waitForHuman:mode==='challenge-resolved'?async(p,platform,dest)=>{await p.evaluate(()=>{document.querySelector('iframe').remove();history.pushState({},'',location.pathname+'/confirmation');document.querySelector('main').innerHTML='<h1>Application received after human CAPTCHA</h1>';});return outcome(p,platform,2000,dest,{ignoreChallenge:true});}:undefined,fillForm:(p,pkt,bytes,form)=>fillApproved(p,pkt,bytes,form,{inspectForm}),loadCV:async()=>mode==='cv-mismatch'?Buffer.from('changed'):pdf,waitOutcome:(p,platform,_timeout,dest)=>outcome(p,platform,mode==='missing'?150:2000,dest),saveOutcome:async item=>{saved={...item,text:await page.locator('body').innerText()};applyWorkerAction(data,{action:'result',jobId:job.id,attempt:item.attempt,status:item.status,receipt:item.receipt,issue:item.issue,evidence:'attempts/'+item.attempt});}});
  const succeeds=['success','custom','challenge-resolved','conditional-reviewed'].includes(mode),beforeSubmit=['cv-mismatch','changed-form','expired','upload-failed','checkpoint-failed','conditional-new'].includes(mode);
  assert.equal(posts,beforeSubmit?0:1,`${name}/${mode}: submit count; result=${JSON.stringify(result)} issue=${saved?.issue}`);
  assert.equal(result.status,succeeds?'submitted':mode==='expired'?'not-claimed':beforeSubmit?'blocked':'uncertain',`${name}/${mode}: ${saved?.issue}`);
  if(succeeds){assert.deepEqual(uploaded,pdf);assert(job.receipt);assert.equal(job.receipt.signal,name==='knit'?'greenhouse-confirmation':'ashby-success-container');}
  if(!beforeSubmit)assert(saved.text);
  console.log(`PASS ${name}/${mode}: ${result.status}; ${posts} submit request(s)`);await context.close();
 }
 // A successful click followed by a lost API response must never click Submit again.
 const dir=await fs.mkdtemp('/private/tmp/application-outbox-test-'),file=dir+'/evidence.json';await atomicJSON(file,{text:'Verified receipt'});
 const outbox=dir+'/outbox';await atomicJSON(outbox+'/attempt.json',{jobId:'fixture',attempt:'attempt',status:'submitted',receipt:{kind:'success'},files:{json:file},recorded:false});
 let results=0,uploads=0;
 const api=async()=>{results++;if(results===1)throw Error('Lost network response');return {ok:true,recorded:true};},upload=async()=>{uploads++;return {evidence:'attempts/attempt'};};
 assert.equal(await flushOutbox({directory:outbox,api,upload}),1);assert.equal(await flushOutbox({directory:outbox,api,upload}),0);assert.equal(await flushOutbox({directory:outbox,api,upload}),0);assert.equal(results,2);assert.equal(uploads,2);assert.equal(external,0);
 console.log('PASS durable result recovery: only receipt recording retried; zero employer requests escaped fixtures.');
} finally {await browser.close();}
