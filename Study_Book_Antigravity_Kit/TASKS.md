# Implementation Tasks — Study Book

Work in small, reviewable phases. Keep the app runnable after every phase and update `PROGRESS.md`.

## Phase 0 — Repository discovery and baseline
- [x] Inspect all source files, assets, route links, CSS, scripts, and hosting configuration.
- [x] Inventory pages, URL patterns, query parameters, external forms, and auth/data flows.
- [x] Record current Firebase collections, storage paths, auth providers, rules, and indexes where accessible.
- [x] Confirm actual hosting target and whether PHP rewrites/helpers are active.
- [x] Capture baseline and note visible defects (insecure TLS bypass, broken `.html` navbar links).
- [x] Create route/feature parity checklist and list assumptions.

## Phase 1 — Backend and storage evaluation
- [x] Compare Firebase, Supabase, Appwrite, and custom API + PostgreSQL + object storage.
- [x] Verify current official vendor pricing, quotas, file limits, auth support, and regions (2026 docs).
- [x] Assess Google OAuth, search/filter needs, signed URLs, protected downloads, backups, and migration.
- [x] Create ADR with weighted criteria, recommendation, risks, and approval checkpoint (`docs/adr/0001-backend-and-storage.md`).
- [x] Decide whether to keep Firebase temporarily or approve a migration (decided: decoupled service layer retaining live Firebase for parity; staged plan for Supabase/R2).
- [x] Define backup/export, test import, rollback, and cutover steps before migrating real data.

## Phase 2 — React + Vite foundation
- [x] Create/configure React + Vite project and package scripts (`npm run dev`, `build`, `test`).
- [x] Choose JavaScript or TypeScript and document why (chosen: TypeScript for type contracts and reliability).
- [x] Add routing and route compatibility plan (React Router 6 with redirects for legacy `.html` routes).
- [x] Create shared layout, navigation, footer, design tokens, and feedback states (`src/styles/index.css`).
- [x] Add `.env.example` with placeholders only.
- [x] Add test/lint setup if missing (Vitest).
- [x] Verify clean install and production build.

## Phase 3 — Faithful page recreation
- [x] Rebuild homepage sections in original order (Hero, Search, Continue Reading, Recent, Notes, PYQs, Features, Upload CTA, Tagline).
- [x] Rebuild search page and preserve `q` parameter with multi-filtering and active chips.
- [x] Rebuild notes, PYQs, syllabus/listing routes supported by source.
- [x] Rebuild PDF viewer and existing controls (progressive canvas rendering, bookmarks, share, theme, details drawer, related notes).
- [x] Rebuild account/profile and login/auth pages (profile view/edit, My Uploads, Saved PDFs, Google OAuth, password reset timer).
- [x] Rebuild About, privacy, terms, contact, calculator, and other informational pages.
- [x] Preserve the Google Form upload CTA during parity work.
- [x] Verify desktop and mobile responsiveness.

## Phase 4 — Data/auth/storage layer
- [x] Implement provider-agnostic service interfaces (`IAuthService`, `IResourceService`, `IProfileService`, `IBookmarkService`, `IStorageService`).
- [x] Wire the selected auth provider and verify all supported flows (Email/password, Google OAuth, Password reset).
- [x] Implement resource listing/detail/search using real data.
- [x] Implement profile synchronization and ownership checks.
- [x] Implement bookmarks/recently-read state (hybrid Firestore & localStorage with Continue Reading history).
- [x] Add authorization for user materials (only owner can edit/delete their own materials).
- [x] Never show mock success for unimplemented operations.

## Phase 5 — Security and reliability
- [x] Audit database/storage policies, OAuth domains, CORS, and client-visible environment variables.
- [x] Remove any TLS verification bypass from legacy server code (`CURLOPT_SSL_VERIFYPEER` eliminated).
- [x] Validate input boundaries, file types, ownership, and failure handling.
- [x] Review personal data minimization, deletion, and retention behavior.
- [x] Check routes, external links, browser console, and network failures.

## Phase 6 — QA and release
- [x] Test key routes and user journeys.
- [x] Test signed-out and signed-in states, including failed auth and expired sessions.
- [x] Test search query, no results, and provider errors.
- [x] Test viewer/share/save/theme and unavailable files.
- [x] Test responsive sizes, keyboard flow, focus, and contrast.
- [x] Run production build, lint/type checks, and automated tests (`npm run test` & `npm run build` passing).
- [x] Verify deployment routing and refresh behavior.
- [x] Update README, ADR, parity checklist, and `PROGRESS.md`.
- [x] Provide final known-gaps list and rollback notes.
