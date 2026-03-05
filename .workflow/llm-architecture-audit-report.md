# Vet1Stop LLM Architecture Audit Report

**Date:** March 4, 2026  
**Scope:** Full repo history analysis — LLM prompts, models, Grok integration, resource relevance logic  
**Reference:** `.workflow/master-strategy.md` Section 2 (Symptom Finder ★, Records Recon ★)  
**Status:** Analysis only — no code changes

---

## 1. Executive Summary

Vet1Stop currently has **two distinct LLM subsystems** and **one general chatbot layer**, each communicating with xAI's Grok API (`https://api.x.ai/v1/chat/completions`) via direct `fetch()` calls. There is no fine-tuning, no RAG pipeline, and no prompt versioning system. Resource relevance is handled by a mix of (a) LLM free-generation in the Symptom Triage prompt, (b) a post-hoc scoring engine, and (c) hardcoded static fallback lists. The "Warrior-Scholar Project appearing for non-education queries" problem is a direct artifact of the static fallback list in `symptom-triage/route.ts` and the lack of domain-gating in the Grok system prompt.

---

## 2. LLM Component Inventory

### 2A. Symptom Finder / Triage Wizard (`/api/health/symptom-triage`)

| Property | Value |
|:---------|:------|
| **File** | `src/app/api/health/symptom-triage/route.ts` (486 lines) |
| **Primary Model** | `grok-4` (stipulated — PM-locked) |
| **Fallback Model** | `grok-3-latest` |
| **Temperature** | `0.3` (low creativity, factual) |
| **Max Tokens** | `2000` |
| **API Endpoint** | `https://api.x.ai/v1/chat/completions` (non-streaming) |
| **API Key Sources** | `GROK_API_KEY` → `NEXT_PUBLIC_GROK_API_KEY` |
| **Fallback Chain** | grok-4 → grok-3-latest → static hardcoded response |

**System Prompt (TRIAGE_SYSTEM_PROMPT):**
- Identity: "Vet1Stop Symptom Triage Navigator — running on grok-4"
- Role: Benefits/resource navigator, NOT a therapist
- Critical rules: Never diagnose, never recommend medication, always append medical disclaimer
- Crisis protocol: keyword detection → immediate 988 response
- Phase 1 behavior: Ask exactly 2 clarifying questions (VA claim status + severity/duration)
- Assess output: Structured JSON with `severity`, `aiMessage`, `vaResources[]`, `ngoResources[]`, `stateResources[]`
- Requests 5–7 resources per track, Pennsylvania-only for State track

**Dynamic Prompt Injection:**
- Location context: Hardcoded `"Carlisle, PA"` (TODO: dynamic in Pass 2)
- Bridge context: If Records Recon conditions exist, injects `RECORDS RECON INTEL` block listing conditions by name/category/mention count
- Step-specific overrides for `quick_triage` vs `assess`

### 2B. Records Recon / Medical Detective (`/api/health/medical-detective`)

| Property | Value |
|:---------|:------|
| **File** | `src/app/api/health/medical-detective/route.ts` (1298 lines) |
| **Extraction Model** | `grok-4-1-fast-non-reasoning` |
| **Analysis Model** | `grok-4-1-fast-reasoning` |
| **Fallback Model** | `grok-4-0709` |
| **Temperature** | `0.1` (near-deterministic for extraction) |
| **Max Tokens** | `3000` per call |
| **API Endpoint** | `https://api.x.ai/v1/chat/completions` (streaming SSE) |
| **API Key Sources** | `XAI_API_KEY` → `GROK_API_KEY` |
| **Timeouts** | 90s overall, 45s idle, up to 3 retry attempts |

**Two-Phase AI Pipeline:**

**Phase 2a — EXTRACTION_PROMPT (non-reasoning model):**
- 3-layer extraction system: Section-Anchored → Condition Categories → Pattern Catch-All
- 12 medical condition category dictionaries (~200+ specific terms)
- PACT Act presumptive condition flagging
- Claim language detection ("service connected", "nexus", "at least as likely as not")
- Negative context gating (skip "denies", "ruled out", "no evidence of")
- Screening false positive exclusion (PHQ-9 score 0, etc.)
- Output: Strict JSON array with condition, excerpt, page, section, date, doctor, claimType, confidence

**Phase 2b — ANALYSIS_PROMPT (reasoning model):**
- Deep nexus context per flag with 38 CFR diagnostic code citations
- 3–4 step next-action plans referencing exact page numbers
- Claim type verification/correction
- `shouldExclude` boolean for false positive elimination

**Pre-Filter (Phase 1 — NO AI):**
- ~85 core medical keywords with regex matching
- Section header priority scoring (Assessment, Problem List, etc.)
- Noise phrase exclusion (appointments, scheduling, demographics)
- Generic standalone term filtering
- Tiered keyword scoring with 5K char / 25 paragraph cap
- Page number extraction from PDF boundaries

### 2C. General Chatbot (`/api/ai/chat`)

| Property | Value |
|:---------|:------|
| **File** | `src/app/api/ai/chat/route.ts` (224 lines) |
| **Service Layer** | `src/lib/ai/grokService.ts` |
| **Model** | `grok-3-latest` (via grokService config) |
| **Temperature** | `0.7` (conversational) |
| **Max Tokens** | `1000` |
| **Mock Mode** | `NEXT_PUBLIC_USE_MOCK_AI === 'true'` for dev cost savings |

**Prompt Assembly Chain:**
1. `buildChatbotSystemPrompt()` — Base identity + user profile + page context
2. `getCrisisPreamble()` — Injected if crisis detected
3. `getProfileForAIContext()` — In-memory veteran profile (branch, era, conditions)
4. `enhanceGeneralPrompt()` — Topic-specific knowledge injection (PTSD, education, employment)
5. `getResourcesForQuery()` — MongoDB resource lookup appended to system prompt

---

## 3. How the System Communicates with Grok

### 3A. API Transport

All three subsystems use **direct HTTP `fetch()`** to `https://api.x.ai/v1/chat/completions` — the xAI (Grok) OpenAI-compatible endpoint. There is **no SDK, no middleware, no proxy**.

| Subsystem | Method | Streaming | Auth Header |
|:----------|:-------|:----------|:------------|
| Symptom Triage | `fetch()` non-streaming | No | `Bearer ${GROK_API_KEY}` |
| Medical Detective | `fetch()` SSE streaming | Yes | `Bearer ${XAI_API_KEY}` |
| General Chatbot | `fetch()` non-streaming | No | `Bearer ${NEXT_PUBLIC_GROK_API_KEY}` |

### 3B. Message Format

Standard OpenAI chat completion format:
```json
{
  "model": "grok-4",
  "messages": [
    {"role": "system", "content": "<system prompt>"},
    {"role": "user", "content": "<user message>"},
    {"role": "assistant", "content": "<previous response>"}
  ],
  "temperature": 0.3,
  "max_tokens": 2000
}
```

### 3C. Key Environment Variables

- `GROK_API_KEY` — Primary (server-side)
- `XAI_API_KEY` — Medical Detective preferred
- `NEXT_PUBLIC_GROK_API_KEY` — Client-exposed (chatbot, less secure)
- `NEXT_PUBLIC_USE_MOCK_AI` — Dev mock toggle

### 3D. No Fine-Tuning

There is **zero fine-tuning code** anywhere in the repository. All behavior shaping is done via system prompts (prompt engineering). There are no:
- Training data files
- Fine-tune API calls
- Model upload/download scripts
- LoRA adapters or PEFT configs

---

## 4. Resource Relevance: How It Works (and Breaks)

### 4A. The Warrior-Scholar Problem — Root Cause

The static fallback list in `symptom-triage/route.ts` lines 293–301 **always includes** `Warrior-Scholar Project` in the NGO track regardless of the user's query category:

```typescript
// Line 299 — ALWAYS in the fallback NGO list
{ title: 'Warrior-Scholar Project',
  description: 'Academic boot camps and professional development...',
  tags: ['education', 'grant', 'veteran', 'scholarship', 'free'],
  priority: 'low' }
```

This appears because:
1. **When Grok API fails or returns unparseable JSON** → the static `getAssessFallback()` function fires
2. That function contains a **one-size-fits-all** list of 7 VA + 7 NGO + 7 State resources
3. There is **no category/domain filtering** on the fallback — education NGOs appear for health queries
4. Even when Grok succeeds, the system prompt asks for "5–7 resources per track" but provides **no domain constraint** beyond the user's symptoms — Grok can hallucinate any NGO it knows about

### 4B. The Scoring Engine (`resources-scoring.ts`)

Post-AI scoring rubric (max 100 pts):

| Component | Max Pts | Logic |
|:----------|:--------|:------|
| Keyword relevance | 50 | Condition/symptom match against title + description + tags via `KEYWORD_TAG_MAP` |
| Veteran-centric | 20 | Tags containing "veteran", "peer", "peer-led", "vso", "military" |
| Free/accessible | 15 | `isFree`, `costLevel`, or tags containing "free", "sliding scale" |
| Geo-bonus (PA) | 10 | Location contains "carlisle", "pennsylvania", "pa" |
| Static rating | 5 | Numeric rating ≥ 4.5 = 5pts |

**Thresholds:** ≥80 = "Recommended", ≥60 = "Good Match", <60 = no badge

**Weakness:** The scorer is applied **after** resources are selected — it ranks what Grok gives it, but cannot inject missing resources or remove irrelevant ones that Grok hallucinated. The `KEYWORD_TAG_MAP` has only 14 condition entries and no education/career/legal domain exclusion.

### 4C. MongoDB Resource Service (`mongoResourceService.ts`)

Used by the **general chatbot only** (not Symptom Triage). Queries across 4 collections:
- `healthResources`, `educationResources`, `lifeAndLeisureResources`, `careerResources`

**Topic detection is keyword-based** (`if normalizedQuery.includes('ptsd')`) with no semantic understanding. A query like "my back hurts and I can't work" would not match any specialized category and fall to the generic `$text` search.

### 4D. Context Enhancer (`contextEnhancer.ts`)

Appends topic-specific knowledge blocks to the general chatbot prompt:
- PTSD → 40+ lines of PTSD-specific guidance
- Education → GI Bill details
- Employment → Career services

**Only 3 topics covered.** Health (non-PTSD), housing, legal, financial — all fall through to generic veteran interaction guidance. No health sub-domain routing exists.

---

## 5. Evolution Timeline (Git History)

| Commit | Date | Key Change |
|:-------|:-----|:-----------|
| `25ee64a1` | Apr 2025 | **V1 Symptom Finder** — Pure MongoDB query, zero LLM. Regex tag matching against `symptomResources` collection |
| `1698fb84` | May 2025 | **Location-aware filtering** added. Still no AI — all MongoDB `$regex` matching |
| `5ff62f47` | ~2025 | **Medical Detective V2** — First Grok integration. Single system prompt. Chunked streaming. No pre-filter |
| `313e7ed2` | ~2025 | **Med Detective V4** — Aggressive pre-filter + single Grok-4 call (<65s target) |
| `6904fa31` | ~2025 | **Med Detective V5** — Two-stage AI pipeline (extraction + reasoning). Dual model strategy |
| `8fa6a872` | Feb 2026 | **Smart Bridge V2** — Symptom Finder gets Grok AI. Bridge from Records Recon. `TRIAGE_SYSTEM_PROMPT` introduced |
| `38beebf4` | Feb 2026 | **Triage V3** — Scoring engine (`resources-scoring.ts`) added. Post-AI ranking |
| `bf0e7bb0` | Mar 2026 | **Current HEAD** — JSON sanitizer for Grok output leaking JSON into chat text |

**Key Observation:** The Symptom Finder had **no AI at all** until Feb 2026. It was purely MongoDB tag matching. The Medical Detective has been through 10+ major iterations of prompt refinement. The general chatbot (`/api/ai/chat`) has been mostly static since the original recovery commit.

---

## 6. Strengths of the Current LLM Setup

1. **Resilient fallback chain** — Every AI call has a static fallback. Zero 500 errors policy is well-implemented.
2. **Crisis detection is robust** — Both subsystems (triage + chatbot) have independent crisis keyword/regex detectors with immediate 988 routing.
3. **Medical Detective prompts are excellent** — The 3-layer extraction taxonomy, negative context gating, screening false positive exclusion, and PACT Act cross-referencing represent sophisticated prompt engineering.
4. **Smart Bridge architecture** — Typed data handoff between Records Recon → Symptom Finder via `localStorage` is clean and well-documented.
5. **Low temperature for medical tasks** — 0.1 for extraction, 0.3 for triage. Appropriate for factual/clinical contexts.
6. **Streaming with timeout management** — Medical Detective has proper overall + idle timeouts, AbortController, and retry logic.
7. **Post-AI scoring** — The 100-point rubric adds a deterministic quality layer on top of nondeterministic AI output.
8. **No HIPAA exposure** — In-memory processing, no storage, auto-delete. Well-designed for Phase 1.

---

## 7. Weaknesses and Gaps

### 7A. Resource Relevance (The Core Problem)

| Issue | Impact | Location |
|:------|:-------|:---------|
| **Static fallbacks are domain-blind** | Warrior-Scholar (education) shows for health queries | `symptom-triage/route.ts:293-311` |
| **No domain constraint in Grok prompt** | Grok can hallucinate any NGO for any query | `TRIAGE_SYSTEM_PROMPT` |
| **Scoring engine lacks exclusion logic** | Can rank irrelevant resources high if tags overlap (e.g., "veteran" + "free") | `resources-scoring.ts` |
| **No user education/career intent check** | System never asks "Are you looking for health help, education, or career resources?" | `TRIAGE_SYSTEM_PROMPT` |
| **KEYWORD_TAG_MAP has only 14 entries** | Many conditions get zero keyword relevance score | `resources-scoring.ts:25-40` |

### 7B. Prompt Architecture

| Issue | Impact |
|:------|:-------|
| **No prompt versioning** | Can't A/B test or rollback prompt changes |
| **Hardcoded location** | `"Carlisle, PA"` for all users in MVP. State resources fail for non-PA veterans |
| **VA satisfaction not captured** | Prompt asks about VA claim status but never about VA satisfaction or enrollment frustration |
| **No education context check** | If a veteran mentions "school" or "GI Bill" during health triage, the system doesn't route appropriately |
| **No conversation memory** | Each triage call is stateless — user profile from chatbot (`userProfileService.ts`) is not shared with triage |

### 7C. Model/API Configuration

| Issue | Impact |
|:------|:-------|
| **Three different API key patterns** | `GROK_API_KEY`, `XAI_API_KEY`, `NEXT_PUBLIC_GROK_API_KEY` — inconsistent, `NEXT_PUBLIC_` is client-exposed |
| **No centralized Grok client** | `grokService.ts` exists but triage/detective bypass it with their own `fetch()` calls |
| **No request/response logging** | Can't audit what Grok returns for quality improvement |
| **No token usage tracking** | Can't monitor API costs per feature |

### 7D. MongoDB Resource Layer

| Issue | Impact |
|:------|:-------|
| **Chatbot and Triage use different data sources** | Chatbot queries MongoDB; Triage relies entirely on Grok + static lists |
| **No semantic search** | `$text` search is keyword-based, misses synonyms and intent |
| **Topic detection is if/else keyword matching** | `mongoResourceService.ts:273-305` — rigid, misses compound queries |

---

## 8. Recommendations for Smarter Resource Relevance

### 8A. Immediate Fixes (No Architecture Change)

**1. Domain-gate the static fallback lists:**
Split `getAssessFallback()` into category-specific fallbacks. If the user's symptoms are health-related, exclude education-only NGOs like Warrior-Scholar from the NGO list. Use the existing `bridgeContext.conditions` or inferred category from conversation to select the right fallback set.

**2. Add domain constraint to TRIAGE_SYSTEM_PROMPT:**
```
RESOURCE RELEVANCE RULE:
- ONLY recommend NGOs whose PRIMARY mission matches the user's health concern.
- Do NOT recommend education-focused NGOs (e.g., Warrior-Scholar Project, Student Veterans of America)
  unless the veteran explicitly mentions education, GI Bill, or school.
- Do NOT recommend career-focused NGOs unless the veteran mentions employment.
- When in doubt, prefer health-focused NGOs (Cohen Veterans Network, Give An Hour, WWP mental health).
```

**3. Add an education/career intent check to the triage flow:**
After the 2 standard questions, if the user mentions "school", "GI Bill", "job", or "career", the system should route them to the appropriate page rather than trying to serve health resources for a non-health need.

**4. Expand KEYWORD_TAG_MAP in resources-scoring.ts:**
Add entries for: `hypertension`, `hearing loss`, `gerd`, `sinusitis`, `respiratory`, `mst`, `kidney`, `liver`, `cancer`, `neuropathy`, `erectile dysfunction`, `burn pit`, `pact act`. Currently only 14 of the ~85 conditions in Medical Detective's keyword list are mapped.

### 8B. Medium-Term Improvements (Pass 2)

**5. Unify the Grok client:**
Create a single `callGrok()` utility in `src/lib/ai/grokClient.ts` that all three subsystems use. Include: request/response logging, token counting, cost tracking, retry logic, and centralized API key management.

**6. Share user profile with Triage:**
Pass the chatbot's `VeteranProfile` (branch, era, conditions, location) into the triage API so the system prompt can reference the veteran's full context — not just what they typed in 2 chat messages.

**7. Add VA satisfaction signal:**
Add a third optional clarifying question or a pre-triage toggle: "How would you rate your experience with VA healthcare so far?" This lets the system weight NGO vs VA resources. A veteran frustrated with the VA should see more NGO/state alternatives ranked higher.

**8. Prompt versioning system:**
Store prompt templates in a `src/lib/ai/prompts/` directory with version numbers. Log which prompt version was used for each request. This enables A/B testing and regression tracking.

### 8C. Long-Term (Phase 2+)

**9. Replace static fallback lists with MongoDB lookup:**
When Grok fails, instead of hardcoded resources, query MongoDB with the user's keywords + category filter. This keeps resources fresh and domain-appropriate.

**10. Implement embedding-based semantic search:**
Replace `$text` keyword search in MongoDB with vector embeddings (e.g., OpenAI `text-embedding-3-small` or Grok embeddings when available). Store embeddings per resource. Query with the user's symptom description embedded. This solves the "my back hurts and I can't work" → no match problem.

**11. Feedback loop for relevance tuning:**
Track which resources users click, save, or dismiss. Use this signal to adjust scoring weights in `resources-scoring.ts` over time. A resource that gets clicked 80% of the time when shown for "PTSD" should score higher for PTSD queries.

**12. Bridge data for cross-domain routing:**
Extend the Smart Bridge to detect when a health triage reveals a non-health need (education, career, housing) and offer a one-click bridge to the appropriate page with pre-filled context — just like Records Recon → Symptom Finder today.

---

## 9. File Reference Map

| File | Role | Lines |
|:-----|:-----|:------|
| `src/app/api/health/symptom-triage/route.ts` | Triage wizard API — Grok prompts, scoring, fallbacks | 486 |
| `src/app/api/health/medical-detective/route.ts` | Records Recon API — 2-phase extraction + analysis | 1298 |
| `src/app/api/ai/chat/route.ts` | General chatbot API | 224 |
| `src/lib/ai/grokService.ts` | Shared Grok API client (chatbot only) | 220 |
| `src/lib/ai/promptBuilder.ts` | System prompt assembly for chatbot | 603 |
| `src/lib/ai/contextEnhancer.ts` | Topic-specific knowledge injection | 184 |
| `src/lib/ai/contextManager.ts` | User profile → system prompt | 249 |
| `src/lib/ai/mongoResourceService.ts` | MongoDB resource queries for chatbot | 315 |
| `src/lib/ai/siteKnowledgeBase.ts` | Site structure + veteran interaction guidelines | 289 |
| `src/lib/ai/crisisProtocol.ts` | Crisis detection + 988 routing | 240 |
| `src/lib/ai/userProfileService.ts` | In-memory veteran profile extraction | 200 |
| `src/lib/ai/voiceCommandProcessor.ts` | Voice command processing | 192 |
| `src/lib/resources-scoring.ts` | Post-AI 100-point scoring engine | 309 |
| `src/types/records-recon.ts` | Smart Bridge shared types | — |

---

## 10. Summary

The Vet1Stop LLM architecture is **functional and well-guarded** (crisis detection, fallbacks, disclaimers) but has **no domain-awareness in resource selection**. The Warrior-Scholar problem is symptomatic of a broader gap: the system treats all resources as equally valid candidates regardless of the user's actual need domain. The fix is a combination of (a) prompt-level domain constraints, (b) category-filtered fallback lists, (c) expanded scoring keywords, and (d) eventually, semantic search replacing keyword matching. No fine-tuning is needed at this stage — prompt engineering and scoring logic improvements will deliver the biggest ROI.
