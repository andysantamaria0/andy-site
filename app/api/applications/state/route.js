import {owner,sameOrigin,json,read,write,body} from '../../../../lib/applications/server';
import {blockers,packet,hash,cleanProfile,cleanSiroAnswers,SIRO_JOB_ID,invalidate,log} from '../../../../lib/applications/core.mjs';
export const dynamic='force-dynamic';
export async function GET(){if(!await owner())return json({error:'Sign in required'},401);try{const row=await read();const worker=await read('worker');return json({...row,worker:worker.data});}catch{return json({error:'Workspace unavailable'},503);}}
export async function POST(request){
 if(!await owner())return json({error:'Sign in required'},401);if(!sameOrigin(request))return json({error:'Origin rejected'},403);
 try{const input=await body(request),row=await read(),data=row.data;if(input.version!==row.version)return json({error:'Workspace changed. Reload before saving.'},409);
 const j=data.jobs.find(j=>j.id===input.jobId);
 if(input.action==='profile'){if(data.jobs.some(j=>j.status==='submitting'))throw Error('Wait for the active submission to finish.');data.profile=cleanProfile(input.profile);data.jobs.forEach(j=>invalidate(data,j));log(data,'Profile updated.');}
 else if(input.action==='pause'){data.paused=!!input.paused;log(data,data.paused?'Submission queue paused.':'Submission queue resumed.');}
 else if(!j)throw Error('Opportunity not found');
 else if(input.action==='edit'){if(['submitting','submitted','uncertain'].includes(j.status))throw Error('This application is locked after an attempt.');if(typeof input.answer!=='string'||input.answer.length>10000)throw Error('Invalid answer');if(j.id===SIRO_JOB_ID)Object.assign(j,cleanSiroAnswers(input));invalidate(data,j);j.answer=input.answer;j.lessonConfirmed=input.lessonConfirmed===true;j.historyConfirmed=input.historyConfirmed===true;j.notes=String(input.notes||'').slice(0,5000);log(data,`${j.company}: draft saved.`);}
 else if(input.action==='approve'){
  if(['approved','submitting','submitted','uncertain'].includes(j.status))throw Error('Application is already approved or attempted.');if(data.paused)throw Error('Resume the queue before approving.');
  const missing=blockers(data,j);if(missing.length)return json({error:missing.join(' ')},422);
  const proposed=packet(data,j);if(input.packageHash!==hash(proposed))throw Error('Application changed. Review it again.');
  j.approval={hash:hash(proposed),packet:proposed,at:new Date().toISOString(),expiresAt:new Date(Date.now()+86400000).toISOString()};j.status='approved';log(data,`${j.company}: exact application approved for submission.`);
 }else if(input.action==='cancel'){if(j.status!=='approved')throw Error('Only queued approvals can be cancelled.');j.status='draft';j.approval=null;log(data,`${j.company}: queued approval cancelled.`);}
 else if(input.action==='review'){return json({packet:packet(data,j),packageHash:hash(packet(data,j)),blockers:blockers(data,j)});}
 else throw Error('Unknown action');
 const version=await write(row);return json({version,data});
 }catch(error){return json({error:error.message==='Unable to save workspace'?'Save failed; please retry.':error.message},400);}
}
