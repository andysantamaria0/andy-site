# Product Concept: Onboarding UX — The Stand Coach

*Captured Feb 17, 2026 — Andy's core UX thesis for the kid journey*

---

## The Problem

The current prototype treats onboarding like a questionnaire: pick a category, pick a subcategory, pick a product, type a name, pick colors. It feels like filling out a form. For kids, this is death. They disengage, they get overwhelmed, they don't feel ownership over the output because it felt like a multiple-choice test.

## The Concept: Two-Pane Collaborative Interface

### Left Pane — The Conversation
- The kid is talking to a **Stand Coach** — a character/personality that guides them
- It's conversational, not form-based — the coach asks questions, reacts, encourages
- The kid can type OR talk (voice-first for younger kids on iPads)
- The coach adapts to their energy — if the kid is excited, the coach matches it
- Voice input can detect excitement/emotion and amplify the response
- Feels like brainstorming with a creative partner, not answering survey questions

### Right Pane — The Live Build
- Updates dynamically in real time as the kid makes decisions
- Every answer immediately renders into something visual:
  - Kid says "I want to sell bracelets" → bracelet product mockup appears
  - Kid picks pink and gold → the brand palette updates, logo shifts, product mockup recolors
  - Kid names their business → the storefront header updates with the name
  - Kid sets a goal → a goal tracker animates into the dashboard preview
- The right pane IS their business coming to life — storefront, brand, products
- By the end of the journey, the right pane IS the Grand Reveal — it's been building the whole time

## Why This Works

1. **No form fatigue** — Kids never feel like they're answering questions. They're building.
2. **Immediate feedback loop** — Every input has a visible output. Cause and effect. Kids love this.
3. **Ownership** — They watched it being built. Every piece was their decision. It's THEIRS.
4. **The reveal is earned** — Instead of a sudden "here's your brand!" at the end, they've been watching it materialize. The final moment is just the full picture coming together.
5. **Voice-native** — Kids on iPads default to talking. This meets them where they are.
6. **Emotional detection** — If the coach can sense excitement in their voice, it can match energy. "You sound SO fired up about this!" This makes it feel alive, not robotic.

## Technical Considerations

- Voice input: Whisper API for transcription
- Emotion/excitement detection: Could analyze pitch, speed, volume of voice
- Real-time rendering: The right pane needs to update smoothly (animations, transitions)
- LLM-powered coach: Claude for conversational responses adapted to kid's age/energy
- Product mockup generation: Could use templates with dynamic color/text overlays (not AI image gen)
- Mobile: On phone, could be a single pane that alternates, or the "build" is a persistent header/preview

## The Secret Sauce

> "If it feels like filling out a questionnaire we are doomed. If the kids feel like they're collaborating with a Stand Coach, in real time, and there is a two-pane interface where one side is updating dynamically as they move through the journey — that could be really powerful."

The UX of intake — getting information from kids and displaying it back to them BETTER than they imagined — is one of the core differentiators. The gap between what they said and what they see should feel like magic.
