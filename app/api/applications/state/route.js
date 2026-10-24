import {owner,sameOrigin,json,read,write,body} from '../../../../lib/applications/server';
import {hash,cleanProfile,invalidate,log} from '../../../../lib/applications/core.mjs';
import {destination,LOCKED,supportsExecution,saveAnswers} from '../../../../lib/applications/forms.mjs';
import {applicationPacket,applicationBlockers,workerReady,preflightReady} from '../../../../lib/applications/workflow.mjs';
export const dynamic='force-dynamic';
async function workerState(){try{return (await read(process.env.APPLICATION_DESK_WORKER_ID||'worker')).data;}catch{return {};}}
export async function GET(){if(!await owner())return json({error:'Sign in required'},401);try{return json({...await read(),worker:await workerState()});}catch{return json({error:'Workspace unavailable'},503);}}
export async function POST(request) {
  if(!await owner())return json({error:'Sign in required'},401);
  if(!sameOrigin(request))return json({error:'Origin rejected'},403);
  try {
    const input=await body(request);
    for(let retry=0;retry<4;retry++) {
      const row=await read(),data=row.data,j=data.jobs.find(j=>j.id===input.jobId);
      let review,selected,checking;
      if(input.action==='profile') {
        if(data.jobs.some(j=>j.status==='submitting'))throw Error('An application is being sent. Wait for its result before changing shared answers.');
        if(input.baseProfile && hash(data.profile)!==hash(input.baseProfile))throw Error('Your profile changed in another window. Refresh before saving.');
        const cleaned=cleanProfile(input.profile);
        for(const k of ['firstName','lastName','preferredName','phoneCountry','workAuthorizedUS','futureSponsorship']) cleaned[k]=String(input.profile[k]||'').trim().slice(0,500);
        if(cleaned.name!==data.profile.name){delete cleaned.firstName;delete cleaned.lastName;}
        data.profile=cleaned;
        if(typeof input.candidateNotes==='string')data.candidate={...data.candidate,notes:input.candidateNotes.slice(0,20000)};
        data.jobs.forEach(j=>invalidate(data,j));log(data,'Profile and reusable candidate facts updated.');
      }else if(input.action==='pause') {data.paused=!!input.paused;log(data,data.paused?'Submission queue paused.':'Submission queue resumed.');}
      else if(input.action==='add') {
        const d=destination(input.url);if(!d)throw Error('Paste an Ashby or Greenhouse application link. Other platforms currently need browser assistance.');
        const existing=data.jobs.find(j=>destination(j.apply||j.source)?.url===d.url);
        if(existing)selected=existing.id;
        else {
          if(data.jobs.length>=200)throw Error('The desk is full.');
          selected='application-'+hash(d.url).slice(0,20);
          data.jobs.push({id:selected,company:d.board,title:'Inspecting role…',source:input.url,apply:d.url,salary:'Checking listing',location:'',fit:'The agent is inspecting this role and its application.',gap:'',checklist:[],status:'draft',answers:{},notes:'',needsRoleSummary:true,preparation:{state:'queued',at:new Date().toISOString()}});
          log(data,`${d.board}: application added for inspection.`);
        }
      }else {
        if(!j)throw Error('Opportunity not found');
        if(['save-answers','review'].includes(input.action)) {
          if(LOCKED.includes(j.status))throw Error('This application is already approved or attempted.');
          if(input.answers) {
            if(!j.form||input.schemaHash!==j.schemaHash)throw Error('The employer form changed. Refresh to see its current questions. Your application was not submitted.');
            if(input.baseAnswers && hash(j.answers||{})!==hash(input.baseAnswers))throw Error('These answers changed in another window. Refresh before reviewing.');
            const {profileChanged}=saveAnswers(data,j,input.answers);
            if(profileChanged) {
              if(data.jobs.some(x=>x.status==='submitting'))throw Error('Another application is being sent. Wait before changing shared contact information.');
              data.jobs.forEach(x=>invalidate(data,x));
            }
            if(j.id==='browser-company-model-behavior')j.historyConfirmed=input.historyConfirmed===true;
            j.notes=String(input.notes||'').slice(0,5000);j.issue=null;
            log(data,`${j.company}: application answers saved.`);
          }
          if(input.action==='review') {
            const packet=applicationPacket(data,j),worker=await workerState(),blockers=applicationBlockers(data,j,Date.now(),{requirePreflight:false});
            if(!workerReady(worker))blockers.push('The current application agent is offline or updating. Keep your Mac awake; review again when it is connected.');
            if(data.paused)blockers.push('Resume the submission queue before approving.');
            if(!blockers.length&&!preflightReady(data,j)) {
              if(!['queued','checking'].includes(j.preflight?.state)||j.preflight.packetHash!==hash(packet))j.preflight={state:'queued',packetHash:hash(packet),at:new Date().toISOString()};
              checking=j.id;
            }else review={packet,packageHash:hash(packet),blockers,supported:supportsExecution(j)};
          }
        }else if(input.action==='inspect') {
          if(LOCKED.includes(j.status))throw Error('An approved or attempted application cannot be re-inspected automatically.');
          j.preparation={state:'queued',at:new Date().toISOString()};j.issue=null;log(data,`${j.company}: application inspection requested.`);
        }else if(input.action==='approve') {
          if(LOCKED.includes(j.status))throw Error('This application is already approved or attempted.');
          if(data.paused)throw Error('Resume the queue before approving.');
          if(!workerReady(await workerState()))throw Error('The application agent is offline or updating. No submission was queued.');
          const blockers=applicationBlockers(data,j);if(blockers.length)throw Error(blockers.join(' '));
          const packet=applicationPacket(data,j);
          if(input.packageHash!==hash(packet))throw Error('The application changed. Review its current answers.');
          j.approval={hash:hash(packet),packet,at:new Date().toISOString(),expiresAt:new Date(Date.now()+86400000).toISOString()};
          if(j.attempt){j.attemptHistory=[...(j.attemptHistory||[]),j.attempt].slice(-20);j.attempt=null;}
          j.status='approved';j.issue=null;log(data,`${j.company}: exact application approved for one submission.`);
        }else if(input.action==='cancel') {
          if(j.status!=='approved')throw Error('Only a queued approval can be cancelled.');j.status='draft';j.approval=null;log(data,`${j.company}: queued approval cancelled.`);
        }else throw Error('Unknown action');
      }
      try {const version=await write(row);return json({version,data,worker:await workerState(),...(review?{review}:{}),...(selected?{selected}:{}),...(checking?{checking}:{})});}
      catch(e){if(retry===3||!e.message.startsWith('Workspace changed'))throw e;}
    }
  }catch(e){return json({error:e.message},400);}
}
