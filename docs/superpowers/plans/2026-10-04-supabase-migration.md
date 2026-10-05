# Campus Pulse Supabase Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Campus Pulse's browser-only accounts and event data with secure Supabase Auth and shared Postgres data.

**Architecture:** Supabase Auth and the `profiles` table become the single source of session state. A small browser repository maps the existing UI models to the database, and a data provider makes shared clubs, events, and RSVP state available to client pages without localStorage fallbacks.

**Tech Stack:** Next.js 16.3.8 App Router, React 19, TypeScript, Tailwind CSS 4, `@supabase/ssr`, `@supabase/supabase-js`, Supabase Auth/Postgres/RLS.

**Spec:** `docs/superpowers/specs/2026-10-04-supabase-migration-design.md`

## Global Constraints

- Do not print, commit, or transmit credentials.
- Do not create a persistent production user as part of verification.
- Preserve the existing visual language.
- Keep roles database-owned: public sign-up creates participants only.
- Use `apply_patch` for source and migration edits.
- Read relevant Next.js 16 documentation before changing App Router behavior.

## Review Focus

- Missing or incomplete Supabase environment configuration must show a recoverable UI error, not a blank page or render loop.
- An Auth project requiring email confirmation must show the confirmation state instead of assuming a session exists.
- A participant must not be able to create events, change clubs, or inspect another participant's RSVP through a client-side role value.
- An empty shared database must render intentional empty states rather than stale local demo records.
- Event date and time mapping must preserve the selected local calendar date and time after a shared-data round trip.

---

## File Structure

- `src/lib/supabase/repository.ts`: typed database-to-UI mappings and asynchronous auth, club, event, and RSVP operations.
- `src/components/auth-context.tsx`: Supabase session subscription and profile source of truth.
- `src/components/campus-data-context.tsx`: shared loading, error, refresh, and mutation state for client routes.
- `src/app/layout.tsx`: provider composition.
- `src/app/signup/page.tsx`, `src/app/login/page.tsx`: password-based Supabase forms and confirmation handling.
- Existing event, club, calendar, and dashboard routes: consume shared context and render loading/error/empty states.
- `supabase/migrations/202610040002_shared_event_support.sql`: RSVP count and organizer reporting support required by the existing UI.
- `supabase/README.md`: safe apply/verification instructions for the additional migration.
- `src/lib/supabase/repository.test.ts`: mapping and API-contract tests.

### Task 1: Create the shared-data repository contract

**Files:**
- Create: `src/lib/supabase/repository.ts`
- Create: `src/lib/supabase/repository.test.ts`
- Modify: `package.json`

**Interfaces:**
- Produces `listClubs()`, `listEvents()`, `listMyRsvps()`, `createEvent()`, `updateEvent()`, `createRsvp()`, `cancelRsvp()`, `createClub()`, `updateClub()`, and date/record mapping helpers.
- Consumed by `src/components/campus-data-context.tsx` and the authentication context.

- [ ] **Step 1: Write failing repository mapping tests**

Test an event record with a UTC timestamp maps to its intended date/time, an RSVP question maps ordered choices, and malformed database data yields a safe error.

- [ ] **Step 2: Run the focused test to verify it fails**

Run: `npm test -- repository.test.ts`
Expected: FAIL because the repository module does not exist.

- [ ] **Step 3: Implement the repository interface**

Implement the listed async functions against the Supabase browser client; map server fields to the existing `CampusEvent`, `Club`, and RSVP shapes and throw actionable errors returned by Supabase.

- [ ] **Step 4: Run repository tests**

Run: `npm test -- repository.test.ts`
Expected: PASS.

### Task 2: Add database support for shared RSVP metrics

**Files:**
- Create: `supabase/migrations/202610040002_shared_event_support.sql`
- Modify: `supabase/README.md`

**Interfaces:**
- Produces `events.rsvp_count`, count-maintenance triggers, and `get_organizer_rsvps()` for authorized dashboard data.
- Consumed by `listEvents()` and organizer dashboard repository calls.

- [ ] **Step 1: Document failing SQL checks**

Add SQL Editor checks for public event reads, exact RSVP count changes, and rejection of an unauthorized organizer-report request.

- [ ] **Step 2: Implement the migration**

Add the count field and triggers, backfill existing rows, and add a security-definer organizer report function that checks club/event authorization before returning attendee details.

- [ ] **Step 3: Document application and verification**

Update the Supabase README with the migration order and expected checks; no key is written to repository files.

### Task 3: Replace localStorage authentication

**Files:**
- Modify: `src/components/auth-context.tsx`
- Modify: `src/app/signup/page.tsx`
- Modify: `src/app/login/page.tsx`
- Modify: `src/app/signup-success/page.tsx`
- Modify: `src/app/returning-user/page.tsx`

**Interfaces:**
- Consumes `createClient()` and the repository profile mapper.
- Produces `useAuth()` with `user`, `loading`, `error`, `signUp`, `signIn`, and `logout`.
- Consumed by navigation and protected route actions.

- [ ] **Step 1: Write failing auth client tests**

Mock Supabase Auth and assert sign-up sends email/password/name, sign-in uses password credentials, and a session with no profile remains recoverable.

- [ ] **Step 2: Run focused tests to verify they fail**

Run: `npm test -- repository.test.ts`
Expected: FAIL with missing authentication functions.

- [ ] **Step 3: Implement session/profile lifecycle and forms**

Use `onAuthStateChange`, fetch the profile for the authenticated identity, add password confirmation/client validation, and route confirmation-required signups to the existing success experience.

- [ ] **Step 4: Run auth tests and lint**

Run: `npm test -- repository.test.ts && npm run lint`
Expected: PASS with no lint errors.

### Task 4: Make application screens consume shared data

**Files:**
- Create: `src/components/campus-data-context.tsx`
- Modify: `src/app/layout.tsx`
- Modify: `src/app/page.tsx`
- Modify: `src/app/events/page.tsx`
- Modify: `src/app/events/[id]/page.tsx`
- Modify: `src/app/events/new/page.tsx`
- Modify: `src/app/events/[id]/edit/page.tsx`
- Modify: `src/app/events/[id]/rsvp/page.tsx`
- Modify: `src/app/calendar/page.tsx`
- Modify: `src/app/clubs/page.tsx`
- Modify: `src/app/clubs/[clubSlug]/page.tsx`
- Modify: `src/app/clubs/manage/page.tsx`
- Modify: `src/app/dashboard/page.tsx`

**Interfaces:**
- Consumes all repository operations from Task 1 and `useAuth()` from Task 3.
- Produces `useCampusData()` with `clubs`, `events`, `myRsvps`, `loading`, `error`, `refresh`, and mutation methods.

- [ ] **Step 1: Write failing provider tests**

Test initial public data loading, a rejected RSVP mutation preserving prior state, and an empty database returning an empty collection rather than local demo records.

- [ ] **Step 2: Run focused tests to verify they fail**

Run: `npm test -- repository.test.ts`
Expected: FAIL with missing provider behavior.

- [ ] **Step 3: Implement provider and refactor routes**

Load public records independently of a session, load personal RSVP records after authentication, refresh after mutations, and give each affected route loading, error, and empty states while preserving layout and visual effects.

- [ ] **Step 4: Run the full code checks**

Run: `npm test && npm run lint && npm run build`
Expected: PASS.

### Task 5: Verify safely against the configured project

**Files:**
- Modify: `supabase/README.md`

**Interfaces:**
- Consumes the deployed migration and the configured local environment without reading values into logs.

- [ ] **Step 1: Verify safe connection paths**

Run a read-only database query and Auth session endpoint check using environment variables without printing their values.

- [ ] **Step 2: Exercise browser paths without creating an account**

Open the landing, sign-up, login, events, and clubs pages; verify UI validation and no console/runtime errors.

- [ ] **Step 3: Record required external action**

If the configured project does not yet contain Task 2's migration, report the exact migration file the owner must apply; do not use an untrusted client key to alter production schema.
