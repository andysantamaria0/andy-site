# Plaud Integration — Project Notes

*Saved Feb 24, 2026 — pick up where we left off*

---

## Goal

Automate the flow from Plaud recording → structured markdown notes filed into the right consulting project folder. Level 3: smart notes with Claude processing.

## Current Workflow (manual)

1. Record meeting with Plaud
2. Press "Generate" in Plaud app to trigger transcription
3. Manually export transcript
4. Manually export audio
5. Upload to Claude Code for processing

## Target Workflow

1. Record meeting with Plaud
2. Name the call (e.g., "stand-lauren-feb24") and press Generate
3. **Everything else is automated:**
   - Pipeline pulls transcript from Plaud API
   - Claude classifies: sales vs. project (from content)
   - Claude generates structured notes (summary, action items, product decisions, open questions)
   - Files to `consulting-projects/[client]/notes/sales/` or `notes/project/`
   - Raw transcript saved to `notes/transcripts/`

## Folder Structure

```
consulting-projects/
  stand/
    notes/
      sales/           ← sales call notes (private, proposal-informing)
      project/         ← project call notes (decisions, action items)
      transcripts/     ← raw transcripts (reference)
  [future-client]/
    notes/
      sales/
      project/
      transcripts/
```

## Smart Notes Output Format

```markdown
# [Client] — Call Notes / [Date]

## Summary
[Claude-generated summary in Andy's consulting framework]

## Action Items
- [ ] Andy: ...
- [ ] Client: ...

## Product Decisions
- [Decisions that affect scope, timeline, direction]

## Open Questions
- [Unresolved items from the call]

## Transcript
[Speaker 1 — Andy] ...
[Speaker 2 — Client] ...
```

## Classification Logic

- **Sales call** → discovery questions, pitching, pricing discussion, opportunity signals
  - Summary focused on: client needs, concerns, opportunity, budget hints
- **Project call** → reviewing builds, product decisions, action items, scope changes
  - Summary focused on: what was decided, what changed, what's next
- **Both** → Claude tags as sales+project, generates both views

## Client Routing

- Parse recording name for client identifier (e.g., "stand-lauren-feb24" → stand)
- Fall back: match against known client folders in `consulting-projects/*/`
- Fall back: Claude infers from transcript content
- Last resort: prompt Andy via notification

## Plaud API Access

### Official Developer Platform (pending)
- Apply at: https://www.plaud.ai/pages/developer-platform
- Yields: `client_id` + `secret_key`
- Auth: POST `/oauth/partner/access-token` with Basic Auth
- Endpoints:
  - `POST /open/partner/ai/transcriptions/` — submit audio for transcription
  - `GET /open/partner/ai/transcriptions/{id}` — check results
- Webhook: `audio_transcribe.completed` fires on SUCCESS/FAILURE
- Regions: US `platform.plaud.ai`, JP `platform-jp.plaud.ai`, EU coming soon

### Browser Token (start immediately)
- Log in to https://web.plaud.ai/
- DevTools → Application → Local Storage → copy `tokenstr`
- Unofficial API endpoints:
  - `GET /file/simple/web` — list recordings
  - `GET /file/detail/{file_id}` — get recording details + transcript
- Base URLs: `api-euc1.plaud.ai` (EU), `api-use1.plaud.ai` (US)

## What to Build

`andy-site/scripts/plaud-sync.js` — the pipeline script

1. Pull new recordings from Plaud API
2. Download transcripts (with speaker diarization)
3. Send to Claude for classification + structured note generation
4. Write markdown files to correct location
5. Optionally auto-commit to repo

## Next Steps

- [ ] Apply for Plaud Developer Platform access
- [ ] Grab browser token from web.plaud.ai to start building
- [ ] Build `plaud-sync.js` script
- [ ] Test with existing Stand call recordings
- [ ] Set up webhook listener (Vercel serverless function) for auto-sync

## References

- Plaud Developer Quickstart: https://docs.plaud.ai/documentation/get_started/quickstart
- Plaud Developer Platform: https://www.plaud.ai/pages/developer-platform
- Community Plaud API client: https://vett.sh/skills/clawhub.ai/leonardsellem/plaud-api
- Plaud Exporter (Chrome): https://github.com/josephhyatt/plaud-exporter
- Zapier integration: https://zapier.com/apps/plaud/integrations
