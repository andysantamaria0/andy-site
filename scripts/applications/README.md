# Hosted Application Desk

Private workspace: `/applications`. The page, state API, and CV endpoint require a signed, HttpOnly password session. Mutation routes require the configured Origin. The worker uses a separate bearer credential. All responses disable caching and indexing. No private candidate data or PDF belongs in this repository.

## Deployment

Apply `supabase/migrations/035_application_desk.sql`. Seed the `owner` row in `application_desk` privately with profile, resume metadata, preferences, jobs, events, and paused state. Upload the original CV to the private `application-desk-private` bucket and verify its SHA-256. The service role is the only database/storage access used by these routes; anonymous access must remain denied.

Server configuration:

- Existing `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
- `APPLICATION_DESK_PASSWORD_HASH`: `passwordHash()` from `lib/applications/core.mjs`
- `APPLICATION_DESK_SESSION_KEY`: independently generated random secret, at least 32 characters
- `APPLICATION_DESK_WORKER_KEY`: a separate random secret, at least 32 characters
- `APPLICATION_DESK_ORIGIN`: `https://andysantamaria.com`

Rotate the session key to invalidate all browser sessions. Rotate the worker key on the server and Mac together. Never put secrets in `NEXT_PUBLIC_` variables (the existing public Supabase URL is not a secret).

## Submission worker

`scripts/applications/worker.cjs` runs on a signed-in Mac with Node, Google Chrome and Playwright 1.58.2. `APPLICATION_WORKER_CONFIG` points to a mode-0600 JSON file containing `origin`, `token` (worker key), and `receiptsDir`. Install its runtime outside the public site, in a mode-0700 directory. A launchd job invokes it every 60 seconds. The Mac must be awake, connected and signed in; the website/database remain hosted independently.

Siro Senior Product Manager and The Browser Company Model Behavior/Product applications are supported. The Browser Company form uses New York City location selection. Other opportunities remain preparation records and cannot be approved for automatic execution. The worker inspects the public form, fingerprints its fields, then accepts only a fresh, immutable, user-approved packet. It checks the original PDF hash and field values, records an attempt before clicking Submit, and records employer confirmation afterward. CAS database writes prevent competing claims. Edits invalidate queued approvals; approvals expire after 24 hours. A changed form, CAPTCHA, interrupted attempt or ambiguous receipt stops execution. An uncertain submission is never retried automatically; inspect the employer receipt before manually reconciling it.

No automatic tailoring, optional demographic answers, outreach, follow-ups, or mailbox monitoring are included. Employer replies go to the email the user approved in the application.

## Daily research

`research.py` uses the existing authenticated Codex CLI for read-only public web research after 08:40 America/New_York. A separate launchd job checks every 15 minutes, with a daily lock and at most one delayed retry. Configuration also provides the absolute `codex` binary path. Create a `research-workspace` directory beside the script, and copy `research.schema.json` there alongside the script. The research subprocess receives preferences and tracked job metadata, never the worker credential or CV. Results are draft opportunities; they cannot authorize submissions. Zero matching jobs is valid. Preserve private logs/state for troubleshooting.

The installed replacement disables the old `com.andysantamaria.job-digest` launchd job without deleting its history. Search adds at most five opportunities per run and keeps at most 200 records; archiving is a future addition.

## Validation

- `node --test tests/applications/core.test.mjs`
- `node tests/applications/siro-adapter.cjs` (all office/visa combinations and the approval-to-confirmation sequence against a local form; zero employer requests)
- `node tests/applications/adapter.cjs` (Chrome fixture; no employer request or submission)
- `node tests/applications/browser.cjs` against a running workspace. `DESK_TEST_URL` selects the host; `DESK_TEST_CONFIG` is a private JSON file with `password`. The test requires the original PDF at the owner's Downloads path, checks anonymous rejection, CSRF, original file bytes, incomplete-approval rejection, persistence and logout. It saves the same profile once; run before real approvals exist.
- `npm run build` (use `-- --webpack` only if an isolated local worktree symlinks node_modules outside its root)

Production verification must check the exact custom domain, authenticated state and CV bytes, worker heartbeat and fresh form inspection. A real employer submission is tested only after the user completes and approves its exact packet.

### Siro preparation

Siro’s inspected form requests name, email, LinkedIn, the unchanged original CV, NYC Tuesday–Thursday office commitment, and one of three visa-sponsorship choices. Its optional introduction remains a private preparation draft and is excluded from the application packet. Answers are never inferred from the shared profile’s yes/no visa field. After all answers are saved and the Mac worker has freshly inspected the form, review can approve one exact Siro application. The worker rechecks the form, approval, expiry and unchanged CV before filling and submitting. The UI refreshes queued/submitting status every ten seconds.

Run `node --test tests/applications/core.test.mjs` for packet and approval checks. `node tests/applications/siro.cjs` starts a local production server after `npm run build`; pass a site URL to check a deployed desk. It reads the existing local access file (`DESK_ACCESS_FILE` can override the path), verifies authentication and the original CV, and intercepts its save interaction so no candidate answers are changed.

When changing submission support, deploy the matching site and copy the reviewed `worker.cjs` to the installed Mac runtime. Confirm its heartbeat version and fresh form fingerprint on the custom domain. Keep existing credentials and research schedules unchanged.

### Employer confirmation and diagnostics

Ashby’s default confirmation is “Your application was successfully submitted,” and employers can customize that text. Use its dedicated success/failure/blocked outcome containers instead of guessing a sentence. On success and on a failed confirmation check, save the page text and screenshot under the private receipts directory with mode-0600 files. A missing confirmation after Submit remains uncertain and is never retried automatically. Fixing the detector does not retroactively prove that an earlier application was received.
