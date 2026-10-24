import {worker,json,read,write,body,db} from '../../../../lib/applications/server';
import {hash,log} from '../../../../lib/applications/core.mjs';
import {ENGINE,destination} from '../../../../lib/applications/forms.mjs';
import {applyWorkerAction} from '../../../../lib/applications/workflow.mjs';
export const dynamic='force-dynamic';
export async function GET(request) {
  if(!worker(request))return json({error:'Unauthorized'},401);
  try {const row=await read();return json({version:row.version,...row.data});} catch{return json({error:'Unavailable'},503);}
}
export async function POST(request) {
  if(!worker(request))return json({error:'Unauthorized'},401);
  try {
    const input=await body(request);
    if(input.action==='heartbeat') {
      const {error}=await db().from('application_desk').upsert({id:process.env.APPLICATION_DESK_WORKER_ID||'worker',version:1,data:{lastSeen:new Date().toISOString(),mode:'mac-browser-worker',version:String(input.version||'legacy').slice(0,60),message:String(input.message||'Checking the queue').slice(0,250)},updated_at:new Date().toISOString()});
      if(error)throw Error('Heartbeat unavailable'); return json({ok:true});
    }
    if(input.version!==ENGINE)throw Error('The application worker needs updating. No submission was authorized.');
    for(let retry=0;retry<4;retry++) {
      const row=await read(),data=row.data;let result;
      if(input.action==='research') {
        if(!Array.isArray(input.jobs)||input.jobs.length>5)throw Error('Invalid research batch');
        let added=0;
        for(const raw of input.jobs) {
          const source=new URL(raw.source);if(source.protocol!=='https:'||source.username||source.password)throw Error('Invalid employer source');source.hash='';
          const dest=destination(source.href),canonical=dest?.url||source.href;
          if(data.jobs.some(j=>(destination(j.apply||j.source)?.url||j.source)===canonical)||data.jobs.length>=200)continue;
          const value=k=>{if(typeof raw[k]!=='string'||raw[k].length>5000)throw Error('Invalid research field');return raw[k];};
          data.jobs.push({id:'research-'+hash(canonical).slice(0,20),company:value('company'),title:value('title'),salary:value('salary'),location:value('location'),source:source.href,apply:dest?.url||null,fit:value('fit'),gap:value('gap'),sourceNote:value('sourceNote'),checklist:[],status:'draft',answers:{},notes:'',approval:null,preparation:{state:dest?'queued':'unsupported',issue:dest?null:'This employer uses a platform that needs browser assistance. Automatic submission is unavailable.'}});added++;
        }
        data.lastResearchAt=new Date().toISOString();log(data,`Daily research completed: ${added} new opportunities. Application forms queued for inspection.`);result={ok:true,added};
      } else {
        if(input.evidence) {const j=data.jobs.find(j=>j.id===input.jobId);if(!j?.attempt||j.attempt.id!==input.attempt||input.evidence!==j.attempt.evidence||!j.attempt.files?.json)throw Error('Attempt evidence must be stored before recording its outcome.');}
        result=applyWorkerAction(data,input);
      }
      try {await write(row);return json(result);}catch(e){if(e.message!=='Workspace changed. Reload before saving.'||retry===3)throw e;}
    }
  }catch(e){return json({error:e.message},400);}
}
