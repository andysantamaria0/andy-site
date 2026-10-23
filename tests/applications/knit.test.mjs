import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {KNIT_DESTINATION,KNIT_QUESTIONS,KNIT_LABELS,cleanKnitAnswers} from '../../lib/applications/knit.mjs';
import {packet,blockers,supported} from '../../lib/applications/core.mjs';
const captured=JSON.parse(fs.readFileSync(new URL('./fixtures/knit-form.json',import.meta.url),'utf8'));
const data={profile:{name:'Andrew Santamaria',email:'candidate@example.com',phone:'+12125550123',location:'New York, NY, USA',linkedin:'https://www.linkedin.com/in/candidate',portfolio:'https://example.com',visa:'no'},resume:{sha256:'original-cv',path:'original.pdf'}};
const fixture=()=>({id:'research-knit',company:'Knit',title:'Senior Product Manager',source:KNIT_DESTINATION,apply:KNIT_DESTINATION,answer:'Private introduction; never submit this',notes:'Private notes',knitAnswers:{phoneCountry:'United States (+1)',...Object.fromEntries(KNIT_QUESTIONS.map(q=>[q.key,'yes']))}});
test('Knit questions match the captured Greenhouse question IDs, wording, requiredness and choices',()=>{
 const selects=captured.questions.filter(q=>q.fields.some(f=>f.type==='multi_value_single_select'));
 assert.equal(selects.length,7);assert.equal(KNIT_QUESTIONS.length,7);
 for(const q of KNIT_QUESTIONS){const actual=selects.find(x=>x.fields[0].name===q.field);assert(actual);assert.equal(q.label,actual.label.trim());assert.equal(actual.required,true);assert.deepEqual(actual.fields[0].values.map(v=>v.label),['Yes','No']);}
 for(const id of ['preferred_name','question_5977313009','question_5977317009'])assert.equal(captured.questions.find(q=>q.fields[0].name===id).required,false);
 assert(!captured.questions.some(q=>/cover letter|personal statement|why.*knit/i.test(q.label)));
});
test('Knit packet uses actual fields, keeps the CV and excludes generic drafts and unrelated employer answers',()=>{
 const j=fixture(),p=packet(data,j);assert.equal(p.fields.first_name,'Andrew');assert.equal(p.fields.last_name,'Santamaria');assert.equal(p.fields.question_5977312009,data.profile.linkedin);assert.equal(p.fields.question_5977313009,data.profile.portfolio);assert.deepEqual(p.resume,data.resume);assert.deepEqual(p.outreach,[]);assert.deepEqual(p.fieldLabels,KNIT_LABELS);
 assert(!JSON.stringify(p).includes(j.answer));assert(!JSON.stringify(p).includes(j.notes));assert(!Object.hasOwn(p.fields,'answer'));assert(!Object.hasOwn(p.fields,'years'));assert(!Object.hasOwn(p,'historyConfirmed'));
 assert.equal(Object.keys(p.fields).length,17);
});
test('Knit never silently chooses consent, authorization or the combined AI screener',()=>{
 const j=fixture();j.knitAnswers={};const p=packet(data,j);
 for(const q of KNIT_QUESTIONS)assert.equal(p.fields[q.field],'');
 assert.equal(blockers(data,j).filter(x=>x.startsWith('Answer:')).length,7);
 assert(!supported(j));
});
test('Knit optional explanations do not become required and completed preparation cannot queue a submission',()=>{
 const j=fixture();assert.equal(blockers(data,j).length,1);assert.match(blockers(data,j)[0],/Automatic submission is not enabled/);
 j.knitAnswers.futureSponsorship='no';assert.equal(packet(data,j).fields.question_5977316009,'No');assert.equal(packet(data,j).fields.question_5977317009,'');
 j.apply='https://example.com/another-job';assert.deepEqual(packet(data,j).fields,{});
});
test('Knit saves only explicit permitted answer values',()=>{
 assert.equal(cleanKnitAnswers({privacyConsent:'no'}).privacyConsent,'no');assert.equal(cleanKnitAnswers({}).privacyConsent,'');
 for(const bad of [{privacyConsent:true},{aiSystemsExperience:'maybe'},{phoneCountry:[]},{authorizationDetails:'x'.repeat(2001)}])assert.throws(()=>cleanKnitAnswers(bad));
});
