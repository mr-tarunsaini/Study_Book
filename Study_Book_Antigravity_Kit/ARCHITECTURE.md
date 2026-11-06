# Architecture — Study Book

## 1. Current-state baseline

The legacy project is primarily HTML, CSS, and JavaScript with Firebase SDK usage for Authentication, Firestore, and Storage. The existing site includes a home page, search page, account/profile page, sign-in page, PDF viewer, and legal/informational pages. Some metadata/routing behavior appears to use a PHP helper and hosting rewrites; verify these in the actual repository and active deployment before changing them.

Known baseline elements to verify in source:
- Firestore collections include `study_materials` and `users`.
- Auth flows include email/password, Google sign-in, and password reset.
- Search accepts a `q` query parameter.
- The upload CTA points to a Google Form.
- The PDF viewer uses PDF.js or an equivalent viewer integration.
- A PHP helper reportedly disables TLS verification. Confirm and remediate if present.

Treat all names above as inventory hints, not permission to delete or rename existing data.

## 2. Target frontend

**Chosen frontend:** React + Vite.

Suggested structure (adapt to repository findings):

```text
src/
  app/
    App.jsx
    router.jsx
    providers/
  components/
    layout/
    navigation/
    search/
    resources/
    viewer/
    auth/
    feedback/
  pages/
    HomePage.jsx
    SearchPage.jsx
    NotesPage.jsx
    PyqsPage.jsx
    SyllabusPage.jsx
    ViewerPage.jsx
    AccountPage.jsx
    LoginPage.jsx
    AboutPage.jsx
    PrivacyPage.jsx
    TermsPage.jsx
    NotFoundPage.jsx
  services/
    auth/
    resources/
    storage/
    profile/
  hooks/
  lib/
  styles/
  tests/
```

Use TypeScript for new code if practical; document the choice. Avoid duplicating page logic. Separate presentation from provider-specific data access so a backend can be swapped without rewriting the UI.

## 3. Routing

Use React Router or an equivalent explicit route table. Preserve:
- `/` or current home path.
- Search path and `?q=...`.
- Notes, PYQ, syllabus, viewer, account, login, About, privacy, terms paths.
- Existing public note links where possible.

Before migrating routes, capture the legacy URL list and current hosting rewrites. GitHub Pages is static hosting and does not execute PHP; verify whether the production site uses GitHub Pages or another host. For static hosting, configure SPA fallback/404 routing or choose route shapes compatible with the host. If preserving a route requires server-side metadata, use a supported server/edge function or document a static alternative; do not pretend PHP runs on GitHub Pages.

## 4. Data-access boundary

Create provider-agnostic interfaces such as:
- `AuthService`: current user, sign in, sign up, Google OAuth, reset password, sign out.
- `ResourceRepository`: list, search, fetch detail, related resources.
- `ProfileRepository`: fetch/update own profile.
- `BookmarkRepository`: add/remove/list saved resources.
- `StorageService`: upload, resolve authorized preview/download URL, delete if permitted.

UI components must call these interfaces rather than import provider SDKs directly. Validate server/provider responses and normalize them to a stable application model.

## 5. Backend/storage options to evaluate

### A. Firebase baseline
- Auth + Firestore + Storage.
- Lowest migration disruption because the current project already uses it.
- Requires a careful audit of Firestore/Storage rules, quota/cost behavior, query indexes, and access controls.
- Can be retained during the first React migration while alternatives are tested.

### B. Supabase
- Auth + PostgreSQL + Storage.
- Relational schema and SQL queries may suit resource metadata and filtering.
- Requires correct Row Level Security policies and storage policies; client-side UI checks are not authorization.
- Evaluate OAuth provider configuration, file size limits, signed URLs, pricing, backup/export, and region availability.

### C. Appwrite
- Auth + database + storage.
- Evaluate deployment/hosting model, quotas, OAuth support, permissions, operational burden, export/migration, and file limits.

### D. Custom API + PostgreSQL + object storage
- Example: Node.js/NestJS or another maintainable API, PostgreSQL/PostGIS only if geospatial capability is actually needed, and S3-compatible storage.
- Maximum flexibility and portability; greater engineering, deployment, monitoring, and security burden.
- Requires secure API authorization, signed upload/download URLs, rate limits, backups, observability, and maintenance.

### E. Storage-only alternatives
Consider S3-compatible storage such as Amazon S3 or Cloudflare R2 alongside a separate auth/database provider. Verify current pricing, egress policies, request costs, file limits, region and retention behavior from official sources before making a decision.

## 6. ADR required before migration

Create `docs/adr/0001-backend-and-storage.md` with:
- Current constraints and data inventory.
- Weighted comparison matrix.
- Official links and date checked for current pricing/limits.
- Migration effort and rollback plan.
- Security and authorization model.
- Recommended MVP and rationale.
- Explicit decision owner approval checkpoint.

Do not migrate real users/files until backup, import validation, access-control tests, and rollback are ready. If no decision is approved, use a provider abstraction and retain the current Firebase integration temporarily rather than blocking all frontend work.

## 7. Security model

- Never expose service-role/admin credentials in the browser.
- Public client keys may be present only when provider documentation explicitly classifies them as public and security policies are correct.
- Enforce ownership and permissions at the backend/storage layer.
- Protect private or subscription-gated files with authorization and short-lived signed URLs; do not rely on hiding download buttons.
- Validate MIME type, file extension, size, and content as appropriate; PDFs should not be treated as inherently safe.
- Apply rate limits, abuse protection, logging, and deletion/retention rules.
- Inspect OAuth domains, CORS configuration, environment variables, repository history, and provider policies.
- If the legacy PHP helper exists, do not disable TLS certificate verification.

## 8. Deployment and environment

- Vite environment variables prefixed with `VITE_` are exposed to client code; only put public client configuration there.
- Keep secrets in server/hosting environment variables.
- Document `npm run dev`, `npm run build`, test/lint commands, and deployment target.
- Confirm whether the site will deploy to GitHub Pages, Firebase Hosting, Vercel, or another platform; choose route fallback and server/edge capabilities accordingly.
- Include `.env.example` placeholders, never live values.
