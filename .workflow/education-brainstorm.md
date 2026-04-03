<!-- Status: ACTIVE | Last Updated: 2026-03-21 -->
# Education Page — Brainstorm & Feature Vision
**Session Date:** March 21, 2026
**Status:** Brainstorming / Pre-Sprint Planning
**Roles:** CTO · PM · Veteran Help Expert

---

## Core Philosophy
Veterans should never have to open 8 tabs to answer one question.
The Education page is a **mission ops center** — not a link directory.
Every tool here should connect to at least one other part of the platform (Smart Bridge).

---

## 🔧 Quick Fixes (Carry Over)

### 1. Mission Briefing Cards — Make Expandable
**Problem:** Cards on education hub are static/not clickable. Health page cards expand inline.
**Fix:** Each Mission Briefing card expands on click to reveal step-by-step checklist, estimated time, and a CTA button linking to the relevant subpage or external VA resource.
**UX:** Accordion-style expand with a smooth slide-down animation (same pattern as Health). Chevron rotates 180° on open. Card border highlights in accent gold when expanded.

---

## 📐 Subpage Architecture

```
/education                    ← Hub (lean, card-based, like Health hub)
  /education/gi-bill          ← GI Bill Pathfinder (existing, needs BAH overhaul)
  /education/school-finder    ← 4-year colleges/universities (existing, needs overhaul)
  /education/trade-schools    ← NEW: Vocational, apprenticeships, technical programs
  /education/certifications   ← NEW: Industry certs (CompTIA, AWS, PMP, OSHA, etc.)
  /education/advisor          ← AI Education Advisor (existing)
  /education/edu-recon        ← NEW: DD-214/VA Letter AI upload tool
```

---

## 💰 Feature 1 — BAH Accuracy Overhaul (GI Bill Pathfinder)

### The Problem
BAH is not state-level — it is **MHA (Military Housing Area)** level, defined by DoD
as geographic zip code clusters. Carlisle PA ≠ Philadelphia PA. NYC boroughs ≠ upstate NY.
A wrong BAH estimate = $500–900/month financial surprise for the veteran.

### Remote & Part-Time Rules (Critical Missing Logic)
- **Fully online:** BAH = 50% of national average rate regardless of location
- **Part-time:** BAH scales proportionally to credit load
- **Half-time or less:** No BAH awarded at all
- These rules are among the most misunderstood GI Bill facts

### Data Source
- DoD publishes annual BAH rate tables by MHA/zip code (free, downloadable)
- Store in MongoDB, query by zip code input
- Update annually (DoD releases in December for following year)

### UX/UI Vision
- Input: Zip code field (not state dropdown) + pay grade selector (E-1 through O-10 + W grades)
- Toggle: "Will you attend in-person, hybrid, or fully online?"
- If hybrid: slider for "% of credits online this semester"
- Output card: Your MHA, your BAH rate, adjusted rate if remote/part-time
- Side note callout: "Choosing a school 30 miles away in a different MHA could change your BAH by $X/month"
- Smart Bridge: BAH calculation feeds directly into School Finder comparison table

---

## 🏫 Feature 2 — School Finder Overhaul

### Three Use Cases (Design for All)
1. **Discovery** — "I don't know where to start, show me options"
2. **Validation** — "I'm thinking about Penn State, is it good for vets?"
3. **Comparison** — "Help me choose between these 2-3 schools"

### Data Sources
- **VA WEAMS** — official list of VA-approved schools (if not listed = GI Bill can't be used there)
- **College Scorecard API** (Dept. of Education) — free, has veteran enrollment %, earnings data, graduation rates
- **Yellow Ribbon Program** database — DoE publishes annually
- **Community ratings** — vet-sourced scores (see Veteran Friendliness below)

### New School Card Fields
| Field | Source |
|---|---|
| % Veterans enrolled | College Scorecard |
| Yellow Ribbon eligible | DoE / WEAMS |
| Dedicated vet center on campus | Community sourced / manual |
| GI Bill approved | WEAMS |
| CLEP credits accepted | College Scorecard / manual |
| Veteran graduation rate | College Scorecard |
| Veteran friendliness score | Hybrid (see Feature 6) |
| Median post-grad salary for vets | College Scorecard |

### UX/UI Vision
- **Search bar** front and center with filters: state, degree type, online/in-person, Yellow Ribbon Y/N, VA approved Y/N
- **List view** (default) — expandable cards with all above fields
- **Map view** toggle — pins on US map, clustered by state
- **Compare tray** — floating bottom bar that accumulates selected schools (max 3); click "Compare" opens full side-by-side modal
- **Validation mode** — if a user types a school name directly, jump straight to that school's detail page
- Smart Bridge: "Analyze cost at this school with your GI Bill" → passes school data to /education/gi-bill

---

## 🔨 Feature 3 — Trade Schools Subpage (`/education/trade-schools`)

### Why Separate
Completely different decision framework from 4-year colleges:
- Program length (weeks/months, not years)
- Licensing/certification outcomes (state-specific)
- Employer pipeline partnerships
- Apprenticeship vs. classroom
- GI Bill OJT (On-the-Job Training) benefit — different from standard chapter 33

### Content Structure
- Intro explainer: "How GI Bill works for trade schools (it's different)"
- OJT benefit calculator: monthly stipend + tool allowance vs. standard BAH
- Trade school finder: filterable by trade (HVAC, electrician, plumbing, culinary, welding, etc.), state, VA-approved
- Apprenticeship locator: links to DOL apprenticeship finder + Helmets to Hardhats
- Success story callouts: "Veterans who went this route"

### UX/UI
- Dark industrial card aesthetic — slightly different from the academic blue/gold of school finder
- Trade category icons (wrench, hard hat, circuit board, chef hat, etc.) as filter chips
- Program length prominently displayed on each card (not buried)

---

## 📜 Feature 4 — Certifications Subpage (`/education/certifications`)

### Why Separate
- No enrollment, no campus, no BAH implications (usually)
- Fastest ROI path for many veterans (3-6 months vs. 4 years)
- GI Bill covers testing fees for many certs via the Licensing & Certification (L&C) benefit
- VRRAP (Veteran Rapid Retraining Assistance Program) also covers some certs

### Content Structure
- Category filters: IT/Cybersecurity, Project Management, Healthcare, Trades/Safety, Finance, Legal
- Each cert card shows: exam cost, GI Bill L&C coverage (Y/N), estimated study time, employer recognition rating, avg salary bump
- Popular vet-to-cert pipelines highlighted (e.g., MOS 25B → CompTIA Security+ → SOC Analyst)
- DSST/CLEP connection: "Already have knowledge from service? Test out first, then certify"
- Smart Bridge: cert card → Careers page ("Veterans with this cert found jobs in X")

### UX/UI
- Badge/patch visual design (military aesthetic for credentials)
- Filter chips by category + by GI Bill covered / VRRAP eligible
- "Vet Path" badges on certs that align well to common MOS codes
- Estimated time to cert prominently displayed (weeks not years)

---

## 📄 Feature 5 — Edu Recon (`/education/edu-recon`)

### Concept
AI-powered document upload tool for education planning — same architecture as Records Recon on the Health page. Veterans upload DD-214 and/or VA Benefit Summary Letters to get personalized education benefit analysis.

### What It Extracts
**From DD-214:**
- Total active duty service time → GI Bill entitlement % calculation
- Character of discharge → eligibility determination
- MOS/Rate/AFSC → maps to civilian career fields + relevant education paths
- Education level at separation → identifies gaps and opportunities

**From VA Letters:**
- Disability rating → Chapter 31 / VR&E eligibility check
- Current benefits → identify what stacks and what doesn't

### PII/PHI Handling (CRITICAL)
- **SSN redaction is mandatory and client-side:** regex strips SSN pattern (XXX-XX-XXXX and XXXXXXXXX formats) from text extraction BEFORE any data is sent to Grok API
- No raw document is ever transmitted — only extracted/redacted text
- No document storage — ephemeral processing only (same as Records Recon)
- Consent gate: user must check acknowledgment before upload begins
- Disclaimer: "Vet1Stop is not a VA representative. This analysis does not constitute official VA benefit determination."
- Grok API (xAI Enterprise): does not train on API inputs — confirm DPA before launch
- **Action Item:** Update Records Recon on Health page with same SSN redaction pattern for consistency

### Output ("Edu Intel Brief")
- GI Bill entitlement % and estimated months remaining
- Chapter 31 / VR&E eligibility flag (if disability rating detected)
- Recommended education paths based on MOS
- Suggested schools from School Finder that match extracted profile
- State benefits that apply based on home of record
- Smart Bridge: "Send this brief to GI Bill Pathfinder" → pre-fills calculator with entitlement data

### UX/UI
- Same panel aesthetic as Records Recon — dark card, upload zone, progress states
- Two upload slots: "DD-214" and "VA Letter" (both optional, more = better analysis)
- Redaction confirmation visual: "SSN detected and redacted ✓" shown before processing begins
- Output as collapsible sections (not one wall of text)
- Export as PDF option (same as Records Recon Briefing Pack)

---

## 📊 Feature 6 — GI Bill Entitlement Tracker

### Problem
Veterans frequently don't know how much GI Bill entitlement they have left, especially if they've used partial benefits, transferred between schools, or stopped and restarted.

### Inputs
- Total active duty service time (or upload DD-214 via Edu Recon)
- Service type (active duty Chapter 33 vs. reserve Chapter 30/1606)
- Prior GI Bill usage (months used, schools attended)

### Outputs
- Entitlement % (60% / 80% / 100%)
- Months remaining (visual progress bar)
- Projected end date at current school + credit load
- "What this buys you" breakdown: semesters of full-time enrollment, approximate total BAH value remaining, tuition coverage estimate
- Warning flag if entitlement is within 6 months of exhaustion

### UX/UI
- Gauge/meter visualization — not just a number
- Color coding: green (>18 months), amber (6-18 months), red (<6 months)
- Comparison row: "At School A (Philadelphia) your remaining entitlement = $XX,XXX in BAH. At School B (online) = $XX,XXX"
- Persistent mini-tracker widget that appears across education subpages once filled out (sessionStorage)

---

## 👨‍👩‍👧 Feature 7 — Transfer of Benefits (TEB) Checker

### Problem
Veterans can transfer unused GI Bill to a spouse or dependent child — but the transfer request must be made **before separation** (with limited exceptions). Many veterans don't know this or miss the window.

### Tool
- Quick eligibility quiz: service length, separation date, current dependent status
- If eligible and still serving: direct link to milConnect + step-by-step instructions
- If window already passed: show alternative options (state benefits, scholarships for dependents of veterans)
- Explainer: "If you transferred benefits, here's how your dependent uses them"

### UX/UI
- Conversational wizard (3-4 questions, not a form)
- Green/red eligibility result with clear next steps
- "I already transferred — help my dependent use them" secondary flow

---

## ♿ Feature 8 — Chapter 31 / VR&E Pathway Identifier

### Problem
Vocational Rehab & Employment (Chapter 31) is a completely separate, often superior benefit for veterans with service-connected disabilities. Many don't know it exists or that it can cover graduate and professional school (law school, medical school, etc.).

### Real Example
A veteran can exhaust their Chapter 33 GI Bill on an undergrad degree, then use Chapter 31 for law school or an MBA if they have a qualifying disability rating — which is exactly the kind of path this feature should surface.

### Tool
- Eligibility checker: disability rating % + employment handicap assessment
- Comparison table: Chapter 33 vs. Chapter 31 side-by-side (what each covers, limits, monthly rates)
- For those eligible for both: strategic sequencing guide ("Use Ch. 33 for undergrad, preserve Ch. 31 for grad school")
- Direct link to VA VR&E application

### UX/UI
- Decision tree format — not a wall of text
- "You may qualify" callout card prominently placed on Education hub for any vet who hasn't seen this tool
- Subtle cross-link from School Finder: "Attending grad school? Check Chapter 31 eligibility"

---

## 🧪 Feature 9 — CLEP/DSST Credit Evaluator

### Problem
Veterans can test out of college courses for ~$90-100/exam. Each passed test saves entitlement months. Most vets don't know this or which of their military training maps to testable knowledge.

### Tool
- MOS/rate/AFSC input → maps to likely CLEP/DSST subjects (e.g., military leadership → Intro to Business Management)
- School selector: "Does [school] accept CLEP credits?" (sourced from College Scorecard)
- Calculator: "Passing X CLEP exams saves you Y months of GI Bill = approximately $Z in BAH"
- Resource links to official CLEP/DSST prep materials

### UX/UI
- Input: MOS code + target school
- Output: recommended exams, potential credit savings, dollar value of savings
- Badge visual for each recommended exam (study time estimate)

---

## 🗺️ Feature 10 — State Benefits Stacker

### Problem
Every US state has its own veteran education benefit — some are full tuition waivers, some are grants, some are living stipends. These stack on top of federal GI Bill but are massively underutilized.

### Tool
- State selector → shows all applicable state education benefits
- Stacking calculator: GI Bill BAH + tuition coverage + state benefit = total monthly/annual value
- Links to state application portals
- Notable highlights: Texas (Hazelwood Act covers 150 credit hours), Illinois, California, Florida all have strong state programs

### UX/UI
- US map as the entry point — click or search your state
- Benefits shown as stackable cards with dollar values
- "Your total potential education value" summary card combining all sources

---

## 🏅 Feature 11 — Scholarship Finder

### Problem
Dozens of military/veteran-specific scholarships exist and can be used alongside GI Bill. Most veterans are unaware of them or don't know how to find them efficiently.

### Tool
- Filterable database: by branch, disability status, academic focus, degree level, school type
- "Stacks with GI Bill" clearly labeled on each scholarship
- Application deadline tracking (highlight expiring soon)
- Key scholarships: Pat Tillman, AMVETS, Fisher House, VFW, DAV, Student Veterans of America

### UX/UI
- Card grid with scholarship logos/seals
- Filter bar: Branch, Degree Level, Field of Study, Disability Required Y/N, Deadline
- "Apply" CTA on each card (external link)
- Bookmark/save feature (when auth is added)

---

## 🌉 Feature 12 — Smart Bridge: Education → Careers

### Concept
Connect school/cert choices to real career outcomes — closing the loop between education decisions and employment reality.

### How It Works
- On any school or cert card: "See where veterans with this degree/cert end up" → opens Careers page filtered by that credential
- On Careers page: "What education do veterans in this role have?" → links back to School Finder with relevant filters
- Data source: College Scorecard earnings data + O*NET military crosswalk

### Bridge Points
| From | To | Payload |
|---|---|---|
| School Finder card | Careers page | School name + degree type |
| Cert card | Careers page | Certification name |
| Edu Recon brief | GI Bill Pathfinder | Entitlement %, school data |
| GI Bill Pathfinder | School Finder | BAH rate, entitlement remaining |
| School Finder | GI Bill Pathfinder | Tuition, location, Yellow Ribbon |
| Edu Recon brief | Chapter 31 checker | Disability rating detected |

---

## 🔒 PII/PHI Compliance Notes

| Item | Decision |
|---|---|
| SSN in DD-214 | Client-side regex redaction before any API call |
| Document storage | None — ephemeral processing only |
| Grok API data retention | Confirm xAI Enterprise DPA before launch |
| FERPA applicability | Research before Edu Recon launch |
| State privacy laws (CA, VA) | Add to legal review checklist |
| User consent | Checkbox gate required before any upload |
| Disclaimer language | "Not a VSO. Not official VA benefit determination." |
| Records Recon (Health) | **Action: apply same SSN redaction pattern retroactively** |

---

## 📋 Build Priority Order (Proposed)

| Priority | Feature | Complexity | Impact |
|---|---|---|---|
| P0 | Mission briefing cards — expandable | Low | Medium |
| P0 | BAH zip-code accuracy in GI Bill Pathfinder | Medium | High |
| P0 | Remote/part-time BAH logic in Pathfinder | Low | High |
| P1 | School Finder overhaul (all 3 use cases) | High | High |
| P1 | GI Bill Entitlement Tracker | Medium | High |
| P1 | Chapter 31 / VR&E Pathway Identifier | Medium | High |
| P1 | Edu Recon (DD-214 upload + AI analysis) | High | High |
| P2 | Trade Schools subpage | Medium | High |
| P2 | Certifications subpage | Medium | High |
| P2 | State Benefits Stacker | Medium | Medium |
| P2 | TEB Checker | Low | Medium |
| P2 | CLEP/DSST Credit Evaluator | Medium | Medium |
| P3 | Scholarship Finder | Medium | Medium |
| P3 | Education → Careers Smart Bridge | High | High |

---

## 🔗 Cross-Platform Smart Bridge Summary

The Education page is a **hub node** in the Smart Bridge ecosystem:

```
Health (Records Recon)
        ↕
    Education Hub
    ↙    ↓    ↘
GI Bill  Schools  Edu Recon
    ↘    ↓    ↙
    Careers Page
        ↕
    Local Page (BAH → housing costs)
```

Veterans should be able to start anywhere and be intelligently routed.

---

*Last updated: March 21, 2026 — Brainstorming session*
*Next step: Continue brainstorming session (ask mode)*
