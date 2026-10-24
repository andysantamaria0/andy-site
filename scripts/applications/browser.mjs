import {ENGINE, destination, normalize, sensitive, isEmpty} from '../../lib/applications/forms.mjs';
import {formHash,compatibleForm} from '../../lib/applications/workflow.mjs';

const idLocator = (page, id) => page.locator(`[id=${JSON.stringify(id)}]`);
export function control(page, field) {
  return field.locator.kind === 'ashby' ? page.locator('.ashby-application-form-question-title').filter({hasText: field.label}).filter({visible: true}) : idLocator(page, field.locator.id);
}
function group(page, field) {
  // label[for] is a stable form-question identity even when the actual widget has no ID.
  return page.locator(`label[for=${JSON.stringify(field.id)}].ashby-application-form-question-title`).locator('..');
}
const stripHTML = value => normalize(String(value || '').replace(/<[^>]*>/g, ' ').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' '));
export async function inspect(page, target, {navigate = true, apiData, location} = {}) {
  const dest = destination(target);
  if (!dest) throw Error('This application platform needs browser assistance. It cannot be approved for automatic submission.');
  if (navigate) await page.goto(dest.url, {waitUntil: 'domcontentloaded', timeout: 45000});
  if (destination(page.url())?.url !== dest.url) throw Error(`The employer redirected away from this application to ${new URL(page.url()).origin+new URL(page.url()).pathname}. The job may have closed.`);
  await page.getByRole('button', {name: /^Submit application$/i}).waitFor({state: 'visible', timeout: 25000});
  // A server-rendered form can be visible before React attaches its event handlers.
  await page.waitForFunction(()=>{
    const input=document.querySelector('input[id]:not([type=hidden])');
    return input&&Object.keys(input).some(k=>k.startsWith('__reactProps$'));
  },null,{timeout:20000});
  // Location can change the employer's consent questions. Resolve it before inspecting.
  if (location && navigate) {
    const locations = page.getByRole('combobox');
    for (const el of await locations.all()) {
      const label = await el.evaluate(e => [...e.labels || []].map(l => l.innerText).join(' ') || e.getAttribute('aria-label') || e.closest('.ashby-application-form-field-entry')?.querySelector('.ashby-application-form-question-title')?.innerText || e.id);
      if (!/^(location|location \(city\))\s*\*?$/i.test(label.trim())) continue;
      const id = await el.getAttribute('id');
      await chooseCombo(page, {label:'Location',type:'location',locator:{kind:dest.platform==='greenhouse'?'id':'ashby',id}}, location, el);
    }
  }
  // Hydration may add compliance fields after the submit button first appears.
  let previous='',stable=0;
  for(let n=0;n<16&&stable<3;n++) {
    const signature=await page.locator('input[id],textarea[id],select[id]').evaluateAll(es=>es.map(e=>e.id+':'+!!e.getClientRects().length).join('|'));
    stable=signature===previous?stable+1:0;previous=signature;await page.waitForTimeout(250);
  }
  if (dest.platform === 'greenhouse' && !apiData) {
    const r = await page.request.get(`https://boards-api.greenhouse.io/v1/boards/${dest.board}/jobs/${dest.job}?questions=true`, {timeout: 20000});
    if (!r.ok()) throw Error('The employer’s public question list could not be verified.');
    apiData = await r.json();
  }
  const extracted = await page.evaluate(platform => {
    const norm = v => (v || '').replace(/\s+/g, ' ').replace(/\s*\*\s*$/, '').trim();
    const visible = e => !!(e.getClientRects().length && getComputedStyle(e).visibility !== 'hidden');
    const linkData = root => [...root.querySelectorAll('a[href]')].map(a => ({label: norm(a.innerText), url: a.href})).filter(a => a.url.startsWith('https://')).slice(0,15);
    const fields = [], unknown = [];
    if (platform === 'ashby') {
      for (const title of document.querySelectorAll('.ashby-application-form-question-title')) {
        const root = title.parentElement;
        if (!visible(root)) continue;
        const label = norm(title.innerText), id = title.getAttribute('for');
        if (!id || !label) {unknown.push('An employer question has no stable identity.'); continue;}
        const buttons = [...root.querySelectorAll('button[data-option]')], radios = [...root.querySelectorAll('input[type=radio]')];
        const el = root.querySelector('input:not([type=hidden]),textarea,select');
        const required = /required/i.test(title.className) || !!el?.required || el?.getAttribute('aria-required') === 'true';
        let type = 'unsupported', options = [];
        if (buttons.length) {type = 'choice'; options = buttons.map(b => ({value: b.dataset.option, label: norm(b.innerText)}));}
        else if (radios.length) {type = 'radio'; options = radios.map(e => ({value: e.id, label: norm([...e.labels].map(l => l.innerText).join(' '))}));}
        else if (el?.tagName === 'SELECT') {type = 'select'; options = [...el.options].filter(o => o.value).map(o => ({value: o.value, label: norm(o.text)}));}
        else if (el?.tagName === 'TEXTAREA') type = 'textarea';
        else if (el?.type === 'checkbox') {type = 'checkbox'; options = [{value: 'true', label: 'Yes'}, {value: 'false', label: 'No'}];}
        else if (el) type = el.getAttribute('role') === 'combobox' ? (/location|city/i.test(label) ? 'location' : 'combobox') : el.type;
        const description = norm(root.querySelector('.ashby-application-form-question-description')?.innerText);
        fields.push({id, label, type, required, options, maxLength: el?.maxLength > 0 ? el.maxLength : null, description, links: linkData(root), locator: {kind: 'ashby', id, controlId: el?.id || ''}, ...(type === 'file' ? {document: /resume|cv/i.test(label) ? 'resume' : 'other'} : {})});
      }
    } else {
      for (const el of document.querySelectorAll('input,textarea,select')) {
        if (el.type === 'hidden' || el.getAttribute('aria-hidden') === 'true' || /recaptcha/i.test(el.name || el.id)) continue;
        if (el.type !== 'file' && !visible(el)) continue;
        const id = el.id;
        if (!id) {if (visible(el)) unknown.push('An employer input has no stable identity.'); continue;}
        let label = norm([...el.labels || []].map(l => l.innerText).join(' ') || el.getAttribute('aria-label'));
        const root = el.closest('.field-wrapper') || el.parentElement;
        if (el.type === 'file') label = norm(root.querySelector('.upload-label')?.innerText || label);
        if (!label) {unknown.push(`Unlabelled field: ${id}`); continue;}
        let type = el.tagName === 'TEXTAREA' ? 'textarea' : el.tagName === 'SELECT' ? 'select' : el.type;
        if (el.getAttribute('role') === 'combobox') type = id === 'country' ? 'country' : /location/i.test(id) ? 'location' : 'combobox';
        const options = el.options ? [...el.options].filter(o => o.value).map(o => ({value: o.value, label: norm(o.text)})) : type === 'checkbox' ? [{value: 'true', label: 'Yes'}, {value: 'false', label: 'No'}] : [];
        fields.push({id, label, type, required: !!el.required || el.getAttribute('aria-required') === 'true' || root.querySelector('[role=group]')?.getAttribute('aria-required') === 'true', options, maxLength: el.maxLength > 0 ? el.maxLength : null,
          description: norm(document.getElementById(`${id}-description`)?.innerText), links: linkData(root), locator: {kind: 'id', id}, ...(type === 'file' ? {document: id === 'resume' ? 'resume' : 'other'} : {})});
      }
    }
    return {fields, unknown, title: document.querySelector('h1')?.innerText || document.title, context: document.body.innerText.slice(0,25000)};
  }, dest.platform);
  const unsupported = [...extracted.unknown];
  for (const f of extracted.fields) {
    if (dest.platform === 'greenhouse') {
      const q = (apiData.questions || []).find(q => q.fields?.some(x => x.name === f.id));
      if (q) {
        f.label = normalize(q.label); f.required = !!q.required; f.description = stripHTML(q.description);
        const apiField = q.fields.find(x => x.name === f.id);
        if (apiField.values?.length) f.options = apiField.values.map(o => ({value: String(o.value), label: normalize(o.label)}));
        if (apiField.type === 'multi_value_multi_select') f.type = 'multi';
      }
      if (/^gdpr_.*consent/i.test(f.id)) {
        const policies=apiData.data_compliance||[];
        // Greenhouse requests retention consent separately, but that checkbox is optional.
        if (/retention/.test(f.id)) f.required=false;
        else if (/processing/.test(f.id)) f.required=policies.some(p=>p.requires_processing_consent);
        else f.required=policies.some(p=>p.requires_consent);
      }
    }
    // Inspect actual choice menus, not merely their summaries in the posting.
    if (['combobox','country'].includes(f.type) && !sensitive(f)) {
      const el = f.locator.kind === 'id' ? idLocator(page, f.id) : group(page,f).getByRole('combobox');
      await el.click();
      const list = page.getByRole('listbox').filter({visible: true});
      await list.first().waitFor({timeout: 8000});
      const rendered=await list.getByRole('option').evaluateAll(es=>es.map(e=>({label:e.innerText,code:e.querySelector('.iti__flag')?.className.match(/\biti__([a-z]{2})\b/)?.[1]})));
      const labels=rendered.map(o=>normalize(o.label)).filter(Boolean);
      await page.keyboard.press('Escape');
      if (!labels.length) unsupported.push(`${f.label}: options could not be inspected.`);
      else if (f.options.length && (labels.length !== f.options.length || labels.some(v => !f.options.some(o => o.label === v)))) unsupported.push(`${f.label}: the public question list differs from the visible form.`);
      else if (!f.options.length) f.options = rendered.filter(o=>normalize(o.label)).map(o=>({value:f.type==='country'&&o.code?o.code:normalize(o.label),label:normalize(o.label)}));
    }
    if (sensitive(f) && !f.required) f.omit = true;
    if (!['text','email','tel','url','number','textarea','file','choice','radio','select','checkbox','combobox','country','location'].includes(f.type)) unsupported.push(`${f.label}: this control needs browser assistance.`);
    if (f.type === 'file' && f.required && f.document !== 'resume') unsupported.push(`${f.label}: an additional document is required.`);
  }
  if (dest.platform === 'greenhouse') {
    for (const q of apiData.questions || []) {
      if (q.required && !q.fields.some(f => extracted.fields.some(d => d.id === f.name))) unsupported.push(`${normalize(q.label)}: a required question is not visible; it needs inspection.`);
    }
  }
  const form = {version: 2, engine: ENGINE, platform: dest.platform, destination: dest.url, fields: extracted.fields, notices: [], unsupported, checkedAt: new Date().toISOString()};
  return {form, schemaHash: formHash(form), title: apiData?.title || extracted.title, company: apiData?.company_name || dest.board, context: extracted.context};
}

function canonicalLocation(value) {
  return normalize(value).toLowerCase().replace(/\busa\b/g,'united states').replace(/\bny\b/g,'new york').replace(/new york city/g,'new york').replace(/[^a-z0-9]/g,'');
}
async function chooseCombo(page, field, value, el) {
  if(field.type==='location'&&canonicalLocation(await el.inputValue())===canonicalLocation(value))return normalize(await el.inputValue());
  await el.click();
  await el.fill('');
  if(field.type==='location')await el.pressSequentially(value.split(',')[0],{delay:45});
  const list = page.getByRole('listbox').filter({visible: true}).first();
  await list.waitFor({timeout: 15000});
  // Wait until an unambiguous matching option exists; async locations can briefly show a stale menu.
  const wanted = field.type === 'location' ? canonicalLocation(value) : normalize(value);
  const end = Date.now() + 15000;
  let matches = [], available = [];
  while (Date.now() < end) {
    const labels = (await list.getByRole('option').allTextContents()).map(normalize);
    available = labels;
    matches = labels.filter(label => (field.type === 'location' ? canonicalLocation(label) : label) === wanted);
    if (matches.length === 1) break;
    await page.waitForTimeout(200);
  }
  if (matches.length !== 1) throw Error(`${field.label}: choose the employer's exact location or option. Available matches: ${available.slice(0,5).join('; ')}. Nothing was submitted.`);
  await list.getByRole('option', {name: matches[0], exact: true}).click();
  if (field.locator.kind === 'id') {
    const root = el.locator('xpath=ancestor::div[contains(@class,"select__container")][1]');
    if (await root.count() && !(await root.innerText()).includes(matches[0])) {
      const countryCode=field.type==='country'&&field.options.find(o=>o.label===matches[0])?.value;
      if(countryCode&&/^[a-z]{2}$/.test(countryCode)&&await root.locator(`.select__single-value .iti__${countryCode}`).count()===1)return matches[0];
      // Greenhouse's country widget displays only the dial code after selection.
      // Verify the selected option itself, rather than assuming its visible label stays the same.
      await el.click();
      const selected=page.getByRole('listbox').filter({visible:true}).getByRole('option',{name:matches[0],exact:true});
      const confirmed=await selected.count()===1&&await selected.getAttribute('aria-selected')==='true';
      await page.keyboard.press('Escape');
      if(!confirmed)throw Error(`${field.label}: the selection did not persist.`);
    }
  } else {
    let persisted=false;
    for(let n=0;n<30;n++){const selected=await el.inputValue();if(field.type==='location'?canonicalLocation(selected)===canonicalLocation(matches[0]):selected===matches[0]){persisted=true;break;}await page.waitForTimeout(100);}
    if(!persisted)throw Error(`${field.label}: the selected location did not persist.`);
  }
  return matches[0];
}
export async function fillApproved(page, packet, pdf, observed, {inspectForm=inspect,uploadTimeout=30000,upload=true}={}) {
  const filled = {};
  let current=observed,complete=false;
  for(let round=0;round<4&&!complete;round++) {
  if(!compatibleForm(current,packet.form)){const error=Error('The employer revealed new or changed questions. Review the updated form. Nothing was submitted.');error.form=current;throw error;}
  for (const field of current.fields) {
    if (field.type === 'file') continue; // Upload only after all other answers have been checked.
    if(Object.hasOwn(filled,field.id))continue;
    const value = packet.fields[field.id];
    if (isEmpty(value)) continue;
    const root = field.locator.kind === 'ashby' ? group(page, field) : null;
    const el = field.locator.kind === 'id' ? idLocator(page, field.id) : ['combobox','location','country'].includes(field.type)?root.getByRole('combobox'):idLocator(page, field.locator.controlId || field.id);
    if (field.type === 'choice') {
      const button = root.getByRole('button', {name: value, exact: true}); await button.click();
      if (await button.getAttribute('aria-pressed') !== 'true') throw Error(`${field.label}: answer did not persist.`);
    } else if (field.type === 'radio') {
      const radio = root.getByRole('radio', {name: value, exact: true}); await radio.check();
      if (!await radio.isChecked()) throw Error(`${field.label}: answer did not persist.`);
    } else if (field.type === 'checkbox') {
      await el.setChecked(value === 'Yes');
      if (await el.isChecked() !== (value === 'Yes')) throw Error(`${field.label}: answer did not persist.`);
    } else if (field.type === 'select') {
      await el.selectOption({label: value});
      if (normalize(await el.locator('option:checked').innerText()) !== value) throw Error(`${field.label}: answer did not persist.`);
    } else if (['combobox','country','location'].includes(field.type)) {
      filled[field.id] = await chooseCombo(page, field, value, el); continue;
    } else {
      await el.fill(value);
      const actual=await el.inputValue();
      const same=field.type==='tel'?actual.replace(/\D/g,'')===value.replace(/\D/g,''):actual===value;
      if (!same) throw Error(`${field.label}: answer did not persist.`);
      filled[field.id]=actual;continue;
    }
    filled[field.id] = value;
  }
  // Re-extract after choices: conditional questions must never be silently skipped.
  const after = await inspectForm(page, packet.destination, {navigate: false});
  if(!compatibleForm(after.form,packet.form)){const error=Error('Your choices revealed new or changed questions. Review the updated form. Nothing was submitted.');error.form=after.form;throw error;}
  complete=after.schemaHash===packet.schemaHash&&after.form.fields.every(f=>f.type==='file'||isEmpty(packet.fields[f.id])||Object.hasOwn(filled,f.id));
  current=after.form;
  }
  if(!complete){const error=Error('The active questions differ from the reviewed form. Nothing was submitted.');error.form=current;throw error;}
  if(!upload) {
    const invalid=await page.locator('[aria-invalid="true"],input:invalid,textarea:invalid,select:invalid').evaluateAll(es=>es.filter(e=>e.type!=='file'&&e.getClientRects().length&&e.getAttribute('aria-hidden')!=='true'&&getComputedStyle(e).visibility!=='hidden').map(e=>e.getAttribute('aria-label')||e.id||'Employer field'));
    if(invalid.length)throw Error(`The employer rejected these answers: ${invalid.join(', ')}. Nothing was submitted.`);
    return filled;
  }
  for (const field of current.fields.filter(f => f.type === 'file' && f.document === 'resume')) {
    const el = field.locator.kind === 'id' ? idLocator(page, field.id) : idLocator(page, field.locator.controlId);
    // Greenhouse unmounts its file input while uploading. Keep the original handle,
    // then verify the completed upload widget rather than waiting for that input to return.
    const handle=await el.elementHandle();if(!handle)throw Error('The resume upload control disappeared.');
    await handle.setInputFiles({name: 'CV_A_Santamaria_A.pdf', mimeType: 'application/pdf', buffer: pdf});
    const files = await handle.evaluate(e => [...e.files].map(f => ({name: f.name, size: f.size})));await handle.dispose();
    if (files.length !== 1 || files[0].size !== pdf.length || files[0].name !== 'CV_A_Santamaria_A.pdf') throw Error('The original CV did not attach correctly.');
    if(observed.platform==='greenhouse') {
      const result=await page.waitForFunction(id=>{
        const root=document.querySelector(`[aria-labelledby="upload-label-${id}"]`);
        const error=root?.querySelector('.helper-text--error')?.innerText?.trim();if(error)return {error};
        const file=root?.querySelector('.file-upload__filename');return file?.innerText.includes('CV_A_Santamaria_A.pdf')?{ok:true}:false;
      },field.id,{timeout:uploadTimeout});
      const uploaded=await result.jsonValue();await result.dispose();if(uploaded.error)throw Error(`Resume upload failed: ${uploaded.error}. Nothing was submitted.`);
    }
  }
  const invalid = await page.locator('[aria-invalid="true"],input:invalid,textarea:invalid,select:invalid').evaluateAll(es => es.filter(e => e.getClientRects().length && e.getAttribute('aria-hidden') !== 'true' && getComputedStyle(e).visibility !== 'hidden').map(e => e.getAttribute('aria-label') || e.id || 'Employer field'));
  if (invalid.length) throw Error(`The employer rejected these fields: ${invalid.join(', ')}. Nothing was submitted.`);
  return filled;
}

export async function outcome(page, platform, timeout = 45000, expectedDestination, {ignoreChallenge=false}={}) {
  const handle = await page.waitForFunction(({platform,expectedDestination,ignoreChallenge}) => {
    const visible = e => e && e.getClientRects().length && getComputedStyle(e).visibility !== 'hidden';
    if (platform === 'ashby') {
      const success = document.querySelector('.ashby-application-form-success-container');
      if (visible(success)) return {kind: 'success', signal: 'ashby-success-container', text: success.innerText};
      for (const s of ['.ashby-application-form-failure-container','.ashby-application-form-blocked-application-container']) {
        const e = document.querySelector(s); if (visible(e)) return {kind: 'rejected', text: e.innerText};
      }
    } else {
      // The hosted Greenhouse confirmation route is independent of an employer's custom copy.
      const main = document.querySelector('main') || document.body;
      const expected=expectedDestination&&new URL(expectedDestination);
      if (expected && location.origin===expected.origin && location.pathname===expected.pathname+'/confirmation' && ![...document.querySelectorAll('button')].some(b => visible(b) && /^submit application$/i.test(b.innerText.trim()))) return {kind: 'success', signal: 'greenhouse-confirmation', text: main.innerText};
    }
    const challenge = [...document.querySelectorAll('iframe[title]')].find(f => /challenge/i.test(f.title) && visible(f));
    if (challenge&&!ignoreChallenge) return {kind: 'challenge', text: 'The employer requested a CAPTCHA. Human participation is needed.'};
    const errors = [...document.querySelectorAll('[role=alert],.field-error,.input__error,.select__error,.helper-text--error')].filter(visible).map(e => e.innerText.trim()).filter(Boolean);
    if (errors.length) return {kind: 'validation', text: [...new Set(errors)].join(' ')};
    return false;
  }, {platform,expectedDestination,ignoreChallenge}, {timeout});
  const result = await handle.jsonValue(); await handle.dispose(); return result;
}
