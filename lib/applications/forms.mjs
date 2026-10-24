// Shared contract between inspection, preparation, review and execution.
// This module is also used in the browser; keep secrets and Node APIs out.
export const ENGINE = 'applications-2.0.0';
export const LOCKED = ['approved', 'submitting', 'submitted', 'uncertain'];
export const TERMINAL = ['submitted', 'uncertain'];
export const normalize = value => String(value || '').replace(/\s+/g, ' ').replace(/\s*\*\s*$/, '').trim();
export const keyText = value => normalize(value).toLowerCase().replace(/[’‘]/g, "'");
export const isEmpty = value => value == null || value === '' || Array.isArray(value) && !value.length;

export function destination(value) {
  try {
    const u = new URL(value);
    if (u.protocol !== 'https:' || u.username || u.password || u.port) return null;
    let match;
    if (u.hostname === 'jobs.ashbyhq.com' && (match = u.pathname.match(/^\/([^/]+)\/([a-f0-9-]{36})(?:\/application)?\/?$/i))) {
      return {platform: 'ashby', board: decodeURIComponent(match[1]), job: match[2], url: `https://jobs.ashbyhq.com/${match[1]}/${match[2]}/application`};
    }
    if (['job-boards.greenhouse.io', 'boards.greenhouse.io'].includes(u.hostname) && (match = u.pathname.match(/^\/([\w-]+)\/jobs\/(\d+)\/?$/))) {
      return {platform: 'greenhouse', board: match[1], job: match[2], url: `https://job-boards.greenhouse.io/${match[1]}/jobs/${match[2]}`};
    }
  } catch {}
  return null;
}

export function sensitive(field) {
  return /\b(gender|pronouns|race|ethnic\w*|hispanic|latino|veteran|disabilit\w*|sexual orientation|religion|date of birth)\b/i.test(field.label);
}
export function personalDecision(field) {
  return sensitive(field) || /\b(consent|privacy|gdpr|disclosure|agree|certify|acknowledg\w*|relocat\w*|salary|compensation|office|in.person|hybrid|sponsor\w*|visa\w*|authoriz\w*|citizen\w*|notice period|start date|referral|referred|hear about|previously applied)\b/i.test(field.label);
}
export function profileBinding(field) {
  const s = keyText(field.label).replace(/\s*\(optional\)$/, '');
  if (/^(full name|name|legal name)$/.test(s)) return 'name';
  if (/^first name$/.test(s)) return 'firstName';
  if (/^last name$/.test(s)) return 'lastName';
  if (/^preferred (first )?name$/.test(s)) return 'preferredName';
  if (s === 'how many years of professional experience do you have?') return 'years';
  if (/^(email|email address)$/.test(s)) return 'email';
  if (/^(phone|phone number|mobile|mobile phone)$/.test(s)) return 'phone';
  if (/^linkedin( (profile|url|profile url))?$/.test(s)) return 'linkedin';
  if (/^github( (url|profile))?$/.test(s)) return 'github';
  if (/^(website|portfolio|portfolio url|personal website)$/.test(s)) return 'portfolio';
  if (/^(location|location \(city\)|city|current location)$/.test(s)) return 'location';
  if (field.type === 'country' || s === 'country (phone country code)') return 'phoneCountry';
  if (/legally authorized to work in (the )?(us|u\.s\.|united states)\??$/.test(s)) return 'workAuthorizedUS';
  if (/sponsor/.test(s) && /now/.test(s) && /future/.test(s) && /united states|u\.s\.|\bus\b/.test(s) && field.options?.some(o=>o.label==='Yes')) return 'futureSponsorship';
  return null;
}
export function profileValue(profile = {}, binding) {
  const names = normalize(profile.name).split(' ');
  if (binding === 'firstName') return profile.firstName || names[0] || '';
  if (binding === 'lastName') return profile.lastName || names.slice(1).join(' ');
  return profile[binding] || '';
}
export function questionKey(field) {
  return JSON.stringify([keyText(field.label), field.type, (field.options || []).map(o => keyText(o.label))]);
}
export function reusable(field) {
  // Employer commitments, consents and personal disclosures are reviewed in context.
  return !personalDecision(field) && !profileBinding(field) && field.type !== 'file';
}
export function identity(form) {
  return {version: 2, platform: form.platform, destination: form.destination,
    fields: form.fields.map(({id, label, type, required, options = [], maxLength = null, description = '', links = []}) =>
      ({id, label: normalize(label), type, required: !!required, options, maxLength, description: normalize(description), links})),
    notices: form.notices || [], unsupported: form.unsupported || []};
}
export function supportsExecution(job) {
  const d = destination(job.apply);
  return !!(d && job.form?.version === 2 && job.form.engine === ENGINE && job.form.destination === d.url && job.form.platform === d.platform && job.form.fields?.length && !job.form.unsupported?.length && job.preparation?.state === 'ready');
}
export function answersFor(data, job) {
  const answers = {};
  for (const f of job.form?.fields || []) {
    if (f.type === 'file') continue;
    const saved = job.answers?.[f.id], binding = profileBinding(f);
    if (saved && saved.source !== 'profile') answers[f.id] = {...saved};
    else if (binding) answers[f.id] = {value: profileValue(data.profile, binding), source: 'profile', evidence: 'Your saved profile', binding};
    else {
      const memory = reusable(f) && data.answerMemory?.[questionKey(f)];
      answers[f.id] = memory ? {value: memory.value, source: 'saved', evidence: `Answer you saved for ${memory.company}`} : {value: f.type === 'multi' ? [] : '', source: 'missing', evidence: ''};
    }
  }
  return answers;
}
export function valueIssue(field, value, allowPlaceholders=false) {
  if (isEmpty(value)) return field.required ? `${field.label} needs an answer.` : '';
  if (field.type === 'multi') {
    if (!Array.isArray(value) || value.some(v => !field.options?.some(o => o.label === v))) return `${field.label}: choose the listed options.`;
  } else {
    if (typeof value !== 'string' || value.length > 15000) return `${field.label}: invalid answer.`;
    if (!allowPlaceholders && /\[(ADD|YOUR|CONFIRM|MISSING)\b[^\]]*\]/i.test(value)) return `${field.label}: complete the marked detail in the draft.`;
    if (field.options?.length && !field.options.some(o => o.label === value)) return `${field.label}: choose one of the employer's options.`;
    if (field.maxLength && value.length > field.maxLength) return `${field.label}: maximum ${field.maxLength} characters.`;
    const wordLimit=(field.label+' '+(field.description||'')).match(/(?:maximum|max\.?)\s+(\d+)\s+words/i);
    if(wordLimit&&value.trim().split(/\s+/).length>Number(wordLimit[1]))return `${field.label}: maximum ${wordLimit[1]} words.`;
    const binding = profileBinding(field);
    if ((field.type === 'email' || binding === 'email') && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return `${field.label}: enter a valid email.`;
    if ((field.type === 'tel' || binding === 'phone') && !/^\+?[\d\s().-]{7,30}$/.test(value)) return `${field.label}: enter a valid phone number.`;
    if (binding === 'linkedin' && !/^https:\/\/(www\.)?linkedin\.com\/in\/[^\s/?#]+\/?(?:[?#].*)?$/i.test(value)) return `${field.label}: enter your LinkedIn profile URL.`;
    if (field.type === 'number' && !Number.isFinite(Number(value))) return `${field.label}: enter a number.`;
    if (field.type === 'checkbox' && field.required && value !== 'Yes') return `${field.label}: the employer requires this checkbox to be selected to submit.`;
  }
  return '';
}
export function missingAnswers(data, job) {
  if (!job.form) return [];
  const values = answersFor(data, job), issues = [];
  for (const field of job.form.fields) {
    if (field.type === 'file') {
      if (field.required && field.document !== 'resume') issues.push(`${field.label}: this document needs to be provided separately.`);
      continue;
    }
    const issue = valueIssue(field, values[field.id]?.value);
    if (issue) issues.push(issue);
    else if(values[field.id]?.source==='draft'&&values[field.id]?.needsInput)issues.push(`${field.label}: ${values[field.id].needsInput}`);
  }
  if (job.id === 'browser-company-model-behavior' && !job.historyConfirmed) issues.push('Confirm the Browser Company application-frequency limits.');
  return issues;
}
export function capability(data, job) {
  if (job.status === 'submitted') return 'Submission confirmed';
  if (job.status === 'uncertain') return 'Outcome unresolved';
  if (job.status === 'submitting') return job.progress?.message || 'Submitting';
  if (job.status === 'approved') return 'Approved · queued';
  if (job.preparation?.state === 'inspecting' || job.preparation?.state === 'queued') return 'Inspecting application';
  if (job.preparation?.state === 'drafting') return 'Preparing answers';
  if (['queued','checking'].includes(job.preflight?.state)) return 'Checking completed answers';
  if(job.preflight?.state==='failed')return 'Form check needs attention';
  if (!destination(job.apply || job.source)) return 'Browser assistance needed';
  if (!supportsExecution(job)) return job.preparation?.state === 'failed' ? 'Inspection needs attention' : job.form?.unsupported?.length ? 'Browser assistance needed' : 'Waiting for inspection';
  const count = missingAnswers(data, job).length;
  return count ? `${count} answer${count === 1 ? '' : 's'} needed` : 'Ready to review';
}

export function saveAnswers(data, job, input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw Error('Invalid application answers');
  const fields = job.form.fields, before = answersFor(data, job);
  for (const id of Object.keys(input)) if (!fields.some(f => f.id === id && f.type !== 'file')) throw Error('The application questions changed. Refresh the review.');
  job.answers ||= {};
  data.answerMemory ||= {};
  let profileChanged = false;
  for (const field of fields) {
    if (field.type === 'file' || !Object.hasOwn(input, field.id)) continue;
    const raw = input[field.id], value = Array.isArray(raw) ? raw : typeof raw === 'string' ? raw.trim() : raw;
    // Incomplete drafts can be saved, but invalid choices cannot.
    const issue = valueIssue({...field, required: false}, value, true);
    if (issue) throw Error(issue);
    if (JSON.stringify(before[field.id]?.value) === JSON.stringify(value)) continue;
    const binding = profileBinding(field);
    if (binding) {
      data.profile[binding] = value;
      if (binding === 'firstName' || binding === 'lastName') data.profile.name = [profileValue(data.profile, 'firstName'), profileValue(data.profile, 'lastName')].filter(Boolean).join(' ');
      if (binding === 'name') {delete data.profile.firstName; delete data.profile.lastName;}
      job.answers[field.id] = {value, source: 'profile', evidence: 'Your saved profile', binding};
      profileChanged = true;
    } else {
      job.answers[field.id] = {value, source: 'user', evidence: 'Your answer', at: new Date().toISOString()};
      if (reusable(field) && !isEmpty(value)) data.answerMemory[questionKey(field)] = {value, company: job.company, at: new Date().toISOString()};
    }
  }
  return {profileChanged};
}
