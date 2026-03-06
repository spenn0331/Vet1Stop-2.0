# Vet1Stop AI Command Center — Permanent Workflow (Feb/Mar 2026)

## The Dream Team (never deviate)
| AI Tool     | Nickname              | Role & What They Give You                              |
|-------------|-----------------------|--------------------------------------------------------|
| Gemini      | XO / PM / CTO         | God-Tier Prompts, specs, business logic, project_status.md |
| Grok        | Intel Officer & co-PM | Internal LLM prompts, privacy/legal audits, Triple-Track research, plan overrides |
| Windsurf    | Architect / Builder   | Heavy lifting, plans first, executes exactly            |
| Cursor      | Surgeon               | Polish only — never on large features                   |

## Golden Rules (copy-paste into every plan)
1. Plan First, Code Second — numbered plan + files list before any code.
2. Zero-Clutter Mandate — delete every .fixed/.temp/.new/.old file on sight.
3. Next.js 15 Safety — localStorage/window ONLY inside useEffect + "use client".
4. One Driver Rule — never fight Cursor on the same file.
5. Living Master Strategy — follow `.workflow/master-strategy.md` exactly.

## How We Operate
- Gemini/Grok drop God-Tier Prompt → Windsurf outputs plan → audit → "PLAN LOCKED" → Sean says "CODE" → ship.
- Always update `.workflow/project_status.md` at end of sprint.
