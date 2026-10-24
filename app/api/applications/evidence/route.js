import {owner,worker,read,write,db,json,privateHeaders} from '../../../../lib/applications/server';
import {hash} from '../../../../lib/applications/core.mjs';
export const dynamic='force-dynamic';
export async function POST(request) {
  if(!worker(request))return json({error:'Unauthorized'},401);
  try {
    const q=new URL(request.url).searchParams,jobId=q.get('job'),attempt=q.get('attempt'),kind=q.get('kind');
    if(!['json','png','zip'].includes(kind)||!attempt?.match(/^[a-f0-9-]{36}$/))throw Error('Invalid evidence');
    const bytes=Buffer.from(await request.arrayBuffer());if(bytes.length>20_000_000)throw Error('Evidence too large');
    let row=await read(),job=row.data.jobs.find(j=>j.id===jobId);if(job?.attempt?.id!==attempt)throw Error('Attempt mismatch');
    const prefix=`attempts/${attempt}`,file=`${prefix}/browser.${kind}`;
    const {error}=await db().storage.from('application-desk-private').upload(file,bytes,{contentType:{json:'application/json',png:'image/png',zip:'application/zip'}[kind],upsert:true});if(error)throw Error('Evidence upload failed');
    for(let n=0;n<4;n++) {
      row=await read();job=row.data.jobs.find(j=>j.id===jobId);if(job?.attempt?.id!==attempt)throw Error('Attempt changed');
      job.attempt.evidence=prefix;job.attempt.files={...job.attempt.files,[kind]:{sha256:hash(bytes),size:bytes.length}};
      try{await write(row);return json({ok:true,evidence:prefix});}catch(e){if(n===3||!e.message.startsWith('Workspace changed'))throw e;}
    }
  }catch(e){return json({error:e.message},400);}
}
export async function GET(request) {
  if(!await owner())return json({error:'Sign in required'},401);
  try {
    const q=new URL(request.url).searchParams,kind=q.get('kind')||'json';if(!['json','png','zip'].includes(kind))throw Error('Invalid evidence');
    const row=await read(),job=row.data.jobs.find(j=>j.id===q.get('job'));
    if(!job?.attempt?.evidence||!job.attempt.files?.[kind])return json({error:'No browser evidence was retained for this attempt.'},404);
    const {data,error}=await db().storage.from('application-desk-private').download(`${job.attempt.evidence}/browser.${kind}`);if(error)throw Error('Evidence unavailable');
    const bytes=Buffer.from(await data.arrayBuffer());if(hash(bytes)!==job.attempt.files[kind].sha256)throw Error('Evidence integrity check failed');
    return new Response(bytes,{headers:{...privateHeaders,'Content-Type':{json:'application/json',png:'image/png',zip:'application/zip'}[kind],'X-Content-Type-Options':'nosniff'}});
  }catch(e){return json({error:e.message},400);}
}
