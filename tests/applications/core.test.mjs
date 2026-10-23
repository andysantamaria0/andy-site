import test from 'node:test';
import assert from 'node:assert/strict';
import {passwordHash,checkPassword,session,verify,hash,blockers,packet,invalidate,DESTINATION,JOB_ID,TTL} from '../../lib/applications/core.mjs';
const secret='a'.repeat(64);
test('password hashing rejects wrong passwords and oversized inputs',()=>{const encoded=passwordHash('a long unique test password');assert.equal(checkPassword('a long unique test password',encoded),true);assert.equal(checkPassword('wrong',encoded),false);assert.equal(checkPassword('x'.repeat(257),encoded),false);});
test('signed sessions reject tampering, wrong keys and expiration',()=>{const now=Date.now(),t=session(secret,now);assert(verify(t,secret,now));assert(!verify(t+'x',secret,now));assert(!verify(t,'b'.repeat(64),now));assert(!verify(t,secret,now+TTL*1000+1));assert(!verify(t,undefined,now));});
test('packet hashing survives JSONB key reordering but changes with content',()=>{assert.equal(hash({a:1,b:{c:2,d:3}}),hash({b:{d:3,c:2},a:1}));assert.notEqual(hash({a:1}),hash({a:2}));});
function fixture(){const data={profile:{name:'Candidate',email:'candidate@example.com',phone:'+12125550123',years:'12',visa:'no',location:'New York, NY, USA'},resume:{sha256:'abc',path:'original.pdf'},events:[]};const job={id:JOB_ID,company:'Employer',title:'Role',apply:DESTINATION,answer:'Factual answer',historyConfirmed:true,lessonConfirmed:true,schemaHash:'test',verifiedAt:new Date().toISOString()};return {data,job};}
test('approval requires candidate answers, verified form and exact destination',()=>{const {data,job}=fixture();assert.deepEqual(blockers(data,job),[]);data.profile.phone='';assert(blockers(data,job).some(x=>x.includes('Phone')));job.apply='https://attacker.example/apply';assert(blockers(data,job).some(x=>x.includes('adapter')));});
test('stale form and unconfirmed claims prevent approval',()=>{const {data,job}=fixture();job.verifiedAt=new Date(Date.now()-86400001).toISOString();job.lessonConfirmed=false;job.historyConfirmed=false;assert.equal(blockers(data,job).length,3);});
test('approval fingerprints include CV, fields and destination',()=>{const {data,job}=fixture();const a=hash(packet(data,job));data.resume.sha256='changed';assert.notEqual(hash(packet(data,job)),a);});
test('edits invalidate queued approvals',()=>{const {data,job}=fixture();job.status='approved';job.approval={hash:'old'};invalidate(data,job);assert.equal(job.status,'draft');assert.equal(job.approval,null);assert.equal(data.events.length,1);});

test('location adapter rejects unreviewed cities',()=>{const {data,job}=fixture();data.profile.location='Boston, MA, USA';assert(blockers(data,job).some(x=>x.includes('New York')));});
