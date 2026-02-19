# Stand — Infrastructure Cost Estimates

*From David Shimel (System Architecture) — Feb 2026*

Estimated monthly costs for running the Stand pilot (~100 families).

---

## Breakdown

| Service | What | Cost/month | Notes |
|---------|------|------------|-------|
| **Static Content Storage (S3)** | Images, videos, database backups | ~$10 | Conservative estimate. Can reduce with CloudFront CDN. |
| **Compute (EC2 or Vercel)** | Application hosting | ~$10 | EC2 pricing |
| **Text-to-Speech (ElevenLabs API)** | Voice for Stand Coach | $5–$22 | Depends on feature usage. [Pricing](https://elevenlabs.io/pricing?price.platform=api) |
| **LLM (Claude / Anthropic)** | Stand Coach conversations | ~$25 | $0.25/session × 100 users × 1 session/month |
| **AI Image Generation (Gemini)** | Logo/brand rendering | ~$13.40 | $0.134/image × 100 users × 1 image/month. Could drop to $1-4/month with cheaper model (e.g. ChatGPT at $0.01-$0.04/image) |
| **Data Storage (Supabase)** | Database, auth | Free | Free tier |
| **Code Storage (GitHub)** | Repository | Free | Free tier |

---

## Total

**~$65–$85/month** at 100 users

---

## Notes

- Costs scale roughly linearly with user count
- Biggest variable costs are LLM and image generation (per-session)
- TTS cost depends on how prominently voice features are used
- Image gen has significant cost reduction options ($13/mo → $1-4/mo) by switching models
- David is laying out the full system architecture — these estimates will be incorporated into the proposal
