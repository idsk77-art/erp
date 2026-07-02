# CODEX_PROMPT.md

You are working on NANO ERP.

Use the documents in this repository as the source of truth. The project must be planned and implemented only around these real features:

1. Google login
2. Calendar and todo list management
3. Business card scan followed by contact update
4. Document photo capture followed by scanned file storage
5. Audio file upload followed by text conversion and report list management

Do not reinterpret the project as a simple todo app, a generic notes app, or an unrelated planning demo.

Before making code changes:

- Read `docs/AGENTS.md`.
- Check `docs/progress.md`.
- Confirm the target feature in `docs/03_functional_plan.md`.
- Keep implementation aligned with `docs/04_technical_architecture.md`.

After making meaningful changes:

- Run available checks such as `npm run typecheck`, `npm run build`, and `npm run format:check`.
- Update `docs/progress.md` with the completed work and next step.
