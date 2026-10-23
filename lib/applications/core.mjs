import {createHash,createHmac,timingSafeEqual,scryptSync,randomBytes} from 'node:crypto';
export const COOKIE='application_desk_session';
export const TTL=60*60*24*7;
export const canonical=v=>Array.isArray(v)?v.map(canonical):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,canonical(v[k])])):v;
export const hash=v=>createHash('sha256').update(typeof v==='string'||Buffer.isBuffer(v)?v:JSON.stringify(canonical(v))).digest('hex');
export function equal(a,b){if(typeof a!=='string'||typeof b!=='string')return false;const x=Buffer.from(a),y=Buffer.from(b);return x.length===y.length&&timingSafeEqual(x,y);}
export function passwordHash(password,salt=randomBytes(16).toString('hex')){return salt+':'+scryptSync(password,salt,64).toString('hex');}
export function checkPassword(password,encoded){if(typeof password!=='string'||password.length>256||!encoded)return false;const [salt,digest]=encoded.split(':');return !!salt&&!!digest&&equal(scryptSync(password,salt,64).toString('hex'),digest);}
export function session(secret,now=Date.now()){if(!secret||secret.length<32)throw Error('Authentication unavailable');const payload=Buffer.from(JSON.stringify({exp:now+TTL*1000,nonce:randomBytes(16).toString('hex')})).toString('base64url');return payload+'.'+createHmac('sha256',secret).update(payload).digest('base64url');}
export function verify(token,secret,now=Date.now()){try{if(!secret||secret.length<32||typeof token!=='string')return false;const [p,s,...extra]=token.split('.');if(extra.length||!equal(s,createHmac('sha256',secret).update(p).digest('base64url')))return false;const d=JSON.parse(Buffer.from(p,'base64url'));return d.exp>now&&d.exp<=now+TTL*1000&&typeof d.nonce==='string';}catch{return false;}}
export const JOB_ID='browser-company-model-behavior';
export const DESTINATION='https://jobs.ashbyhq.com/The%20Browser%20Company/7225dea4-ae91-46bf-9ecc-8bb7bbeb3914/application';
export function blockers(data,j,now=Date.now()){
 const p=data.profile||{},out=[];
 if(j.id!==JOB_ID||j.apply!==DESTINATION)out.push('This application route still needs an execution adapter.');
 if(!data.resume?.sha256)out.push('Original CV is not configured.');
 if(!p.name?.trim())out.push('Full name is missing.');
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email||''))out.push('Valid email is missing.');
 if(!/^\+?[\d\s().-]{7,30}$/.test(p.phone||''))out.push('Phone number is missing.');
 if(!Number.isInteger(Number(p.years))||String(p.years||'').trim()===''||Number(p.years)<1||Number(p.years)>70)out.push('Professional experience must be an exact number of years.');
 if(!['yes','no'].includes(p.visa))out.push('Visa / work-authorization answer is missing.');
 if(!/^New York(?: City)?(?:,|$)/i.test(p.location?.trim()||''))out.push('The current adapter supports New York City locations. Enter New York, NY, USA.');
 if(!j.answer?.trim())out.push('AI-project answer is missing.');
 if(!j.lessonConfirmed)out.push('Confirm the project answer is accurate.');
 if(j.historyConfirmed!==true)out.push('Confirm you meet the employer’s application-frequency limits.');
 if(!j.schemaHash||!j.verifiedAt||now-Date.parse(j.verifiedAt)>86400000||!Number.isFinite(Date.parse(j.verifiedAt)))out.push('The application form needs a fresh verification.');
 return out;
}
export function packet(data,j){return {jobId:j.id,company:j.company,title:j.title,destination:j.apply,schemaHash:j.schemaHash,resume:{...data.resume},fields:{name:data.profile.name,email:data.profile.email,phone:data.profile.phone,years:String(data.profile.years),visa:data.profile.visa,location:data.profile.location,linkedin:data.profile.linkedin||'',github:data.profile.github||'',portfolio:data.profile.portfolio||'',answer:j.answer},historyConfirmed:j.historyConfirmed,lessonConfirmed:j.lessonConfirmed,omitted:['pronouns','current company','Twitter','Other','voluntary demographic and veteran disclosures'],outreach:[]};}
export function log(data,text){data.events=[{at:new Date().toISOString(),text},...(data.events||[])].slice(0,300);}
export function invalidate(data,j){if(j.status==='approved'){j.status='draft';j.approval=null;log(data,`${j.company}: approval cleared after an edit.`);}}
export function cleanProfile(p){const out={};for(const k of ['name','email','phone','years','visa','location','linkedin','github','portfolio']){if(typeof p[k]!=='string')throw Error('Invalid profile');out[k]=p[k].trim().slice(0,500);}for(const k of ['linkedin','github','portfolio'])if(out[k]&&!/^https:\/\//.test(out[k]))throw Error('Profile links must use https.');return out;}
