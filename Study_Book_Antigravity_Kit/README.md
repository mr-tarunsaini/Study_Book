# Study Book — Antigravity Documentation Kit

This kit guides a faithful recreation of Study Book using React + Vite, with bug fixes and a documented evaluation of alternatives to Firebase and file storage.

## Included files
- `MASTER_PROMPT.md` — paste into Antigravity as the main instruction.
- `PRD.md` — product scope and acceptance criteria.
- `ARCHITECTURE.md` — target architecture and backend/storage evaluation plan.
- `RULES.md` — product, security, and quality rules.
- `DESIGN.md` — visual fidelity and accessibility guidance.
- `TASKS.md` — phased implementation checklist.
- `PROGRESS.md` — baseline, decisions, and progress log.

## Recommended use
1. Put all seven Markdown files in the project repository, preferably under `docs/` (keep `MASTER_PROMPT.md` easy to find).
2. Open the existing repository in Antigravity.
3. Paste `MASTER_PROMPT.md` and ask the agent to read all project docs and inspect the repository before editing.
4. Ask it to complete Phase 0 and Phase 1 first. Review the backend/storage ADR before approving a data migration.
5. Keep the current Firebase project and data intact until a replacement is tested and migration approved.

This is a documentation/planning kit. It does not contain a rebuilt website, live credentials, or a completed backend migration.
