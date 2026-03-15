# Vet1Stop Project Status — March 2026

## Quick Reference
- **Repo**: [github.com/spenn0331/Vet1Stop-2.0](https://github.com/spenn0331/Vet1Stop-2.0) (branch: `main`)
- **Local Path**: `c:\Users\penny\Desktop\Vet1Stop`
- **Primary Goal**: MVP Launch (Q2 2026)
- **Current Phase**: Phase 2 Health Tools + Auto-Fill Engine COMPLETE (Mar 15, 2026)
- **Dev Server**: `npm run dev` → http://localhost:3000
- **Last Active Development**: Mar 15, 2026
- **Recovery Date**: Feb 14, 2026 (restored from git commit `863a42cd`)
- **Latest Commits**: `50c81067` (Phase 2 + Auto-Fill complete), `e1951dcf` (Health MVP v1.0 polish), `8e323237` (NGO mixed + card redesign), `748bb794` (premium chat upgrade), `87b1156c` (mic + hallucination fix)
- **Next Up**: Local VOB Directory (Leaflet + Real Estate) — Phase 1 item #2 per master strategy

---

## 🎯 Current Status: Health MVP v1.0 Complete + Phase 2 In Progress — Mar 15, 2026

### ✅ Health MVP v1.0 Final Polish (Mar 15, 2026)

**Goal:** Complete final polish of the Health page MVP — fix PA-hardcoded state fallback, remove orphaned files, and prepare for Phase 2 health tools.

**Changes shipped:**

**`src/app/api/health/symptom-triage/route.ts`**
- Removed `CARLISLE_PA_CONTEXT` / `'Pennsylvania, PA'` hardcode. Replaced with `DEFAULT_LOCATION_CONTEXT = 'your area'` — a neutral generic fallback valid for any state.
- Replaced 7 PA-specific state fallback resources (PA DMVA, HACC Carlisle, Cumberland County VA, Penn State Hershey CBOC, etc.) with 7 nationally-applicable resources valid for any state: VA State Veterans Affairs Offices locator, DAV Chapter Locator, VFW Post Finder, VA Vet Center Locator, SAMHSA Veterans Behavioral Health, Vets4Warriors, American Legion State Programs.
- Fixed `scoreTrack` to use `location: r.location ?? undefined` (was `?? 'Pennsylvania, PA'`).

**`src/app/health/simplified/`**
- Deleted orphaned empty directory.

---

## ✅ Phase 2 Health Tools + Auto-Fill Engine — Mar 15, 2026 (commit `50c81067`)

### `/health/wellness` — AI Wellness Predictor
- 5-slider daily check-in (Mood, Energy, Sleep, Pain, Social Connection 1–10)
- 7-day inline SVG sparkline trend chart — 5 color-coded metric lines
- Smart Insights engine: surfaces mental health / physical / sleep resources based on threshold logic (mood ≤4 for 3+ days, pain ≥7, sleep ≤3 for 2+ days)
- Crisis modal: triggers on mood=1 or crisis keyword detection in notes (988 + Text 838255)
- Day streak counter, mini bar chart of recent check-ins
- 100% client-side; all data in `localStorage` key `vet1stop_wellness_log`; nothing transmitted
- Legal: "Not a medical device" disclaimer on every render; 988 always visible in breadcrumb

### `/health/scribe` — Ambient Scribe Companion
- Web Speech API voice recording with live interim transcript display
- Text fallback textarea for non-supporting browsers
- AI summary via `/api/health/scribe` (grok-4 → grok-3-latest fallback): 3-section output (What I Described, Key Themes, Things to Follow Up On)
- jsPDF client-side export: branded header + 3-section summary + raw transcript + legal footer
- Server route (`src/app/api/health/scribe/route.ts`): structured JSON extraction, static fallback if no API key

### `/health/cpp-prep` — C&P Exam Prep
- Smart Bridge receiver: reads `vet1stop_recon_bridge_data` from localStorage (conditions from Records Recon auto-populate)
- Manual condition add/remove with accordion cards
- AI questions via `/api/health/cpp-prep` (grok-4 → fallback): 5 questions per condition with Tip + "Avoid" per question
- Role-play mode: answer a question → Grok gives feedback + rating (good/needs-work/incomplete) + improvement angle
- Exam Day Checklist: 10 items with progress bar
- jsPDF download: full prep sheet with all conditions, questions, checklist, disclaimer
- RecordsReconPanel: added "Prep for C&P Exam →" CTA alongside "Map My Needs" in the Smart Bridge inline card
- Legal: "Educational practice tool only — not official VA guidance or claims assistance"

### `/auto-fill` — Auto-Fill Engine
- Two-tab UI: "Upload Document" + "Enter Manually"
- Upload tab: drag-and-drop or click-to-browse; PDF → pdfjs-dist text layer; images → Tesseract.js OCR with progress indicator
- `src/lib/auto-fill/extractFields.ts`: pure client-side extraction utility — DD-214 fields: full name, branch, entry/separation dates, MOS, character of discharge, awards. SSN intentionally NOT extracted. Date normalization (YYYYMMDD, MM/DD/YYYY, DD MMM YYYY). Branch + discharge normalization. Years-of-service auto-computed from dates.
- Digital Sea Bag status bar: shows saved state, last updated date, clear button
- Manual tab: dropdowns for Branch (8 options) + Character of Discharge (6 types), date pickers, years-of-service auto-calc display, awards textarea
- Save/clear with confirmation modal. Clear confirms before wiping `vet1stop_sea_bag` from localStorage
- FAB (`AutoFillButton.tsx`): rewired from "Coming Soon" overlay to direct `router.push('/auto-fill')`
- `public/pdf.worker.min.js` copied from `node_modules/pdfjs-dist/build/`
- Legal: "Processes entirely in your browser — nothing sent to any server. SSNs never extracted."

### Health Hub Updates (`src/app/health/page.tsx`)
- Added Phase 2 tools row below existing 3 main cards: Wellness Predictor (amber), Ambient Scribe (indigo), C&P Exam Prep (emerald) — each with "New" badge, icon, description, CTA

---

## 🎯 Current Status: Chat AI Premium Upgrade — Mar 14, 2026

### ✅ Chat AI Premium Upgrade (Mar 14, 2026) — Commits `87b1156c` → `8e323237`

**Goal:** Transform the floating chatbot from a navigation pointer into a premium AI assistant that directly answers veteran questions, surfaces real MongoDB resources as clickable cards, and feels as natural as ChatGPT/Grok.

**Problem solved:** Chat was hallucinating non-existent tools ("Resource Finder Tool", fake sidebar sections), showing no greeting, crashing on mic use, and returning no resource cards despite a 200+ resource MongoDB database.

**Fixes and features shipped (8 commits):**

**`src/components/ai/ChatbotWidget.tsx`**
- Fixed `transcript is not defined` ReferenceError — declared missing state, two-step mic overlay UX
- Added `ResourceCardItem` component — compact cards rendered below AI text: navy/orange/green color-coded badge by subcategory (federal/NGO/state), title, 2-line description, `Visit site` link, truncated phone number (36-char max)
- Added `QuickReplyChips` component — 3 context-sensitive tap chips below the last AI response. Topic-aware: PTSD → claims/treatment chips, sleep → CBT-i/service-connection chips, housing → VA loan/HUD-VASH chips, etc.
- Updated message rendering loop to pass `isLastAI` + `prevUserMsg` to each bubble so chips only show on the latest response

**`src/app/api/ai/chat/route.ts`**
- Removed stale `contextEnhancer` import (was poisoning prompts with hallucinated navigation)
- Always rebuilds system prompt fresh from `promptBuilder.ts` — no more sessionStorage cache poisoning
- Added `getTopResourcesRaw()` call alongside AI generation; injects concise resource titles into system prompt and returns full resource objects in API response as `resources[]`
- Returns `{ response, resources[], metadata }` — cards flow from DB → API → hook → widget

**`src/lib/ai/promptBuilder.ts`**
- Fully rewrote `CHATBOT_SYSTEM` with precise tab-by-tab navigation for all 5 Health page tabs
- Explicitly forbids hallucinating tools that don't exist
- Removed dead `getResourceRecommendationsForConcern()` function
- Added follow-up question pattern instruction

**`src/lib/ai/mongoResourceService.ts`**
- Exported `Resource` interface for card typing across route/hook/widget
- Fixed critical `$and` → `$or` keyword search bug (was requiring ALL words to match — returned 0 results)
- Fixed `$elemMatch` → plain `$regex` for string array tag fields
- Removed `category: 'Health'` filter (seed docs use `subcategory` not `category` — this silently killed every query)
- Fixed URL/phone field resolution: tries `url` → `link` → `website` → `contact.website`; phone tries `phone` → `contact` (string) → `contact.phone`
- Added `subcategory` filter param to `searchResources()`
- Added `mixedSearch()` helper — runs parallel queries for 2 general + 1 NGO, deduplicates, returns top 3 mixed
- Added NGO intent detection ("ngo", "nonprofit", "non-federal", "not va", etc.) → routes to NGO-only subcategory query
- Added `ngos` and `ngoResources` to collection search list
- Handles NGO schema variants: `name` → title, `link` → url, `focus` → tags
- Added server console tracing: `[AI Resources]` prefix logs on every query

**`src/hooks/useAIChat.ts`**
- Added `ResourceCard` interface with `url`, `phone`, `rating`, `isFree` fields
- Extended `ChatMessage` to carry `resources?: ResourceCard[]`
- Parses `data.resources` from API response and attaches to assistant message
- Added `[Vet1Stop Chat]` browser console log on every response (shows `resourceCards` count + titles/urls)

**Card UI redesign:**
- `rounded-lg` (was `rounded-xl`), `py-2 px-2.5` (was `py-2.5 px-3`) — compact feel
- Left border `w-0.5` (was `w-1`) — subtle accent
- Color-coded subcategory badges: 🔵 Federal `#E8EEF8` · 🟠 NGO `#FFF3E0` · 🟢 State `#E8F5E9`
- Phone truncated at 36 chars with `…` — prevents long contact strings breaking layout
- `text-[0.55rem]` badges, `text-xs` title, `text-[0.68rem]` description — clear hierarchy

**Debugging infrastructure:**
- Server terminal (`npm run dev`) logs: `[AI Resources]` query, collection, results count; `[Chat Route]` resource card count per request
- Browser DevTools console logs: `[Vet1Stop Chat]` after every AI response — shows `resourceCards` count and card titles/URLs

**Known pending:**
- NGO cards in chat require `healthResources` docs with `subcategory: 'ngo'` — run `node scripts/seed-federal-va-resources.js` (already has ngo docs) to confirm. If still empty, inspect DB directly for ngo subcategory count.
- Quick reply chips show wrong topic when user sends a follow-up (chips are based on previous user message, not conversation topic context)

---

## 🎯 Previous Status: Strike 9 Complete — Resource Intelligence Overhaul + Mission Expansion
**As of Mar 11, 2026:** Strike 9 delivers four major upgrades: (A/B/C) Scoring engine precision (recreational penalty, coverage multiplier, raised cutoff), (D-lite) Grok AI re-ranks from our own MongoDB pool instead of hallucinating, Browse search synonym expansion fixes vocabulary gaps, Mission Briefings get `vet1stopTip` platform callouts, and the preventive-wellness mission is replaced with a legally-compliant VA Claims Navigation mission.

### ✅ Strike 9 — Resource Intelligence Overhaul + Mission Expansion (Mar 11, 2026)

**Problem solved:** Recreational NGOs (fishing, equine therapy) outscored clinical PTSD/pain orgs. Browse search couldn't find "outdoors" matching fishing NGOs. Grok hallucinated resources instead of using our 133-NGO database. Mission Briefings lacked Vet1Stop tool integration tips.

**Scoring engine (`src/lib/resources-scoring.ts`):**
- **Strike 9A — Recreational Penalty (-20 pts):** `scoreRecreationalPenalty()` penalizes resources whose primary identity is recreational (fishing, equine, art therapy, etc.) when user hasn't signaled outdoor preference. `allowRecreational` flag in `ScoringContext` disables penalty when user asks for outdoor therapy. `buildScoringContext()` auto-detects from keywords.
- **Strike 9B — Coverage Multiplier (+0/+8/+15/+25 pts):** `scoreCoverageBonus()` rewards resources matching 2/3/4+ of the veteran's distinct conditions. WWP (PTSD + physical + TBI) beats single-condition orgs.
- `RECREATIONAL_INTEREST_SIGNALS` constant auto-sets `allowRecreational` when conditions include "outdoor", "fishing", etc.

**Assess pipeline (`src/app/api/health/symptom-triage/route.ts`):**
- **Strike 9C — Raised Cutoff:** `bridgeCount >= 6` cutoff raised from 48 → 55. Also raises to 55 when `allConditions.length >= 3`. Eliminates recreational orgs that scored ~50 via veteran tag + free + 1 keyword.
- **Strike 9D-lite — Grok Pool Re-ranking:** After MongoDB fetch, builds compact pool (top 20 VA / 40 NGO / 15 State) and injects it into the Grok `assess` prompt via `buildSystemPrompt()`. Grok selects clinical best-fits from OUR data (not hallucinated). `matchPoolByTitles()` matches Grok's title selections back to full DB records. `CompactPool` interface added. `max_tokens` bumped 2000 → 4000.

**Browse search (`src/app/api/health/browse/route.ts`):**
- `SYNONYM_MAP` (35 terms): "outdoors" → fishing/hunting/camping/hiking, "pain" → chronic pain/PT/musculoskeletal, etc. Solves vocabulary gap between user search terms and resource tags.
- `expandSearchTerms()` expands search before building `$or` query across all synonym variants.
- When search is active and `sortBy` is default, sort switches to `rating: -1, priority: 1` (best-rated first).
- Atlas text index setup instructions added to file header comments.

**Mission Briefings (`src/data/missions.ts`, `src/app/health/components/MissionPanel.tsx`):**
- `vet1stopTip?: string` added to `MissionStep` interface.
- Tips added to key steps: step-1-2 (Records Recon), step-1-4 (Symptom Finder), step-2-1 (Symptom Finder), step-5-2 (Records Recon).
- `MissionPanel.tsx`: new emerald `⚡ Vet1Stop Tip` callout block renders between Tips and Action Items. Uses `BoltIcon`.
- `preventive-wellness` mission **replaced** with `va-claims-navigation` (38 CFR §14.629-630 compliant):
  - 5 steps: VA Rating System, Gathering Evidence, Free VSO Connect, C&P Exam Prep, Appeals Options
  - Resources: DAV, VFW, AmLegion, NVLSP, REE Medical, Trajector, CCK Law, Berry Law, Hill & Ponton
  - vet1stopTips on steps 1, 2, 4 (all tied to Records Recon)
  - Legal disclaimers on steps 2, 3, 4, 5

**Pending next sprint:**
- MongoDB Atlas text index creation (manual step — instructions in `browse/route.ts` header)
- End-to-end test of D-lite pool injection with real Grok 4 API call
- Expand `SYNONYM_MAP` based on observed search queries

---

## 🎯 Previous Status: Strike 8 Complete — Mission Briefings + System Unification
**As of Mar 11, 2026:** Strike 8 delivers Mission Briefings — structured, step-by-step health mission plans with per-step NGO partner cards, action checklists, Records Recon deeplinks, and localStorage progress tracking. Unifies the old orphaned PathwaySelector system under `missions.ts` as the single source of truth.

### ✅ Strike 8 — Mission Briefings + Unification (Mar 11, 2026)

**New files created:**
- `src/data/missions.ts` — 8 full missions × 5 steps × NGO partners each (875 lines). Single source of truth. Exports: `MISSIONS`, `getMissionById`, `getFeaturedMissions`, `getMissionMatch`, `getMissionStepsForModal`.
- `src/hooks/useMissionProgress.ts` — localStorage-backed progress hook. Key: `vet1stop_mission_progress`. Methods: `markStepComplete`, `setCurrentStep`, `resetMission`, `isStepComplete`, `hasStarted`.
- `src/app/health/components/MissionStrip.tsx` — 4-card featured grid (expand to all 8). Difficulty badges, NGO partner chips, progress bar if started, "Resume Step N" CTA.
- `src/app/health/components/MissionPanel.tsx` — right-side drawer (desktop) / bottom sheet (mobile). Step timeline tabs, key points, tips/warnings callouts, action checklist, NGO partner cards with Sea Bag save, Records Recon deeplink, 988 crisis footer.
- `src/app/health/components/MissionHub.tsx` — thin client wrapper managing `activeMissionId` state.

**Files modified:**
- `src/app/health/page.tsx` — `<MissionHub />` inserted between Tool Nav and NGO Spotlight.
- `src/app/health/components/SmartBridgeBanner.tsx` — added `getMissionMatch()` → mission suggestion chip shows under bridge alert when conditions match a mission's tags.
- `src/app/health/components/symptom-finder/ResultsPanel.tsx` — `PATHWAY_STEPS` / `DEFAULT_PATHWAY_STEPS` replaced with `getMissionStepsForModal()` converter. Pathway labels now map to real mission IDs.
- `src/lib/resource-intelligence/resource-fetcher.ts` — `fetchDomainResources()` gains optional `exclusionTags?: string[]` parameter → applied as `$nin` filter at MongoDB query level before results are returned.
- `src/app/api/health/symptom-triage/route.ts` — all 3 `fetchDomainResources()` call sites now pass `fetchExclusions` for pre-filter at query level.
- `src/services/mock-pathways-service.ts` — replaced 8-stub array with `MISSIONS → Pathway` type converter. `getMockPathways()` now returns fully populated real data. `LEGACY_ID_MAP` for old `pathway-N` URL compatibility.
- `src/app/health/pathways/[id]/page.tsx` — rewritten to use `MissionPanel` directly. No more `PathwayContext` API dependency. Supports legacy and new IDs. Falls back to `MissionHub` if not found.
- `src/app/health/components/ResourcePathwaysSection.tsx` — replaced `PathwaySelector` system with thin `MissionHub` wrapper.

**Architecture decisions:**
- `missions.ts` is now the canonical data source for all 8 health pathways. `PathwayContext` / `PathwaySelector` / `PathwayNavigator` / `PathwayStep` components are still present but superseded — will be removed in a future cleanup sprint.
- Sea Bag key: `vet1stop_sea_bag` (shared between MissionPanel and ResultsPanel).
- Mission progress key: `vet1stop_mission_progress` (separate from `pathway_progress_*` legacy keys).

---

## 🎯 Previous Status: Strike 7 Complete — AI Intelligence Overhaul
**As of Mar 10, 2026:** Strike 7 delivers a full intelligence overhaul of the Symptom Finder AI and Health Browse section: cold-start progressive profiling, intent classification, negative exclusion filtering, 3-tier query relaxation, thumbs up/down preference learning, and cross-domain redirect cards.

### ✅ Strike 7 — AI Intelligence Overhaul (Mar 10, 2026) — Commit `6dd06daf`

**Problem solved:** Grok 4 felt "dumb" compared to xAI's own platform. Root causes: rigid narrow system prompt, no intent classification, no negative feedback handling, cold-start resource quality, and no user preference signals.

**Phase 1 — System Prompt + Intent Classification (route.ts):**
- Rewrote `TRIAGE_SYSTEM_PROMPT`: removed "ONLY mission" cage, added personality rules, negative feedback handling ("Got it — removing those from your results"), follow-up question handling, cross-domain awareness. Grok 4 now sounds like a knowledgeable friend, not a form-filling bot.
- Added `classifyIntent()`: zero-latency regex router — `health_query | negative_feedback | cross_domain | preference_signal | chitchat | crisis`. Runs on every message.
- Added `parseNegativeContext()`: scans full conversation history for negative statements ("not homeless", "don't need service animal") → builds `exclusionTags[]`.
- Added `applyExclusions()`: post-MongoDB filter removes resources whose tags/title/description match any exclusion string.
- Temperature split: `0.5` for `quick_triage` (natural conversation), `0.3` for `assess` (structured JSON output).
- `buildSystemPrompt()` now injects detected intent + active exclusions into the prompt context.
- `TriageRequest` interface: added `userIntent` and `clientExclusionTags` fields.

**Phase 2 — Cold Start / Progressive Profiling (SymptomFinderWizard.tsx):**
- `handleStartChat()` now shows AI greeting + 5 intent tap cards instead of 4 stiff questions.
- Cards: 🧠 Mental health, 💪 Physical pain, 📋 VA benefits, ⚕️ Managing a condition, 🔍 Just exploring.
- `handleIntentSelect()`: tapping a card sends a natural seed message → triage API starts with intent context.
- If `bridgeData` exists (Records Recon flow) → skips tap cards, goes straight to bridge-aware greeting.
- `RawTriageResponse` extended: `crossDomainHints[]` + `activeExclusions[]`.

**Phase 3 — Negative Exclusion + 3-Tier Query Relaxation (route.ts assess step):**
- Exclusion tags parsed from conversation → applied post-MongoDB fetch → aiMessage acknowledges removals by name.
- Tier 1: full query (state + keywords). Tier 2: drop state filter if < 10 results. Tier 3: drop keyword filter if still < 10.
- Prevents "19 NGO resources for broad query" — system now guarantees meaningful result volume.
- Grok's `exclusionTags[]` in JSON output merged with session exclusions for double-pass filter.

**Phase 4 — Thumbs Up/Down Preference Signals (BrowseResourceCard + HealthBrowseSection):**
- `BrowseResourceCard`: 👍/👎 buttons on every card. Writes to `localStorage` key `vet1stop_resource_prefs: { liked[], disliked[] }`. Dispatches `vet1stop:pref-update` custom event.
- `HealthBrowseSection`: listens to pref-update event, re-ranks liked resources to top, disliked to bottom — in real-time without refetch.
- Dislike toast: "Not finding what you need? Symptom Finder can pull more targeted results" → links to `/health/symptom-finder`. Auto-dismisses after 5s.

**Phase 5 — Cross-Domain Redirect Cards (SymptomFinderWizard.tsx):**
- `CROSS_DOMAIN_MAP`: maps `education/gi-bill/school → /education`, `careers/employment/business/entrepreneurship → /careers`, `housing → /local`.
- Redirect card renders in the chat thread when `crossDomainHints` are detected. Amber-styled, dismissible, links to correct page without interrupting the health resource flow.

**Also completed this session (pre-Strike 7):**
- NGO Spotlight: added demo placeholder orgs (WWP premium, Cohen/Team RWB/DAV/Give An Hour featured) — commit `623375c3`.
- HealthBrowseSection: NGO tab gets 8 need-based mega-category filters — commit `66c05afe`.

---

## 🎯 Previous Status: Strike 6 Complete — Federal Seeding + Admin Live Data + userState Wiring
**As of Mar 10, 2026:** Strike 6 expands the federal VA track from 5 → 33 resources, wires the Admin Dashboard to live MongoDB stats, fixes the `/admin/ngos` 404, and routes the veteran's detected state end-to-end from `BridgeData` → `SymptomFinderWizard` → `route.ts` → scoring engine.

### ✅ Strike 6 — Data Expansion + Admin Live Data + State Wiring (Mar 10, 2026)

**Phase 1 — Federal VA Resource Seed:**
- `scripts/seed-federal-va-resources.js`: Seeded 28 new federal resources. `healthResources` federal subcategory: 5 → 33. Total collection: 190 → 218 (federal: 33 | ngo: 133 | state: 51). VA track in Symptom Finder now has real MongoDB results instead of Grok fallback.

**Phase 2 — Admin Dashboard Live Data (3 files):**
- `src/app/api/admin/stats/route.ts` *(new)*: `GET /api/admin/stats` — queries MongoDB for live counts of `healthResources` (total + by subcategory), `pathways`, and `ratings` (count + avg + recent 5). Returns 500 gracefully on DB error.
- `src/app/admin/page.tsx`: Converted from static server component → `'use client'` component. Fetches `/api/admin/stats` on mount. Replaces hardcoded 12/8/15 with live DB counts across 7 stat cards (resources by subcategory, pathways, ratings count, avg rating). Ratings Inbox table renders live recent rows when present.
- `src/app/admin/ngos/page.tsx` *(new)*: Fixes `/admin/ngos` 404. Placeholder page with current NGO counts and Phase 1.5 roadmap note.

**Phase 3 — userState End-to-End Wiring (2 files):**
- `src/app/health/components/SymptomFinderWizard.tsx`: Replaced `userState: 'PA'` hardcode with `bridgeData?.userState ?? undefined`. State now flows from Records Recon bridge payload.
- `src/app/api/health/symptom-triage/route.ts`: Destructures `userState` as `bodyUserState` from request body. Merges into `bridgeContext.userState` (bridge value wins, body value is fallback). Without bridge, creates minimal `{ conditions: [], userState }` context. `applyScoring` + `buildSystemPrompt` now always receive the correct veteran state.

### ✅ State Geo Filter + Chat UX Fixes (Mar 10, 2026)

**Root causes found and fixed across 5 files:**

- **`resource-fetcher.ts`**: `buildStateGeoFilter` generated wrong abbreviation (`'PE'` instead of `'PA'`) when a full state name like `'pennsylvania'` was passed. Added `STATE_NAME_TO_ABBR` reverse map and proper Title Case resolution.
- **`route.ts` — jump-ahead path**: When user answered all 4 questions in one message, `grokJumpedAhead=true` triggered a path that called `fetchDomainResources(HEALTH_CONFIG, jumpKws, bridgeContext)` with the raw bridge (no state). Now applies `jumpBridge` enrichment using `jumpProfile.state` (same pattern as the assess path).
- **`route.ts` — system prompt**: Hardcoded `"ONLY Pennsylvania programs"` overrode all state detection at the AI level. Replaced with dynamic state label derived from `bridgeContext.userState`.
- **`/api/geocode/route.ts`** *(new)*: Browser `fetch` strips `User-Agent` header for security — Nominatim returned 400. Created server-side proxy that adds the required header. Wizard now calls `/api/geocode?lat=X&lon=Y` instead of Nominatim directly.
- **`SymptomFinderWizard.tsx`**: Geolocation call routed through proxy. Textarea auto-resizes (42px → 200px) as user types, resets after send. Fallback `aiMessage` rewritten to be warmer ("Alright — I found some solid options...").
- **`profile-parser.ts`**: 4-tier state detection: context phrase + full name → context phrase + abbr → bare full name → bare UPPERCASE abbr (`PA`, `TX`). `VA`/common words excluded from bare abbr scan.
- **`scripts/fix-state-locations.js`**: Migrated all 51 state `healthResources` to have `location.state` set from their title (was `N/A` for all 51).

### ✅ Strike 5 — Resource Intelligence Engine Architecture (Mar 10, 2026)

**Phase 1 — DB Audit:** Ran `scripts/audit-tags.js`. All 190 `healthResources` docs have ≥3 tags (100% coverage). 189/190 have `updatedAt`. Key finding: `federal` subcategory = only 5 docs (VA track very thin — separate data issue). `location.state` = 0 on all docs (geo-bonus was never firing via DB location). No enrichment needed for Phase 1.

**Phase 2 — Dynamic Location Wiring (3 files):**
- `src/types/records-recon.ts`: Added `userState?: string` to `BridgeData` interface
- `src/app/api/health/symptom-triage/route.ts`: Added 50-state detection to `parseUserProfile()`. Dynamic location in `buildSystemPrompt()` (uses bridge state > CARLISLE_PA fallback). `applyScoring()` extracts `userState` from bridge first, then chat-parsed state, passes to `buildScoringContext`
- `src/lib/resources-scoring.ts`: Removed hardcoded `PA_TERMS` + `'Carlisle, PA'`. `hasGeoBonus(resource, userLocation)` now checks full resource haystack against user's detected state. `ScoringContext.location` is now `string | null` (null = no geo-bonus, honest default). `buildScoringContext` accepts `userLocation?: string | null`

**Phase 3 — KEYWORD_TAG_MAP → MongoDB (2 new files):**
- `scripts/seed-keyword-mappings.js`: Seeds 33 keyword mappings (health=19, education=7, life=7). Indexes on domain + keyword+domain. Run and confirmed seeded.
- `src/lib/resource-intelligence/keyword-map-loader.ts`: MongoDB loader with 10-min in-memory cache + hardcoded fallback. `getKeywordTagMap(domain)` used by scoring engine.

**Phase 4 — Engine Extraction (7 new files + route.ts refactor):**
- `src/lib/resource-intelligence/types.ts`: All shared interfaces (RawResource, ScoredRawResource, BridgeContext, BridgeCondition, UserProfile, DomainConfig, DomainTrack, TrackResults, CrossDomainHint)
- `src/lib/resource-intelligence/domain-configs.ts`: HEALTH_CONFIG, EDUCATION_CONFIG, LIFE_CONFIG + PA_GEO_FILTER
- `src/lib/resource-intelligence/keyword-extractor.ts`: `extractKeywords(text, config?)` — domain-configurable, uses config.knownPhrases + config.signalWords
- `src/lib/resource-intelligence/profile-parser.ts`: `parseUserProfile()`, `parseSeverityWeights()`, `detectCrossDomainIntent()`
- `src/lib/resource-intelligence/resource-fetcher.ts`: `fetchDomainResources(config, keywords, bridge?)` — generic track-aware MongoDB fetcher
- `src/lib/resource-intelligence/resource-scorer.ts`: Re-exports all scoring functions from resources-scoring.ts
- `src/lib/resource-intelligence/index.ts`: Barrel export — single import path for all RIE functions
- `src/app/api/health/symptom-triage/route.ts`: Imports all extracted functions from `@/lib/resource-intelligence`. Removed ~220 lines of duplicate local definitions. `fetchMongoResources` → `fetchDomainResources(HEALTH_CONFIG, ...)`. `connectToDatabase` import removed.

**Phase 5 — Data Enrichment Script:**
- `scripts/enrich-resource-tags.js`: AI-assisted tag enrichment (dry-run default, `--write` to commit). Sends sparse docs to Grok, merges returned tags. Not needed now (100% coverage) but ready for future use.

**Critical Data Finding:** `healthResources.subcategory = 'federal'` has only 5 docs. VA track in Symptom Finder almost always shows fallback static resources. This needs a separate data seeding pass to expand federal resources.

### ✅ Strike 4 — Resource Intelligence Engine (Mar 9, 2026)

**11 fixes across 2 code files + 2 doc files. No new files, no DB changes, no new dependencies.**

**`src/app/api/health/symptom-triage/route.ts`**
- **Fix A — Smart keyword extraction**: Replaced single-word splitter with compound phrase detection (`KNOWN_HEALTH_PHRASES`) + health-signal word set + expanded noise word list (removes `"service"`, `"stuff"`, `"things"` etc. that caused Navy SEAL Foundation false matches). Returns up to 15 meaningful phrases, not 12 single words.
- **Fix B — Limit 7 → 20**: All 3 MongoDB track queries now fetch up to 20 docs. Scoring engine + cutoff determine final count, not DB cap.
- **Fix C — Unified scoring context**: `applyScoring()` now accepts `chatKeywords` + `userProfile`. Merges bridge conditions (PDF) + chat keywords into single deduplicated `allConditions` array. Both sources score each resource together.
- **Fix D — Score cutoff 35**: After scoring, resources below score 35 are filtered out. Top 3 kept as safety net per track if all fall below threshold.
- **Fix G — User profile parser**: `parseUserProfile()` detects 100% P&T, branch, era, VA satisfaction from chat text. Passed into scoring context.
- **Fix I — Cross-domain intent**: `detectCrossDomainIntent()` detects off-domain signals (entrepreneur → careers, school → education, moving → life). Logged + returned as `crossDomainHints[]` in response. No UI yet.
- **Fix J — Severity weighting**: `parseSeverityWeights()` detects amplifier words near keywords ("sleep and ptsd affect me **more**" → PTSD/sleep get 1.5x weight in scoring).
- **Fix K — Already-handled penalty**: Passed via `userProfile.isPermanentTotal` → scoring engine applies -15 to enrollment/onboarding resources for 100% P&T veterans.

**`src/lib/resources-scoring.ts`**
- **Fix E — Per-resource `whyMatches`**: `buildWhyMatches()` now checks which keywords actually match THIS resource's title/description/tags. Cards show "Matches your PTSD + sleep needs" instead of the same 2 PDF conditions on every card.
- **Fix F — Population penalty (-20 pts)**: `POPULATION_PENALTY_PHRASES` list added. Resources like Navy SEAL Foundation (`"supports seals"`, `"navy seal foundation"`) receive -20 penalty, dropping them below the score cutoff.
- **Fix H — Freshness bonus (+3 pts)**: `scoreFreshness()` gives +3 to resources with `updatedAt` < 6 months, +1 for < 12 months.
- **Fix J (scoring side)**: `scoreKeywordRelevance()` now accepts `ScoringContext` instead of `keywords[]`, reads `severityWeights` to multiply hit contribution per keyword.
- Updated `ScoringContext` interface: added `severityWeights?`, `userProfile?` fields.
- Updated `ResourceInput` interface: added `updatedAt?` field.
- Updated `buildScoringContext()`: accepts and passes through `severityWeights` + `userProfile`.

**`.workflow/master-strategy.md` + `.workflow/project_status.md`**
- **Renamed "PCS Commander" → "Home Base"** across all 8 occurrences. Rationale: veterans aren't PCSing to duty stations — they're just moving. "Home Base" is warmer and civilian-friendly.

### ✅ Recently Completed (Mar 5, 2026) — Strike 1 + Strike 2

**Strike 1 — API Stabilization (Mar 5, 2026)**
Target file: `src/app/api/health/symptom-triage/route.ts`
- **JSON Leak Fix**: Added `CRITICAL RULE — STRUCTURED OUTPUT ENFORCEMENT` directive to `TRIAGE_SYSTEM_PROMPT`. Instructs Grok to return raw parsable JSON only during assess phase — no markdown fences, no prose wrapper.
- **Intake & Tone Upgrade**: Phase 1 triage now asks **3 questions** (was 2): Q1 "Active VA claim?", Q2 "Receiving VA care — satisfied?", Q3 open-ended "Anything else to share?". Warm professional close. Updated in system prompt, `buildSystemPrompt()`, and `getQuickTriageFallback()`.
- **Domain Constraint Rule**: Added `DOMAIN CONSTRAINT RULE` block forbidding education/career NGOs on symptom queries. Explicitly names Warrior-Scholar Project as negative example.
- **Fallback Fix**: Removed `Warrior-Scholar Project` (education NGO) from `getAssessFallback()` NGO array. Replaced with **Headstrong Project** (free PTSD/mental health therapy, `https://getheadstrong.org/`, priority: high).
- All disclaimers, crisis detection, scoring pipeline, model chain (grok-4 → grok-3-latest → static), and GRF combo preserved.

**Strike 2 — Feedback Framework Skeleton (Mar 5, 2026)**
Phase 1 + 1.5 data-harvesting skeleton — ratings flow Day 1, post-launch team extends.
- **`src/lib/feedback/ratingsSchema.ts`** (NEW): MongoDB `ratings` collection schema — `RatingDocument` interface, `RATINGS_COLLECTION` constant, JSON Schema validator for `createCollection`, index recommendations. Fields: `resourceId`, `rating` (1–5), `thumbs` (up/down), `timestamp`, `userId` (SHA-256 hashed), `sessionId` (anonymized), `track`, `source`.
- **`src/app/api/feedback/route.ts`** (NEW): `POST /api/feedback` endpoint — validates payload, SHA-256 hashes userId + sessionId (zero PII stored), writes to MongoDB `ratings` collection, always returns 200 (feedback never blocks UX). No auth required for MVP.
- **`src/app/health/components/shared/ResourceCard.tsx`** (EDITED): Added thumbs up/down buttons (`HandThumbUpIcon`/`HandThumbDownIcon` from Heroicons) + clickable 1–5 star user rating below each card. On click → POST to `/api/feedback` with resourceId, track, rating. Shows animated "Thank you — this helps us improve" toast for 2.5s. All existing save/heart, rating display, badges, location, and disclaimer logic preserved.
- **`src/app/admin/page.tsx`** (EDITED): Added "Ratings Inbox" section with empty table stub (Resource, Track, Thumbs, Rating, Timestamp columns). "Phase 1.5 Skeleton" badge. Note: "Data will flow here Day 1 — ready for post-launch team". Zero PII disclaimer.
- All 4 files carry comment: `// Phase 1 + 1.5 feedback framework skeleton — data-ready Day 1 per Living Master MD Section 2 ★ — Strike 2 March 2026`

### 🔴 Strike 3 — Database Query Fix + Chat Input Bug (Mar 5–6, 2026)

**Status:** Diagnosed, fix pending implementation. Database itself is healthy — code is the problem.

**Problem 1: Resources in wrong tabs (VA resources in State tab, state resources in VA tab, Florida resources showing for PA user)**
- **Root cause:** `fetchMongoResources()` in `symptom-triage/route.ts` was written without knowledge of the actual database schema. It ran a single keyword query against `symptomResources` (190 docs), then tried to classify results into VA/NGO/State tracks using URL pattern heuristics (`url.includes('va.gov')`, org name matching, location string checks). Three fatal flaws:
  1. **Schema mismatch:** Every document already has `subcategory: "federal" | "ngo" | "state"` — the correct track classification field — but the code never reads it. Instead it guessed from URLs, catching state VA departments (e.g., "Florida Dept of Veterans' Affairs") as federal VA resources.
  2. **Broken `location` access:** The `location` field was transformed into a nested object `{state, city, address}` during the Apr 2025 database standardization (Era 3). The code did `String(location)` which returns `"[object Object]"` — never matching any state filter. Fix: use dot notation `location.state`.
  3. **"Remaining dump" fallback:** Uncategorized docs were randomly assigned to the first empty track via an index offset, putting federal VA resources in the State tab and vice versa.

**Problem 2: Only 2 NGO resources (NMFA + Navy SEAL Foundation — both irrelevant to user)**
- **Root cause:** The dedicated `ngos` collection (3 docs) was never queried — `fetchMongoResources` only checked `['symptomResources', 'resources', 'healthResources']`. Within `symptomResources`, the NGO classifier depended on `resourceType` (which many docs lack) instead of `subcategory: "ngo"`. Only 2 NGO-type docs happened to match user keywords, and both were branch/caregiver-specific (Navy SEAL Foundation, National Military Family Association) rather than relevant to the user's actual conditions (PTSD, back pain, sleep issues).

**Problem 3: Chat input disappears after resource handoff**
- **Root cause:** In `SymptomFinderWizard.tsx`, when `isHandedOff` is set to `true`, the text input area + send button are conditionally hidden. The earlier fix (`setChatExpanded(true)`) kept the chat **history** visible but not the **input area**, so users can see past messages but cannot type follow-ups to refine results.

**Problem 4: JSON leaking to chat bubbles (partially fixed in earlier commits)**
- **Root cause:** Grok "jumps ahead" during `quick_triage` when user answers all 3 questions in one message (`userTurns=1 < 3` → still calls `quick_triage`). Grok returns assess-style JSON instead of conversational text. The `sanitizeAiMessage` regex failed on truncated JSON (no closing `}` when max_tokens hit). Fixed with nuclear keyword-based sanitizer + jump-ahead handler. JSON leak is resolved but resource quality issues (Problems 1–2) remained.

**Database forensic findings (Mar 6, 2026):**
- The database went through 4 schema eras across multiple AI tools (Era 1: original seed → Era 2: reformulation → Era 3: standardization → Era 4: symptom enhancement). Each layer added fields without fully completing the previous migration.
- Despite this, the data is **well-structured and complete**: 190 docs in both `healthResources` and `symptomResources`, all with correct `subcategory` classification, rich `tags` arrays (11–32 keywords), `rating`, nested `location` objects, `symptoms` arrays, `approachTypes`, and `qualityScore`.
- **No database changes needed.** The fix is entirely in `route.ts`: use `subcategory` for track classification, `location.state` for state filtering, query `ngos` collection, and remove the "remaining dump" distributor.

**Fix implemented (Mar 6, 2026) — 2 files:**
1. `src/app/api/health/symptom-triage/route.ts` — Rewrote `fetchMongoResources`: query `healthResources` ONLY (dropped collection loop + `symptomResources`/`ngos`), 3 separate targeted queries using `subcategory: 'federal'|'ngo'|'state'`, `location.state` dot notation for PA filter, `tags $elemMatch` for keyword matching, pad-fallback per track, removed heuristic classifiers + remaining-dump distributor.
2. `src/app/health/components/SymptomFinderWizard.tsx` — Fixed chat input: `{!isHandedOff && ...}` → `{(!isHandedOff || chatExpanded) && ...}` on lines 612 + 637. Input now visible when refine panel is expanded post-handoff.

### 📦 Database Roadmap — Phase-by-Phase

**Phase 1 (Current — Q1/Q2 2026) ✅ No DB changes needed**
- `healthResources` (190 docs): `subcategory: "federal"|"ngo"|"state"` classification is sufficient for all Symptom Finder queries. Source of truth for VA/NGO/State tabs.
- `ratings` collection: auto-created on first feedback POST (Strike 2 schema). No manual seeding required.
- `educationResources`, `jobResources`, `lifeLeisureResources`: existing, serving their respective pages, no changes needed for Phase 1 Health MVP.
- `ngos`, `undefinedResources`: legacy artifacts from Apr 2025 reformulation — not queried, not deleted. Can be cleaned up in a future maintenance pass.

**Phase 1.5 (Q2 2026) — Home Base + Local VOB Directory**
- **`localResources`** (6 docs currently): Expand to full PA/national VOB directory. Add `location.coordinates: {lat, lng}` for Leaflet map rendering. Seed from partner data or verified scraping.
- **`pcsPlans`** collection (NEW): Stores per-user relocation Gantt data. Schema: `userId` (Firebase UID), `originBase`, `destinationBase`, `timeline[]`, `leadCapture`, `referralAgentId`. Real estate lead routing API writes here.

**Phase 2 (Q3 2026) — Smart Bridge → Persistent Database Profile**
- **`userProfiles`** collection (NEW): Replaces `localStorage` (`vet1stop_recon_bridge_data`, `vet1stop_symptom_profile`) as the Smart Bridge transport layer. Schema: `firebaseUid`, `branch`, `era`, `state`, `conditions[]`, `seaBag[]`, `bridgeHistory[]`. Enables cross-device persistence + personalized AI recommendations.
- **`wellnessCheckins`** collection (NEW): For AI Wellness Predictor (Phase 1–2 feature). Schema: `userId`, `date`, `moodScore`, `symptoms[]`, `flags[]`.

**Phase 3 (Q4 2026) — Education + Shop Marketplace**
- **`educationResources`**: Expand to include GI Bill partner schools with `gigBillApproved`, `veteranGradRate`, `tuitionCap` fields for GI Bill Pathfinder tool and Education Lead Gen revenue stream.
- **`shopResources`** (19 docs currently): Expand to full marketplace schema — add `sellerId`, `price`, `inventory`, `stripeProductId` for Stripe checkout integration and Vet1Stop Shop launch.

**Phase 5 (Year 3+) — VA Blue Button Direct Integration**
- Direct VA Blue Button API (`va.gov/blue-button`) integration to pull veteran medical records in real-time, replacing the manual PDF upload flow in Records Recon. Requires HIPAA compliance agreement + VA Digital Experience API partnership.
- Full `userProfiles` schema expansion to store anonymized health trend data for AI Wellness Predictor and personalized resource matching at scale.

### ✅ Previously Completed (Mar 3, 2026) — Symptom Finder Triage V3

**Pass 1 — Core Triage + Scoring Engine (commit `38beebf4`)**
- **`src/lib/resources-scoring.ts`** (NEW): Pure TS scoring engine — 5 factors (keyword relevance 50pts, veteran-centric 20pts, free/accessible 15pts, PA/Carlisle geo-bonus 10pts, static rating 5pts). Returns `Recommended`/`Good Match` badges, `matchPercent`, `whyMatches` ≤15 words, and `getSuggestedPathway()` for compound keyword pairs.
- **`src/app/health/components/symptom-finder/ResultsPanel.tsx`** (NEW): Standalone results component (`flex-1 overflow-auto`). Sticky VA | NGO | State tabs (7 resources each), card grid (title + badge + match% + desc + tags + `whyMatches` + "Visit Website →" + "Save to Sea Bag"), Full Browse Mode with Fitness | Peer | Grants | Yoga | Adaptive | Solo filters sorted by score, Sea Bag (`vet1stop_sea_bag` localStorage), Suggested Pathway banner (score >80 + compound keyword), Refine mini-chat `h-0` placeholder.
- **`SymptomFinderWizard.tsx`** (OVERWRITE): Layout `flex flex-col h-[calc(100vh-180px)]`. Triage flow collapsed to `idle → chat (2 questions) → results`. Chat shrinks to `h-16` minimized bar (`transition-all duration-300`) post-handoff. "Skip Chat & Generate My Resources" (patriotic yellow) reads `vet1stop_symptom_profile` localStorage fallback. Writes symptom profile after Q2.
- **`symptom-triage/route.ts`** (OVERWRITE): Model = `grok-4` (stipulated in system prompt). New `quick_triage` step asks exactly 2 questions in one reply. `CARLISLE_PA_CONTEXT = 'Carlisle, PA'` hardcoded (TODO Pass 2: dynamic). All AI resources scored via `resources-scoring.ts` before serialization. 7 pre-scored PA-specific static fallback resources per track. Zero 500 errors guaranteed.
- **Deleted 3 junk files** (Zero-Clutter Mandate): `route.ts.new`, `route.ts.fixed`, `route.new.ts`.

**Pass 2 — Refine Mini-Chat + Live Re-Scoring (commit `1483b15b`)**
- Always-visible slim blue trigger bar "Need better matches? Chat with Grok-4 →" expands to `384px` via CSS `maxHeight` transition.
- Chat bubbles matching `SymptomFinderWizard` style (SparklesIcon avatar, bounce typing indicator, error fallback).
- On send: `POST /api/health/symptom-triage` with `{ mode:'refine', step:'quick_triage', profile: localStorage(vet1stop_symptom_profile) }`.
- **Client-side keyword extraction** (`extractRefinementKeywords`): parses 20+ trigger terms from user message, appends new keywords to `liveKeywords` state — zero extra API dependency for re-scoring.
- **`rescoreWithKeywords()`**: calls `scoreAndSortResources` + `buildScoringContext` on all 3 tracks with updated keyword set. Merges scores back onto original recs → card grid re-renders live.
- "Match refreshed!" toast (fixed bottom-center, 2.8s auto-dismiss).
- 3 quick-send buttons: "More solo grants", "Show local Carlisle options", "Explain top match".
- `liveRecs` state replaces `result.recommendations` throughout so all UI elements reflect re-scored state.

**Pass 3 — Pathways Wired + Final Mobile Polish (commit `ff37f44e`)**
- **`PathwayModal` component**: In-page bottom-sheet (mobile) / centered modal (sm+). 4-step guide with step icon, body text in "Many veterans find this helps with motivation" language only. No clinical advice. Hardcoded steps for "Back Pain to Shape" + "Sleep & Recovery Track"; `DEFAULT_PATHWAY_STEPS` fallback for other labels. Closes on Escape or backdrop click.
- **`handleViewPathway`** now opens `PathwayModal(suggestedPathway)` — wired, not a no-op. TODO Pass 4: replace with `PathwayNavigator` context.
- **2 new refine quick-send buttons** (5 total): "Military-to-VA Transition Guide" and "Back Pain to Shape".
- **"Save All Recommended"** one-tap button: saves all `badge=Recommended` resources across all 3 tracks to Sea Bag in a single click. Only visible when ≥1 exists.
- **Mobile layout fix**: scrollable content area (`flex-1 overflow-y-auto overscroll-contain`) is now separate from refine panel. Refine panel is `flex-shrink-0` outside the scroll div — always anchored at bottom, never scrolled away. No card/refine overlap on mobile.
- **Tab bar**: `sticky top-0 bg-white/95` inside scroll area — stays visible while cards scroll.
- **SymptomFinderWizard**: `h-[calc(100dvh-180px)]` using dynamic viewport height for iOS Safari/Chrome mobile. `overflow-y-auto` on idle screen. Responsive message list heights. `overscroll-contain` prevents iOS scroll chaining.

### ✅ Previously Completed
* **Smart Bridge V2 + Symptom Finder Overhaul (Mar 2, 2026):**
  - **Receiver Page:** `src/app/health/symptom-finder/page.tsx` — bridge payload receiver with privacy wipe, Intel Brief banner, dev simulation tools.
  - **Wizard Overhaul:** Premium chat UI with gradient bubbles, AI/user avatars, timestamps, typing indicators, error retry toast, persistent "Not Medical Advice" disclaimer + 988 Crisis Line button.
  - **Auto-Trigger:** When bridge data is present, wizard skips welcome/category steps and opens with 2 clarifying questions pre-contextualized on extracted conditions.
  - **API Upgrade:** `symptom-triage/route.ts` upgraded to `grok-4` with resilient fallback to `grok-3-latest`. Bridge context injected into system prompt. Zero 500 errors.
  - **Clutter Cleanup:** Deleted 8 junk files (`.fixed`, `.new`, `.temp`, `.old`) from health directory.
  - **AI Command Center:** Created `.workflow/ai-command-center.md`.
* **Records Recon Production Polish + Smart Bridge V1 (Feb 28, 2026):** Massive 4-phase refactor moving Records Recon from functional to production-ready MVP. See detailed section below.
* **Records Recon v4.8 (Feb 23, 2026):** Three key improvements over v4.7:
  1. **VSO Briefing Pack PDF fix:** Download button now opens a print-ready preview in a new browser window and auto-triggers the print dialog. Users can "Save as PDF" natively from the browser print dialog instead of getting raw HTML code in VS Code.
  2. **Blue Button date extraction overhaul:** Fixed missing `may` month mapping (was completely absent). Added VA Blue Button-specific date formats: `DATE OF NOTE: FEB 06, 2024@14:48`, `ENTRY DATE`, `DATE ENTERED`, `DATE SIGNED`, `ADMISSION DATE`, `DISCHARGE DATE`, `Date entered`, `Date signed` — all with `@timestamp` support. Added standalone abbreviated month+timestamp pattern (`FEB 06, 2024@14:48`). Both `records-recon/route.ts` and `medical-detective/route.ts` updated.
  3. **UI/UX retheme to match site palette:** Replaced dark hacker theme (`#0A0F1A` bg, `#4ADE80` green accents) with the site's patriotic blue/gold/white palette (`#1A2C5B` primary, `#EAB308` gold accent, white backgrounds, `bg-blue-50` cards). All 6 sub-components updated: RecordsReconPanel, ReconDisclaimer, ReconTimeline, ConditionsIndex, ConditionFrequencyChart, BriefingPackExport.
* **Records Recon v4.7 (Feb 23, 2026):** Complete legal-safe refactor of "Medical Detective". Retired all claims advice language. New two-phase architecture: Phase 2a (Extraction) + Phase 2b (Structuring). Tabbed dashboard (Dashboard | Timeline | Conditions Index | Export), MVP PDF viewer split-pane with jump-to-page, VSO Briefing Pack export, and permanent legal disclaimer. See detailed section below.
* **Strategic Pivot:** Defined the "Living Master Strategy" (replacing the traditional business plan).
* **Revenue Model:** Finalized the "Hybrid Engine" (SaaS + B2B Spotlights + Gov Contracting).
* **Documentation:** Completed the **AI Command Center Cheat Sheet** for operational efficiency.
* **Vertical Expansion:** Formally integrated "Life & Leisure" (Space-A/Retreats) and "Education" (EdTech) into the core product pillars.
* **Grok API Key:** Configured server-side `GROK_API_KEY` in `.env.local` (was missing, causing both Symptom Finder and Medical Detective to silently fail).
* **Symptom Finder (Health Page):** Fully operational — conversational triage wizard uses `grok-4-latest` model, produces personalized VA/NGO/State resource recommendations with crisis detection.
* **Model Upgrades:** Updated all AI endpoints from older Grok models to `grok-4` (text/NLP via `XAI_API_KEY`) and `grok-2-vision-1212` (image analysis).

### 🚧 In Progress / Next Up
* ~~**Smart Bridge Receiver Node (Symptom Finder):**~~ ✅ **COMPLETE (Mar 2, 2026)**
* ~~**Symptom Finder Triage V3:**~~ ✅ **COMPLETE (Mar 3, 2026)** — 3 passes shipped.
* ~~**Strike 1 — API Stabilization:**~~ ✅ **CODE COMPLETE (Mar 5, 2026)** — JSON leak fix, 3Q intake, domain constraints, Headstrong fallback. **Not yet tested.**
* ~~**Strike 2 — Feedback Framework Skeleton:**~~ ✅ **CODE COMPLETE (Mar 5, 2026)** — ratingsSchema.ts, /api/feedback, ResourceCard thumbs/stars, admin Ratings Inbox. **Not yet tested.**
* **🔴 TEST Strike 1 + 2:** Run dev server, test symptom triage with Blue Button report (desktop + mobile). Confirm: no raw JSON in chat, 3 questions asked (incl. VA satisfaction), domain constraints respected, thumbs/stars POST to /api/feedback, toast appears, admin Ratings Inbox renders.
* **Symptom Finder end-to-end testing:** Test with real back pain + PTSD query, verify grok-4 API response shapes match scoring engine input, refine chat re-score flow, pathway banner trigger conditions.
* **Pass 4 — Pathway Navigator wiring:** Replace `PathwayModal` placeholder with real `PathwayNavigator` + `PathwayContext` integration. Add dynamic pathway slugs for "military-to-va-transition" and "adaptive-fitness-track".
* **Pass 4 — Dynamic user state:** Replace `CARLISLE_PA_CONTEXT` hardcode with Firebase Auth custom claim (`user.state`) + localStorage fallback. Add "Confirm your state?" single-ask in chat.
* **Records Recon thorough testing:** Needs real-world validation with VA Blue Button PDFs.
* **Local VOB Directory (Phase 1 next priority):** Leaflet map + real estate teaser. Section III.8 pathway cards already tease this.
* **Living Master Strategy alignment:** Verify `.workflow/master-strategy.md` matches living Google Doc.
* **Legal Setup:** LLC formation in PA (Pending).

### ✅ Records Recon v4.7 (Feb 23, 2026) — Legal-Safe Refactor Complete

**Why:** "Medical Detective" v4.3 contained legally dangerous language — claim types ("Primary Service-Connected", "Secondary", "PACT Act Presumptive"), next-action instructions ("File at va.gov", "Request nexus letter", "Submit buddy statement"), DC code references, rating estimates, and "Why This Matters for Your Claim" framing. These crossed red lines from VA OGC (38 CFR §14.629), FTC Operation AI Comply, and PA UTPCPL.

**What Changed:**
* **Retired "Medical Detective"** — renamed to **Records Recon** everywhere (API, UI, page.tsx, docs)
* **New API route:** `src/app/api/health/records-recon/route.ts` — completely rewritten
* **Two-phase architecture preserved, repurposed:**
  - Phase 1 (Smart Pre-Filter): Unchanged — `smartPreFilter()` works perfectly
  - Phase 2a (Extraction): Rewritten prompt — extracts conditions with page, date, section, provider, excerpt, category. **ZERO claim language.**
  - Phase 2b (Structuring): **Replaces** the old "claims analyst" call. Organizes raw extractions into `timeline[]`, `conditions_index[]`, `keyword_frequency[]`, `document_summary`. Pure reorganization — no advice.
* **Banned-words policy (softened):** Only claim/strategy words banned. Neutral document words allowed (excerpt, mention, found, referenced, page, section, etc.)
* **New UI:** Patriotic blue/gold/white theme matching site palette (`#1A2C5B` primary, `#EAB308` gold accent, white backgrounds)
  - Tabbed layout: Dashboard | Timeline | Conditions Index | Export
  - MVP PDF viewer: `<iframe>` split-pane with `#page=N` jump-to-page
  - Clickable page badges throughout — timeline entries, condition excerpts, all jump to PDF page
  - Permanent yellow disclaimer banner (non-dismissible)
  - Pre-scan consent checkbox required before "Run Recon" activates
  - Copy-to-clipboard on every excerpt
  - VSO Briefing Pack: opens print-ready preview → browser "Save as PDF" for professional document
* **Deleted (legal kills):**
  - `ANALYSIS_PROMPT` (the "VA disability claims analyst")
  - `generateInterimContext()` (contained claim filing instructions)
  - `addPactActCrossRef()` (implied eligibility determination)
  - All `claimType`, `nextAction`, `suggestedNextSteps`, `suggestedClaimCategory` fields
  - All UI text: "Why This Matters for Your Claim", "Recommended Next Step", "claim-relevant", "evidence flags"

**Files Created:**
- `src/app/api/health/records-recon/route.ts` — new legal-safe API (~900 lines)
- `src/app/health/components/RecordsReconPanel.tsx` — main tabbed panel + PDF viewer (~680 lines)
- `src/app/health/components/records-recon/ReconDisclaimer.tsx` — shared disclaimer banner
- `src/app/health/components/records-recon/ReconTimeline.tsx` — interactive vertical timeline
- `src/app/health/components/records-recon/ConditionFrequencyChart.tsx` — CSS bar chart
- `src/app/health/components/records-recon/ConditionsIndex.tsx` — searchable conditions table
- `src/app/health/components/records-recon/BriefingPackExport.tsx` — VSO Briefing Pack generator

**Files Modified:**
- `src/app/health/page.tsx` — rebranded all "Medical Detective" → "Records Recon"

**Files Preserved (not deleted):**
- `src/app/api/health/medical-detective/route.ts` — kept for reference/rollback
- `src/app/health/components/MedicalDetectivePanel.tsx` — kept for reference/rollback

### ⚠️ Records Recon — Remaining Work
1. **Real-world testing** — Run the 1001-page Blue Button and mock PDFs through v4.8 to validate extraction quality, structuring accuracy, and **date extraction** from Blue Button entries.
2. **Excerpt quality** — Verify Grok-4 extracts real verbatim quotes, not hallucinated text.
3. **Timing targets** — Blue Button <75s, mock PDF <20s.
4. **PDF viewer edge cases** — Test iframe `#page=N` jump across Chrome, Edge, Firefox.
5. **Mobile responsiveness** — Test split-pane collapse on mobile (should stack vertically).
6. **Vercel deployment** — Verify serverless function timeouts work in production.
7. ~~**VSO Briefing Pack polish**~~ — ✅ Fixed in v4.8: now opens print-ready preview with auto-print dialog. Future: consider native PDF via `pdf-lib`.
8. ~~**Date extraction from Blue Button**~~ — ✅ Fixed in v4.8: added VA-specific date formats, fixed missing `may` month.

### 🔮 Records Recon — Future Sprint Roadmap

**Phase 1.5 — Enhanced PDF Viewer**
- Replace `<iframe>` with `react-pdf` + `pdfjs-dist` for virtualized rendering
- Page thumbnails sidebar, search within PDF
- Handles 1000+ page PDFs without browser memory issues

**Phase 2 — Premium Features**
- Stripe integration — premium gating, checkout, webhooks
- Multi-file merge — upload multiple records, merged timeline
- Advanced analytics — frequency trends over time, provider comparison
- Authentication gate — require login for premium tabs
- Custom filters — date range, category, provider filtering on timeline

**Phase 3 — Scale**
- Mobile-responsive command center optimization
- Native PDF generation via pdf-lib (replace HTML export)
- AI chatbot integration ("ask questions about your records")
- Rate limiting + usage tracking for freemium enforcement

### ✅ Medical Detective v4.2 (Feb 20, 2026) — Streaming Architecture Stable
* **Root cause fixed:** Switched from `response.json()` (hung forever) to streaming API (`stream: true`) with token-by-token receipt
* **Two-phase idle timeout:** 45s before first token (model thinking), 10s after (stall detection)
* **Auto-retry at 60% cap:** On first timeout, automatically reduces input and retries with 50s timeout
* **Interim report fallback:** On double timeout, immediately returns keyword flags + synopsis as interim report with green banner
* **Frontend UX:** Real-time token progress bar, green interim banner with "Retry Deep Analysis" button, PDF generation always enabled
* **Test results:** Mock PDF completes in ~63s with full streaming synthesis (1437 tokens received). No stall, no dead spinner.
* **Commit:** `Medical Detective v4.2 – reliable Grok-4 synthesis + interim UX fallback – Phase 1 ★ complete per master-strategy.md Section 2`

### 🚧 Medical Detective v4.3 (Feb 21, 2026) — Deep Evidence Synthesis (IN PROGRESS)
* **Fixed build crash:** Removed all image analysis code (`MODEL_VISION`, `screenImageWithVision`, `imageFiles`, `imagePromise`, `imageResults`) — duplicate `imageResults` declaration was causing webpack Module parse failure at line 1071. Image processing was not in Phase 1 spec.
* **Upgraded synthesis prompt:** Changed from loose numbered-list text format to **structured JSON array** output. Each flag now requests: condition, confidence, category, claimType (Primary/Secondary/PACT Act/Aggravated/Rating Increase), excerpt (verbatim 1-2 sentences), date, page, context (why it matters), nextAction (specific step).
* **Rewrote parser:** `parseSynthesisOutput` now tries JSON parse first (reliable structured output), falls back to numbered-list text parsing for backward compatibility.
* **Increased max_tokens:** 1500 → 3000 to give Grok-4 room for real excerpts and context instead of clipped summaries.
* **Added FlaggedItem fields:** `claimType` and `nextAction` added to both backend interface and frontend interface.
* **Frontend card expansion:** Each flag card now shows 3 distinct sections: "Highlighted Excerpt" (amber), "Why This Matters for Your Claim" (blue), "Recommended Next Step" (green). Plus claim type badge.
* **PDF report updated:** Includes claim type badge, highlighted excerpt, claim relevance, and next step per flag.
* **API key fix:** `getApiKey()` now checks both `XAI_API_KEY` and `GROK_API_KEY` env vars.
* **Safe controller.close():** Wrapped in try/catch to prevent `ERR_INVALID_STATE` crash on early returns.
* **Status: NOT COMPLETE** — Architecture is in place but output quality, timing, and edge cases have not been validated against real VA records. See "Remaining Work" list above.
* **Commits:** `d525aa99` (fix: 30s idle + API key + safe close + parser), `fdbc44ff` (v4.3: deep evidence synthesis + build fix)

### 📋 Session: Feb 20, 2026 — Medical Detective v4.x → v5.0 Planning

#### Root Cause (35% stall — FIXED)
`response.json()` hung indefinitely waiting for Grok-4 to complete the response body. Neither `AbortSignal.timeout` nor `setTimeout` bail-outs could interrupt the blocked `.json()` call.

#### Fix: Streaming SSE API (`stream: true`)
1. **New `callGrokAPIStreaming` function** — reads Grok-4 response token-by-token via Server-Sent Events
2. **Dual timeout protection** — 70s hard overall timeout + 10s idle timeout (no new token = bail)
3. **Auto-retry at 60% cap** — if first streaming call times out, automatically retries with 60% of input
4. **Interim report fallback** — if both attempts fail, returns keyword flags + green "Deep Analysis Paused" banner
5. **Real-time progress** — frontend shows token count during synthesis (every 15 tokens)
6. **Frontend UX** — "Phase 1: Live Flags" → "Phase 2: Deep Synthesis" labels, green interim banner, one-click retry with reduced cap

#### Files Changed
- `src/app/api/health/medical-detective/route.ts` — streaming synthesis, auto-retry, constants update
- `src/app/health/components/MedicalDetectivePanel.tsx` — phase labels, green interim banner, retry with reduced cap

#### Previous Commits (Feb 20)
- `515ffbc3` — v4.2 initial: AbortSignal.timeout + interim report + cached retry
- `5ce1f940` — v4.3: sorted input + section guarantee + setTimeout bail-out

---

### 📋 Session: Feb 19, 2026 — Medical Detective v3 "Three-Phase Pipeline"

#### Problem (v2 still too slow)
After v2 fix (adaptive chunks + parallel batches), a 1001-page VA Blue Button PDF still took 20-30+ minutes because:
- **28 Grok 4 API calls** at 60-120s each = too slow even with 3x parallelism
- **~75% of VA Blue Button content is administrative noise** (appointments, demographics, scheduling)
- Every chunk was sent to the expensive Grok 4 model regardless of content quality

#### v3 Architecture: Three-Phase Pipeline
**Phase 1 — Smart Pre-Filter (No AI, instant)**
- ~90 medical/claim keywords compiled into a single regex
- Scans every paragraph, discards non-medical content (appointments, demographics, immunizations, vitals)
- Reduces 1001-page VA Blue Button by ~75% → only high-signal paragraphs kept
- Result: 28 chunks → ~3-5 filtered chunks

**Phase 2 — Fast Screening with `grok-3-mini` (~20-30s)**
- Pre-filtered text sent to `grok-3-mini` (8-10x faster than Grok 4)
- Structured `FLAG|` output format for easy parsing
- Parallel batches of 3 with 60s timeout + 2 retries
- Live flags streamed to client as they're found

**Phase 3 — Grok 4 Synthesis (single call, ~30-45s)**
- All raw FLAG lines from Phase 2 sent to `grok-4-0709` in ONE call
- Grok 4 deduplicates, scores confidence, maps categories, writes nexus reasoning
- Fallback: if synthesis fails, screening flags used directly

#### Files Changed
- `src/app/api/health/medical-detective/route.ts` — complete rewrite to 3-phase pipeline
- `src/app/health/components/MedicalDetectivePanel.tsx` — phase indicators, live flags UI, updated event handling
- `next.config.js` — 50MB body size, pdf-parse external package (from v2)

#### Models Used
- **Screening**: `grok-3-mini` (fast, cheap)
- **Synthesis**: `grok-4-0709` (deep analysis, single call)
- **Vision**: `grok-3-mini` (for image uploads)

#### Performance Impact (estimated for 1001-page PDF)
| Metric | v1 (original) | v2 (adaptive chunks) | v3 (3-phase pipeline) |
|--------|---------------|---------------------|----------------------|
| Chunks to process | ~72 | ~28 | ~3-5 |
| Model per chunk | Grok 4 (slow) | Grok 4 (slow) | grok-3-mini (fast) |
| Grok 4 calls | 72 | 28 | **1** (synthesis only) |
| Est. total time | Infinite (froze) | 20-30 min | **~45-75 seconds** |
| Live flag preview | No | No | Yes |
| Cancel button | No | Yes | Yes |

### � Today's Session Summary (Feb 18, 2026)

#### What We Accomplished
1. **Diagnosed Root Cause of AI Tool Failures**
   - Both Symptom Finder and Medical Detective were non-functional
   - `.env.local` was missing the server-side `GROK_API_KEY` (only client-side key existed, and it was old/expired)
   - Both API routes (`/api/health/symptom-triage` and `/api/health/medical-detective`) were silently returning empty/fallback responses

2. **Fixed API Key Configuration**
   - Added `GROK_API_KEY` (server-side) to `.env.local` with new xAI key: `xai-[REDACTED — store in .env.local only, never commit]`
   - Updated `NEXT_PUBLIC_GROK_API_KEY` (client-side) to match

3. **Upgraded AI Models**
   - Symptom Finder: `grok-3-latest` → `grok-4-latest`
   - Medical Detective (NLP): `grok-3-latest` → `grok-4-latest`
   - Medical Detective (Vision): `grok-2-vision-latest` → `grok-2-vision-1206`

4. **Attempted PDF Parsing Library Upgrade (Reverted)**
   - Installed `pdf-parse` v2.4.5 for proper PDF text extraction
   - **Issue**: v2 uses ESM + `@napi-rs/canvas` native dependencies that broke Next.js webpack bundling
   - **Resolution**: Uninstalled `pdf-parse`, reverted to enhanced regex-based extraction

5. **Improved Medical Detective PDF Processing**
   - Enhanced regex extraction (BT/ET blocks + TJ arrays + UTF-8 fallback)
   - Added **Grok Vision API fallback** for scanned PDFs (when text extraction < 50 chars)
   - Added diagnostic logging throughout pipeline

6. **Verified API Connectivity**
   - Symptom Finder API test returned real Grok responses with personalized VA/NGO/State resources
   - Medical Detective compiles cleanly, route responds correctly

#### What Still Needs Work (Tomorrow's Focus)
**Symptom Finder Issues:**
- Not finding resources/recommendations **effectively** — conversation flows but result quality needs improvement
- Investigate: system prompt tuning, MongoDB resource DB integration, frontend wizard flow, assessment output quality

**Medical Detective Issues:**
- Not finding evidence flags **effectively** from real VA PDFs
- Investigate: regex extraction too weak for compressed/encoded VA PDFs (Blue Button exports), need proper PDF parsing library (`pdf-parse` v1.x or `pdfjs-dist` directly), test Grok Vision fallback with real records, tune AI prompts for VA-specific document formats

#### Files Modified Today
- `.env.local` — Added server-side key, updated both keys
- `src/app/api/health/symptom-triage/route.ts` — Model upgrade + error logging
- `src/app/api/health/medical-detective/route.ts` — Model upgrades, PDF extraction rewrite, Vision fallback
- `.workflow/project_status.md` — Updated status & timeline (this file)

### �� Upcoming Tasks (The "Sprint")
1.  **Finalize Master Doc:** Commit the "Vet1Stop Living Master Strategy" to the repo.
2.  **Admin:** File Articles of Organization (PA) and get EIN.
3.  **Dev:** Resume coding the **Life & Leisure** landing page (Low hanging fruit for SEO).
4.  **Dev:** Build the "Shop/Local" directory MVP.

---

## 🛠 Tech Stack Overview
* **Frontend:** Next.js 14 (App Router) + Tailwind CSS
* **Database:** MongoDB Atlas (Resources) + Firebase (Auth - *Migration to Custom Auth planned*)
* **Hosting:** Vercel
* **Design System:** "Veterans First" (Accessible, Clean, Trust-based)

---

## 1. What Is Vet1Stop?

Vet1Stop is a centralized platform for U.S. veterans to access resources (Education, Health, Life & Leisure, Careers), connect socially, discover veteran-owned businesses (Local), and shop veteran products (Shop). The goal is a polished MVP for investor/grant pitching, evolving into a mobile app with partnerships and premium features.

**Revenue Model**: Hybrid Engine — SaaS + B2B Spotlights + Gov Contracting. Core resources free, premium tier at $9.99/month or $99/year for advanced filtering, AI recommendations, career tools, community features, and ad-free experience.

---

## 2. What's Built (Completed Features)

### Core Infrastructure ✅
- Next.js 14+ project with App Router architecture
- Tailwind CSS integration with patriotic color scheme
- TypeScript throughout
- Firebase authentication (sign-in, sign-up, forgot password)
- MongoDB Atlas connection with resource schemas
- Responsive Header and Footer components
- Root layout with AuthProvider, QueryClientProvider, and AI wrapper

### Homepage ✅
- Hero section with resource category cards
- 7 resource categories with gradient cards and icons (Education, Health, Life & Leisure, Careers, Local, Shop, Social)
- Community features section
- Full SEO metadata

### Health Page ✅ (Most Developed Page — ~84 files)
- **Three-tab navigation**: Find Resources, VA Benefits, NGO Resources
- **Resource Finder Section**: Advanced filtering by category, state, branch, era, veteran type, eligibility
- **State-specific resources**: Location-aware resource filtering
- **NGO Resources Section**: 133+ health NGOs with filtering, pagination, detail views
- **Symptom Finder** ✅ **(Triage V3 — Mar 3, 2026)**: Full production rebuild — strict 2-question triage → `ResultsPanel` handoff. `resources-scoring.ts` (5-factor pure TS engine), `ResultsPanel.tsx` (sticky VA/NGO/State tabs, scored card grid, Full Browse Mode, Sea Bag, live refine mini-chat with Grok-4, PathwayModal, "Save All Recommended"), `SymptomFinderWizard.tsx` (mobile-first, `h-16` chat collapse, `dvh` viewport), `symptom-triage/route.ts` (grok-4, `quick_triage` step, `CARLISLE_PA_CONTEXT`). 3 localStorage keys: `vet1stop_symptom_profile`, `vet1stop_sea_bag`, `vet1stop_recon_bridge_data`.
- **Records Recon** ✅ (v4.7): Upload VA medical records (PDF) → AI extracts and organizes conditions into structured timeline, conditions index, and keyword frequency chart → generates downloadable VSO Briefing Pack. Tactical command-center UI with dark theme, tabbed dashboard, MVP PDF viewer split-pane with jump-to-page. **Legally safe — zero claims advice language.** Uses `grok-4-1-fast-non-reasoning` (extraction) + `grok-4-1-fast-reasoning` (structuring).
- **Crisis Banner**: Always-visible Veterans Crisis Line info with crisis detection
- **VA Healthcare Benefits Section**: Accordion-based benefit explanations
- **Resource Pathways**: Step-by-step pathway navigator (PathwaySelector, PathwayNavigator, PathwayStep)
- **Standalone Request Modal**: Info request form for resources
- **Lazy loading** and performance optimization
- **Health tools**: Pre-separation checklist, priority calculator, transition timeline
- **Military-to-VA Transition Guide**: Multi-component resource guide
- **Data**: Static fallback data + MongoDB dynamic resources
- **Tests**: UI validation and component import tests passing

### Education Page ✅
- Resource display with grid cards
- Filter system (federal, state, NGO)
- MongoDB integration for dynamic resources

### Careers Page ✅
- LinkedIn/Indeed-style career search
- Components: HeroSection, CareerPathways, EmploymentResources, EntrepreneurshipResources
- Premium features sections (Employment + Entrepreneurship)
- CTA section, testimonials, related resources
- Resource cards with detailed information

### Admin Dashboard ✅
- Admin layout with sidebar navigation
- Resource management dashboard
- Community Q&A management page
- Pathways management page
- **Ratings Inbox** (Phase 1.5 skeleton): Empty table stub with columns (Resource, Track, Thumbs, Rating, Timestamp). "Data will flow here Day 1" placeholder. Zero PII disclaimer.

### Authentication ✅
- Firebase integration with AuthContext provider
- Sign-in page (email + Google)
- Sign-up page with validation
- Forgot password with email reset
- Protected route infrastructure

### Grok AI Integration ✅ (Extensive — 13 service files)
- **Chat API**: Full conversational AI with Grok API
- **Voice Commands**: Speech recognition with context-aware processing
- **Recommendations**: Personalized resource recommendations
- **Summarization**: Content summarization API
- **Crisis Protocol**: Detects crisis signals, provides Veterans Crisis Line info, trauma-informed responses
- **User Profile Service**: Extracts veteran info from conversations (branch, era, rank, conditions)
- **MongoDB Resource Service**: AI queries database directly for relevant resources
- **Local Resource Service**: Location-based recommendations with fallback (city → state → national)
- **Accessibility Service**: Screen reader optimization, military abbreviation expansion
- **Follow-up Service**: Automated follow-ups for crisis situations
- **Response Formatter**: Consistent markdown formatting with clickable links
- **Context Manager**: Conversation context and profile management
- **Prompt Builder**: Dynamic prompt construction based on context
- **UI Components**: ChatbotWidget (floating), VoiceCommandButton, RecommendationPanel, FormAssistant, SummaryButton, AILayoutWrapper

### Shared Components ✅
- Resource cards, grids, and filters (multiple variants)
- Advanced filter panels with checkbox, radio, dropdown, toggle, and collapsible sections
- Saved resources panel
- View toggle (grid/list)
- UI primitives: Button, Checkbox, Input, Label, Switch, Modal
- Placeholder image component
- Section header
- Icon library

### Custom Hooks ✅
- `useAIChat` — chatbot interactions
- `useVoiceCommand` — speech recognition
- `useRecommendations` — personalized recommendations
- `useResourceFiltering` / `useResourceFilters` — resource filter logic
- `useSavedResources` — bookmark/save functionality
- `useAuth` — authentication state

### API Routes ✅ (21+ routes)
- **AI**: `/api/ai/chat`, `/api/ai/voice`, `/api/ai/recommend`, `/api/ai/summarize`
- **Health**: `/api/health/resources`, `/api/health/state-resources`, `/api/health/symptom-finder`
- **NGOs**: `/api/ngos`, `/api/ngos/featured`, `/api/ngos/month`
- **Resources**: `/api/resources`, `/api/resources/[id]`, `/api/resources/counts`
- **Pathways**: `/api/pathways`, `/api/pathways/[id]`, `/api/pathways/progress`
- **Feedback**: `/api/feedback` (POST — anonymized thumbs + star ratings to MongoDB `ratings` collection)
- **Other**: `/api/community-qa`, `/api/request-info`, `/api/health-resources`, `/api/health-needs`, `/api/symptom-resources`, `/api/update-resource`
- **Debug/Test**: `/api/db-test`, `/api/debug-db`, `/api/mongodb-test`, `/api/test`, `/api/quick-count`, `/api/check-resource`, `/api/check-resource-details`

### Database ✅
- MongoDB Atlas cluster connected (`cluster0.hpghrbe.mongodb.net`)
- Database: `vet1stop`, Collection: `healthResources`
- Standardized schema with resource models (healthResource, NGOResource, general resource)
- Connection management with error handling

---

## 3. What's NOT Built Yet (Incomplete / Planned)

### Pages Not Yet Implemented
| Page | Status | Notes |
|------|--------|-------|
| **Life & Leisure** | ❌ Not built | Has route planned but no page component |
| **Local** | ❌ Not built | Map-based veteran business directory — needs Google Maps API |
| **Shop** | ❌ Not built | E-commerce marketplace — needs payment processing (Stripe) |
| **Social** | ❌ Not built | Veteran social network with events, groups, messaging |
| **Contact** | ❌ Not built | Basic contact form |

### Features Not Yet Implemented
- **Life & Leisure page** following the Health page pattern
- **Local page**: Map integration, business directory, verification, ratings
- **Shop page**: Product catalog, seller onboarding, cart/checkout, order management
- **Social page**: Profiles, forums, events, groups, messaging, content moderation
- **Premium feature gates**: Visual indicators, pricing page, subscription management
- **Payment processing**: Stripe/PayPal integration
- **Military verification**: ID.me or equivalent
- **Advanced search**: Cross-page unified resource search
- ~~**Resource rating/feedback system**~~ — ✅ Phase 1.5 skeleton built (Strike 2, Mar 5, 2026). Full admin UI polish + RAG wiring deferred to post-launch.
- **User profile management page**
- **Protected routes middleware** (auth guards)
- **SEO optimization** (metadata on layout is commented out due to client component)
- **Vercel deployment** (was attempted but had issues; currently local-only)
- **Mobile app** (React Native — long-term)
- **Comprehensive testing** (only basic tests exist)

---

## 4. Known Technical Issues

1. **Layout metadata**: `src/app/layout.tsx` is marked `"use client"` which prevents Next.js metadata export. Metadata is commented out. Needs refactoring to separate server/client concerns.
2. **Peer dependency warnings**: `@tanstack/react-query@4.x` has peer dep conflicts with React 19. Works but shows warnings.
3. **Duplicate hook files**: Both `useAuth.ts` and `useAuth.tsx` exist — should consolidate.
4. ~~**`.fixed` and `.new` files scattered**~~ — ✅ **Resolved (Mar 3, 2026)**: All flagged junk files in the health/API directories deleted. `_backup/` folder and any `ngo-data.ts.fixed` variants in `src/utils/` may still exist — verify and clean if present.
5. **Health page complexity**: 84 files in the health directory; some may be redundant (`simplified-page.tsx`, `page.tsx.new`).
6. **Vercel deployment**: Previously had issues with large files and build errors. Not currently deployed.
7. **Testing gaps**: Most tests are pending; only basic component import tests pass.

---

## 5. Project File Structure

```
Vet1Stop/
├── .workflow/           # 51 planning/documentation files
├── src/
│   ├── app/
│   │   ├── page.tsx            # Homepage (680 lines)
│   │   ├── layout.tsx          # Root layout with providers
│   │   ├── globals.css         # Global styles
│   │   ├── admin/              # Admin dashboard (4 files)
│   │   ├── api/                # 21+ API route directories
│   │   ├── careers/            # Careers page (12 files)
│   │   ├── education/          # Education page (1 file)
│   │   ├── health/             # Health page (84 files) ← most developed
│   │   ├── signin/             # Sign-in page
│   │   ├── signup/             # Sign-up page
│   │   ├── forgot-password/    # Password reset
│   │   ├── db-debug/           # DB debug page
│   │   └── lib/                # Firebase config, auth, analytics
│   ├── components/
│   │   ├── ai/                 # 6 AI components (chatbot, voice, etc.)
│   │   ├── common/             # Header, Footer, PlaceholderImage
│   │   ├── feature/            # ResourceCard, ResourceGrid, Filters
│   │   ├── shared/             # Advanced filter panels, saved resources
│   │   ├── ui/                 # Button, Checkbox, Input, Label, Modal, Switch
│   │   ├── icons/              # Icon components
│   │   └── resource-filters/   # Additional filter components
│   ├── hooks/                  # 8 custom hooks
│   ├── lib/                    # Firebase, MongoDB, AI services (24 files)
│   ├── models/                 # MongoDB data models
│   ├── services/               # Pathway and resource services
│   ├── types/                  # TypeScript type definitions
│   ├── utils/                  # Helpers (cache, geo, images, NGO data)
│   ├── contexts/               # AuthContext
│   ├── constants/              # Filter options
│   └── data/                   # Static health resources fallback
├── public/                     # Static assets (images)
├── _backup/                    # Health page backup files (31 .bak/.fixed files)
├── scripts/                    # Utility scripts and logs
├── .env.local                  # Live API keys (Firebase, MongoDB, Grok)
├── package.json                # Dependencies
├── next.config.js              # Next.js config
├── tailwind.config.js          # Tailwind config
├── tsconfig.json               # TypeScript config
└── postcss.config.js           # PostCSS config
```

---

## 6. Environment & Integrations

| Service | Status | Details |
|---------|--------|---------|
| **Firebase** | ✅ Configured | Auth (email + Google), project: `vet1stop-21f83` |
| **MongoDB Atlas** | ✅ Configured | Cluster: `cluster0.hpghrbe.mongodb.net`, DB: `vet1stop` |
| **Grok AI (xAI)** | ✅ Configured | Both `GROK_API_KEY` (server) and `NEXT_PUBLIC_GROK_API_KEY` (client) set. Active model: `grok-4` (stipulated in system prompt, fallback `grok-3-latest`). Features: symptom triage (quick_triage + assess + refine modes), records recon extraction/structuring, chat, voice, recommendations, summarization |
| **Vercel** | ❌ Not deployed | Had build/large-file issues previously |
| **Stripe** | ❌ Not integrated | Planned for Shop/premium gating |
| **Leaflet** | ❌ Not integrated | Planned for Local VOB Directory |

---

## 7. The .workflow Documentation Library

Key documents to reference:
- **`master-strategy.md`** — Living Master Strategy (constitution — read first)
- **`project_status.md`** — This file — current sprint + history
- **`ai-command-center.md`** — Dream Team matrix, Golden Rules, operational protocol
- **`PRD.md`** — Full product requirements
- **`development-roadmap.md`** — Phase-by-phase development plan
- **`technical-architecture.md`** — System architecture blueprint
- **`project-overview.md`** — Mission, vision, objectives
- **`monetization-strategy.md`** — Freemium model details
- **`business-plan-monetization.md`** — Full business plan
- **`grok-ai-integration-progress.md`** — AI feature implementation status
- **`grf-enhancement-ideas.md`** — General Resource Finder UX/AI enhancement backlog (Firebase Analytics, smart search, GRF vs SRF differentiation)
- **`health-page-*.md`** — Health page architecture docs
- **`pages-*.md`** — Individual page specs (careers, education, health, life-leisure, local, shop, social)
- **`style-theme-and-vision.md`** — Design system and patriotic theme
- **`firebase-integration.md`** — Auth integration details
- **`mongodb-resource-integration.md`** — Database integration details

---

## 8. Where We're Going — Recommended Next Steps

### Immediate Priorities (Phase 1 Health MVP Completion)
1. **Symptom Finder E2E test** — Run real back pain + PTSD query through full stack: bridge handoff → 2-question triage → grok-4 assess → scored ResultsPanel → refine "more yoga" → PathwayModal click. Verify all localStorage keys write/read correctly.
2. **Pass 4 — Dynamic state + PathwayNavigator wiring** — Replace `CARLISLE_PA_CONTEXT` with user profile state. Wire `handleViewPathway` to existing `/health/pathways/[id]` + `PathwayContext`.
3. **Local VOB Directory MVP** — Phase 1 next priority per master-strategy Section III. Leaflet map, real estate teaser, RESPA disclaimers.
4. **Fix the layout.tsx server/client split** — Restore SEO metadata.
5. **Get Vercel deployment working** — Critical for investor demos.

### Short-Term (Complete MVP)
6. **Home Base + Smart Bridge integration** — Phase 1 priority #3 per master-strategy.
7. **Auto-Fill shared component** — Phase 1 priority #4, "not official VA claims assistance" disclaimer required.
8. **Build Life & Leisure page** — Follow Health/Education pattern.
9. **Implement premium feature indicators** — Visual gates showing future paid features.
10. **Create pricing page** — Clean tier comparison.

### Medium-Term (Post-MVP / Post-Funding)

**Phase 1.5 (Immediate after Health MVP):**
- ~~Implement feedback loop skeleton (thumbs up/down + ratings on cards, anonymized Mongo store)~~ — ✅ **Strike 2 (Mar 5, 2026)**
- ~~Add Q1 VA satisfaction + "tell me more" end prompt + domain constraints to eliminate irrelevant NGOs~~ — ✅ **Strike 1 (Mar 5, 2026)**
- Remaining: Full admin data fetching from `ratings` collection, aggregation pipelines, export, RAG feedback loop wiring

**Phase 2 (Post-Launch):**
Full Admin Dashboard overhaul using Gemini 4-pillar blueprint:
- **The AI Command Center** (Prompt Version Control, Failure Threshold Log, RAG Knowledge Base Manager)
- **The Revenue & Referral Engine** (Lead Handoff Tracking, B2B Partner Queue)
- **Verification & Crisis Ops** (Manual Verification Override, Crisis Trigger Logs)
- **Community Moderation** (User-Submitted Resource Queue, Flagged Content/Dead Links)

**Phase 3+:**
- Full RAG + fine-tune on aggregates
- Sell anonymized insights to VSOs/VA

**Other Medium-Term:**
11. **Build Local page** — Map-based veteran business directory (Leaflet + real Google Places API).
12. **Build Shop page** — Product catalog, seller onboarding, Stripe.
13. **Build Social page** — Basic community features (events, groups).
14. **Payment processing** (Stripe).
15. **Military verification** (ID.me).
16. **Mobile app** (React Native — long-term).

---

## 9. History Timeline

| Date | Event |
|------|-------|
| **Early 2025** | VetUnite project started as HTML/CSS/Express app |
| **March 2025** | Sprints 3-4: Shop page, careers, resource pages built |
| **April 2025** | Sprint 5: Tailwind migration, React component migration, Vercel deployment attempts |
| **April 10-11** | Full migration to Next.js (Vet1Stop-2.0 repo) |
| **April-May 2025** | Extensive Health page development, Grok AI integration, MongoDB standardization |
| **May 5, 2025** | Last component tests passing |
| **May 7, 2025** | Last real commit before hiatus (`863a42cd`) |
| **Aug 29, 2025** | Repo "cleaned" for GitHub large file limits — **source code accidentally lost** |
| **Feb 14, 2026** | Full recovery from git history, pushed to GitHub |
| **Feb 15, 2026** | Strategic pivot to Bootstrapped/Solo-Founder model; paused feature dev for business foundation |
| **Feb 18, 2026** | Fixed Grok API integration (missing server-side key), upgraded to `grok-4-latest`, Symptom Finder + Medical Detective fully operational |
| **Feb 19-20, 2026** | Medical Detective v4.1→v4.3: two-phase pipeline, smart pre-filter, AbortSignal timeout, interim report, cached retry. Phase 2 (Grok-4) still hangs — v5.0 production plan created |
| **Feb 23, 2026** | Records Recon v4.7-v4.8: legal-safe refactor (zero claims language), patriotic UI theme, Blue Button date extraction fixes, VSO Briefing Pack PDF print dialog |
| **Mar 2, 2026** | Smart Bridge V2 complete. Symptom Finder receiver page live. SymptomFinderWizard overhauled to premium chat UI. `grok-4` model chain active. |
| **Mar 3, 2026** | **Symptom Finder Triage V3 — 3 passes, 5 files, pushed to `main`**: `resources-scoring.ts` (scoring engine), `ResultsPanel.tsx` (card grid, refine chat, pathway modal, mobile layout), `SymptomFinderWizard.tsx` (2Q flow, dvh, h-16 collapse), `symptom-triage/route.ts` (grok-4, quick_triage, scoring integrated). Commits: `38beebf4`, `1483b15b`, `ff37f44e`. |
| **Mar 5, 2026** | **Strike 1 — API Stabilization**: `symptom-triage/route.ts` hardened — structured output enforcement (JSON leak fix), 3-question intake (VA claim + VA satisfaction + open-ended), DOMAIN CONSTRAINT RULE (no education/career NGOs on symptom queries), Warrior-Scholar replaced with Headstrong Project in fallback. |
| **Mar 5, 2026** | **Strike 2 — Feedback Framework Skeleton**: 2 new files (`ratingsSchema.ts`, `api/feedback/route.ts`), 2 edited (`ResourceCard.tsx` thumbs/stars, `admin/page.tsx` Ratings Inbox stub). MongoDB `ratings` collection, zero PII (SHA-256 hashed), POST endpoint always returns 200. Phase 1.5 data-ready Day 1. **Both strikes code-complete but not yet tested.** |

---

## 10. Other Repos & Folders

| Location | Purpose | Status |
|----------|---------|--------|
| `c:\Users\penny\Desktop\VetUnite` | Original HTML/Express version with its own `.workflow` docs | Archived — superseded by Next.js version |
| `github.com/spenn0331/Vet1Stop-2.0` | **Active repo** — recovered Next.js app | ✅ Current |
| `github.com/spenn0331/Vet1Stop-2.0.1` | Blank `create-next-app` boilerplate | ❌ Not useful |
