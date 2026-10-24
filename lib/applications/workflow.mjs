import {hash, log} from './core.mjs';
import {ENGINE, identity, destination, supportsExecution, answersFor, missingAnswers, isEmpty} from './forms.mjs';
import {randomUUID} from 'node:crypto';

export const formHash = form => hash(identity(form));
export function compatibleForm(actual, reviewed) {
  const a=identity(actual),r=identity(reviewed);
  return a.platform===r.platform&&a.destination===r.destination&&!a.unsupported.length&&a.fields.every(field=>r.fields.some(expected=>expected.id===field.id&&hash(expected)===hash(field)));
}
export function applicationPacket(data, job) {
  const answers = answersFor(data, job), fields = {}, fieldLabels = {}, omitted = [];
  for (const field of job.form?.fields || []) {
    if (field.type === 'file') {if (field.document !== 'resume') omitted.push(field.label); continue;}
    if (isEmpty(answers[field.id]?.value) && !field.required) {omitted.push(field.label); continue;}
    fields[field.id] = answers[field.id]?.value ?? '';
    fieldLabels[field.id] = field.label;
  }
  return {version: 2, engine: ENGINE, jobId: job.id, company: job.company, title: job.title,
    destination: job.apply, schemaHash: job.form ? formHash(job.form) : null,
    form: job.form ? identity(job.form) : null, fields, fieldLabels, resume: {...data.resume}, omitted,
    historyConfirmed: job.id === 'browser-company-model-behavior' ? job.historyConfirmed === true : null, outreach: []};
}
export function applicationBlockers(data, job, now = Date.now(), {requirePreflight=true}={}) {
  const result = [];
  if (!supportsExecution(job)) result.push(job.preparation?.issue || job.form?.unsupported?.join(' ') || 'The agent must inspect this application before you can approve it.');
  if (!data.resume?.sha256?.match(/^[a-f0-9]{64}$/)) result.push('The original CV needs verification.');
  const age = now - Date.parse(job.form?.checkedAt);
  if (job.form && (!Number.isFinite(age) || age < -60000 || age > 86400000)) result.push('This form needs a fresh inspection. Use Recheck application.');
  result.push(...missingAnswers(data, job));
  if(requirePreflight && !preflightReady(data,job,now))result.push(job.preflight?.issue||'The agent must check these completed answers on the employer form before approval.');
  return result;
}
export function preflightReady(data,job,now=Date.now()) {
  return job.preflight?.state==='ready'&&job.preflight.packetHash===hash(applicationPacket(data,job))&&now-Date.parse(job.preflight.at)<30*60000;
}
export function executionApprovalIssue(data, job, now = Date.now()) {
  const a = job.approval;
  if (!a || !Number.isFinite(Date.parse(a.expiresAt)) || Date.parse(a.expiresAt) <= now) return 'Approval expired. Review again.';
  if (a.packet?.version !== 2 || a.packet.engine !== ENGINE) return 'The application worker was upgraded. Review this application again.';
  if (a.hash !== hash(a.packet) || a.hash !== hash(applicationPacket(data, job))) return 'The form or answers changed. Review the updated application.';
  return applicationBlockers(data, job, now,{requirePreflight:false}).join(' ');
}
export function workerReady(worker, now = Date.now()) {
  return worker?.version === ENGINE && Number.isFinite(Date.parse(worker.lastSeen)) && now - Date.parse(worker.lastSeen) < 180000 && now - Date.parse(worker.lastSeen) >= -60000;
}
export function applyWorkerAction(data, input, now = Date.now()) {
  const job = data.jobs.find(j => j.id === input.jobId);
  if (!job) throw Error('Unknown application');
  const at = new Date(now).toISOString();
  if (input.action === 'inspection-start') {
    if (['approved', 'submitting', 'submitted', 'uncertain'].includes(job.status)) return {ok: true, skipped: true};
    job.preparation = {state: 'inspecting', at};
    return {ok: true};
  }
  if (input.action === 'inspection') {
    if (['approved', 'submitting', 'submitted', 'uncertain'].includes(job.status)) return {ok: true, skipped: true};
    if (input.issue) {job.preparation = {state: input.unsupported ? 'unsupported' : 'failed', issue: String(input.issue).slice(0,1500), at}; return {ok: true};}
    const form = input.form, dest = destination(job.apply || job.source);
    if (!dest || form?.destination !== dest.url || form.engine !== ENGINE || form.version !== 2 || !Array.isArray(form.fields) || !form.fields.length || form.fields.length > 150 || new Set(form.fields.map(f => f.id)).size !== form.fields.length) throw Error('Invalid inspected form');
    for (const f of form.fields) if (typeof f.id !== 'string' || typeof f.label !== 'string' || typeof f.type !== 'string' || !Array.isArray(f.options) || f.label.length > 5000) throw Error('Invalid application field');
    const previous = job.form;
    // Preserve user answers only when the question and choices have the same meaning.
    if (previous) for (const id of Object.keys(job.answers || {})) {
      const old = previous.fields.find(f => f.id === id), fresh = form.fields.find(f => f.id === id);
      if (!old || !fresh || hash({...old, locator: null}) !== hash({...fresh, locator: null})) delete job.answers[id];
    }
    job.apply = dest.url; job.form = {...form, checkedAt: at}; job.schemaHash = formHash(job.form); job.verifiedAt = at;
    job.preparation = {state: 'ready', at}; job.issue = null;
    if (input.company && (!job.company || job.needsRoleSummary)) job.company = String(input.company).slice(0,200);
    if (input.title) job.title = String(input.title).slice(0,250);
    if (typeof input.context==='string') job.roleContext=input.context.slice(0,25000);
    log(data, `${job.company || 'Application'}: inspected ${form.fields.length} actual form fields.`);
    return {ok: true};
  }
  if (input.action === 'draft-start') {
    if (['approved','submitting','submitted','uncertain'].includes(job.status)) return {ok:true,skipped:true};
    job.preparation={...job.preparation,state:'drafting',at}; return {ok:true};
  }
  if (input.action === 'prepared') {
    if (['approved', 'submitting', 'submitted', 'uncertain'].includes(job.status) || input.schemaHash !== job.schemaHash) return {ok: true, skipped: true};
    job.answers ||= {};
    const current=answersFor(data,job);
    for (const [id, answer] of Object.entries(input.answers || {})) {
      if (!job.form.fields.some(f => f.id === id && f.type !== 'file') || !isEmpty(current[id]?.value)) continue;
      if (!isEmpty(answer.value)) job.answers[id] = answer;
    }
    job.preparation = {...job.preparation, state: 'ready', draftedAt: at, draftIssue: input.issue ? String(input.issue).slice(0,1000) : null};
    if(job.needsRoleSummary&&input.summary) {
      for(const key of ['fit','gap','salary','location'])if(typeof input.summary[key]==='string'&&input.summary[key].trim())job[key]=input.summary[key].slice(0,5000);
      job.needsRoleSummary=false;
    }
    return {ok: true};
  }
  if(input.action==='preflight-start') {
    if(LOCKED_STATUS(job.status)||input.packetHash!==hash(applicationPacket(data,job)))return {ok:true,skipped:true};
    job.preflight={state:'checking',packetHash:input.packetHash,at};return {ok:true};
  }
  if(input.action==='preflight-result') {
    if(LOCKED_STATUS(job.status)||input.packetHash!==hash(applicationPacket(data,job)))return {ok:true,skipped:true};
    if(input.form) {
      applyWorkerAction(data,{action:'inspection',jobId:job.id,form:input.form},now);
      job.preflight={state:'needs-answers',at,issue:'The employer revealed additional or changed questions. Review the updated answers before continuing.'};
    }else job.preflight={state:input.ok?'ready':'failed',packetHash:input.packetHash,at,issue:input.ok?null:String(input.issue||'The employer form check could not finish.').slice(0,1500)};
    log(data,`${job.company}: ${input.ok?'completed answers checked on the employer form; nothing submitted':job.preflight.issue}`);return {ok:true};
  }
  if (input.action === 'claim') {
    if (data.paused || job.status !== 'approved') return {claimed: false};
    const issue = executionApprovalIssue(data, job, now);
    if (issue) {job.status = 'blocked'; job.issue = issue; job.approval = null; log(data, `${job.company}: ${issue}`); return {claimed: false};}
    job.status = 'submitting';
    job.attempt = {id: randomUUID(), startedAt: at, submitStarted: false, engine: ENGINE};
    job.progress = {at, message: 'Checking and filling the approved form'};
    log(data, `${job.company}: approved application claimed.`);
    return {claimed: true, attempt: job.attempt.id, approval: job.approval};
  }
  if (input.action === 'recover') {
    if (job.status !== 'submitting' || now - Date.parse(job.attempt?.startedAt) <= 20 * 60000) return {ok: true};
    job.status = job.attempt.submitStarted ? 'uncertain' : 'blocked';
    job.issue = job.attempt.submitStarted ? 'The browser stopped after submission began. The outcome is unresolved. No retry is running. Check the saved attempt evidence before any further application.' : 'The browser stopped before submission. Nothing was submitted; review again to restart.';
    if (!job.attempt.submitStarted) job.approval = null;
    log(data, `${job.company}: ${job.issue}`); return {ok: true};
  }
  if (!job.attempt || job.attempt.id !== input.attempt) throw Error('Attempt mismatch');
  if (input.action === 'result' && job.receipt?.attempt === input.attempt) return {ok: true, recorded: true};
  if (!['submitting', 'uncertain'].includes(job.status)) throw Error('Attempt is not active');
  if (input.action === 'progress') {
    job.progress = {at, message: String(input.message).slice(0,250)}; return {ok: true};
  }
  if (input.action === 'begin-submit') {
    if (job.status !== 'submitting' || job.attempt.submitStarted || data.paused) throw Error('Submission not authorized');
    const issue = executionApprovalIssue(data, job, now); if (issue) throw Error(issue);
    job.attempt.submitStarted = true; job.attempt.submitStartedAt = at;
    job.progress = {at, message: 'Sending once and checking employer confirmation'}; return {ok: true};
  }
  if (input.action === 'result') {
    const receipt = input.receipt;
    if (input.status === 'submitted') {
      if (!job.attempt.submitStarted || receipt?.kind !== 'success' || receipt?.destination !== job.apply || !['ashby-success-container','greenhouse-confirmation'].includes(receipt.signal) || typeof receipt.text !== 'string' || !receipt.text.trim() || !input.evidence) throw Error('A verified employer receipt and evidence are required');
      job.status = 'submitted'; job.receipt = {summary: receipt.text.slice(0,4000), at: receipt.at || at, attempt: input.attempt, signal: receipt.signal}; job.issue = null;
    } else {
      job.status = job.attempt.submitStarted ? 'uncertain' : 'blocked';
      job.issue = String(input.issue || 'The application stopped and needs attention.').slice(0,2000);
      if (!job.attempt.submitStarted) job.approval = null;
    }
    if (input.evidence) job.attempt.evidence = input.evidence;
    job.attempt.finishedAt = at; job.progress = null;
    log(data, `${job.company}: ${job.status === 'submitted' ? 'employer confirmation recorded' : job.issue}`);
    return {ok: true, recorded: true};
  }
  throw Error('Unknown worker action');
}
function LOCKED_STATUS(status){return ['approved','submitting','submitted','uncertain'].includes(status);}
