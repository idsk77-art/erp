# AGENTS.md

## Project Identity

This repository is for NANO ERP, a lightweight business productivity app focused on authentication, calendar and todo management, contact updates from business cards, document scan storage, and audio-to-text report management.

## Development Principles

- Build only for the NANO ERP scope described in `docs/`.
- Do not drift into a generic todo app, note app, or unrelated CRM.
- Prefer TypeScript with strict typing.
- Keep features small, testable, and traceable to the planning documents.
- Separate product planning, technical decisions, and progress history.
- Update `docs/progress.md` whenever a meaningful implementation step is completed.
- Do not commit secrets, local `.env` files, scan images, recordings, or user data.

## Source Of Truth

- Overall scope: `docs/01_overall_plan.md`
- UX and screen direction: `docs/02_design_plan.md`
- Feature behavior: `docs/03_functional_plan.md`
- System architecture: `docs/04_technical_architecture.md`
- Folder structure: `docs/05_folder_structure.md`
- Work history: `docs/progress.md`

## Implementation Rules

- Use TypeScript for application code.
- Validate external inputs before saving or processing.
- Keep authentication, file upload, OCR, speech-to-text, and report generation boundaries explicit.
- Prefer service modules over placing business logic directly in UI handlers.
- When choosing libraries or APIs, document the reason in the relevant planning file or progress log.
