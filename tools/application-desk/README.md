# Application Desk local pilot

A local opportunity-review workspace with source evidence, application checklists, editable drafts, review invalidation, user-reported outcomes, follow-up reminders and exports.

This is preparation software. It does **not** submit applications, send email, monitor replies or run a daily search. “Save reviewed draft” is a local review record, not submission authorization.

## Run

From this directory, run `npm start` and open http://127.0.0.1:3231. The server uses Node built-ins and binds only to loopback. Set `PORT` to select another local port.

Copy `config.example.js` to `config.local.js` for personal preferences. Copy `opportunities.example.js` to `opportunities.local.js` for candidate-specific research and drafts. Both local files are ignored by Git. The server serves these in place of their examples when present. Never place CVs, personal answers, credentials or exports in tracked files.

The included employer records are dated research examples. Inspect the current official application before relying on them. They contain no candidate-specific drafts. Browser notes persist in localStorage for the current browser and origin; export them before clearing storage or changing ports.

This utility is excluded from portfolio deployment. A hosted version needs real authentication, durable private storage, an approval-bound execution queue and separately authorized integrations.

## Verify

Run `npm install`, start the local server, then `npm test`. Tests use an installed Google Chrome through Playwright. Set `DESK_URL` when testing a different port. Tests use an isolated browser context and do not modify your normal browser notes.

Checks cover persistence, review invalidation, role isolation, self-reported status confirmation, follow-up suppression, export, keyboard dialogs, mobile overflow and absence of external requests during local interactions.

## Before enabling submission

Generate and preview the exact documents and answers; obtain approval for the specific package; check that it remains unchanged and the role remains open; submit only once; retain a verifiable receipt. Unknown outcomes require reconciliation rather than automatic resubmission. A local draft review must never be silently promoted to submission authorization.
