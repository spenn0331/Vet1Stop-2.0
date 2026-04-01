# Vet1Stop — Supercharge Mode v2

## AI Operating Architecture & Workflow Plan

**From:** Chief of Staff (Claude Desktop)
**To:** Sean Penny, CEO & Founder
**Date:** March 31, 2026
**Version:** 2.0 — Replaces Windsurf Architect Briefing v1

---

## 1. Executive Summary

This document defines the operating architecture for Vet1Stop development — how AI tools work together, how builds happen, how context stays in sync, and how Sean's time is protected. It replaces the original Windsurf Architect Briefing (v1) with a streamlined model based on real-world experience from the first week of operations.

> **Core Principle:** Sean is the CEO, not a switchboard operator. The system should multiply his output, not create a second job managing AI tools.

### What Changed from v1

| v1 (Windsurf Plan) | v2 (This Plan) | Why |
|---|---|---|
| 7 AI tools all active | 3 active + 2 on-call | Solo founder working nights can't manage 7 tools |
| 45-min bridge checkpoints | Lane lock at start, review at end | Protects build time |
| Gemini writes specs | Claude writes specs | Claude has Notion + codebase access — fewer handoffs |
| Grok audits compliance | Claude flags PII inline during code review | Already handling real PII (Blue Button) |
| n8n syncs everything | Same, but must be activated first | All 11 workflows were built but inactive |
| Claude = "Architect" only | Claude = Chief of Staff + Architect | Reflects actual usage |

---

## 2. The AI Team

### Always Active (The Main Element)

| Tool | Codename | Role | Connected To |
|---|---|---|---|
| **Claude Desktop** | Chief of Staff + Architect | Strategy, inbox triage, sprint planning, spec writing, code review, architecture, n8n management, Notion ops, deep research | Notion, Gmail, n8n, Vercel, GitHub, Google Drive, Codebase |
| **Windsurf** | Lead Dev | Implements specs via multi-Cascade. Rapid iteration, parallel feature builds. Stays in assigned lanes. | Local codebase, terminal, GitHub |
| **n8n** | Operations (Autopilot) | Background automation that runs 24/7 without Sean. Keeps all tools and data in sync. See Section 7 for full details. | Notion, Gmail, GitHub, Claude API |

### On-Call Reinforcements (Deployed When Claude Says)

Sean does not manage these tools directly. Claude recommends when to use them based on the situation.

| Tool | Codename | Deploy When | Example |
|---|---|---|---|
| **Grok** | Intel Scout | Real-time X/Twitter intel, multi-agent validation on high-stakes decisions, trend scanning | "Ask Grok to pull recent X threads about RallyPoint's new feature launch" |
| **Gemini** | Advisor (Optional) | Image generation, Google Sheets/Drive work, third-opinion validation | "Bounce this pricing model off Gemini for a different perspective" |
| **Cursor** | QA | Final polish pass on completed features before merge. Precision edits only. | "Run Cursor over the Life & Leisure page for final cleanup" |

> Grok is paid annually — use it strategically, not daily. Gemini is $20/mo — evaluate at end of April whether the Sheets/Drive integration justifies keeping it. Cursor + GitHub Copilot overlap with Windsurf — consolidation review planned.

---

## 3. The Nightly Build Workflow

Sean works nights after his kids go to sleep — sometimes 4 hours, sometimes 1. Every minute counts. This workflow is designed to minimize startup time and maximize build output.

### Phase 1: ORIENT (5 minutes)

Sean opens Cowork. Claude briefs him immediately:

- **Inbox pretriage results** — what's new, what needs attention
- **Project status** — what's In Progress, what's blocked
- **n8n alerts** — any failed workflows, security alerts, stale leads
- **Recommendation** — "Here's what matters tonight" based on the 4 Pillars

> Sean decides: What hat am I wearing tonight? Builder? CEO/Strategy? Admin/Ops?

### Phase 2: PLAN (10-15 minutes, Builder hat only)

When building features, Claude produces a spec sheet before any code is written:

| Spec Element | What It Contains |
|---|---|
| Feature Name | Clear, one-line description of what's being built |
| Files to Create | Exact paths: src/app/life/page.tsx, src/app/api/life/route.ts, etc. |
| Files to Modify | Existing files that need changes, with specific descriptions |
| Data Model | MongoDB collections, fields, types, indexes |
| API Routes | Endpoints, methods, request/response shapes |
| Components | React components with props, state, and behavior |
| Dependencies | Any new npm packages needed |
| Danger Zone Check | Does this touch any shared files? If yes, what's the plan? |
| Acceptance Criteria | How do we know it's done? Specific, testable conditions |
| Estimated Effort | Small / Medium / Large — so Sean can plan his night |

> Sean reviews the spec. Says "LOCK IT." Only then does building begin.

### Phase 3: BUILD (Bulk of Session)

Sean pastes the locked spec into Windsurf. Building happens in parallel:

| Stream | Who | What |
|---|---|---|
| Primary Build | Windsurf (Lead Dev) | Implements the spec across 1-3 Cascade tabs |
| Support / Parallel Lane | Claude (Architect) | Available for: code review, architecture questions, debugging, or working a separate lane |
| Reinforcement (if needed) | Grok / Gemini | Claude flags when a second opinion or live intel would help |

Lane Discipline applies during the build phase. Each builder stays in their assigned directories. No two builders touch the same file. See Section 4 for the lane map.

### Phase 4: VERIFY (Before Merge)

- Windsurf commits to feature branch
- Claude reviews the diff: code quality, PII handling (real veteran data!), architectural consistency
- Issues flagged → Windsurf fixes → merge to main via PR

> **PII Alert:** Vet1Stop handles real veteran PII. Sean's own VA Blue Button report is the test dataset. Every code review must check for PII exposure — localStorage, console.log, API responses, error messages. HIPAA and 38 CFR compliance are not hypothetical.

### Phase 5: CLOSE (5 minutes)

- Claude writes session log to Notion (Meeting Notes / Decision Log)
- Log includes: what was built, what broke, key decisions, next steps, files touched
- n8n auto-syncs activity back to CEO Dashboard
- Next session picks up clean — no re-explaining

---

## 4. Lane Discipline & Safety

The codebase is divided into independent directory scopes called "lanes." Each builder claims a lane before starting. No two builders ever work in the same lane simultaneously.

### Lane Map

| Lane | Scope | Isolated? |
|---|---|---|
| Life & Leisure | `src/app/life/*`, `src/app/api/life/*` | Yes — new directory |
| Careers | `src/app/careers/*`, `src/app/api/careers/*` | Yes — self-contained |
| Health Phase 2 Tools | `src/app/health/tools/*` (new sub-routes) | Yes — new sub-route |
| Local VOB Polish | `src/app/local/*`, `src/data/businesses.ts` | Yes — isolated |
| Auto-Fill | `src/app/auto-fill/*` | Yes — self-contained |
| Partner Dashboard | `src/app/partner/*`, `src/app/api/partner/*` | Yes — new directory |

### Danger Zone Files (One Builder at a Time, Ever)

These files are shared infrastructure. If any builder needs to modify one, ALL other builders pause until the change is committed and pushed.

| File | Why It's Dangerous |
|---|---|
| `src/app/layout.tsx` | Root layout — every page renders through this |
| `src/components/common/Header.tsx` | Global navigation — visible on every page |
| `src/components/common/Footer.tsx` | Global footer |
| `src/app/globals.css` | Global styles — affects entire app |
| `src/lib/mongodb.ts` | Database singleton — 26 API routes depend on it |
| `src/contexts/AuthContext.tsx` | Authentication state — all protected routes use it |
| `tailwind.config.js` / `next.config.js` | Build configuration — can break everything |
| `package.json` / `package-lock.json` | Dependencies — version conflicts cause build failures |
| `src/components/shared/*` | Shared components are cross-cutting by definition — any edit affects multiple pages |
| `src/components/shared/BrowseResourceCard.tsx` | Used by Health AND Education pages |

---

## 5. Git Branch Workflow

> **Rule: Never push directly to main. All work happens on feature branches.**

| Action | Command / Process |
|---|---|
| Start new feature | `git checkout main && git pull origin main` then `git checkout -b sean/<feature-name>` |
| Josh's branches | `josh/<feature-name>` |
| Commit convention | `feat:` / `fix:` / `refactor:` / `docs:` + short description |
| Before merge | Claude reviews diff for quality + PII safety |
| Merge to main | PR required — 1 approval to merge (Claude or Sean) |
| Rollback protocol | If a merged feature breaks something: revert PR immediately, fix on branch, re-merge |

### Phase 0 Prerequisites (Before Parallel Sessions)

These structural changes must be completed before running Windsurf and Claude in parallel:

| Task | Status | Why |
|---|---|---|
| Enable git branch protection on main | Not Done | Prevents accidental pushes to production |
| Move BrowseResourceCard.tsx to `src/components/shared/` | Not Done | Currently in health/ — will cause conflicts when Education needs it |
| Extract nav config from Header.tsx to `src/constants/navigation.ts` | Not Done | Decouples nav data from shared component |
| Activate + test at least 1 n8n workflow | Not Done | Validates the sync layer before depending on it |
| Delete stale branches (medical-detective-v4.2-*) | Not Done | Dead code, 113-116 commits behind main |
| Verify `npm run build` passes clean on main | Not Done | Clean baseline prevents inherited TS errors on every feature branch |
| Create `.env.local.example` with all required env vars | Not Done | Prevents "works on my machine" issues when Josh picks up branches |

---

## 6. Context Persistence — How We Never Lose the Thread

The biggest risk in a multi-AI setup is context loss between sessions and between tools. Here's how each gap is covered:

### Between Sean and Claude

- **Session Logs** — Written to Notion Meeting Notes / Decision Log at every session close. Includes what was done, decisions made, next steps, files touched.
- **Auto-Memory** — Claude maintains persistent memory files (user profile, project state, feedback, references) that carry across conversations.
- **CLAUDE.md** — Project instructions file that every Claude session reads on startup.

### Between Claude and Windsurf

- **The Spec Sheet** — The contract between Architect and Lead Dev. Claude writes it, Windsurf implements it. Windsurf doesn't need strategy reasoning — just clear build instructions.
- **`.workflow/` Directory** — Shared ground truth on disk: project_status.md, master-strategy.md, supercharge-mode-v2.md (this file). Both tools read from here.

### Between Sessions and the Real World

- **n8n Automations** — GitHub pushes auto-log to Notion. Session logs auto-extract action items. Inbox auto-triages. Intel briefing lands in email weekly. Runs 24/7 without Sean.
- **Scheduled Tasks** — Daily inbox pretriage (8 PM) and weekly cockpit review (Thursday 9 PM) run automatically in Cowork.

---

## 7. n8n Operations Layer — The Nervous System

n8n is the background automation platform that keeps everything connected. It runs 24/7 without Sean's involvement. Once workflows are activated, they handle the repetitive operational work that would otherwise eat into Sean's limited nighttime hours.

### What n8n Does (and Doesn't Do)

n8n is **not** an AI you talk to. It's a workflow automation engine that connects services together. Think of it as a set of "if this, then that" pipelines that fire on schedules or events. Each workflow is a chain of nodes: a trigger (schedule, webhook, or event), data fetching, processing (sometimes via Claude API), and an action (update Notion, send email, create alert).

**Cost model:** n8n Cloud Starter = $20/mo for 2,500 executions. Current projected usage: ~800-1,000 executions/mo. API costs for Claude-powered workflows estimated at $8-13/mo total across all workflows.

### Tier 1 — Activate Immediately

These are the foundational workflows. They keep the CEO Dashboard accurate and save Sean 5-10 hours/week of manual work.

| # | Workflow | ID | Trigger | What It Does | Cost/Run |
|---|---|---|---|---|---|
| 1 | **CEO Intel Briefing** | mqQAk7CrZarXkMEr | Schedule (Saturday 10 AM) | Fetches 9 RSS feeds (VA News, Realtor, TechCrunch AI, HousingWire, MilitaryTimes, HN AI, Latent Space, Simon Willison, AI News) + GitHub commits. Sends all data to Claude API with web search enabled. Claude produces an 8-section HTML executive intelligence email covering: Action Required, Veteran & VA Watch, RERN / Real Estate Intel, AI & Stack Updates, Funding & Opportunities, Competitor Radar, Learning Pick, and Vet1Stop Pulse. Delivered to Sean's Gmail. | ~$0.15 |
| 2 | **Notion Inbox Auto-Triage** | iH3DQlft1P1e5VoY | Schedule (daily) | Polls the CEO Inbox database in Notion for items with no Tag or Priority set. Sends each item's title and content to Claude API for classification. Claude returns a Tag (Revenue Idea, Tech Idea, Building, Learning, Admin, etc.) and Priority (High/Medium/Low). n8n updates the Notion page with the classification. Sean sits down to a pre-sorted inbox instead of raw captures. | ~$0.01 |
| 3 | **GitHub → Notion Project Sync** | oljn5h5OSWIvZLjz | Webhook (on git push) | Listens for GitHub push events on the Vet1Stop-2.0 repo. Parses commit messages, author, branch, and changed files. Creates a new item in the CEO Inbox tagged "Building" with a summary of what was committed. This means the CEO Dashboard always shows recent dev activity without Sean checking GitHub manually. Requires: GitHub webhook URL added to repo settings. | $0 |
| 4 | **Session Log Action Extractor** | yh6FwtERC191myh3 | Trigger (new Notion page in Meeting Notes DB) | When a new session log is created in the Meeting Notes / Decision Log database, this workflow fires. It sends the log content to Claude API, which extracts discrete action items. Each action item is created as a new CEO Inbox entry with appropriate tags. This closes the loop — session logs automatically generate follow-up tasks. | ~$0.03 |
| 5 | **Dependabot Security Monitor** | HegEyKH3RvwdpnRd | Schedule (daily) | Queries the GitHub API for Dependabot vulnerability alerts on Vet1Stop-2.0. Filters for critical and high severity issues. Creates CEO Inbox items for any new alerts so Sean is aware of security issues without manually checking GitHub. Requires: GitHub personal access token with `security_events` scope. | $0 |

### Tier 2 — Activate After Tier 1 Is Stable

These add polish and catch things that would otherwise slip through the cracks.

| # | Workflow | ID | What It Does |
|---|---|---|---|
| 6 | **Stale B2B Lead Alert** | GJeSGoIjoBnTo48g | Polls the B2B Sales Pipeline in Notion. If any lead has been in the same stage for more than 7 days with no activity, creates an alert in CEO Inbox. Prevents deals from going cold. |
| 7 | **Weekly CEO Cockpit Briefing** | Bc4BrgK3h6t4DqqQ | Pulls data from Projects DB, CEO Inbox, and B2B Pipeline every Thursday. Compiles into a structured briefing with the 4 CEO Questions (tracking to assumptions? needle-mover? blockers? family guardrails?). |
| 8 | **Daily Stand-Up Digest** | ppZwWcYzcsDNLbb1 | Morning email summarizing yesterday's GitHub commits, new inbox items, and pipeline changes. Lightweight daily awareness without opening multiple tools. |
| 9 | **PR Review Reminder** | UP7rd58A96NRvXUR | Monitors open pull requests on the repo. If a PR sits without review for more than 24 hours, creates an alert. Keeps the build pipeline flowing. |
| 10 | **Stale Branch Cleanup** | DHYxn7aD9w7ul4c0 | Weekly check for branches that are significantly behind main. Creates reminders to delete or merge them. Keeps the repo clean. |
| 11 | **Gmail Auto-Label** | MqJZ27SySbDVwYeN | Auto-labels and stars incoming emails from known B2B leads, RERN agents, or partners. Keeps the Gmail inbox organized without manual sorting. |

### Tier 3 — Future (Idea Backlog)

These are planned but not yet built. Each has a trigger condition — they get built when the business reaches the right stage.

| Workflow | Build When |
|---|---|
| Vercel Deploy Pipeline Monitor | When deploy frequency exceeds 3x/week |
| NGO of the Month Rotation | When NGO partnerships are active |
| Firebase Auth Digest | When user signups begin |
| Community QA Monitor | When community features launch |
| API Health Check | When production traffic is live |
| B2B Lead Follow-Up Sequences | When first B2B deal enters pipeline |
| RERN Lead Routing | When RERN recruitment begins |

### n8n Activation Checklist (Sean's Desktop, 15-20 min)

1. Open each workflow in n8n Cloud (vet1stop.app.n8n.cloud)
2. For each workflow: click the credential dropdown on each node → select or add the correct credential (Notion, Gmail, Claude API, GitHub)
3. Click **Publish** on each workflow to activate the trigger
4. For GitHub → Notion Sync: add webhook URL `https://vet1stop.app.n8n.cloud/webhook/github-sync` to Vet1Stop-2.0 repo settings (Settings → Webhooks → Add, select Push + PR events)
5. For Dependabot Monitor: create a GitHub personal access token with `security_events` scope and add as n8n credential
6. For CEO Intel Briefing: click Publish to activate the Saturday schedule trigger (currently 0/1 inactive)
7. Test one workflow manually to confirm end-to-end (recommended: Inbox Auto-Triage — fastest to verify)

---

## 8. Connected Tools & Capabilities

Claude's current direct access in Cowork mode:

| Connector | Status | Capabilities |
|---|---|---|
| **Notion** | Connected | Full read/write: search, fetch pages, create pages, update databases, query views, manage comments |
| **Gmail** | Connected | Search messages, read threads, create drafts, get profile |
| **n8n** | Connected | Search/create/update/publish/execute workflows, search nodes, validate workflows |
| **Vercel** | Connected | List projects, view deployments, read build/runtime logs, search docs |
| **GitHub** | Connected | Repository access via CLI (gh commands), browsing via Chrome |
| **Google Drive** | Connected (Limited) | Shows connected in UI but no dedicated tools. Can search via Notion AI search. Cannot browse/read files directly. |
| **Codebase** | Mounted | Full read/write access to Vet1Stop 2.1 folder on Sean's machine |

---

## 9. PII & Compliance Framework

> **Vet1Stop handles real veteran PII. Sean's own VA Blue Button report is the test dataset. This is not hypothetical — HIPAA and 38 CFR apply today.**

### PII Safety Checklist (Every Code Review)

- No PII in localStorage or sessionStorage (use server-side storage)
- No PII in console.log statements (even in dev mode)
- No PII in API error responses (use generic error messages)
- No PII in URL parameters or query strings
- No PII in client-side state that persists after logout
- Firebase Auth tokens handled securely (httpOnly cookies, not localStorage)
- MongoDB queries scoped to authenticated user only

### When to Deploy Grok for Compliance

Claude handles routine PII checks during code review. Deploy Grok (multi-agent mode) for:

- Pre-launch full compliance audit (HIPAA, 38 CFR, xAI ToS)
- New data handling features (NVWI registry, anonymization pipeline)
- Any feature that touches the Blue Button data pipeline

---

## 10. Current Project Status

### Build Queue

| Order | Feature | Status |
|---|---|---|
| 1 | Health Page MVP | Complete |
| 2 | Education Page | Complete |
| 3 | Local VOB Directory | In Progress — Leaflet map + 25 seed businesses built |
| 4 | Life & Leisure Page | Next after Local |
| 5 | Careers Page | Shell exists, needs API routes + build-out |
| 6 | Partner Analytics Dashboard | Planned after Life & Leisure (required before first Mission Sponsor pitch) |
| 7 | PCS Commander + Smart Bridge | Year 1 Q3 |

### Monthly Tool Burn: $275.18/mo

| Category | Tools | $/mo | Notes |
|---|---|---|---|
| Infrastructure | GoDaddy + GitHub + Vercel + Notion | $48.30 | |
| AI Coding | Windsurf + Cursor + Copilot | $143.60 | Overlap — consolidation review planned |
| AI Research | Grok + Gemini | $63.28 | Grok annual, Gemini monthly — evaluate April |
| Automation | n8n Cloud | $20.00 | |

> Potential savings: Up to $101/mo ($1,212/yr) by consolidating Windsurf vs Cursor and Grok vs Gemini overlaps. Consolidation review scheduled as a project in Notion.

---

## 11. Golden Rules

All builders and all AI tools follow these rules without exception:

**1. 4 Pillars First** — Every decision filters through: Profit-First > Default Alive > Mission-First > Time-First.

**2. 3 Mission Filters** — Before any new idea: (1) Does it advance "The First and Only Stop"? (2) Does it keep us Default Alive? (3) Does it protect Sean's time?

**3. Plan First, Code Second** — Numbered plan + files list before any code. No exceptions.

**4. One Driver Rule** — Never edit the same file or directory as another builder. Check lane assignments first.

**5. Branch-Only Workflow** — Never push to main. Feature branches only. PRs required.

**6. Lane Discipline** — Stay in your assigned directory. Do not touch other lanes.

**7. Zero-Clutter Mandate** — Never create .fixed/.temp/.new/.old files. Clean code only.

**8. PII Vigilance** — Every code review checks for PII exposure. Real veteran data is in play.

**9. Operations Keeps the Loop** — n8n syncs context. No manual copy-paste between tools.

**10. Session Logs Are Sacred** — Every session ends with a thorough log to Notion. Write it like you're briefing your replacement.

---

## 12. Reference Files

Key files on disk that all builders should check before starting work:

| File | What It Contains |
|---|---|
| `.workflow/project_status.md` | Current sprint, build queue, active work table |
| `.workflow/master-strategy.md` | Business strategy, feature roadmap, revenue model |
| `.workflow/supercharge-mode-v2.md` | This file — lane map, workflow, operating architecture |
| `.workflow/ai-command-center.md` | Full team roster, golden rules, sync architecture |
| `.workflow/cto-onboarding-and-collaboration.md` | Josh's setup, branch workflow, collaboration rules |
| `CLAUDE.md` | Claude's project instructions — read at every session start |

---

*Semper Fi. Let's build.*
