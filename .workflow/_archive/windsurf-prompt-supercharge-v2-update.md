# Windsurf Prompt: Supercharge Mode v2 Update

**Drop this entire prompt into Windsurf.**

---

## Context

The Chief of Staff (Claude Desktop) and I reviewed your Architect Briefing (v1) tonight and built a revised version: **Supercharge Mode v2** (`.workflow/supercharge-mode-v2.md`). It's already in the `.workflow/` directory.

The key changes from your original plan:
- **Simplified team:** 3 always-active tools (Claude, Windsurf, n8n) + 2 on-call (Grok, Gemini). Down from 7 all active.
- **Claude's role expanded:** Chief of Staff + Architect (not just Architect). Claude writes specs, Windsurf implements them.
- **45-min bridge checkpoints removed:** Replaced with lane lock at session start, single review at end.
- **Gemini no longer writes specs:** Claude does this since it has direct Notion + codebase access.
- **PII compliance added:** We're handling real veteran PII (my Blue Button report). Every code review must check for PII exposure.
- **n8n section expanded:** Full workflow-by-workflow breakdown with IDs, triggers, and activation checklist.
- **Build workflow defined:** 5-phase nightly flow (Orient → Plan → Build → Verify → Close).

**The lane discipline, Danger Zone files, git branch workflow, and golden rules from your v1 are preserved — they were solid.**

## What I Need You to Do

1. **Read `.workflow/supercharge-mode-v2.md`** in full. Flag anything you disagree with or would change as Lead Dev.

2. **Update the following files** to reference `supercharge-mode-v2.md` instead of `supercharge-mode.md`:

   - **`.workflow/project_status.md`** — Line 12 references `.workflow/supercharge-mode.md`. Update to `.workflow/supercharge-mode-v2.md`.

   - **`.workflow/ai-command-center.md`** — Line 30 references supercharge-mode.md for Lane Discipline, and Line 215 references it in the file list. Update both to supercharge-mode-v2.md.

   - **`.workflow/architect-briefing.md`** — Line 139 and Line 188 reference supercharge-mode.md. This file is now superseded by supercharge-mode-v2.md. Add a note at the top: `> **SUPERSEDED:** This document has been replaced by supercharge-mode-v2.md as of March 31, 2026. Kept for historical reference only.`

3. **Do NOT modify or delete `supercharge-mode.md`** — keep it as historical reference. The v2 file replaces it operationally.

4. **Confirm** that your `.workflow/` docs are consistent — no other files should point to the old supercharge-mode.md without noting the v2 update.

## Your Role in v2

You are **Lead Dev**. Your job:
- Implement specs that Claude (Chief of Staff + Architect) writes
- Use multi-Cascade for parallel feature builds
- Stay in your assigned lane (directory scope)
- Commit to feature branches, never push to main
- Follow the Golden Rules in Section 11 of supercharge-mode-v2.md

The spec sheet is the contract between us. Claude writes it, you build it. You don't need strategy context — just clear build instructions with exact files, components, API routes, and acceptance criteria.

## Questions for You

- Does the Lead Dev role as defined work for how you operate?
- Any structural issues with the lane map that would cause problems during multi-Cascade sessions?
- Anything missing from the Phase 0 prerequisites that you'd add before we start parallel builds?

Let me know your thoughts, then make the file updates.
