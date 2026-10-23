// Exact fields inspected on the employer's Greenhouse form and public Job Board API.
// This is preparation mapping; it does not enable automatic submission.
export const KNIT_DESTINATION='https://job-boards.greenhouse.io/knit/jobs/4234448009';
export const isKnit=j=>j.company==='Knit'&&(j.apply===KNIT_DESTINATION||(!j.apply&&j.source===KNIT_DESTINATION));
export const KNIT_QUESTIONS=[
 {key:'officeMinimum',field:'question_5977314009',label:'Are you able to work a minimum of 3 days a week in our Midtown Manhattan office?'},
 {key:'workAuthorized',field:'question_5977315009',label:'Are you legally authorized to work in the US?'},
 {key:'futureSponsorship',field:'question_5977316009',label:'Would you require visa sponsorship now or in the future?'},
 {key:'privacyConsent',field:'question_5977318009',label:"Do you consent to Knit's Privacy Policy?"},
 {key:'aiSystemsExperience',field:'question_5977319009',label:'Do you have experience with LLM/agent systems, evals, and prompt tooling; RAG, embeddings, vector dbs.'},
 {key:'earlyStageExperience',field:'question_5977854009',label:'Have you worked at an early-stage startup — Seed, Series A or Series B?'},
 {key:'fiveYearsExperience',field:'question_5977855009',label:'Do you have a minimum of 5 years relevant experience?'}
];
export const KNIT_STATUS_LABEL='Can you share a bit more about your current work authorization status and the type of sponsorship you would require, now or in the future?';
export function cleanKnitAnswers(input){
 if(!input||typeof input!=='object'||Array.isArray(input))throw Error('Invalid Knit answers');
 const out={};
 for(const {key}of KNIT_QUESTIONS){const value=input[key]??'';if(!['','yes','no'].includes(value))throw Error('Choose Yes or No for each Knit screening answer.');out[key]=value;}
 for(const key of ['phoneCountry','preferredName','authorizationDetails']){const value=input[key]??'';if(typeof value!=='string'||value.length>2000)throw Error('Invalid Knit answer');out[key]=value.trim();}
 return out;
}
export function knitFields(profile,j){
 const [firstName='',...lastName]=String(profile.name||'').trim().split(/\s+/),a=j.knitAnswers||{};
 const fields={first_name:firstName,last_name:lastName.join(' '),preferred_name:a.preferredName||'',email:profile.email||'',country:a.phoneCountry||'',phone:profile.phone||'',location:profile.location||'',question_5977312009:profile.linkedin||'',question_5977313009:profile.portfolio||''};
 for(const {key,field}of KNIT_QUESTIONS){fields[field]=a[key]==='yes'?'Yes':a[key]==='no'?'No':'';if(key==='futureSponsorship')fields.question_5977317009=a.authorizationDetails||'';}
 return fields;
}
export const KNIT_LABELS={first_name:'First Name',last_name:'Last Name',preferred_name:'Preferred First Name (optional)',email:'Email',country:'Country (phone country code)',phone:'Phone',location:'Location (City)',question_5977312009:'LinkedIn Profile',question_5977313009:'Website (optional)',...Object.fromEntries(KNIT_QUESTIONS.map(q=>[q.field,q.label])),question_5977317009:KNIT_STATUS_LABEL+' (optional)'};
export function knitMissing(profile,j){
 const f=knitFields(profile,j),missing=[];
 for(const key of ['first_name','last_name','country','phone','location','question_5977312009'])if(!f[key])missing.push(KNIT_LABELS[key]+' is missing.');
 for(const {field,label}of KNIT_QUESTIONS)if(!f[field])missing.push('Answer: '+label);
 return missing;
}
