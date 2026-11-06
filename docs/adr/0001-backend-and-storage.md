# ADR 0001: Backend & File Storage Evaluation and Architecture Decision

**Status:** Proposed & Provisionally Implemented via Decoupled Service Layer  
**Date:** October 2026  
**Deciders:** Lead Product Engineer & System Architect  
**Project:** Study Book (“Study Smarter. Score Better.”)

---

## 1. Context & Problem Statement

Study Book is an academic resource-sharing platform designed for engineering students (B.Tech CSE/AIML) to discover, view, save, and share study materials, including notes, previous-year question papers (PYQs), and syllabus documents.

The legacy implementation was built on static HTML, CSS, JavaScript, and direct client-side integration with **Firebase** (Authentication, Cloud Firestore, Cloud Storage), hosted on a mix of InfinityFree/Apache (with a PHP helper) and GitHub Pages. 

As part of recreating Study Book in **React + Vite**, we must:
1. Recreate the existing user workflows and pages with 100% fidelity.
2. Decouple the frontend from vendor-specific SDKs via provider-agnostic service abstractions.
3. Compare **Firebase**, **Supabase**, **Appwrite**, and a **Custom Backend (PostgreSQL + S3/R2)** across pricing, technical limits, security, PDF delivery, and migration effort.
4. Provide a sound, risk-free recommendation that preserves existing data without unauthorized destructive changes.

---

## 2. Baseline Data & System Inventory

Inspection of the legacy codebase (`c:\Users\kd\OneDrive\Desktop\Study Book`) revealed the following data models and dependencies:

### A. Authentication
- **Firebase Auth** (Project: `studybook-15297`)
- Methods supported:
  - Email & Password (sign-in, registration, password reset)
  - Google OAuth (`GoogleAuthProvider` via popup)
  - Auth state synchronized to `localStorage` (`userName`, `userUid`) and Firestore `users` collection.

### B. Firestore Collections
1. **`study_materials`**:
   - `id`: Document ID
   - `title`: string
   - `subject`: string (e.g., "Engineering Physics", "Data Structures")
   - `type`: string ("Notes", "Class Notes", "Previous Year Questions (PYQs)", "Syllabus", "Books")
   - `course`: string (e.g., "B.Tech", "BCA")
   - `branch`: string (e.g., "Computer Science Engineering (CSE)")
   - `college` / `university`: string (e.g., "AKTU", "GLA University")
   - `fileName`: string
   - `fileSize`: number
   - `fileUrl`: string (direct download/preview URL in Firebase Storage)
   - `uploaderUid`: string
   - `uploaderName`: string
   - `createdAt`: ISO 8601 string
   - `slug`: string (SEO slug format: `{title-slug}-{timestamp}`)
   - `likedBy`: string[] (array of user UIDs)
   - `savedBy`: string[] (array of user UIDs who bookmarked this document)
   - `description`: string

2. **`users`**:
   - `uid`: Document ID
   - `name`: string
   - `email`: string
   - `college`: string
   - `course`: string
   - `branch`: string
   - `createdAt`: ISO 8601 string
   - `lastLogin`: ISO 8601 string

3. **`contact_messages`**:
   - `name`, `email`, `subject`, `message`, `createdAt`

### C. File Storage
- **Firebase Cloud Storage Bucket**: `studybook-15297.firebasestorage.app`
- Upload path pattern: `uploads/study-materials/{timestamp}_{cleanedFileName}`
- Current file formats: PDF (up to 10 MB per file).

### D. Server & Routing Infrastructure
- Apache `.htaccess` rewrote `/notes/.*` to `viewer.php`.
- `viewer.php` fetched Firestore REST endpoints and injected `<title>` and Open Graph tags for WhatsApp/social sharing previews.
- **Critical Security Finding**: `viewer.php` explicitly contained `curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);` to bypass TLS certificate verification on InfinityFree. This is a critical security vulnerability that must never be carried forward.
- GitHub Pages is a purely static host and cannot execute PHP.

---

## 3. Comparison of Backend & Storage Candidates

Verified against official vendor documentation (current as of 2026):

| Evaluation Criteria | 1. Firebase (Current Baseline) | 2. Supabase | 3. Appwrite Cloud | 4. Custom Backend (Node/Fastify + Postgres + R2) |
| :--- | :--- | :--- | :--- | :--- |
| **Database Engine** | Cloud Firestore (NoSQL Document Store) | PostgreSQL 15+ (Relational with JSONB, Full-Text Search) | MariaDB / Custom Document Database | PostgreSQL (Dedicated/Serverless, e.g., Neon or Supabase) |
| **Free Tier Limits** | **1 GiB** stored data<br>50,000 reads/day<br>20,000 writes/day | **500 MB** database<br>Shared compute / 500 MB RAM<br>Log retention 1 day | **1 Database**<br>Included in 2 GB combined storage quota | Depends on host (Neon: 0.5 GB free; Render/Railway free or low-tier) |
| **Authentication & MAUs** | Free up to **50,000 MAUs** (Email/Pass + Google OAuth) | Free up to **50,000 MAUs** (Email/Pass + Google OAuth) | Free up to **75,000 MAUs** (Email/Pass + Google OAuth) | Handled via custom JWT / Lucia Auth / Supabase Auth |
| **Google Sign-In Support** | Native, 1-click popup/redirect | Native OAuth with Google provider | Native OAuth with Google provider | Requires custom OAuth callback handler & Google API client |
| **File Storage Free Quota** | **0 GB on Spark** (requires Blaze plan; Blaze has 5 GB free baseline + card) | **1 GB** bucket storage<br>Max file size 50 MB | **2 GB** total storage<br>1 bucket limit on Free plan | **Cloudflare R2: 10 GB free**<br>AWS S3: 5 GB for 12 mos |
| **Egress / Bandwidth Fees** | **10 GiB/mo free**, then **$0.12/GB** (expensive for heavy PDF downloads) | **5 GB/mo free** (+5 GB cached), then $0.09/GB | **5 GB/mo bandwidth** (Hard cutoff when reached on free plan) | **Cloudflare R2: $0.00/GB Egress forever** (Zero egress fees) |
| **Project Inactivity Policy** | Never paused on Spark/Blaze | **Paused after 7 days** of database inactivity on Free plan | **Paused after 7 days** of inactivity on Free plan | Never paused on standard self-hosted / VPS |
| **Access Control & Security** | Firestore Security Rules & Storage Rules | Row Level Security (RLS) policies in SQL | Collection & Document-level Permissions | Middleware & SQL query filtering |
| **PDF Delivery & Signed URLs** | Download tokens / signed URLs via Firebase Storage SDK | Signed URLs via Storage API (custom expiration) | File view / download URLs with permission tokens | S3 Presigned URLs or Cloudflare public/private bucket bindings |
| **Search Capabilities** | Prefix matching only; no native full-text search without Algolia | Native PostgreSQL `to_tsvector` and `tsquery` full-text search | Basic string indexing; full-text search limited | Native SQL full-text search or pg_trgm |
| **Automatic Backups** | Managed GCP backups (manual export to Cloud Storage) | Only on Pro plan ($25/mo); free requires manual `pg_dump` | Only on Pro plan ($25/mo); free requires manual export | Automated via cron / `pg_dump` to R2/S3 |
| **Migration Friction from Legacy** | **Zero friction** (existing records & accounts work immediately) | Medium (requires schema migration, user export/import script) | Medium (requires schema migration & collection setup) | High (requires full API creation, ORM, auth server, DevOps) |

---

## 4. Architectural Analysis & Trade-Offs

1. **The PDF Bandwidth Challenge:**
   In an academic portal where students read and download 5–15 MB PDFs, bandwidth egress is the single greatest scaling cost.
   - Firebase Storage charges ~$0.12 per GB of egress once past free tier.
   - Supabase charges $0.09 per GB after 5 GB.
   - Appwrite freezes storage when 5 GB bandwidth is reached.
   - **Cloudflare R2** charges **$0.00 egress**, with 10 GB free storage and 10M free read operations per month.

2. **The Querying & Search Requirement:**
   The current website filters materials by `type`, `course`, `branch`, and `college`, and performs text searches on `title`, `subject`, and `description`.
   - Firestore requires complex composite indexes for multi-field filtering and cannot do case-insensitive partial substring search across multiple fields without reading large result sets into client memory.
   - PostgreSQL (Supabase or Neon) executes multi-column filters, indexes, and full-text ranking natively with SQL queries.

3. **Inactivity Pausing Risk:**
   Both Supabase and Appwrite free plans automatically pause projects if no queries occur for 7 days. For an academic site that experiences lull periods between semesters, an unannounced project pause could disrupt students during exam preparation unless an automated health check is maintained.

4. **Preservation of Existing Users and Materials:**
   Migrating immediately to a new backend before the React application is verified carries severe risk of data loss, broken file URLs, and disrupted user sessions.

---

## 5. Architectural Decision & Staged Plan

### Phase A: Parity & Continuity (Immediate Decision)
1. **Retain the working Firebase (`studybook-15297`) backend** for the React + Vite parity build.
2. Build a **strictly decoupled provider abstraction layer** in `src/services/`:
   - `authService.ts`: Standard interface for login, register, Google OAuth, password reset, profile update, logout.
   - `resourceService.ts`: Standard interface for search, recent materials, detail by slug/ID, personalized materials.
   - `profileService.ts`: Standard interface for user account data.
   - `bookmarkService.ts`: Standard interface for bookmarks / saved materials.
   - `storageService.ts`: Standard interface for file resolution and uploads.
3. No React component or page may directly import `firebase/*`. All UI code interacts solely with the abstract service layer.
4. Keep the **Google Form** upload workflow (`https://forms.gle/zvqRWNyxxjJ1iJWq9`) as the canonical upload path during parity work, while keeping the client-side profile completeness check.

### Phase B: Future Backend Migration (Approved Plan for Post-Parity)
When the product owner approves migrating off Firebase:
1. **Target Stack:**
   - **Database & Auth:** **Supabase** (PostgreSQL with Row Level Security, 50,000 MAUs, full-text SQL search).
   - **Object Storage for PDFs:** **Cloudflare R2** (S3-compatible API, 10 GB free, **Zero Egress Fees**).
2. **Migration Steps:**
   - Step 1: Export all existing documents from Firestore (`study_materials`, `users`, `contact_messages`) via Firebase Admin SDK script to JSON.
   - Step 2: Mirror files from Firebase Storage to Cloudflare R2 bucket.
   - Step 3: Run SQL migration on Supabase to populate `study_materials` and `users` tables.
   - Step 4: Swap `src/services/` implementations from Firebase to Supabase/R2 without touching UI components.
   - Step 5: Verify all document links, bookmarks, and auth sessions in staging before switching DNS.

---

## 6. Security Decision Record

1. **No Frontend Secrets:** Only public client configuration (`VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`) is bundled in client code. No administrative service-role keys or database root keys shall ever be committed or included in client builds.
2. **Strict TLS Enforcement:** Eliminate the insecure `CURLOPT_SSL_VERIFYPEER = false` found in legacy PHP. All network calls enforce standard TLS verification.
3. **Authorization & Data Ownership:**
   - Users can only edit or delete materials where `uploaderUid === currentUser.uid`.
   - Profile edits restricted to `users/{currentUser.uid}`.
4. **Content Security & Safe File Handling:**
   - PDF rendering sandboxed inside HTML `<canvas>` elements using PDF.js without executing embedded PDF scripts.
   - File uploads (when enabled natively) must validate MIME types (`application/pdf`) and enforce a 10 MB file ceiling.

---

## 7. Decision Checkpoint

- [x] Backend & storage comparison completed and verified against 2026 vendor documentation.
- [x] Decoupled service architecture established.
- [x] Existing live Firebase project preserved for seamless parity.
- [ ] Production migration to Supabase/R2 to be executed only upon explicit owner approval.
