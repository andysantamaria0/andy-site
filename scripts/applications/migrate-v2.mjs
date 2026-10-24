import fs from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createClient} from '@supabase/supabase-js';
import {hash,log} from '../../lib/applications/core.mjs';
import {destination} from '../../lib/applications/forms.mjs';
process.loadEnvFile('.env.local');
const client=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false}});
const {data:row,error}=await client.from('application_desk').select('version,data').eq('id','owner').single();if(error)throw error;
if(!process.argv.includes('--apply')) {
 console.log(JSON.stringify({version:row.version,candidateFactsConnected:!!row.data.candidate?.cvText,jobs:row.data.jobs.map(j=>({company:j.company,status:j.status,platform:destination(j.apply||j.source)?.platform||'assistance',preparation:j.preparation?.state,issue:j.preparation?.issue,formFields:j.form?.fields.length,answers:Object.keys(j.answers||{}).length}))},null,2));
} else {
 if(row.data.jobs.some(j=>['approved','submitting'].includes(j.status)))throw Error('An application is active. Finish or cancel it before migrating.');
 if(row.data.workflowVersion===2)throw Error('This workspace has already migrated.');
 const cvPath=process.argv[process.argv.indexOf('--cv')+1];if(!cvPath||cvPath==='--apply')throw Error('Provide --cv with the original PDF path');
 const bytes=await fs.readFile(cvPath);if(hash(bytes)!==row.data.resume.sha256)throw Error('The original CV does not match the saved checksum.');
 await fs.writeFile('/private/tmp/application-desk-before-v2.json',JSON.stringify(row,null,2),{mode:0o600,flag:'wx'});
 const cvText=execFileSync('/opt/homebrew/bin/pdftotext',['-layout',cvPath,'-'],{encoding:'utf8'}).trim();
 row.data.candidate={...row.data.candidate,cvText,cvSha256:row.data.resume.sha256,source:'Original CV_A_Santamaria_A.pdf',verifiedAt:new Date().toISOString(),notes:row.data.candidate?.notes||''};
 row.data.answerMemory ||= {};
 for(const job of row.data.jobs) {
   if(['submitted','uncertain'].includes(job.status)) {
     if(job.status==='uncertain')job.issue='This earlier attempt reached the submission step, but no employer confirmation was saved. It has not been retried. No background receipt check is running. Check your inbox before any further application.';
     continue;
   }
   const dest=destination(job.apply||job.source);if(dest)job.apply=dest.url;
   job.preparation={state:dest?'queued':'unsupported',at:new Date().toISOString(),issue:dest?null:'This employer uses a platform that needs browser assistance. Automatic submission is unavailable.'};
   job.answers ||= {};
 }
 row.data.workflowVersion=2;log(row.data,'Connected the original CV and shared candidate facts to automatic form inspection, preparation, approval, and evidence-backed submission. Existing uncertain attempts remain locked.');
 const updated=await client.from('application_desk').update({data:row.data,version:row.version+1,updated_at:new Date().toISOString()}).eq('id','owner').eq('version',row.version).select('version').maybeSingle();if(updated.error||!updated.data)throw Error(updated.error?.message||'Workspace changed; migration was not saved.');
 console.log(JSON.stringify({migrated:true,version:updated.data.version,jobsPreserved:row.data.jobs.length,originalCVUnchanged:true,applicationsSubmitted:false}));
}
