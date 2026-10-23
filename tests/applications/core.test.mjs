import test from 'node:test';
import assert from 'node:assert/strict';
import {passwordHash,checkPassword,session,verify,hash,blockers,packet,invalidate,DESTINATION,JOB_ID,TTL,SIRO_JOB_ID,SIRO_DESTINATION,cleanSiroAnswers,supported,approvalIssue} from '../../lib/applications/core.mjs';
const secret='a'.repeat(64);
test('password hashing rejects wrong passwords and oversized inputs',()=>{const encoded=passwordHash('a long unique test password');assert.equal(checkPassword('a long unique test password',encoded),true);assert.equal(checkPassword('wrong',encoded),false);assert.equal(checkPassword('x'.repeat(257),encoded),false);});
test('signed sessions reject tampering, wrong keys and expiration',()=>{const now=Date.now(),t=session(secret,now);assert(verify(t,secret,now));assert(!verify(t+'x',secret,now));assert(!verify(t,'b'.repeat(64),now));assert(!verify(t,secret,now+TTL*1000+1));assert(!verify(t,undefined,now));});
test('packet hashing survives JSONB key reordering but changes with content',()=>{assert.equal(hash({a:1,b:{c:2,d:3}}),hash({b:{d:3,c:2},a:1}));assert.notEqual(hash({a:1}),hash({a:2}));});
function fixture(){const data={profile:{name:'Candidate',email:'candidate@example.com',phone:'+12125550123',years:'12',visa:'no',location:'New York, NY, USA'},resume:{sha256:'abc',path:'original.pdf'},events:[]};const job={id:JOB_ID,company:'Employer',title:'Role',apply:DESTINATION,answer:'Factual answer',historyConfirmed:true,lessonConfirmed:true,schemaHash:'a'.repeat(64),verifiedAt:new Date().toISOString()};return {data,job};}
test('approval requires candidate answers, verified form and exact destination',()=>{const {data,job}=fixture();assert.deepEqual(blockers(data,job),[]);data.profile.phone='';assert(blockers(data,job).some(x=>x.includes('Phone')));job.apply='https://attacker.example/apply';assert(blockers(data,job).some(x=>x.includes('Automatic submission')));});
test('stale form and unconfirmed claims prevent approval',()=>{const {data,job}=fixture();job.verifiedAt=new Date(Date.now()-86400001).toISOString();job.lessonConfirmed=false;job.historyConfirmed=false;assert.equal(blockers(data,job).length,3);});
test('approval fingerprints include CV, fields and destination',()=>{const {data,job}=fixture();const a=hash(packet(data,job));data.resume.sha256='changed';assert.notEqual(hash(packet(data,job)),a);});
test('edits invalidate queued approvals',()=>{const {data,job}=fixture();job.status='approved';job.approval={hash:'old'};invalidate(data,job);assert.equal(job.status,'draft');assert.equal(job.approval,null);assert.equal(data.events.length,1);});

test('location adapter rejects unreviewed cities',()=>{const {data,job}=fixture();data.profile.location='Boston, MA, USA';assert(blockers(data,job).some(x=>x.includes('New York')));});

function siroFixture(){
 const data={profile:{name:'Candidate',email:'candidate@example.com',linkedin:'https://www.linkedin.com/in/candidate'},resume:{sha256:'original',path:'original.pdf'}};
 const job={id:SIRO_JOB_ID,company:'Siro',title:'Senior Product Manager',apply:SIRO_DESTINATION,answer:'Private introduction that must never be submitted',notes:'Private notes',officeCommitment:'yes',sponsorship:'none',schemaHash:'b'.repeat(64),verifiedAt:new Date().toISOString()};
 return {data,job};
}
test('Siro review contains only inspected employer fields and the unchanged CV',()=>{
 const {data,job}=siroFixture(),p=packet(data,job);
 assert.deepEqual(p.fields,{name:'Candidate',email:'candidate@example.com',linkedin:'https://www.linkedin.com/in/candidate',officeCommitment:'Yes',sponsorship:'No visa requirements'});
 assert.deepEqual(p.resume,data.resume);assert.deepEqual(p.outreach,[]);
 assert(!JSON.stringify(p).includes(job.answer));assert(!JSON.stringify(p).includes(job.notes));
 assert(!Object.hasOwn(p,'lessonConfirmed'));assert(!Object.hasOwn(p,'historyConfirmed'));
});
test('Siro can be approved only with all actual form answers and fresh verification',()=>{
 const {data,job}=siroFixture();
 assert.deepEqual(blockers(data,job),[]);assert(supported(job));
 delete data.profile.linkedin;delete job.officeCommitment;delete job.sponsorship;
 const missing=blockers(data,job);assert.equal(missing.length,3);
 assert(missing.some(x=>x.includes('LinkedIn')));assert(missing.some(x=>x.includes('office-commitment')));assert(missing.some(x=>x.includes('visa-sponsorship')));
 assert(!missing.some(x=>/Phone|experience|project|frequency|location/i.test(x)));
});
test('Siro answers use explicit choices and never infer from generic visa status',()=>{
 const {data,job}=siroFixture();data.profile.visa='no';delete job.sponsorship;
 assert.equal(packet(data,job).fields.sponsorship,'');
 assert.deepEqual(cleanSiroAnswers({officeCommitment:'no',sponsorship:'other'}),{officeCommitment:'no',sponsorship:'other'});
 assert.deepEqual(cleanSiroAnswers({}),{officeCommitment:'',sponsorship:''});
 for(const input of [{officeCommitment:'maybe'},{sponsorship:'no'},{sponsorship:[]},{officeCommitment:true}])assert.throws(()=>cleanSiroAnswers(input));
});
test('Siro field mapping is limited to the verified destination',()=>{
 const {data,job}=siroFixture();job.apply='https://example.com/apply';assert.deepEqual(packet(data,job).fields,{});assert(blockers(data,job).length>0);
});
test('unverified roles do not inherit Browser Company essay fields',()=>{
 const {data,job}=fixture();job.id='another-employer';assert.deepEqual(packet(data,job).fields,{});assert(blockers(data,job).length>0);
});

test('Siro requires a current inspected form before approval',()=>{
 const {data,job}=siroFixture();delete job.schemaHash;assert(blockers(data,job).some(x=>x.includes('verification')));
 job.schemaHash='b'.repeat(64);job.verifiedAt=new Date(Date.now()-86400001).toISOString();assert(blockers(data,job).some(x=>x.includes('verification')));
 job.verifiedAt=new Date(Date.now()+60000).toISOString();assert(blockers(data,job).some(x=>x.includes('verification')));
});
test('worker authorization rechecks approved answers, expiry and exact destination',()=>{
 const {data,job}=siroFixture();const p=packet(data,job);job.approval={packet:p,hash:hash(p),expiresAt:new Date(Date.now()+3600000).toISOString()};
 assert.equal(approvalIssue(data,job),'');
 job.sponsorship='h1b';assert.match(approvalIssue(data,job),/changed/);job.sponsorship='none';
 job.approval.packet.fields.email='changed@example.com';assert.match(approvalIssue(data,job),/changed/);
 job.approval.packet=packet(data,job);job.approval.hash=hash(job.approval.packet);job.approval.expiresAt='invalid';assert.match(approvalIssue(data,job),/expired/);
 job.approval.expiresAt=new Date(Date.now()-1).toISOString();assert.match(approvalIssue(data,job),/expired/);
 job.approval.expiresAt=new Date(Date.now()+3600000).toISOString();job.apply='https://example.com/apply';job.approval.packet=packet(data,job);job.approval.hash=hash(job.approval.packet);assert.match(approvalIssue(data,job),/not enabled/);
});
