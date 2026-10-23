'use client';
import {KNIT_QUESTIONS,KNIT_STATUS_LABEL} from '../../lib/applications/knit.mjs';
export default function KnitFields({answers,setAnswers,sources,locked}){
 const change=(key,value)=>setAnswers({...answers,[key]:value});
 return <>
  <p>Knit does not request a cover letter or a general written answer. Its form asks for contact details, your original CV, and the seven Yes/No questions below.</p>
  <p className="muted">Your saved name, email, phone, city, LinkedIn and website come from Your profile. Preferred first name, website and the sponsorship explanation are optional.</p>
  <label>Country (phone country code)<input value={answers.phoneCountry||''} disabled={locked} placeholder="For example: United States (+1)" onChange={e=>change('phoneCountry',e.target.value)}/></label>
  <label>Preferred First Name <span className="muted">(optional)</span><input value={answers.preferredName||''} disabled={locked} onChange={e=>change('preferredName',e.target.value)}/></label>
  {KNIT_QUESTIONS.map(({key,label})=><div key={key}>
   <label>{label}<select value={answers[key]||''} disabled={locked} onChange={e=>change(key,e.target.value)}><option value="">Choose your answer</option><option value="yes">Yes</option><option value="no">No</option></select></label>
   {sources?.[key]&&<small>{sources[key]}</small>}
   {key==='futureSponsorship'&&<label>{KNIT_STATUS_LABEL} <span className="muted">(optional)</span><input value={answers.authorizationDetails||''} disabled={locked} onChange={e=>change('authorizationDetails',e.target.value)}/></label>}
   {key==='privacyConsent'&&<a href="https://goknit.com/privacy-policy" target="_blank" rel="noopener noreferrer">Read Knit’s privacy policy ↗</a>}
   {key==='aiSystemsExperience'&&<small>This is one combined question covering agents, evaluations, prompt tools, RAG, embeddings and vector databases. The saved CV establishes agent work; that alone does not establish every item.</small>}
  </div>)}
 </>;
}
