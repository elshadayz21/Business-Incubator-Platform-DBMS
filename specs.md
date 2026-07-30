# DxValley ICMS — Full Technical Specification (Agent-Ready)
### Incubation Center Management System — Rebuild & Enhancement

**Client:** Cooperative Bank of Oromia — DxValley Incubation Center
**Prepared for:** AI coding agent / engineering intern implementation
**Source document:** DxValley ICMS Rebuild & Enhancement Brief, July 29, 2026
**Purpose of this file:** This is a deep, implementation-level specification. It expands every requirement in the original brief into concrete technical detail — data entities, page inventories, role/permission matrices, API surface, and step-by-step build order — so an autonomous coding agent (or a human developer) can pick this up and build without needing to re-derive intent from the source brief.

---

## 0. How to use this document

Work top to bottom, milestone by milestone (Section 14). Do not skip Section 1–3 (context) even if eager to start coding — the *why* behind each requirement affects implementation choices (e.g., why login must not gate search, why the admin panel must lose its Electron shell). When a decision isn't covered here, default to the safest interpretation and flag it rather than guessing silently — see Section 15 (Open Questions & Escalation Rules).

---

## 1. Project Context

DxValley is the incubation arm of Cooperative Bank of Oromia. It runs cohort-based programs for:
- **Startups** (Fintech, AgriTech categories)
- **MSME growth cohorts** (existing small/medium businesses, not pre-revenue startups)

Programs run in batches — approximately **2 batches per year** — and involve an application/intake process, a staged progression pipeline, mentor assignment, workshops/events, funding requests, and reporting to stakeholders (e.g., E4Impact Foundation) for impact tracking.

The **current ICMS** is functionally incomplete and structurally wrong for this use case in a specific way: its admin layer is a desktop Electron app with direct DB access, its public site forces login for things that shouldn't require it, and it lacks basic operational tooling (CMS, mass email, dynamic forms, reporting export). This project does **not** start from a blank canvas — it forks and re-architects an existing open-source incubator platform.

### 1.1 Non-goals (explicitly out of scope unless stated)
- No native mobile app.
- No desktop/Electron client of any kind (this is being *removed*, not extended).
- No multi-tenant support (single organization: DxValley/Coop Bank) unless later requested.
- No payment processing — "funding requests" here means tracking/recording requests, not moving money through the platform.
- No direct copying of Gohorto's UI — it is a feature/workflow reference only.

---

## 2. Baseline Codebase

**Repository:** `aelaraby6/Business-Incubator-Platform-DBMS`

### 2.1 What exists today (as-is architecture)
- **Frontend:** HTML + Tailwind CSS + vanilla JS + EJS templates, server-rendered, used by entrepreneurs.
- **Backend:** Node.js + Express.js.
- **Database:** PostgreSQL.
- **Admin layer:** Electron desktop app with **direct database access** (bypasses the API layer — a significant architectural smell to fix, not just a UI problem).
- **Modeled concepts already present:** entrepreneur registration, project submission (solo or team), a 3-stage pipeline (**Idea → MVP → Scale-Up**), mentor assignment, workshops, facility booking, funding requests, investor matching.

### 2.2 What must change architecturally
1. **Kill the Electron admin app.** Rebuild its functionality as authenticated web routes/pages served by the same Express (or a new API-backed) application. The direct-DB-access pattern must be replaced with proper API/service-layer calls — this is a security and maintainability fix, not cosmetic.
2. **Introduce a unified role system.** The current app doesn't cleanly support 4 roles with distinct permission boundaries (Section 6). This likely requires a `users` table with a `role` enum/foreign key, plus middleware-based route guards.
3. **Public routes must be decoupled from auth.** Audit every existing route; any route serving public content (landing, gallery, programs, search, contact, subscribe, join) must NOT sit behind a login-required middleware, even if it currently does.
4. **ERD will need extension**, not replacement. Expected new/extended entities: `cohorts`/`batches`, `content_pages` (CMS), `announcements`, `gallery_items`, `contact_submissions`, `subscribers`, `email_templates`, `email_campaigns`, `form_definitions` (dynamic form builder), `mentor_sessions`/`feedback`, `reports`/`exports` (or computed on the fly). Some restructuring of the existing pipeline/entrepreneur/mentor tables is expected and acceptable per the brief.

### 2.3 Why this base was chosen
It already models cohort-like stages, mentor assignment, and funding requests — this materially reduces build time vs. greenfield. Treat existing entrepreneur-facing flows (registration, project submission, pipeline stage) as reusable scaffolding to extend, not sacred code to preserve unchanged.

---

## 3. Reference Benchmark — Gohorto

Review for **workflow/feature ideas only**:
- Application intake flows
- Cohort tracking views
- Mentor coordination patterns
- Structured evaluation rounds
- Milestone management
- Stakeholder reporting formats

Do not copy visual design, component structure, or branding from Gohorto. Use it to sanity-check that DxValley's cohort/evaluation/reporting modules (Sections 9, 11) cover the same functional ground a mature incubator product would.

---

## 4. Branding — Full Design System Notes

### 4.1 Color tokens
Define these as CSS variables / Tailwind theme extensions, not hardcoded hex values scattered through templates:

```css
:root {
  --color-primary-orange: #E38524;   /* CTA, alerts, key metrics, "action needed" */
  --color-secondary-cyan: #00ADEF;   /* links, secondary buttons, active nav, charts */
  --color-text-black: #000000;       /* body text, headers, borders, icons */
}
```

Tailwind config equivalent:
```js
theme: {
  extend: {
    colors: {
      'coop-orange': '#E38524',
      'coop-cyan': '#00ADEF',
    }
  }
}
```

**Rules of application:**
- Cyan = primary interactive color (nav links, active states, primary buttons, chart series 1).
- Orange = accent/CTA only (submit buttons, "apply now", urgent countdown, alert badges). Never use orange and cyan as competing primary actions on the same screen — pick one visual hierarchy per screen.
- Black = text/icon/border only. Never a full black background/section.

### 4.2 Logo system
- Two logo files supplied out-of-band by the client (primary + alternate/reversed).
- Store at `/public/brand/logo-primary.svg` (or .png) and `/public/brand/logo-alt.svg`.
- Primary logo: navbar/header (public site AND admin panel), login screen.
- Alternate logo: favicon, email header/footer, any dark-background component (e.g., footer if dark).
- **Do not hardcode the `<img src>` path in templates where avoidable** — pull from a CMS-managed setting (`BRAND_LOGO_PRIMARY_URL` / `BRAND_LOGO_ALT_URL`, see Section 5) so a non-developer can swap logos later without a deploy.

### 4.3 Typography & polish bar
No explicit font is mandated in the source brief — pick a clean, professional sans-serif (system font stack or a single Google Font, e.g., Inter) and use it consistently. "Professional" (UR-B3) means: consistent spacing scale (Tailwind's default spacing scale is fine), no default unstyled `<select>`/`<input>`/`<button>` browser chrome, consistent button/card/table components reused across admin screens rather than one-off styles per page.

---

## 5. Environment & Configuration

### 5.1 Required `.env` variables

| Variable | Purpose | Notes |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | Real value never committed |
| `PORT` | Web server port | Default `3000` |
| `SESSION_SECRET` | Session/cookie signing | Randomly generated, long string |
| `SMTP_HOST` | Mail server host | For mass email (UR-B4) |
| `SMTP_USER` | Mail auth user | " |
| `SMTP_PASS` | Mail auth password | " |
| `JWT_SECRET` | Token signing secret | Only if token-based auth is introduced |
| `BRAND_LOGO_PRIMARY_URL` | Path/URL to primary logo | Should be overridable via CMS settings table, `.env` is just the default/fallback |
| `BRAND_LOGO_ALT_URL` | Path/URL to alt logo | Same |
| `NODE_ENV` | `development` / `staging` / `production` | Affects logging, error verbosity, cookie `secure` flag |

### 5.2 Deployment-specific variables (Vercel + Supabase target)
Since deployment target is Vercel + Supabase (Section 2/13 of source brief), also anticipate:
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (if using Supabase client libraries directly rather than raw `DATABASE_URL`/pg).
- Note: Supabase Postgres connection strings can be used as a drop-in `DATABASE_URL` for the existing Express/pg setup if the agent prefers not to adopt the Supabase JS client — either approach is acceptable, but pick one consistently rather than mixing raw SQL and Supabase client calls in the same feature.
- Vercel serverless functions have execution time/connection-pooling constraints with traditional long-lived pg connections — if deploying Express as Vercel serverless functions, use a connection pooler (e.g., Supabase's pgbouncer/pooled connection string) instead of a raw persistent pool.

### 5.3 Required files
- `.env.example` committed with placeholder values, real `.env` gitignored.
- No secrets in code, logs, or committed config at any point.

---

## 6. Roles & Permission Matrix

Exactly **4 roles**. No 5th role, no "Project Manager" (explicitly deprecated in favor of Entrepreneur/Incubatee).

| Capability | Superadmin | Admin | Entrepreneur (Incubatee) | Mentor |
|---|:---:|:---:|:---:|:---:|
| Manage users & assign roles | ✅ | ❌ | ❌ | ❌ |
| Global system settings / branding CMS | ✅ | ❌ | ❌ | ❌ |
| Applications review/approve/decline | ✅ | ✅ | ❌ | ❌ |
| Cohort management | ✅ | ✅ | View own cohort only | View own mentees' cohort only |
| Content management (announcements/gallery/pages) | ✅ | ✅ | ❌ | ❌ |
| Mass email sending | ✅ | ✅ | ❌ | ❌ |
| Reporting dashboard + Excel export | ✅ | ✅ | ❌ | ❌ |
| Dynamic form builder | ✅ | ✅ | ❌ | ❌ |
| View own dashboard / application status / milestones | — | — | ✅ | — |
| Log mentor sessions, feedback, progress notes | ❌ | ❌ | ❌ | ✅ (own assignees only) |
| View assigned entrepreneurs only | — | — | — | ✅ |

**Implementation guidance:**
- Model as a `role` column (enum: `superadmin | admin | entrepreneur | mentor`) on a single `users` table, OR separate profile tables joined to a core `users`/`auth` table — either works, but keep one source of truth for "who can log in."
- Route/middleware guards should check role on every protected route — do not rely on frontend hiding of UI elements as the security boundary.
- Mentor and Entrepreneur views must be scoped by relationship (mentor sees only assigned incubatees; incubatee sees only their own data) — this is row-level filtering in queries, not just role-level route gating.

---

## 7. First-Run / Auth Requirements

- **UR-B2:** No hardcoded default superadmin credentials. On first boot (or via a `/setup` route gated by "no superadmin exists yet" check), present a setup wizard: create the first Superadmin account (email + password, or email + invite flow). Once a superadmin exists, this route must self-disable (return 404 or redirect) to prevent re-triggering setup.
- Superadmin can then create Admin, Mentor, and Entrepreneur accounts (or Entrepreneurs may self-register via the public application/join flow — see UR-F10 — with an account created upon acceptance, which is the more realistic flow for an incubator).
- Session-based auth (using `SESSION_SECRET`) is sufficient; JWT is optional/only if the agent finds it cleaner for an API-first architecture.

---

## 8. Public-Facing Frontend — Detailed Page Inventory

**Golden rule (UR-F7/F11):** Nothing on the public site requires an account. If a page currently redirects anonymous users to `/login`, that is a bug to fix, not expected behavior.

| Page | Requirement ID | Detail |
|---|---|---|
| Landing / Home | UR-F2 | Hero section, current open calls with countdown (UR-F3), featured announcements, brand-consistent design. Replaces the "unpolished" current announcements page. |
| Announcements / News list + detail | UR-F1/F2 | List view + individual announcement detail pages, content authored via CMS (UR-B8). |
| Programs / Cohorts info | — (implied by Section 9) | Static/CMS content describing current and past cohort tracks (startup vs MSME). |
| Photo Gallery | UR-F6 | Grid/lightbox gallery pulling from CMS-managed media (events, cohorts, demo days). |
| Terms & Conditions | UR-F5 | Static legal page; link present in footer and on all application/intake forms. |
| Contact Us | UR-F8 | Real HTML form (name, email, message, optionally phone/subject) — submits via POST to backend, stored in DB, NOT a `mailto:` link. |
| Subscribe / Newsletter | UR-F9 | Simple email-capture input (footer and/or landing page), stores to `subscribers` table. |
| Join / Apply | UR-F10 | Multi-field application/interest form (not an email client redirect) — submits into the system, becomes an "application" record admins can review. |
| Search | UR-F11 | Site-wide search over public content (programs, gallery captions, announcements) — must work with zero auth, must not redirect to login on empty/any result. |
| Chatbot widget (stretch) | UR-F4 | Basic FAQ bot — can be a simple rules-based widget if a full NLP/LLM integration is out of scope for time; scope down before cutting entirely. |

### 8.1 Countdown timer detail (UR-F3)
- Attach to whichever entity represents an "open call" (likely a `cohorts`/`calls` table with `application_deadline` timestamp).
- Client-side countdown computed from server-provided deadline (don't trust client clock alone for anything beyond display — the actual deadline enforcement, if any, happens server-side on submission).
- Display format example: "2 days, 4 hours left to apply."

---

## 9. Back-Office Admin Panel — Detailed Module Inventory

All of this is **web-only** (UR-B9) — reachable at a normal authenticated URL path (e.g., `/admin/...`), no desktop shell of any kind.

### 9.1 User Management (UR-B1)
- List/search users, filter by role.
- Superadmin: create/edit/deactivate any user, reassign roles.
- Admin: manage Entrepreneur and Mentor accounts (not Superadmin/Admin accounts, per the permission matrix in Section 6 — confirm this boundary with supervisor if ambiguous, see Section 15).

### 9.2 First-time Setup (UR-B2)
- Covered in Section 7.

### 9.3 Admin UI shell (UR-B3)
- Persistent nav/sidebar, consistent header with primary logo, role-aware nav items (don't show "User Management" to a Mentor, etc.).
- Reusable component set: data tables (with sort/filter/pagination), form components (styled inputs/selects), modal/dialog pattern, toast/notification pattern for success/error feedback.

### 9.4 Mass Email (UR-B4)
- Compose screen: subject, body (rich text or simple templating with placeholders like `{{first_name}}`), recipient source selector.
- Recipient sources: accepted applicants, declined applicants, all subscribers (UR-B10), custom filtered list (e.g., by cohort).
- Template storage: `email_templates` table (name, subject, body) so common messages (acceptance, decline, reminder) don't need re-typing.
- Sending: use SMTP config from `.env` via a mail library (e.g., Nodemailer). For bulk sends, batch/queue rather than blocking a single request — even a simple in-process loop with rate limiting is acceptable for MVP; a full job queue (Bull/Redis) is a nice-to-have, not a hard requirement, unless volume demands it.

### 9.5 Cohort Management (UR-B5)
- CRUD for cohorts/batches: name, type (Startup / MSME), start/end dates, application deadline (feeds UR-F3 countdown), stage definitions.
- Assign entrepreneurs to a cohort; assign mentors to entrepreneurs within a cohort.
- Track pipeline stage per entrepreneur/project (reuse/extend the existing Idea → MVP → Scale-Up stages from the baseline repo, or adapt if cohort type requires different stage names for MSME growth cohorts vs. startup cohorts — confirm naming with supervisor, don't assume both track types use identical stage labels).

### 9.6 Reporting Dashboard + Excel Export (UR-B6)
- Visual dashboard: key metrics (applicants per cohort, acceptance rate, active cohorts, mentor load, funding requests status, cohort completion rate). Simple bar/line/pie charts are sufficient — this doesn't need to be a BI tool.
- Excel export: at minimum, export the underlying tabular data (e.g., full cohort roster with status, or full applicant list) to `.xlsx` — a library like `exceljs` or `sheetjs` on the backend, triggered by a "Download Excel" button, is the standard approach.
- Explicitly named downstream consumer: E4Impact Foundation — so export format should be clean, tabular, human-readable (proper column headers), not a raw DB dump.

### 9.7 Dynamic Form Builder (UR-B7)
- Admin UI to define/edit the fields on the applicant intake form (add text field, dropdown, checkbox, file upload, etc.) without a code deploy.
- Store form structure as JSON schema in a `form_definitions` table (field name, label, type, required flag, options for select/radio, order/position).
- The public "Join/Apply" form (UR-F10) renders dynamically from this schema — this is the key coupling: UR-B7 (admin builds the form) and UR-F10 (public fills it out) are two ends of the same feature, build them together.
- Submitted applications store answers as JSON keyed to field IDs (flexible schema) plus core normalized fields (applicant name/email at minimum, for search/filtering/mass email).

### 9.8 Content Management Tool — back-office half (UR-B8)
- CRUD screens for: Announcements, Gallery items (with image upload), Static pages (Terms & Conditions, and any other static page), Landing page featured content/hero copy.
- Rich text editor for announcement/page bodies (a lightweight WYSIWYG like TipTap or Quill is appropriate — avoid building a custom rich-text engine from scratch).
- Image uploads: store files (local disk in dev is fine; for production on Vercel, use Supabase Storage or another object store since Vercel's filesystem is ephemeral/read-only at runtime for serverless functions — this is a hard constraint of the deployment target, not optional).

### 9.9 Web-only confirmation (UR-B9)
- No Electron main/renderer process, no `electron-builder` config, no direct `pg` calls from a desktop-only codepath. All admin functionality is server-rendered pages or an SPA served over HTTP, authenticated via the same session/auth system as the rest of the app.

### 9.10 Contact & Subscriber Inbox (UR-B10)
- List view of Contact Us submissions (UR-F8): name, email, message, submitted date, read/unread or resolved/pending status flag.
- List view of Subscribers (UR-F9): email, subscribed date, active/unsubscribed status.
- Both lists are selectable as recipient sources for Mass Email (UR-B4) — this is the explicit cross-link in the brief; don't build these as dead-end inboxes.

---

## 10. Data Model — Suggested Entities (extend, don't necessarily replace, baseline ERD)

This is guidance, not a rigid schema — the agent should reconcile with whatever the baseline repo already has and extend/rename as needed, flagging significant restructuring per Section 15.

- `users` (id, email, password_hash, role, name, created_at, is_active)
- `cohorts` (id, name, type[startup|msme], start_date, end_date, application_deadline, stage_definitions)
- `applications` (id, cohort_id, applicant_name, applicant_email, dynamic_answers[jsonb], status[pending|accepted|declined], submitted_at)
- `entrepreneurs` / `incubatees` (id, user_id, cohort_id, current_stage, project_name, team_or_solo)
- `mentor_assignments` (id, mentor_id, entrepreneur_id, cohort_id)
- `mentor_sessions` (id, mentor_assignment_id, date, notes, feedback)
- `funding_requests` (id, entrepreneur_id, amount_requested, status, notes)
- `announcements` (id, title, body, published_at, author_id)
- `gallery_items` (id, image_url, caption, event_tag, uploaded_at)
- `static_pages` (id, slug, title, body) — for Terms & Conditions and similar
- `contact_submissions` (id, name, email, message, submitted_at, status)
- `subscribers` (id, email, subscribed_at, status)
- `email_templates` (id, name, subject, body)
- `email_campaigns` (id, template_id or ad-hoc body, recipient_filter, sent_at, sent_count)
- `form_definitions` (id, name, schema[jsonb], version)
- `brand_settings` (id, logo_primary_url, logo_alt_url, updated_at) — CMS-editable branding, so Section 4.2's "swappable without code change" is real, not aspirational

---

## 11. Cross-Reference — Full Functional Backlog (Beyond This MVP Subset)

Sections 8–10 above are the **prioritized, confirmed subset**. The companion document "User Requirements List — DxValley ICMS" is the full backlog and includes categories not detailed here — build toward compatibility with these even if not implementing them yet:

- User & Role Management (deepened beyond MVP)
- Application & Cohort Management (deepened)
- Program & Curriculum Management
- Mentorship Management (deepened)
- Funding & Financial Management (deepened)
- Partnership & Stakeholder Management
- KPI & Impact Tracking / Reporting (deepened)
- Workshops, Events & Networking
- Document & Content Management (deepened)
- Communication & Collaboration
- Dashboards & Analytics (deepened)
- Alumni & Long-Term Tracking
- Compliance & Security
- Non-Functional Requirements: web-based, scalable, **Michu-integration-ready** (unspecified third-party system — flag with supervisor if integration details are needed later, see Section 15), multi-language-ready (structure copy/content so i18n can be added later — e.g., don't hardcode English strings deep in logic; keep them in templates/CMS content where feasible)

---

## 12. Deliverables Checklist

- [ ] Working web app (public front end + admin back office) deployed from the forked/extended baseline repo.
- [ ] Git repo with clear README, setup instructions, committed `.env.example`.
- [ ] Coop Bank/DxValley branding applied consistently (colors, both logos, professional UI, no unstyled default form elements).
- [ ] CMS functional for at minimum: announcements, gallery, static pages.
- [ ] Role-based access working for all 4 roles with correct scoping (not just route-level, but row-level for Mentor/Entrepreneur).
- [ ] Reporting dashboard with at least one working Excel export.
- [ ] Public Contact Us and Subscribe forms live, submissions visible in admin panel, feeding into mass email recipient sources.
- [ ] Dynamic form builder driving the public Join/Apply form.
- [ ] Zero desktop/Electron dependency anywhere in the codebase.
- [ ] Zero login-wall on any public-facing page (landing, gallery, search, contact, subscribe, join, T&Cs).

---

## 13. Acceptance Criteria (Testable)

1. Fresh clone + `.env` filled from `.env.example` + `npm install` + one seed/migration command → app runs locally end-to-end with no manual DB hacking.
2. No component of the system requires a desktop install — everything is reachable via a browser URL, verified by grep-ing the repo for `electron` and finding zero runtime dependencies on it.
3. An incognito/anonymous browser session can: view the landing page, browse the gallery, use search and get results, submit the Contact Us form, submit the Subscribe form, submit the Join/Apply form — all without hitting a login redirect at any point.
4. A newly created Admin account (non-technical persona) can publish a new announcement and add a gallery image using only the admin UI, no code or DB console.
5. Superadmin can create an Admin, an Entrepreneur, and a Mentor account; logging in as each shows only the nav items and data appropriate to that role (verified against the matrix in Section 6).
6. From the admin panel, selecting "accepted applicants" as a mass-email recipient source and sending a test template results in emails dispatched via the configured SMTP settings (verifiable via a test SMTP catcher like Mailhog/Ethereal in dev).
7. Cohort roster data can be exported to a `.xlsx` file with correct headers and rows matching the on-screen dashboard data.
8. Editing the dynamic form builder to add a new field causes that field to appear on the public Join/Apply form without a redeploy (schema-driven, not hardcoded).

---

## 14. Build Order (Milestones, Expanded)

| # | Milestone | Includes | Exit criteria |
|---|---|---|---|
| M1 | Environment setup | Fork repo, configure `.env`/`.env.example`, get baseline app running locally, confirm DB migrations/seed work | `npm run dev` (or equivalent) boots cleanly against a local/Supabase Postgres instance |
| M2 | Branding + de-Electronification | Apply color tokens/logo system across existing views; strip Electron shell; port any Electron-only admin functionality to web routes | Admin reachable at `/admin` via plain HTTP, zero Electron runtime dependency, brand colors/logos visible site-wide |
| M3 | Auth: roles + first-login setup | Implement 4-role model, route guards, first-run Superadmin setup wizard | UR-B1 + UR-B2 fully testable per Section 13 item 5 |
| M4 | CMS + public front-end pages | Announcements, gallery, static pages, landing redesign, public search, confirm zero login-gating | UR-F1, F2, F5, F6, F7, F11 done; Section 13 item 3 passes |
| M5 | Contact, Subscribe, Join forms + admin inbox | Real forms (not mailto), storage, admin inbox view, cross-link to mass email recipient sources | UR-F8, F9, F10, UR-B10 done |
| M6 | Cohort management + reporting | Cohort CRUD, entrepreneur/mentor assignment, dashboard, Excel export | UR-B5, UR-B6 done; Section 13 item 7 passes |
| M7 | Mass email + dynamic form builder + countdown + chatbot (stretch, in priority order) | UR-B4, UR-B7 (paired with UR-F10 rework), UR-F3, UR-F4 if time allows | UR-B4/B7 done; F3/F4 done or explicitly deferred with supervisor sign-off |

---

## 15. Open Questions & Escalation Rules

The agent/intern should **not silently guess** on the following — flag to the mentor/supervisor before implementing:

- Any change to database engine, backend framework, or overall architecture beyond what's described here.
- Whether Admin role can manage other Admin accounts, or only Entrepreneur/Mentor accounts (Section 6 assumes the latter — confirm).
- Exact stage names/labels for MSME cohorts vs. Startup cohorts, if they differ (Section 9.5).
- What "Michu integration-ready" (Section 11) concretely requires — no integration spec was provided; do not build a speculative integration, just avoid architectural choices that would block one later (e.g., keep an API layer rather than tightly coupling views to DB queries).
- Whether Entrepreneur accounts are created only upon acceptance (recommended default) or immediately upon application submission — recommended default is: application record exists pre-acceptance, user account + login created only on acceptance, but confirm before building.
- Anything in the baseline repo's existing data model that conflicts with entities proposed in Section 10 — flag rather than silently overwriting existing structure.

**Working agreement:** commit small, descriptive changes; one pull request per milestone (Section 14) for review, not one large end-of-project PR; pull from `main` before starting each work session to avoid merge conflicts.

---

## 16. Deployment Notes (Vercel + Supabase)

- **Database:** Supabase-hosted Postgres. Use the pooled connection string for any serverless (Vercel Functions) backend code; direct/non-pooled connection is fine for local dev or long-running processes only.
- **File storage:** Use Supabase Storage buckets for gallery images, logos, and any user-uploaded content — Vercel's serverless filesystem is not persistent.
- **Backend hosting:** If the Express app is deployed as-is (not refactored into Vercel serverless functions), confirm whether Vercel is hosting it as a Node server (via a supported adapter) or whether routes need to be restructured as individual serverless functions — this affects folder structure (`/api` convention) and is worth confirming early (M1) rather than after building out routes the "wrong" way for the target platform.
- **Environment variables:** Set all `.env` values (Section 5) in the Vercel project settings for each environment (production/preview), not just locally.
- **Email sending:** Confirm SMTP provider allows sending from the deployment's egress IPs (some providers restrict by IP or require domain verification) — test mass email (UR-B4) in the actual deployed environment before considering M7 done, not just locally.