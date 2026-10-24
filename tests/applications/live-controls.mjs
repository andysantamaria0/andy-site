// Live widget check only: synthetic answers, candidate network writes blocked after public form loading, no CV and no Submit.
import {createRequire} from 'node:module';
import fs from 'node:fs/promises';
import {inspect,fillApproved} from '../../scripts/applications/browser.mjs';
import {applicationPacket} from '../../lib/applications/workflow.mjs';
import {profileBinding,personalDecision,sensitive} from '../../lib/applications/forms.mjs';
const require=createRequire(import.meta.url),{chromium}=require('@playwright/test');
const urls=process.argv.slice(2);
const browser=await chromium.launch({channel:'chrome',headless:true});
try{for(const url of urls){
 const context=await browser.newContext({serviceWorkers:'block'}),page=await context.newPage();let blockedWrites=0,sealed=false;
 await context.route('**/*',async route=>{
  const req=route.request();
  if(sealed&&(!['GET','HEAD','OPTIONS'].includes(req.method())||/email-address-validator/.test(req.url()))){blockedWrites++;return route.abort();}
  return route.continue();
 });
 try{
  const result=await inspect(page,url,{location:'New York, NY, USA'}),job={id:'live-control-rehearsal',company:result.company,title:result.title,apply:result.form.destination,form:result.form,answers:{}};
  sealed=true;
  const data={profile:{name:'Fixture Test',email:'fixture@example.invalid',phone:'+12125550123',location:'New York, NY, USA',linkedin:'https://www.linkedin.com/in/fixture-example',portfolio:'https://example.invalid',github:'https://github.com/example',years:'8'},resume:{sha256:'fixture-only'}};
  for(const f of job.form.fields){if(f.type==='file'||sensitive(f)||(!f.required&&!profileBinding(f)))continue;const binding=profileBinding(f);let value=binding?data.profile[binding]:'';if(binding==='firstName')value='Fixture';if(binding==='lastName')value='Test';if(f.type==='country')value=f.options.find(o=>/United States/.test(o.label))?.label;if(f.options.length&&!value)value=f.options[0].label;if(!value)value=f.type==='number'?'8':'Synthetic control check. No application will be submitted.';job.answers[f.id]={value,source:'user'};}
  const packet=applicationPacket(data,job);const filled=await fillApproved(page,packet,Buffer.alloc(0),job.form,{upload:false});
  console.log(JSON.stringify({company:result.company,controlsChecked:Object.keys(filled).length,allCandidateWritesBlocked:true,blockedWrites,filesUploaded:0,submitClicked:false}));
 }catch(error){await page.screenshot({path:'/private/tmp/application-controls-error.png',fullPage:true});await fs.writeFile('/private/tmp/application-controls-error.json',JSON.stringify({url,error:error.message,selects:await page.locator('.select__container,.ashby-application-form-field-entry:has(input[role=combobox])').evaluateAll(es=>es.map(e=>({id:e.querySelector('input')?.id,text:e.innerText,html:e.outerHTML.slice(0,7000)}))),inputs:await page.locator('input[id],textarea[id]').evaluateAll(es=>es.map(e=>({id:e.id,value:e.value}))),text:await page.locator('body').innerText()},null,2),{mode:0o600});throw error;}
 finally{await context.close();}
}}finally{await browser.close();}
