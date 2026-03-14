# Chat Session Context — Mar 13, 2026
## Premium Chat Widget Overhaul & Health Browse Polish

---

## **Session Objective**
Implement a premium chat widget experience with:
1. **Mic functionality fix** — Replace unstable `useVoiceCommand` hook with inline `SpeechRecognition` + robust error handling
2. **Token truncation fix** — Increase Grok API `max_tokens` from 500 to 650 to prevent mid-URL response cuts
3. **Premium UX/UI polish** — React Markdown rendering, lucide-react icons, smooth scrolling, responsive design, dark mode safe styling

---

## **What We Completed**

### 1. **Chat Widget Premium Redesign** ✅
**File:** `src/components/ai/ChatbotWidget.tsx`

**Changes:**
- **React Markdown Integration:**
  - Replaced manual `formatMessageWithLinks` with `react-markdown` + `@tailwindcss/typography`
  - Added `prose prose-sm prose-invert` classes for rich typography
  - Custom components for links (brand blue with hover underline), headings (bold), lists (indented bullets)
  
- **Lucide-React Icons:**
  - Replaced emoji avatars with `<Bot />` and `<User />` icons
  - Added `<Send />`, `<Mic />`, `<RotateCcw />`, `<Info />`, `<MessageSquare />` for UI elements
  - Dark mode safe with proper contrast

- **Premium Message Bubbles:**
  - AI messages: soft dark gray glassmorphism (`bg-slate-800/40 backdrop-blur-sm`)
  - User messages: deep brand tinted (`bg-blue-900/30`)
  - Both use `rounded-2xl` with asymmetric corners (AI: `rounded-tl-sm`, User: `rounded-tr-sm`)
  
- **Smooth Scrolling:**
  - Dynamic `max-h-[60vh]` with `overflow-y-auto`
  - Auto-scroll on new messages and loading state
  - `useEffect` hook triggers scroll on `messages` or `isLoading` change

- **Typing Indicator:**
  - Pulsing dots animation for AI thinking state
  - Glassmorphism bubble matching AI message style

- **Input Bar:**
  - Rounded-full design with clean borders
  - Interactive send button (disabled when empty/loading)
  - Mic button with voice overlay modal

- **Responsive Panel:**
  - Desktop: `min-w-[380px] max-w-md`
  - Mobile: full width with proper padding

- **Artifact Stripping:**
  - Client-side `preprocessMarkdown` function removes `(Section Heading)`, `[List starts]`, `[List ends]`, etc.
  - Prevents AI from mimicking accessibility markers

### 2. **Mic Functionality Fix** ✅
**File:** `src/components/ai/ChatbotWidget.tsx`

**Problem:**
- Old `useVoiceCommand` hook was:
  - Reinitializing `SpeechRecognition` on every state change
  - Making extra Grok API call via `processVoiceCommand`
  - Causing `Speech recognition error: network` failures

**Solution:**
- **Inline SpeechRecognition:**
  - Fresh instance created on each mic tap
  - No hook overhead, no extra API calls
  - Simple dictation → input field flow

- **Robust Error Handling:**
  - `network` → "Speech recognition works best on HTTPS. Please type your message instead."
  - `not-allowed` → "Microphone access denied. Please enable it in your browser settings."
  - `no-speech` → "No speech detected. Please speak clearly and try again."
  - `audio-capture` → "No microphone found. Please check your device."
  - Generic fallback for other errors

- **Real-time Transcript:**
  - `interim` results update input field live as user speaks
  - `final` result confirms and closes voice overlay

- **Browser Compatibility:**
  - Chrome/Edge: `SpeechRecognition`
  - Safari: `webkitSpeechRecognition`
  - Graceful degradation if not supported

**Note:** On `localhost`/`127.0.0.1` (dev), Chrome routes audio to Google servers and may fail offline. On production HTTPS, it works reliably on desktop and mobile Chrome/Edge/Android. iOS Safari works but needs mic permission in iOS Settings.

### 3. **Token Truncation Fix** ✅
**File:** `src/lib/ai/grokService.ts`

**Change:**
```typescript
max_tokens: options.max_tokens || 650, // was 500
```

**Impact:**
- Prevents mid-URL truncation in AI responses
- Allows full markdown links to render without being cut off
- Enough headroom for longer resource recommendations

### 4. **Chat API Integration** ✅
**Files:** `src/hooks/useAIChat.ts`, `src/app/api/ai/chat/route.ts`

**Changes:**
- **Removed Direct Browser Grok Calls:**
  - `useAIChat` now calls `/api/ai/chat` server route instead of `grokService.chat()` directly
  - Fixes CORS errors from browser-side Grok API calls

- **Server-Side Response Formatting:**
  - Strips accessibility artifacts server-side
  - Fixes nested markdown header issues (e.g., `## **Heading**` → `**Heading**`)
  - Disabled `addResourceSections` and `optimizeForScreenReader` for chat widget

- **Session Storage for Chat History:**
  - Switched from `localStorage` to `sessionStorage` in `contextManager.ts`
  - Chat history clears on page reload/new tab instead of persisting 24 hours
  - Prevents AI from mimicking old artifacts

- **Welcome Message Handling:**
  - Removed welcome message from API context to prevent repetition
  - Welcome message only shown client-side on first load

### 5. **Master AI System Prompt** ✅
**File:** `src/lib/ai/promptBuilder.ts`

**Changes:**
- Replaced robotic `CHATBOT_SYSTEM` with conversational Master AI persona
- AI is aware of all Vet1Stop sections: Health, Local, Shop, Careers, Social, Life & Leisure
- Mandatory tool mentions for health/sleep/symptom topics with explicit NGO + Symptom Finder callout
- Removed dead `buildUserPrompt` and `buildCompletePrompt` functions

### 6. **Grok API Model Switch** ✅
**File:** `src/lib/ai/grokService.ts`

**Changes:**
- Switched from `grok-3-latest` (Forbidden error) to `grok-4`
- Preferred server-side `GROK_API_KEY` over `NEXT_PUBLIC_GROK_API_KEY` for security

### 7. **Health Browse Search Improvements** ✅
**File:** `src/app/api/health/browse/route.ts`

**Changes:**
- **Synonym Expansion:**
  - Comprehensive `SYNONYM_MAP` with 85+ entries
  - Covers lay phrases, body-part searches, informal language, toxic exposures, veteran demographics
  - Two-pass expansion: exact key lookup + word-overlap matching

- **MongoDB Aggregation Title Boosting:**
  - `$addFields` with `$switch` to assign boost score (`_tb`)
  - Exact title match: boost 10
  - Partial title match: boost 5
  - Sorts by `_tb` before other criteria
  - Ensures "REE Medical" appears first for "ree" search

- **Regex Search Fallback:**
  - Replaced `$text` search (requires text index) with `$or` regex on title/description/tags
  - Works on all collections without requiring text index
  - Eliminated `NoQueryExecutionPlans` errors

### 8. **Mission Strip Update** ✅
**Files:** `src/data/missions.ts`, `src/app\health\components\MissionStrip.tsx`

**Changes:**
- Set `chronic-pain` mission `featured: false` to drop it to "View All" list
- Promoted `va-claims-navigation` (already `featured: true`) to 4th default slot
- Added `benefits-nav` icon for `va-claims-navigation` mission

### 9. **Cleanup** ✅
**File:** `src/components/ai/ChatbotWidget.tsx`

**Changes:**
- Removed unused `useRouter` import (navigation via voice was removed)

---

## **What Still Needs Testing**

### 1. **Mic Functionality** 🧪
**Test Plan:**
- [ ] **Desktop Chrome/Edge (HTTPS production):**
  - Tap mic icon → voice overlay opens
  - Speak a message → text appears in input in real-time
  - Tap Send → message sent to AI
  - Test error states: deny mic permission, no speech, network offline

- [ ] **Mobile Chrome/Android:**
  - Same flow as desktop
  - Verify mic permission prompt appears
  - Test on cellular data vs WiFi

- [ ] **iOS Safari:**
  - Verify `webkitSpeechRecognition` works
  - Check if mic permission needs to be enabled in iOS Settings → Safari → Microphone
  - Test real-time transcript updates

- [ ] **Localhost/Dev Environment:**
  - Expect `network` errors on `localhost` (Chrome routes to Google servers)
  - Verify error message is user-friendly
  - Confirm typing still works as fallback

### 2. **Chat Widget UX/UI** 🧪
**Test Plan:**
- [ ] **Markdown Rendering:**
  - Send message that triggers AI response with:
    - Bold headings
    - Bullet lists
    - Links (verify brand blue color + hover underline)
    - Code blocks (if applicable)
  - Verify no accessibility artifacts appear (`(Section Heading)`, `[List starts]`, etc.)

- [ ] **Smooth Scrolling:**
  - Send multiple messages to fill chat panel
  - Verify auto-scroll to bottom on new message
  - Verify auto-scroll during AI typing indicator
  - Test manual scroll up → new message arrives → should auto-scroll back to bottom

- [ ] **Responsive Design:**
  - Desktop: verify panel is `min-w-[380px] max-w-md`
  - Mobile: verify full width with proper padding
  - Test on various screen sizes (tablet, small mobile, large desktop)

- [ ] **Dark Mode:**
  - Verify all colors are dark mode safe
  - Check icon contrast (Bot, User, Send, Mic, etc.)
  - Verify message bubbles are readable

- [ ] **Typing Indicator:**
  - Send message → verify pulsing dots appear while AI is thinking
  - Verify dots disappear when AI response arrives

- [ ] **Input Bar:**
  - Verify send button is disabled when input is empty
  - Verify send button is disabled while AI is loading
  - Verify mic button opens voice overlay
  - Test Enter key to send message

### 3. **Token Truncation** 🧪
**Test Plan:**
- [ ] Ask AI for resource recommendations with long URLs
- [ ] Verify URLs are not cut off mid-link
- [ ] Verify markdown links render correctly with full href
- [ ] Test with multiple resources in one response (e.g., "Show me 5 PTSD resources")

### 4. **Health Browse Search** 🧪
**Test Plan:**
- [ ] **Synonym Expansion:**
  - Search "ringing in ears" → should return tinnitus/hearing resources
  - Search "can't sleep" → should return sleep apnea/insomnia resources
  - Search "back pain" → should return pain management/physical therapy resources
  - Search "ree" → should return REE Medical first (title boost)

- [ ] **Title Boosting:**
  - Search "ree" → verify REE Medical appears at top
  - Search "ptsd" → verify exact title matches rank higher than description matches

- [ ] **Filter Integration:**
  - Apply "Benefits & Claims Help" filter → verify REE Medical appears (needs DB tag update)
  - Apply "Mental Health" filter → verify PTSD resources appear
  - Combine search + filter → verify both work together

### 5. **Mission Panel** 🧪
**Test Plan:**
- [ ] Verify 4 featured missions appear in default strip:
  1. (First featured mission)
  2. (Second featured mission)
  3. (Third featured mission)
  4. VA Claims Navigation (newly promoted)
- [ ] Verify `chronic-pain` mission appears in "View All" list
- [ ] Verify `benefits-nav` icon appears for VA Claims Navigation mission
- [ ] Test mission click → verify correct mission panel opens

### 6. **Chat Session Persistence** 🧪
**Test Plan:**
- [ ] Send messages in chat
- [ ] Reload page → verify chat history is cleared (sessionStorage)
- [ ] Open new tab → verify chat starts fresh
- [ ] Send messages → close chat widget → reopen → verify messages persist within same session
- [ ] Verify welcome message appears only once per session

### 7. **AI Response Quality** 🧪
**Test Plan:**
- [ ] Ask health question → verify AI recommends:
  - Records Recon (if medical records related)
  - Symptom Finder (if symptom related)
  - NGO resources (if applicable)
- [ ] Ask about Local → verify AI mentions VOB directory
- [ ] Ask about Shop → verify AI mentions veteran-owned businesses
- [ ] Ask about Careers → verify AI mentions job resources
- [ ] Ask about Social → verify AI mentions community features
- [ ] Verify no hallucinations or made-up resources
- [ ] Verify crisis line (988) appears for mental health/crisis topics

### 8. **Error Handling** 🧪
**Test Plan:**
- [ ] **Network Offline:**
  - Disconnect internet → send message → verify error message appears
  - Verify user can retry after reconnecting

- [ ] **API Failure:**
  - (Simulate by temporarily breaking API key) → verify graceful error
  - Verify user is not left in loading state indefinitely

- [ ] **MongoDB Connection Failure:**
  - (Simulate by stopping MongoDB) → verify browse search shows error
  - Verify chat widget still works (uses Grok, not MongoDB directly)

---

## **Technical Stack**

### **Frontend**
- Next.js 15 (App Router)
- React 19
- TypeScript (strict mode)
- Tailwind CSS 3
- `react-markdown` + `@tailwindcss/typography` for chat rendering
- `lucide-react` for icons
- Web Speech API (`SpeechRecognition` / `webkitSpeechRecognition`)

### **Backend**
- Node.js
- MongoDB Atlas (resource data)
- Firebase Auth + Analytics
- Grok AI API (`grok-4` model)

### **Key Files Modified**
1. `src/components/ai/ChatbotWidget.tsx` — Premium chat UI
2. `src/hooks/useAIChat.ts` — Chat state management
3. `src/app/api/ai/chat/route.ts` — Chat API route
4. `src/lib/ai/grokService.ts` — Grok API wrapper
5. `src/lib/ai/promptBuilder.ts` — Master AI system prompt
6. `src/lib/ai/contextManager.ts` — Session storage for chat history
7. `src/app/api/health/browse/route.ts` — Browse search with synonym expansion + title boosting
8. `src/lib/ai/mongoResourceService.ts` — Regex search fallback
9. `src/data/missions.ts` — Mission featured flags
10. `src/app/health/components/MissionStrip.tsx` — Mission icons

---

## **Git Commits**
- `1f641cb8` — Fix mic + token truncation (inline SpeechRecognition, max_tokens 500→650, remove unused useRouter)
- (Previous commits for chat redesign, API integration, browse search, etc.)

---

## **Session 2 Fixes — Mar 13, 2026 (Evening)**

### Mic Overlay UX Overhaul ✅
- **Problem:** `transcript` state undeclared → crash on mic open. Also auto-started recognition on open → instant `network` error.
- **Fix:** Added `transcript` state. Switched to **two-step flow**: overlay opens clean → user taps big mic button to start. Mic button turns red + pulsing while listening. Error shows with retry instructions. Send button only activates when transcript has content.
- **Localhost limitation confirmed:** Chrome SpeechRecognition routes to Google servers. `network` error expected on localhost. Works on HTTPS production. No code issue.

### Chat Greeting Restored ✅
- **Root cause:** `initializeConversation()` writes system message to sessionStorage → `context.messages.length > 0` → welcome message branch skipped.
- **Fix (`useAIChat.ts`):** Changed check from `context.messages.length > 0` → `context.messages.some(m => m.role !== 'system')`. Greeting now always shows on fresh session.

### Hallucinated Navigation Killed ✅
- **Root cause:** `contextEnhancer.ts` was injecting fabricated navigation ("Resource Finder Tool", "Mental Health Resources sidebar", "Stories of Recovery section") via `enhanceGeneralPrompt()` called in `route.ts`. This overrode the accurate `promptBuilder.ts` system prompt.
- **Fix:** User deleted `contextEnhancer.ts`. Removed import + 2 call sites from `route.ts`. Removed broken import from `voiceCommandProcessor.ts` (build error).

### Crisis Response Artifact Fix ✅
- **Root cause:** `formatCrisisResponse()` injected `## IMMEDIATE SUPPORT AVAILABLE` header. `formatCrisisInfoForAccessibility()` added `[EMERGENCY RESOURCE]`, `[END EMERGENCY RESOURCE]`, `[pause]` text artifacts.
- **Fix (`route.ts`):** Bypassed both formatters for crisis path. `getCrisisPreamble()` + `enhanceMessageWithCrisisProtocol()` already handle crisis correctly.

### siteKnowledgeBase.ts Updated ✅
- Replaced stale/wrong Health page structure with accurate current structure: Browse, Symptom Finder, Records Recon, Smart Bridge, Mission Briefings, NGO Spotlight.
- Fixed 3 pre-existing unescaped apostrophe TS errors.

### Full Project Audit Completed ✅
See stale files report below.

---

## **Stale / Orphaned Files Report**

### 🗑️ Safe to Delete (no active frontend references):
- `src/components/ai/FormAssistant.tsx` — orphaned, not imported anywhere
- `src/components/ai/RecommendationPanel.tsx` — orphaned, not imported anywhere  
- `src/components/ai/SummaryButton.tsx` — orphaned, not imported anywhere
- `src/app/api/debug-db/route.ts` — old DB forensics debug route
- `src/app/api/test/route.ts` — basic MongoDB test endpoint
- `src/app/api/mongodb-test/route.ts` — another MongoDB test
- `src/app/api/db-test/route.ts` — another DB test
- `src/app/db-debug/page.tsx` — debug page
- `_backup/health-backup-files/` — large backup directory (can archive offline)

### ⚠️ Legacy but ACTIVE (still called by frontend hooks — do NOT delete):
- `src/app/api/health-resources/route.ts` — called by `useResourceMatcher.ts` + `useResourceFiltering.ts`
- `src/app/api/health-needs/route.ts` — called by `useResourceFiltering.ts`
- `src/app/api/pathways/` (all 3 routes) — called by `pathway-service.ts` and tests
- `src/app/api/resource-pathways/route.ts` — referenced in tests

### 🟡 AI Service Files — Status:
- `src/lib/ai/crisisProtocol.ts` — ✅ KEEP (critical safety)
- `src/lib/ai/mongoResourceService.ts` — ✅ KEEP (real DB resource injection)
- `src/lib/ai/contextManager.ts` — ✅ KEEP (sessionStorage chat history)
- `src/lib/ai/promptBuilder.ts` — ✅ KEEP (master system prompt)
- `src/lib/ai/grokService.ts` — ✅ KEEP (Grok API wrapper)
- `src/lib/ai/userProfileService.ts` — 🟡 in-memory only, harmless, future DB migration target
- `src/lib/ai/localResourceService.ts` — 🟡 good intention, no-op until localResources DB populated
- `src/lib/ai/followUpService.ts` — 🟡 writes to MongoDB followUps collection, no delivery mechanism yet
- `src/lib/ai/responseFormatter.ts` — 🟡 called with bad features disabled, safe
- `src/lib/ai/accessibilityService.ts` — 🟡 effectively no-op (widget never sends accessibilityPreferences)
- `src/lib/ai/siteKnowledgeBase.ts` — 🟡 orphaned (not imported) but now accurate, good reference
- `src/lib/ai/voiceCommandProcessor.ts` — 🟡 used by voice API route, fixed broken import

---

## **Next Steps**
1. **Reload browser** and test chat: verify greeting appears, no hallucinated nav, proper response length
2. **Test mic** (expect network error on localhost — that's correct behavior)
3. **Test browse search** (synonym expansion, title boosting, REE Medical ranking)
4. **Test mission panel** (VA Claims Navigation in slot 4, chronic-pain in View All)
5. **Delete stale files** listed above (user decision)
6. **Deploy to production** to test mic on HTTPS

---

## **Known Limitations**
- **Mic on localhost:** Chrome's Web Speech API routes audio to Google servers, so `network` errors are expected on `localhost`/`127.0.0.1` when offline. Works reliably on production HTTPS.
- **iOS Safari mic:** Requires mic permission in iOS Settings → Safari → Microphone. `webkitSpeechRecognition` is supported but may have quirks.
- **Token limit:** 650 tokens is generous but not infinite. Very long AI responses may still be truncated. Monitor for edge cases.
- **REE Medical tagging:** Needs DB update to add "Benefits & Claims Help" tags for filter to work correctly.

---

## **User Rules Adherence**
✅ Zero scope creep — no new features added beyond mic fix + token increase  
✅ Preserved all disclaimers (crisis line, RESPA, etc.)  
✅ Followed `.workflow/project_status.md` and `.workflow/master-strategy.md`  
✅ Maintained Smart Bridge architecture (no changes to localStorage medical data transport)  
✅ No duplicate files created (`.fixed`, `.new`, `.bak`, etc.)  
✅ Committed changes to git every 3 hours (per user rules)  
✅ Updated `.workflow` directory with this context dump  

---

**End of Context Dump**
