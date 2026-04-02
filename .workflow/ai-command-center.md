# Vet1Stop AI Command Center — Permanent Workflow

**Last Updated:** March 31, 2026
**Operator:** Sean Penny (CEO/Founder)
**CTO:** Josh Diehl

---

## The Executive Team (Supercharge Mode v2)

> **Updated March 31, 2026** — Simplified from 7 always-active tools to 3 active + 2 on-call. See `.workflow/supercharge-mode-v2.md` for full details.

### Always Active (The Main Element)

| AI Tool | Codename | Role | What They Deliver |
|---------|----------|------|-------------------|
| **Claude Desktop** | **Chief of Staff + Architect** | Strategy, inbox triage, sprint planning, spec writing, code review, architecture, n8n management, Notion ops, deep research | Sean's first stop every session. Writes specs for Windsurf. Reviews all code before merge. Connected to Notion, Gmail, n8n, Vercel, GitHub, codebase. |
| **Windsurf** | **Lead Dev** | Implements specs via multi-Cascade. Rapid iteration, parallel feature builds. | IDE-integrated builder — takes locked specs and ships fast. Multiple parallel Cascade tabs for isolated lanes. |
| **n8n** | **Operations (Autopilot)** | Background automation: GitHub sync, inbox triage, intel briefing, security alerts, session log extraction. | Runs 24/7 without Sean. Keeps all tools and data in sync. See Section 7 of supercharge-mode-v2.md. |

### On-Call Reinforcements (Deployed When Claude Says)

| AI Tool | Codename | Deploy When |
|---------|----------|-------------|
| **Grok** | **Intel Scout** | Real-time X/Twitter intel, multi-agent validation, trend scanning, pre-launch compliance audits |
| **Gemini** | **Advisor (Optional)** | Image generation, Google Sheets/Drive work, third-opinion validation. Evaluate April — may be cut. |
| **Cursor** | **QA** | Final polish pass on completed features before merge. Precision edits only. |

---

## Golden Rules (copy-paste into every plan)

1. **Plan First, Code Second** — numbered plan + files list before any code.
2. **Zero-Clutter Mandate** — delete every `.fixed`/`.temp`/`.new`/`.old` file on sight.
3. **Next.js 15 Safety** — `localStorage`/`window` ONLY inside `useEffect` + `"use client"`.
4. **One Driver Rule** — never have two AI tools editing the same file or directory simultaneously. Architect (Claude Desktop) and Lead Dev (Windsurf) must check the Active Work table before starting.
5. **Living Master Strategy** — follow `.workflow/master-strategy.md` exactly.
6. **Lane Discipline** — parallel Cascades stay in their assigned directories. See `.workflow/supercharge-mode-v2.md`.
7. **Branch-Only Workflow** — never push directly to `main`. All work on feature branches (`sean/` or `josh/` prefix).
8. **Operations Keeps the Loop** — n8n syncs context between all tools automatically. No manual copy-pasting between AI tools.

---

## How We Operate

### The Nightly Build Flow (v2)
```
Sean opens Cowork → Claude briefs him (inbox, projects, alerts)
    → Sean decides: what hat tonight? (Builder / CEO / Admin)
    → [Builder hat] Claude reviews codebase + dashboard + master strategy
    → Claude writes spec sheet (exact files, components, API routes, acceptance criteria)
    → Sean reviews → "LOCK IT"
    → Sean pastes spec into Windsurf
    → Windsurf builds (1-3 Cascade tabs, lane discipline)
    → Claude available in parallel (code review, architecture, debugging, separate lane)
    → [If needed] Claude says "run this by Grok" or "bounce off Gemini"
    → Windsurf commits to feature branch
    → Claude reviews diff (quality + PII safety)
    → Merge via PR
    → Claude writes session log to Notion
    → n8n syncs activity back to Dashboard
```

### Multi-Builder Coordination (Architect + Lead Dev)

Claude Desktop (Architect) and Windsurf (Lead Dev) can both edit files on Sean's machine. They must NEVER work on the same files simultaneously.

**Before starting any task:**
1. Check the Active Work table in `project_status.md`
2. Claim your lane (directory scope)
3. Stay in your lane — do not touch files outside your scope

**Architect vs. Lead Dev — When to use which:**

| Situation | Use Architect (Claude Desktop) | Use Lead Dev (Windsurf) |
|-----------|-------------------------------|------------------------|
| Build an entire new page from scratch | ✅ Autonomous, deep reasoning | |
| Rapid small edits, quick iteration | | ✅ IDE-integrated, fast |
| Complex refactoring across many files | ✅ Large context window | |
| Multiple features in parallel tabs | | ✅ Cascade tabs |
| Run build + verify before merge | ✅ Can run terminal | ✅ Can run terminal |
| Code review before PR | ✅ Best deep analysis | |
| Interactive back-and-forth building | | ✅ Conversational flow |

**Maximum parallel streams on one machine:**
```
Claude Desktop (Architect)  → 1 autonomous lane
Windsurf Tab 1 (Lead Dev)   → 1 interactive lane
Windsurf Tab 2 (Lead Dev)   → 1 interactive lane (if isolated)
─────────────────────────────────────────────────
= 3 parallel build streams per machine
= 6 total with Josh's machine
```

### Context Flow (How Each Tool Stays Informed)

```
┌──────────────────────────────────────────────────────────────────┐
│                     Operations (n8n)                              │
│               The nervous system — always running                │
│                                                                  │
│   GitHub ──webhook──→ n8n ──Notion API──→ Dev Activity Log       │
│   Notion ──polling──→ n8n ──GitHub API──→ notion-sync.md         │
│   Cron   ──daily────→ n8n ──everywhere──→ Daily Pulse            │
└──────────────────────────────────────────────────────────────────┘
       │            │            │            │            │
       ▼            ▼            ▼            ▼            ▼
 ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
 │ Architect│ │ Lead Dev │ │ Chief of │ │ Advisor  │ │ Counsel  │
 │ (Claude  │ │(Windsurf)│ │  Staff   │ │(Gemini)  │ │ (Grok)   │
 │ Desktop) │ │          │ │ (Notion) │ │          │ │          │
 │          │ │          │ │          │ │          │ │          │
 │ Reads:   │ │ Reads:   │ │ Reads:   │ │ Reads:   │ │ Reads:   │
 │.workflow/│ │.workflow/│ │Dev Log   │ │GitHub    │ │Prompts + │
 │files     │ │files +   │ │Sprint    │ │repo +    │ │master-   │
 │directly  │ │notion-   │ │Board     │ │.workflow/│ │strategy  │
 │on disk   │ │sync.md   │ │Daily     │ │files     │ │.md       │
 │          │ │          │ │Pulse     │ │          │ │          │
 └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘
```

### What Each Tool Reads (Source of Truth)

| Tool | Primary Context Source | Updated By |
|------|----------------------|------------|
| **Chief of Staff** (Notion) | Notion databases: Dev Activity Log, Sprint Board, Daily Pulse | Operations (n8n) auto-populates from GitHub |
| **Architect** (Claude Desktop) | `.workflow/` files read directly from disk | Reads same files as Lead Dev; updates project_status.md after autonomous builds |
| **Advisor** (Gemini) | GitHub repo: `.workflow/` files | Lead Dev / Architect update after each sprint |
| **Counsel** (Grok) | Your prompts + `.workflow/master-strategy.md` | You feed context; master-strategy.md is canonical |
| **Lead Dev** (Windsurf) | `.workflow/` files + `.workflow/notion-sync.md` | Operations (n8n) syncs from Notion; Windsurf updates project_status.md |
| **QA** (Cursor) | `.workflow/` files (same as Lead Dev) | Same as Lead Dev |
| **Operations** (n8n) | Watches GitHub webhooks + Notion database changes + cron schedules | Self-operating — runs automatically |

---

## Operations (n8n) — Core Sync Workflows

### Sync 1: Code → Chief of Staff (Lead Dev ships → Notion knows)

```
Trigger:  GitHub webhook — push to any branch
Logic:    Parse commit message, extract branch, files, timestamp
Action:   Create row in Notion "Dev Activity Log" database
Result:   Chief of Staff sees every commit without manual updates
```

### Sync 2: Chief of Staff → Code (Notion plans → Lead Dev knows)

```
Trigger:  Notion database change — Sprint Board task status changes
Logic:    Read task title, assignee, priority, target files
Action:   GitHub API → update .workflow/notion-sync.md in repo
Result:   Lead Dev reads priorities at start of every session
```

### Sync 3: Daily Pulse (End-of-day summary → Everyone)

```
Trigger:  Cron — daily at 11 PM ET
Logic:    GitHub API (today's commits) + Notion API (task changes) + MongoDB (resource counts)
Action:   1. Update Notion "Daily Pulse" page
          2. Discord/email notification to Sean + Josh
          3. Update .workflow/daily-pulse.md in repo
Result:   Every tool has a fresh snapshot every morning
```

### Additional Operations Workflows

| Workflow | Trigger | Action | Priority |
|----------|---------|--------|----------|
| Git Commit Reminder | Cron (every 3 hrs) | Alert if no commits in 3+ hours | 🔥 Immediate |
| Content Freshness | Cron (weekly) | Ping all resource URLs, flag 404s | 🔥 Immediate |
| Build Health Monitor | GitHub webhook (push) | Alert if build fails | 🔥 Immediate |
| Real Estate Lead Capture | Webhook (form submit) | Save lead → notify broker → confirm veteran | ★ Before RERN live |
| NVWI Data Pipeline | Cron (weekly) | Aggregate wellness cohort data | After 10 opt-ins |
| NGO of the Month | Cron (monthly) | Auto-select top-rated NGO | After 10+ NGOs |
| Partner Analytics Digest | Cron (weekly) | Stats email to paying partners | After Partner Dashboard |
| New Resource Alert | MongoDB change | Notify admin of new resource | After 100+ resources |

---

## Notion Database Structure (For Chief of Staff)

### Database 1: Dev Activity Log (auto-populated by Operations)

| Column | Type | Source |
|--------|------|--------|
| Date | Date | Commit timestamp |
| Who | Select (Sean / Josh) | Parsed from branch prefix |
| Branch | Text | GitHub webhook |
| Commit Message | Text | GitHub webhook |
| Files Changed | Text | GitHub webhook |
| Status | Select (Pushed / Merged / Reverted) | GitHub event type |

### Database 2: Sprint Board (managed by you + Chief of Staff)

| Column | Type | Who Updates |
|--------|------|-------------|
| Task | Title | You or Chief of Staff |
| Assignee | Select (Sean / Josh) | You or Chief of Staff |
| Priority | Select (🔥 / ★ / Normal) | You or Chief of Staff |
| Status | Select (Planned / In Progress / Done) | You (Operations syncs to `.workflow/`) |
| Target Files | Text | You or Chief of Staff |
| Lane | Select (Health / Education / Careers / Local / Life) | You or Chief of Staff |
| Notes | Text | Chief of Staff adds strategic notes |

---

## Quick Reference: Who To Call

| Situation | Call... | Why |
|-----------|---------|-----|
| "What should I build next?" | **Claude** (Chief of Staff) | Has full Notion access, project status, and strategy context |
| "Write me a spec for this feature" | **Claude** (Architect) | Has codebase + Notion + master strategy — writes exact specs |
| "Build this feature now" | **Windsurf** (Lead Dev) | Takes locked spec, ships fast via multi-Cascade |
| "Review this code before I merge" | **Claude** (Architect) | Deep analysis, PII checks, architectural consistency |
| "Is this approach legal/compliant?" | **Grok** (Intel Scout) | Deploy for HIPAA, 38 CFR, xAI ToS audits — Claude flags when to use |
| "What are veterans saying about X on Twitter?" | **Grok** (Intel Scout) | Real-time X/Twitter access |
| "Generate an image for the site" | **Gemini** or **Grok** | Both can generate images — Claude can't |
| "Polish this component / fix a small bug" | **Cursor** (QA) | Precision edits only |
| "Automate this recurring task" | **Claude** → **n8n** | Claude manages n8n workflows directly |
| "Why didn't Notion know about yesterday's commits?" | **n8n** (Operations) | Check GitHub → Notion sync workflow health |

---

## Related Docs

- `.workflow/supercharge-mode-v2.md` — Lane map, nightly build workflow, n8n operations, golden rules
- `.workflow/cto-onboarding-and-collaboration.md` — Josh setup, branch workflow, golden rules
- `.workflow/project_status.md` — Current sprint status + build queue
- `.workflow/master-strategy.md` — Business strategy, feature roadmap, rev