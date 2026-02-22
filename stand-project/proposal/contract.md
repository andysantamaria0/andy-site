# Independent Contractor Agreement

**Effective Date:** _______________

**Between:**

**Andy Santamaria** ("Contractor")
Email: _______________

**and**

**Lauren Kassan**, on behalf of **[Company Name / Entity]** ("Client")
Email: _______________

---

## 1. Scope of Work

Contractor will perform a 2-week product design and engineering sprint for the Stand application ("the Project"), delivering the following:

1. **Stand Coach Onboarding Experience** — A conversational, two-pane interface with 6 guided moments, supporting both product and service business types across 6 categories (Sports, Toys & Games, Fashion & Style, Cats & Dogs, Beauty & Design, Cooking + Other). Categories may be adjusted by Client during the sprint.
2. **Grand Reveal + Live Storefront** — Animated reveal moment, a hosted storefront page per kid (standkids.com/[business-name]), and a shareable brand card (image/link). Storefronts display products and branding but do not include payment processing or order fulfillment.
3. **Parent Gate + Pilot Survey** — COPPA-lite consent flow with embedded research questions (value prop, pricing, concerns)
4. **Printify Product Integration (Visual Only)** — Product mockup rendering via the Printify API showing the kid's branding on real products, with wholesale pricing and margin display. This is for visual display and education only — not order processing, payment collection, or fulfillment. Actual Printify order fulfillment is explicitly excluded (see Section 2).
5. **AI-Generated Logo/Icon** — First-version logo/icon generation for each kid's business during onboarding. This is an initial implementation; quality and style refinement are expected in future sprints.
6. **Pilot Admin Dashboard** — Real-time funnel data, category breakdown, survey responses, and CSV export
7. **Design System** — Built on the existing Stand brand (logo, palette, fonts), with typography, color, components, and animation patterns
8. **Analytics Instrumentation** — Event tracking and funnel analytics via PostHog. Session replays are configurable directly in PostHog by Client.
9. **Supabase Backend** — Auth, database, and storage (architecture by Contractor's subcontractor, David Shimel)
10. **Production Deployment** — Deployed on Vercel. The web app will be saveable as a home screen bookmark on iOS devices.
11. **Documentation** — What was built, how it works, how to iterate

These deliverables are described in further detail in the Sprint Proposal dated February 2026, which is incorporated by reference.

## 2. Exclusions

The following are explicitly **not included** in this engagement:

- **Printify order fulfillment and payment processing** — Printify integration in Section 1 is limited to visual mockup rendering and margin display. Actual order processing, shipping, inventory management, and payment collection (via Stripe, Step, Greenlight, or any other provider) are excluded.
- **Custom domains** — Kid storefronts are hosted at standkids.com/[name]. Custom domain mapping (e.g., quincyscharms.com) is excluded.
- **CEO Dashboard** — The kid's post-onboarding home base (goal tracking, earnings, leveling, sales data) is excluded from this sprint. Kids land on their storefront as their home base.
- **Curriculum / learning modules** — Structured business education content (marketing lessons, pricing strategy, customer feedback modules) is excluded. Business education in this sprint is embedded in the experience (real margins, real pricing).
- **Social features** (leaderboards, friend invites, Stand Squad)
- **Voice input** (stretch goal only — not guaranteed)
- **Ongoing maintenance, hosting management, or support after delivery**
- Any work not described in Section 1

Any work beyond the scope defined above requires a written Change Order (see Section 7).

## 3. Compensation

**Total fee: $10,000 USD**

This is a fixed-price engagement. Payment schedule:

| Milestone | Amount | Due |
|-----------|--------|-----|
| Upon signing | $5,000 | Before work begins |
| Upon delivery of final deliverables | $5,000 | Net 5 business days from delivery |

**Work will not begin until the first payment is received.** Payments are non-refundable once the corresponding work has been performed.

The Contractor engages David Shimel as a subcontractor for system architecture. Client's sole payment obligation is to Contractor; Contractor is solely responsible for compensating any subcontractors.

## 4. Timeline

The sprint is planned for **14 calendar days** beginning on a mutually agreed start date.

Client delays — including but not limited to delayed feedback, unavailability for required decisions, or failure to provide required assets (GitHub repo access, Printify API documentation, business categories documentation) — will extend the timeline day-for-day at no additional cost to Client, but will not be deemed a breach by Contractor.

Contractor will provide daily progress updates and share working builds throughout the sprint.

## 5. Intellectual Property

Upon receipt of **full payment**, Contractor assigns to Client all right, title, and interest in the deliverables created under this agreement, including all code, designs, and documentation produced specifically for the Project.

**Prior to full payment, all intellectual property remains the property of Contractor.**

Contractor retains the right to **display the Project in Contractor's portfolio** and reference the engagement in marketing materials, unless Client provides written objection within 30 days of project completion.

Client retains all rights to their pre-existing brand assets, logos, content, and business data provided to Contractor during the engagement.

## 6. Client Responsibilities

Client agrees to provide:

- **Before Day 1:** GitHub repo access (existing codebase), Printify API access (account + API token), business categories documentation (working draft from Lauren and Alex/Petra)
- **During the sprint:** Daily 30-minute standing check-in (text/call), MWF 1-hour product review sessions, timely product decisions when flagged, and 2-3 test families by end of Week 1
- **Timely feedback:** Contractor will flag decisions as they arise. Client will respond within 1 business day. Delays in response extend the timeline per Section 4.

## 7. Change Orders

Any request for work outside the scope defined in Section 1 will require a written Change Order agreed to by both parties. Change Orders may adjust the project fee, timeline, or both. Contractor is not obligated to perform out-of-scope work absent a signed Change Order.

Verbal requests, Slack messages, or emails requesting additional features do not constitute a Change Order unless followed by a written and signed agreement.

## 8. Cancellation

Either party may terminate this agreement with written notice.

**If Client cancels:**

- Before work begins: Full refund of any payments made, less any documented expenses.
- After work begins: Client pays for all work completed through the date of cancellation. The initial $5,000 payment is non-refundable once work has begun. If more than 50% of deliverables are complete at time of cancellation, the full $10,000 is due.
- Upon cancellation by Client, Contractor will deliver all work completed to date within 5 business days of receiving all amounts owed.

**If Contractor cancels:**

- Contractor will deliver all work completed to date and refund any payments for undelivered work.

## 9. Warranty

Contractor warrants that deliverables will function substantially as described in Section 1 at the time of delivery.

Contractor will fix bugs and defects reported within **7 days of delivery** at no additional charge, provided they relate to functionality described in Section 1. Bug reports must be submitted via email to Contractor's address listed above and must include a description of the issue, steps to reproduce, and any relevant screenshots or screen recordings. Contractor will acknowledge receipt within 1 business day and deliver a fix within 48 hours of acknowledgment. This warranty does not cover:

- Issues caused by Client modifications after delivery
- Third-party service outages (Vercel, Supabase, PostHog, Anthropic, Printify, etc.)
- Browser or device compatibility beyond modern versions of Chrome, Safari, and Firefox on iOS, iPadOS, and desktop
- New feature requests

After the 7-day warranty period, any additional work will be scoped and quoted separately. An optional Maintenance & Support Agreement is available as a separate addendum for ongoing bug fixes, minor updates, and priority support.

## 10. Limitation of Liability

**Contractor's total liability under this agreement shall not exceed the total fees paid by Client.**

Contractor is not liable for:

- Business outcomes, revenue, user acquisition, or pilot results
- Third-party service failures, outages, or pricing changes
- Data loss caused by third-party services (Supabase, Vercel, etc.)
- Indirect, incidental, or consequential damages

The deliverables are software and design — not a guarantee of business results.

## 11. Independent Contractor

Contractor is an independent contractor, not an employee of Client. Contractor controls the manner and means of performing the work. Contractor is responsible for their own taxes, insurance, and benefits. This agreement does not create a partnership, joint venture, or agency relationship.

## 12. Confidentiality

Contractor will not disclose Client's proprietary business information, user data, financial details, or unreleased product plans to third parties. This obligation survives termination of this agreement.

This does not restrict Contractor from:

- Sharing the existence of the engagement
- Displaying delivered work in Contractor's portfolio (per Section 5)
- Using general knowledge and skills gained during the engagement

## 13. Dispute Resolution

Any dispute arising from this agreement will first be addressed through good-faith negotiation between the parties. If unresolved within 30 days, disputes will be resolved through binding arbitration in the Contractor's jurisdiction, under the rules of the American Arbitration Association. The prevailing party is entitled to recover reasonable attorney's fees.

## 14. Miscellaneous

- This agreement constitutes the entire agreement between the parties and supersedes all prior discussions.
- Amendments must be in writing and signed by both parties.
- This agreement is governed by the laws of the State of _____________.
- If any provision is found unenforceable, the remaining provisions remain in effect.
- Notices may be delivered by email to the addresses listed above.

---

## Signatures

**Contractor — Andy Santamaria**

Signature: ___________________________

Date: _______________

&nbsp;

**Client — Lauren Kassan, on behalf of [Company Name / Entity]**

Signature: ___________________________

Date: _______________
