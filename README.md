# Study Book — "Study Smarter. Score Better."

A modern, faithful recreation of **Study Book** built with **React**, **Vite**, and **TypeScript**. 

---

## 🚀 Key Highlights & Architecture

- **100% Faithful Recreation**: Retains the original blue color scheme, typography (`Inter` & `Poppins`), rounded card design, Canva-style collapsible sidebar, light/dark themes, and student workflows.
- **Provider-Agnostic Service Layer**: Cleanly decouples UI components from backend SDKs (`src/services/` contracts: `authService`, `resourceService`, `profileService`, `bookmarkService`, `storageService`). Swapping or migrating backends does not require touching React page components.
- **Zero-Friction Parity**: Retains live connectivity with the existing Firebase project (`studybook-15297`) without breaking or migrating live records prematurely.
- **Enhanced PDF Viewer**: Progressive, high-DPI canvas rendering powered by PDF.js with lazy page generation, double-click full-screen, reading history tracking, bookmarks, document metadata drawer, and sharing capabilities.
- **Search & URL Preservation**: Full support for the `q` URL search parameter (`/search?q=...`), category/course/university/year multi-filtering, active filter chips, and backwards-compatible redirects for legacy `.html` endpoints.
- **AKTU GPA Calculator**: Accurately calculates SGPA, YGPA, and CGPA with predefined AKTU CSE/AIML credit mappings and grade conversions.
- **Security Hardening**: Eliminated the legacy TLS bypass (`CURLOPT_SSL_VERIFYPEER = false`), zero exposed private keys, validated input boundaries, and role-enforced user profile/material management.

---

## 📁 Project Structure

```text
Study_web/
├── docs/
│   └── adr/
│       └── 0001-backend-and-storage.md    # Full ADR & 2026 Vendor Evaluation
├── public/
│   ├── assets/                            # Original images & illustrations
│   │   ├── Hero-image.png
│   │   └── login.png.png
│   └── logo.png
├── src/
│   ├── components/
│   │   ├── common/                        # ConfirmModal, ShareModal, SkeletonCard
│   │   ├── layout/                        # Sidebar, MobileTopBar, Footer, Layout
│   │   └── resources/                     # DocumentCard, DocumentGrid, AdvancedFilters
│   ├── context/                           # AuthContext, ThemeContext, ToastContext
│   ├── pages/                             # HomePage, SearchPage, ViewerPage,
│   │                                      # CalculatorPage, AccountPage, LoginPage,
│   │                                      # AboutPage, ContactPage, PrivacyPolicyPage,
│   │                                      # TermsConditionsPage, NotFoundPage
│   ├── services/                          # Provider-agnostic service layer
│   │   ├── authService.ts
│   │   ├── bookmarkService.ts
│   │   ├── firebase.ts
│   │   ├── profileService.ts
│   │   ├── resourceService.ts
│   │   └── storageService.ts
│   ├── styles/                            # CSS custom properties & theme tokens
│   ├── types/                             # TypeScript data models & interfaces
│   ├── utils/                             # AKTU GPA calculator algorithms & tests
│   ├── App.tsx                            # React Router with legacy compatibility redirects
│   └── main.tsx                           # Application entry point
├── .env.example                           # Placeholder environment configuration
├── package.json                           # Dependencies & package scripts
├── tsconfig.json                          # Strict TypeScript configuration
└── vite.config.ts                         # Vite configuration with chunk optimization
```

---

## 🛠️ Local Development Setup

### 1. Prerequisites
- **Node.js** v20.x or higher
- **npm** v10.x or higher

### 2. Installation
```bash
git clone <repo-url>
cd Study_web
npm install
```

### 3. Environment Configuration
Copy `.env.example` to `.env` and provide your public client configuration:
```bash
cp .env.example .env
```
*(Default fallbacks to the existing verified production project `studybook-15297` are provided if environment variables are omitted).*

### 4. Running the Development Server
```bash
npm run dev
```
The application will be live at `http://localhost:3000`.

### 5. Running Automated Tests
```bash
npm run test
```

### 6. Building for Production
```bash
npm run build
```
The optimized bundle will be compiled to `dist/`.

---

## 🌐 Routes & URL Compatibility

| Clean Path | Legacy Compatibility Path | Description |
| :--- | :--- | :--- |
| `/` | `/index.html` | Homepage (Hero, Search, Continue Reading, Recently Uploaded, Notes, PYQs, Features, Upload CTA) |
| `/search` | `/search.html` | Search page with `?q=...` URL parameter, filters, and dynamic results |
| `/notes/:slug` | `/viewer.html` / `/viewer` | PDF document viewer, document metadata, bookmarks, related notes |
| `/calculator` | `/calculator.html` | SGPA, YGPA, and CGPA calculator for AKTU engineering |
| `/account` | `/account.html` | User profile management, My Uploads tab, Saved PDFs tab |
| `/login` | `/login.html` | Email/password sign-in, account creation, Google OAuth, password reset |
| `/about` | `/about.html` | Mission, community information, and platform overview |
| `/contact` | `/contact.html` | Feedback form (persisted to backend messages) |
| `/privacy-policy` | `/privacy_policy.html` | Privacy policy and student data governance |
| `/terms-and-conditions` | `/terms_conditions.html`| Terms and conditions of use |
| `*` | N/A | Accessible 404 page with navigation fallbacks |

---

## ⚖️ Architecture Decision Record (ADR 0001) Summary

- **Evaluated Vendors**: Firebase vs. Supabase vs. Appwrite vs. Custom Backend (Postgres + Cloudflare R2).
- **Verified Official Limits (2026)**:
  - *Supabase*: 500 MB DB, 1 GB storage, 5 GB egress, 50k MAUs. Projects automatically pause after 7 days of inactivity.
  - *Appwrite*: 1 DB, 2 GB storage, 5 GB bandwidth, 75k MAUs. Hard freeze on bandwidth limit.
  - *Cloudflare R2*: 10 GB free storage, **Zero Egress Fees** ($0.00/GB data transfer).
  - *Firebase*: 1 GiB Firestore, 50k MAUs free. Storage requires Blaze plan; egress costs $0.12/GB past free quota.
- **Decision**:
  - **Immediate Phase**: Retain working Firebase integration via decoupled abstractions to guarantee 100% uptime and zero data loss.
  - **Evolutionary Phase (Post-Parity Approval)**: Migrate database to **Supabase** (Postgres relational schema, full-text search) and PDF storage to **Cloudflare R2** to eliminate PDF egress costs.
- *Detailed report available at:* `Study_Book_Antigravity_Kit/docs/adr/0001-backend-and-storage.md`.
