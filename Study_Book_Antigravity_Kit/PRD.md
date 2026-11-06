# Product Requirements Document — Study Book

## 1. Product overview

**Product:** Study Book  
**Tagline:** “Study Smarter. Score Better.”  
**Reference:** https://mr-tarunsaini.github.io/Study_book/index.html

Study Book helps students discover, view, save, and share academic resources such as notes, previous-year questions (PYQs), and syllabi. The recreation must remain faithful to the current product and fix defects without introducing unapproved workflow changes.

## 2. Goals

- Recreate existing visual design, navigation, pages, and core flows in React + Vite.
- Improve reliability, responsiveness, accessibility, and maintainability.
- Evaluate alternatives to Firebase and file storage using documented criteria.
- Protect student profile data and control access to uploaded files.
- Make all implemented features truthful: no mock success states presented as real persistence.

## 3. Users and primary jobs

- Students searching for notes, PYQs, and syllabus documents.
- Signed-in students who want to revisit resources or manage their profile.
- Students who use the existing upload-submission workflow.
- Site visitors reading About, privacy, and terms pages.

## 4. Information architecture and page requirements

### Home
Preserve:
- Brand/header and navigation.
- Hero area and search.
- Continue Reading.
- Recently Uploaded.
- Explore Notes.
- Practice PYQs.
- Feature cards and Upload Notes call-to-action.
- Footer and existing footer links.

Continue Reading must be based on real saved/recent state if the backend supports it. Otherwise, show a useful empty state instead of fabricated records.

### Search
- Read the query from the `q` URL parameter.
- Keep query state synchronized with the URL.
- Search the resource categories and metadata supported by the existing implementation.
- Include loading, no-results, and error states.
- Do not claim full-text PDF search unless implemented and tested.

### Resource listing / notes / PYQs / syllabus
- Preserve existing categories, labels, and navigation routes.
- Display only fields supported by actual data.
- Keep the original public URLs where feasible; add compatibility routes/redirects if route shape changes.
- Respect resource visibility and authorization rules.

### Viewer
Preserve existing viewer capabilities where present:
- PDF preview using a supported PDF viewer approach.
- Document title/details and metadata sidebar.
- Save/bookmark, share, theme, and related-resource controls where they exist.
- Loading, unavailable-file, unauthorized, and error states.
- Mobile-friendly controls and readable PDF area.

### Account/profile
- Display and edit only fields supported by the existing account model.
- Preserve profile synchronization where verified.
- Avoid exposing another user's profile or files.
- Show meaningful signed-out, loading, and error states.

### Authentication
Preserve current supported flows:
- Email/password sign-in and registration if currently present.
- Google sign-in.
- Password reset.
- Sign-out and session-aware navigation.
Implement only flows supported by the chosen provider; document any change before removing a flow.

### Upload Notes
- In the faithful recreation phase, retain the current Google Form CTA and its existing destination if still valid.
- Do not replace the form with a nonfunctional upload mock.
- Native uploads are a separately approved enhancement and must include authentication, type/size validation, progress/error states, secure storage, metadata persistence, ownership, moderation/abuse considerations, and access control.

### Informational/legal pages
Preserve About, Privacy Policy, Terms & Conditions, and any other existing informational pages and links. Review their content for stale provider references after a backend decision; do not silently rewrite legal commitments.

## 5. Non-functional requirements

- Responsive at mobile, tablet, and desktop sizes.
- Accessible semantic structure, labels, focus states, keyboard interaction, and sufficient contrast.
- Predictable loading, empty, success, and error states.
- Maintainable component/data-layer separation.
- Avoid duplicate queries and unnecessary re-renders.
- No secrets in client code or committed environment files.
- Respect applicable privacy and data minimization principles for student data.
- Provide documented local setup, production build, deployment, and rollback path.

## 6. Backend/storage decision requirement

Compare Firebase, Supabase, Appwrite, and custom API + PostgreSQL + object storage. Consider the option of keeping Firebase temporarily while migrating only after a verified backup and staged cutover. Current vendor limits/pricing must be checked against official documentation when the decision is made.

Decision criteria: auth/Google OAuth, data model and query needs, storage cost/limits, signed URLs and permissions, upload limits/resumability, search, backups, export/migration, security rules, developer effort, reliability, and hosting compatibility.

## 7. Success criteria

- Existing page/route inventory is complete.
- Required page and flow parity checklist passes.
- All current public links are preserved or mapped.
- Search by `q` works.
- Build and tests pass.
- Backend decision and migration plan are documented.
- No fake persistence or secrets.
- Any known gaps are listed in `PROGRESS.md`.
