# Application Desk

The private `/applications` workspace connects role research, inspected employer questions, reusable candidate facts, approval, browser execution and employer confirmation. It supports the inspected controls on hosted Ashby and Greenhouse forms without adding code for each employer. Other platforms, unavailable postings, additional required documents and unsupported controls are identified before approval.

## Candidate experience

Paste an Ashby or Greenhouse role link, or select a researched opportunity. The Mac worker inspects the actual questions, choices and requiredness. Saved contact information and exact prior answers are reused. Drafts use the unchanged original CV and candidate notes; their evidence is visible privately. Unknown facts, employer commitments and consents remain unanswered. The review contains only actual destination fields and the original PDF. “Save & review” saves the visible answers atomically so an unsaved profile or draft cannot produce a misleading review.

Before final review, the worker rehearses the completed answers on the actual form with candidate network writes blocked, without uploading the CV or clicking Submit. Newly revealed questions return to the desk for answers. This check is tied to the exact packet and expires after 30 minutes.

The final approval authorizes one immutable packet for 24 hours. Contact edits invalidate queued approvals. The worker must be on the current engine and recently connected before approval is available. Approvals, changed forms, CV hashes, pause state and attempt ownership are checked again before Submit.

## Execution and recovery

`worker-v2.mjs` uses the same schema and packet contract as the website. Inspection waits for hydrated controls, reads Greenhouse’s public question list, and compares actual menus. Location is resolved before inspecting location-dependent questions. No CV is uploaded during inspection. Execution checks exact fields, upload completion and newly revealed questions before submitting.

An approved application opens a dedicated Chrome window on the signed-in Mac. A CAPTCHA after Submit prompts the user in the desk and keeps that window available for up to ten minutes. The worker never solves a CAPTCHA or clicks Submit a second time. A stopped or ambiguous attempt remains locked; closing a browser or losing a receipt does not authorize a retry.

Before Submit, a private checkpoint is stored. Afterward, page text, a screenshot and a Playwright trace are retained locally; available evidence is also stored in the existing private Supabase bucket. Ashby uses its actual outcome containers. Greenhouse must reach that job’s exact confirmation route. Error messages and missing confirmation never count as success.

The local `outbox` persists an outcome before remote recording or browser closure. A lost connection retries **receipt recording only**, idempotently for the same attempt. Large supplemental traces remain local if they exceed the hosting upload limit; the small evidence record is mandatory. On restart, an interrupted attempt before submission becomes blocked; an interrupted attempt after submission began becomes uncertain. The historical Siro attempt remains uncertain because its old worker did not retain evidence. No background email receipt monitoring exists.

## Runtime and deployment

Existing server secrets: `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `APPLICATION_DESK_PASSWORD_HASH`, `APPLICATION_DESK_SESSION_KEY`, `APPLICATION_DESK_WORKER_KEY`, `APPLICATION_DESK_ORIGIN`. Do not replace sensitive Vercel secrets with empty values from a local environment pull.

The existing launchd worker checks every minute and the research runner every fifteen minutes (research runs daily after 08:40 Eastern). The Mac must be awake, connected and signed in. Website/database hosting is independent. Both preparation and research read the same saved candidate record. Codex creates drafts only; deterministic code owns submission.

1. Fetch and include current `origin/main`; preserve unrelated local work.
2. Run the checks below and commit the tested source.
3. Deploy the matching website to the existing Vercel project; verify the custom domain.
4. Run `migrate-v2.mjs --apply --cv <original PDF>` once. It checks the existing PDF checksum, backs up state privately, preserves job statuses and connects the CV text. It refuses active applications.
5. Run `install-runtime.py`. It installs an immutable release with the tested Playwright 1.64.1, switches an atomic `current` symlink, and preserves credentials and schedules. Previous worker files are backed up. The existing launchd entry continues to call `worker.cjs`.
6. Check the current engine heartbeat and completed form preparation. Never run a real employer submission as a deployment smoke test.

Production credentials, CV text, candidate state, traces and receipts must never be committed. `APPLICATION_DESK_OWNER_ID` and `APPLICATION_DESK_WORKER_ID` are only needed to isolate integration-test database records; leave them unset in production.

## Verification

- `node --test tests/applications/core.test.mjs tests/applications/knit.test.mjs tests/applications/workflow.test.mjs`: authentication, packets, exact field mapping, candidate reuse, evidence constraints, approval/claim/recovery rules.
- `node tests/applications/engine-browser.mjs`: actual shared inspector/filler/executor against captured form contracts with **all employer requests intercepted**. Covers Ashby and Greenhouse, custom success copy, file-input removal during upload, phone formatting, country selection, location controls without IDs, conditional questions, upload failure, changed forms, expired approval, CV mismatch, missing confirmation, validation rejection, CAPTCHA/human completion, checkpoint failure and idempotent outbox recovery.
- `node tests/applications/desk-v2.cjs`: built Next.js site, real private storage/API and browser UI using isolated test rows and a synthetic CV. Verifies the pre-approval form-check gate, save-and-review, single concurrent claim, confirmation/evidence and mobile layout. Deletes only its own test records. Checks the production owner was untouched.
- `node tests/applications/desk-v2.cjs --live`: authenticated production UI inspection; no answer edits or approvals.
- `node tests/applications/live-controls.mjs <URLs>`: optional live widget rehearsal with synthetic values; allows initial public form loading, then blocks all candidate network writes; never attaches a file, never clicks Submit.
- `node scripts/applications/worker-v2.mjs --inspect <URL> <private output.json> [location]`: public inspection only.
- `npm run build -- --webpack`: production site build.

GitHub Actions runs the unit and isolated browser regression checks. These tests establish the tested behavior; they do not establish that any unconfirmed real application was received. Employer changes, outages and human checks remain explicit outcomes, never silent successes.
