# Progress Log — Study Book

## Current status
**Stage:** Full Production Build Verified & Automated Test Suite Passing  
**Frontend decision:** React 18 + Vite + TypeScript (Strict Mode)  
**Backend/storage decision:** Decoupled Service Architecture (Retaining live Firebase project `studybook-15297` for immediate zero-friction parity; ADR 0001 recommends staged migration to Supabase + Cloudflare R2 upon decision owner approval)  
**Fidelity target:** 100% Faithful Recreation with Bug Fixes, Responsive Layouts, and Hardened Security

---

## Completed Phases Log

### Phase 0: Repository Discovery & Baseline
- **Date:** October 2026
- **Files Inspected:**
  - `Study Book/index.html`, `search.html`, `viewer.html`, `viewer.php`, `account.html`, `login.html`, `calculator.html`, `contact.html`, `about.html`, `privacy_policy.html`, `terms_conditions.html`, `.htaccess`, `firebase.json`, `CNAME`, `robots.txt`, `sitemap.xml`, `auth.js`, `script.js`, `style.css`, assets.
- **Inventory & Findings:**
  - Confirmed Firebase project ID `studybook-15297`, Firestore collections (`study_materials`, `users`, `contact_messages`), and Storage bucket (`studybook-15297.firebasestorage.app`).
  - Discovered critical security flaw in legacy `viewer.php`: `CURLOPT_SSL_VERIFYPEER = false` (TLS verification bypass).
  - Confirmed hosting mismatch: GitHub Pages static deployment cannot run PHP; rewrites to `/notes/**` require client-side SPA routing.
  - Identified broken navigation links in legacy markup: `notes.html`, `pyqs.html`, `syllabus.html` linked in navbars but missing on disk.

### Phase 1: Backend and Storage Evaluation (ADR 0001)
- **Date:** October 2026
- **Deliverable:** `docs/adr/0001-backend-and-storage.md`
- **Vendors Evaluated:** Firebase, Supabase, Appwrite, Custom API + PostgreSQL + Cloudflare R2 / AWS S3.
- **Official 2026 Limits Verified:**
  - *Supabase*: 500 MB DB, 1 GB storage, 5 GB egress, 50k MAUs (Pauses after 7 days inactivity).
  - *Appwrite*: 1 DB, 2 GB storage, 5 GB bandwidth, 75k MAUs (Pauses after 7 days inactivity; hard cutoff on quota).
  - *Cloudflare R2*: 10 GB free, **$0.00/GB egress** (Zero egress fees forever).
  - *Firebase*: 1 GiB Firestore, 50k MAUs. Storage requires Blaze plan; egress costs $0.12/GB.
- **Decision:** Decoupled service layer (`src/services/`). Live Firebase backend retained for zero-friction parity without migrating production data prematurely. Supabase + Cloudflare R2 recommended for post-parity migration upon owner approval.

### Phase 2: React + Vite + TypeScript Foundation
- **Date:** October 2026
- **Setup:** Vite 5, React 18, React Router 6, TypeScript 5.5, Vitest 2.
- **Files Created:**
  - `package.json`, `tsconfig.json`, `vite.config.ts`, `src/vite-env.d.ts`, `.env.example`, `.gitignore`.
- **Layout & Design Tokens:**
  - `src/styles/index.css`: Full color tokens (`:root` & `body.dark-mode`), Canva collapsible sidebar (`body.canva-mode`), cards, buttons, toast notifications, modals, skeletons.
  - Assets transferred to `public/assets/` and `public/logo.png`.

### Phase 3: Faithful Page Recreation
- **Date:** October 2026
- **Pages Implemented:**
  - `HomePage.tsx`: Header, hero, live search bar with dropdown autocomplete, Continue Reading, Recently Uploaded, Explore Notes, Practice PYQs, Why Study Book feature cards, Share Your Notes CTA, and tagline.
  - `SearchPage.tsx`: Query sync with URL `?q=...`, multi-filtering (category, course, college, year), filter chips, results count, empty & loading states.
  - `ViewerPage.tsx`: Top bar (title, back, theme toggle, bookmark, share, info toggle), progressive high-DPI canvas PDF rendering, double-click full-screen, related notes, sliding metadata drawer.
  - `CalculatorPage.tsx`: AKTU SGPA, YGPA, and CGPA calculators with exact credit formulas for semesters 1 through 8.
  - `AccountPage.tsx`: Profile view/edit mode with college/course/branch datalists, My Uploads tab with edit/delete modals, Saved PDFs tab with pagination, logout confirmation modal.
  - `LoginPage.tsx`: Login/Register tabs, password reset with 60-second cooldown timer, Google OAuth popup sign-in.
  - `AboutPage.tsx`, `ContactPage.tsx`, `PrivacyPolicyPage.tsx`, `TermsConditionsPage.tsx`, `NotFoundPage.tsx`.

### Phase 4: Decoupled Service Architecture
- **Date:** October 2026
- **Services Implemented:**
  - `src/services/authService.ts`: `IAuthService` contract + Firebase Auth implementation.
  - `src/services/resourceService.ts`: `IResourceService` contract + Firestore search/filtering/CRUD.
  - `src/services/profileService.ts`: `IProfileService` contract + Firestore profile syncing.
  - `src/services/bookmarkService.ts`: `IBookmarkService` contract + hybrid Firestore & localStorage bookmarking + Continue Reading persistence.
  - `src/services/storageService.ts`: `IStorageService` contract + Firebase Storage file management.
- **Context Providers:**
  - `AuthContext.tsx`, `ThemeContext.tsx`, `ToastContext.tsx`.

### Phase 5: Security Hardening & Bug Fixes
- **Date:** October 2026
- **Remediations:**
  - Removed all insecure TLS verification bypasses (`CURLOPT_SSL_VERIFYPEER = false`).
  - No secret keys in frontend bundles; only `VITE_` public client configurations used.
  - Handled broken legacy navbar routes (`notes.html`, `pyqs.html`, `syllabus.html`) with compatibility redirects.
  - Sandboxed PDF rendering to canvas without executing unverified embedded scripts.
  - Preserved canonical Google Form upload CTA (`https://forms.gle/zvqRWNyxxjJ1iJWq9`) while enforcing profile completion checks.

### Phase 6 & 7: Quality Assurance & Production Release
- **Date:** October 2026
- **Automated Tests:**
  - `src/utils/calculator.test.ts`: AKTU grade point conversion and weighted SGPA calculation (Passed).
  - `src/services/bookmarkService.test.ts`: Bookmark state toggling and Continue Reading queue management (Passed).
  - `src/services/resourceService.test.ts`: Search queries across title, subject, description, and multi-field filters (Passed).
  - **Test Outcome:** 10/10 tests passed across 3 test suites.
- **Production Build:**
  - `npm run build` (`tsc && vite build`) succeeded with 0 errors.
  - Chunks optimized: `react-vendor` (164 kB), `firebase-vendor` (486 kB), application bundle (82 kB). Total gzip size: ~190 kB.

### Phase 8: Subject Cards Redesign, Profile Initial, Viewer Details Fix & In-App Upload Modal
- **Date:** October 2026
- **Tasks Delivered:**
  1. **Subject Cards Redesign (`DocumentCard.tsx` & `index.css`)**:
     - Accurately recreated the card layout from `media_1793112507308_9c8f74ac.png`.
     - 20px rounded outer border with soft shadow and `#0086ff` active/hover highlight.
     - Top preview box: 190px height, 14px rounded corners, `#f8fafc` background (dark mode `#1e2430`), centered blue document icon (`#0086ff`), and bold subtitle `"Preview unavailable"`.
     - Floating circular bookmark button positioned top-right over preview container with hover scaling and bookmark persistence.
     - Bold title (`font-weight: 700`) and structured metadata (`Subject • Type • X days ago`).
  2. **User Avatar Initial on Log in (`Sidebar.tsx`, `MobileTopBar.tsx`, `index.css`)**:
     - When logged in, replaced generic profile icon in navigation and sidebar with a circular gradient avatar badge displaying the first letter of user's Full Name.
     - Synchronized across desktop sidebar and mobile header bar.
  3. **Viewer Details Cross Button & Sliding Drawer Fix (`ViewerPage.tsx` & `index.css`)**:
     - Rebuilt the document details sliding sidebar to slide out smoothly on desktop and mobile (`right: 0` when open, `right: -360px` when closed; bottom sheet on mobile).
     - Fixed close cross button with dedicated `.v-close-info-btn` class, 36px touch target, and high z-index.
     - Added semi-transparent backdrop overlay (`.viewer-info-overlay`) to dismiss drawer on outside tap/click.
  4. **In-App Upload Modal Dialog with Google Form Fallback (`UploadNotesModal.tsx`)**:
     - Created `UploadNotesModal` with PDF drag-and-drop validation (PDF only, max 20MB, file size formatting).
     - Fields: Document Title, Subject, Resource Type selector, Course, Branch, University/College, and Description.
     - Integrated with `storageService.uploadFile` (Firebase Storage) and `resourceService.saveMaterial` (Firestore).
     - Connected to "Share Your Notes" CTA on `HomePage`, "Upload Notes" in `Sidebar`, and "Upload Notes" in `AccountPage`.
     - Preserved canonical Google Form link (`https://forms.gle/zvqRWNyxxjJ1iJWq9`) as a fallback option at the bottom of the modal.
- **Verification:**
  - 10/10 Vitest tests passing.
  - Production build (`tsc && vite build`) passing with zero errors.

### Phase 9: Profile Auto-Fetch for Uploads, Calculator A-F & Credit Controls, Mobile Scroll & Viewer Polish
- **Date:** October 2026
- **Tasks Delivered:**
  1. **Upload Modal Profile Auto-Fetch & Google Form Removal (`UploadNotesModal.tsx`)**:
     - Removed Course, Branch, and College/University inputs from the UI.
     - Automatically fetches and submits profile values from the logged-in user (`user.course`, `user.branch`, `user.college`).
     - Removed the Google Form fallback notice banner and all external Google Form links across the app.
  2. **CGPA/SGPA Calculator Logic Overhaul (`CalculatorPage.tsx` & `calculator.test.ts`)**:
     - Enforced input constraint: marks cannot exceed 100 (auto-clamped between 0 and 100).
     - Standardized grade mapping to A, B, C, D, E, F:
       - 90–100 $\rightarrow$ A (10 pts)
       - 80–89 $\rightarrow$ B (9 pts)
       - 70–79 $\rightarrow$ C (8 pts)
       - 60–69 $\rightarrow$ D (7 pts)
       - 40–59 $\rightarrow$ E (5 pts)
       - < 40 $\rightarrow$ F (0 pts)
     - Real-time visual grade badge next to input.
     - Enforced mathematical cap: calculated SGPA, YGPA, and CGPA can never exceed 10.00.
     - Added interactive credit stepper (`-` and `+` buttons and numeric field) per subject row to increase or decrease credits dynamically.
  3. **Mobile Subject Cards Scrollable Track (`index.css` & `DocumentGrid.tsx`)**:
     - Converted home page subject card sections on mobile (`<= 768px`) to a smooth horizontal scrolling track with scroll-snap alignment and hidden scrollbars.
     - Preserved vertical grid for search results with `.search-results-grid`.
  4. **Mobile PDF Viewer Polish (`ViewerPage.tsx` & `index.css`)**:
     - Adjusted dynamic fit scale lower bound from 0.8 to 0.35, ensuring PDF canvas fits 100% of mobile screen width without clipping or horizontal overflow.
     - Styled mobile top bar with compact action buttons and responsive document title.
     - Added mobile sheet handle to sliding drawer.
  5. **Login Page Image Removal on Mobile (`LoginPage.tsx` & `index.css`)**:
     - Hidden the large illustration on mobile devices (`<= 768px`) so the login/registration form card is prominent, clear, and immediate.
- **Verification:**
  - 10/10 Vitest tests passing.
  - Production build (`tsc && vite build`) passing with zero errors.

### Phase 10: Desktop Horizontal Scrolling for Subject Cards
- **Date:** October 2026
- **Tasks Delivered:**
  1. **Desktop Subject Cards Horizontal Scrolling (`index.css`)**:
     - Configured `.document-grid` as a horizontally scrollable track on desktop as well as mobile (`display: flex; overflow-x: auto; scroll-snap-type: x mandatory;`).
     - Added a clean, subtle scrollbar (`6px` height, rounded track and thumb) that appears on hover and allows smooth trackpad/wheel panning.
     - Cards maintain a fixed width (`260px` on desktop, `240px` on mobile) with scroll snap alignment.
     - Preserved all manual style customizations made by the user (including dark mode container colors, mobile margins, etc.).
     - Kept `.search-results-grid` as a multi-column wrapping grid for search results.
- **Verification:**
  - 10/10 Vitest tests passing.
  - Production build (`tsc && vite build`) passing with zero errors.

---

## Route & Feature Parity Checklist

- [x] Home page (`/`, `/index.html`) — Hero, Live Search, Continue Reading, Recently Uploaded, Notes, PYQs, Features, Upload CTA, Tagline, Footer.
- [x] Redesigned Subject Cards (`DocumentCard.tsx`) — Matching reference screenshot with floating bookmark and fallback preview.
- [x] Profile Initial Avatar — Displays first uppercase letter of user's Full Name upon login in sidebar and top navigation.
- [x] Search page (`/search`, `/search.html`) — Preserves `q` query parameter, category/course/college/year filters, active chips, loading/empty states.
- [x] Document Viewer (`/notes/:slug`, `/viewer`, `/viewer.html`) — Document preview, title, working details drawer with fixed cross button, bookmarks, share modal, theme controls, related resources.
- [x] AKTU GPA Calculator (`/calculator`, `/calculator.html`) — SGPA (Sem 1-8), YGPA, and CGPA calculations with accurate credit tables.
- [x] My Account (`/account`, `/account.html`) — Profile view/edit mode, My Uploads (view/edit/delete), Saved PDFs, Logout modal.
- [x] Authentication (`/login`, `/login.html`) — Email/password login, registration, password reset with 60s cooldown, Google sign-in.
- [x] In-App Notes Upload System (`UploadNotesModal.tsx`) — Native PDF upload with Firebase Storage & Firestore, with Google Form as fallback.
- [x] Legal & Informational — About (`/about`), Contact (`/contact`), Privacy Policy (`/privacy-policy`), Terms & Conditions (`/terms-and-conditions`).
- [x] Canva-style collapsible sidebar (`body.canva-mode`) — Expands from 80px to 280px with transition on desktop; drawer on mobile.
- [x] Light / Dark Theme switching — Persisted in `localStorage`.
- [x] Zero Mock Data / True Backend Persistence — Fully wired to `studybook-15297`.
- [x] Architecture Decision Record (ADR 0001) — Documented backend and storage comparison.
- [x] Clean install & build — `npm install`, `npm run test`, and `npm run build` passing.

---

## Known Remaining Limitations & Next Steps
1. **Server-side Content Moderation:** In-app uploads currently write directly to Firebase Storage and Firestore. A Cloud Function / background worker for automated OCR and virus scanning can be added if desired.
2. **Post-Parity Backend Migration:** If the owner approves migrating off Firebase to reduce PDF egress costs, follow the 5-step migration roadmap in ADR 0001 to migrate Firestore to Supabase (Postgres) and Firebase Storage to Cloudflare R2 ($0.00 egress).
