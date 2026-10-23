import {worker,json,read,write,body,db} from '../../../../lib/applications/server';
import {hash,log,JOB_ID,supported,approvalIssue} from '../../../../lib/applications/core.mjs';
import {randomUUID} from 'node:crypto';
export const dynamic='force-dynamic';
export async function GET(request){if(!worker(request))return json({error:'Unauthorized'},401);try{const row=await read();return json({paused:row.data.paused,jobs:row.data.jobs.map(j=>({id:j.id,company:j.company,title:j.title,source:j.source,status:j.status,apply:j.apply,schemaHash:j.schemaHash,verifiedAt:j.verifiedAt})),preferences:row.data.preferences});}catch{return json({error:'Unavailable'},503);}}
export async function POST(request){if(!worker(request))return json({error:'Unauthorized'},401);
 try{const input=await body(request);
 if(input.action==='heartbeat'){const {error}=await db().from('application_desk').upsert({id:'worker',version:1,data:{lastSeen:new Date().toISOString(),mode:'mac-browser-worker',version:typeof input.version==='string'?input.version.slice(0,60):'legacy'},updated_at:new Date().toISOString()});if(error)throw Error('Heartbeat unavailable');return json({ok:true});}
 const row=await read(),data=row.data;
 if(input.action==='research'){
  if(!Array.isArray(input.jobs)||input.jobs.length>5)throw Error('Invalid research batch');
  let added=0;for(const raw of input.jobs){
   const source=new URL(raw.source);if(source.protocol!=='https:'||source.username||source.password)throw Error('Invalid employer source');source.hash='';
   if(data.jobs.some(j=>j.source===source.href)||data.jobs.length>=200)continue;
   const value=k=>{if(typeof raw[k]!=='string'||raw[k].length>5000)throw Error('Invalid research field');return raw[k];};
   const id='research-'+hash(source.href).slice(0,20);
   data.jobs.push({id,company:value('company'),title:value('title'),salary:value('salary'),location:value('location'),source:source.href,apply:null,fit:value('fit'),gap:value('gap'),sourceNote:value('sourceNote'),evidence:'Research lead · form needs inspection',verified:new Date().toISOString().slice(0,10),checklist:[['Channel','Official employer source; execution route needs inspection'],['CV',value('cv')],['Cover letter',value('coverLetter')],['Other items',value('otherRequirements')]],status:'draft',answer:'',notes:'',lessonConfirmed:false,historyConfirmed:false,approval:null});added++;
  }data.lastResearchAt=new Date().toISOString();log(data,`Daily research completed: ${added} new opportunities.`);await write(row);return json({ok:true,added});
 }
 const j=data.jobs.find(j=>j.id===(input.jobId||JOB_ID));if(!j)throw Error('Unknown application');
 if(input.action==='verify'){
  if(!supported(j)||!input.schemaHash?.match(/^[a-f0-9]{64}$/))throw Error('Unsupported verification');
  if(['approved','submitting','submitted','uncertain'].includes(j.status))return json({ok:true});
  j.schemaHash=input.schemaHash;j.verifiedAt=new Date().toISOString();j.evidence='Form inspected';
 }else if(input.action==='claim'){
  if(data.paused||j.status!=='approved')return json({claimed:false});
  const issue=approvalIssue(data,j);if(issue){j.status='blocked';j.issue=issue;j.approval=null;log(data,`${j.company}: ${issue}`);await write(row);return json({claimed:false});}
  j.status='submitting';j.attempt={id:randomUUID(),startedAt:new Date().toISOString(),submitStarted:false};log(data,`${j.company}: worker claimed the approved package.`);await write(row);return json({claimed:true,attempt:j.attempt.id,approval:j.approval});
 }else if(input.action==='begin-submit'){
  if(j.status!=='submitting'||j.attempt?.id!==input.attempt||j.attempt.submitStarted||data.paused)throw Error('Submission not authorized');
  const issue=approvalIssue(data,j);if(issue)throw Error(issue);
  j.attempt.submitStarted=true;j.attempt.submitStartedAt=new Date().toISOString();await write(row);return json({ok:true});
 }else if(input.action==='result'){
  if(j.status!=='submitting'||j.attempt?.id!==input.attempt)throw Error('Attempt mismatch');
  if(input.status==='submitted'&&j.attempt.submitStarted&&typeof input.confirmation==='string'&&input.confirmation.length>10){j.status='submitted';j.receipt={summary:input.confirmation.slice(0,1500),at:new Date().toISOString(),attempt:j.attempt.id};j.issue=null;}
  else{j.status=j.attempt.submitStarted?'uncertain':'blocked';j.issue=String(input.issue||'The application needs manual review.').slice(0,1500);if(j.status==='blocked'){j.approval=null;j.schemaHash=null;j.verifiedAt=null;}}
  log(data,`${j.company}: ${j.status}.`);
 }else if(input.action==='recover'){
  if(j.status==='submitting'&&Date.now()-Date.parse(j.attempt?.startedAt)>15*60*1000){j.status='uncertain';j.issue='Worker interrupted. Inspect the employer receipt before any retry.';log(data,`${j.company}: interrupted attempt needs reconciliation.`);}else return json({ok:true});
 }else throw Error('Unknown action');await write(row);return json({ok:true});
 }catch(e){return json({error:e.message},400);}
}
