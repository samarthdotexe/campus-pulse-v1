# Campus Pulse Mobile, Account, and Approval Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship mobile-safe Campus Pulse layouts plus secure Supabase authentication, role approvals, profile management, avatar uploads, and password recovery.

**Architecture:** Supabase Auth becomes the session source and Postgres remains the authorization boundary. A new migration adds an approver allowlist, role-request lifecycle, constrained profile RPCs, and private avatar Storage policies. A small async client repository exposes those capabilities to focused client pages; responsive shared components use Tailwind mobile-first breakpoints.

**Tech Stack:** Next.js 16.3.8 App Router, React 19, TypeScript, Tailwind CSS 4, Motion, Lucide, `@supabase/ssr`, `@supabase/supabase-js`, Supabase Auth/Postgres/Storage.

**Spec:** `docs/superpowers/specs/2026-10-04-mobile-account-approval-design.md`

## Global Constraints

- Do not print, commit, or transmit Supabase URL, publishable key, or any other secret.
- The approver email is authorization configuration and must not be rendered as public UI data.
- Preserve the existing visual language and requested confirmation copy.
- Limit changes to the shared UI, auth/account, Supabase integration, and affected event/club/dashboard flows.
- Read the relevant Next.js 16 guide in `node_modules/next/dist/docs/` before writing any Next.js code.
- Use `apply_patch` for source and migration edits.

## Review Focus

- A client attempts to write `profiles.role`, `profiles.club_slug`, request decision fields, or another user’s avatar path directly; the database must deny it.
- An email outside the roster submits an approval RPC request; it must be denied even if the user’s stored UI role says admin.
- A request for Club Member has no club, or a duplicate pending request is submitted; validation must reject it without granting privileges.
- An expired or absent recovery session reaches `/update-password`; the user must receive a safe recovery prompt and no password change occurs.
- At 320px, navigation, forms, metrics, and event/calendar content must remain reachable without horizontal page overflow.

## File Structure

- `supabase/migrations/202610040001_account_approvals.sql`: roles, allowlist, role requests, protected RPCs, and avatar bucket/policies.
- `src/lib/supabase/auth.ts`: session/profile mapping and authentication/account action functions.
- `src/lib/supabase/repository.ts`: async club/event/RSVP mappings and read/write operations that replace active local store calls.
- `src/components/auth-context.tsx`: Supabase session subscription and profile source of truth.
- `src/components/navbar.tsx`: desktop navigation plus accessible mobile disclosure and account entry point.
- `src/app/signup/page.tsx`, `src/app/login/page.tsx`: Supabase-backed credential forms and requested-role creation.
- `src/app/forgot-password/page.tsx`, `src/app/update-password/page.tsx`, `src/app/account/page.tsx`: recovery and self-service account UI.
- `src/app/member-requests/page.tsx`: allowlisted approver request-review UI.
- Existing event, club, dashboard, calendar, and confirmation route files: async Supabase actions and mobile-first layouts.
- `src/app/globals.css`: only shared responsive/base rules that Tailwind utilities cannot express locally.

### Task 1: Add the secure account and approval database contract

**Files:**
- Create: `supabase/migrations/202610040001_account_approvals.sql`
- Modify: `supabase/README.md`
- Test: Supabase SQL Editor policy checks documented in `supabase/README.md`

**Interfaces:**
- Produces `approval_admins`, `role_requests`, `is_approval_admin()`, `request_role(...)`, `decide_role_request(...)`, `update_my_profile(...)`, and the private `avatars` bucket.
- Consumed by `src/lib/supabase/auth.ts` and `src/app/member-requests/page.tsx`.

- [ ] **Step 1: Write database policy checks before the migration**

Document SQL checks proving a participant cannot promote themselves, a non-allowlisted account cannot decide a request, and the allowlisted email can approve a valid request.

- [ ] **Step 2: Run the checks against the current schema**

Run the documented Supabase SQL Editor checks.
Expected: the required tables/functions are absent or the current profile grant allows the unsafe path.

- [ ] **Step 3: Implement the migration contract**

Create `approval_admins` seeded with normalized `samarthrathod161207@gmail.com`; create `role_requests` and a one-pending-request constraint; add the security-definer allowlist and decision functions; revoke direct sensitive profile/request writes; add `avatars` bucket policies scoped to `auth.uid()` folders.

- [ ] **Step 4: Apply the migration and rerun policy checks**

Run the documented checks in the Supabase SQL Editor.
Expected: all allowed paths succeed and all bypass attempts fail.

- [ ] **Step 5: Commit the database contract**

```bash
git add supabase/migrations/202610040001_account_approvals.sql supabase/README.md
git commit -m "feat: secure account approvals"
```

### Task 2: Establish Supabase auth and profile client boundaries

**Files:**
- Create: `src/lib/supabase/auth.ts`
- Modify: `src/lib/data.ts`
- Modify: `src/components/auth-context.tsx`
- Test: `src/lib/supabase/auth.test.ts`

**Interfaces:**
- Consumes `createClient()` and Task 1 RPC/table contracts.
- Produces `signUp`, `signIn`, `signOut`, `sendPasswordReset`, `updatePassword`, `getProfile`, `updateProfile`, `uploadAvatar`, `getMyRoleRequest`, and `CampusUser`.
- Consumed by auth, account, navigation, and approval pages.

- [ ] **Step 1: Write failing auth-mapping tests**

Test `mapProfileToCampusUser(profile, authEmail)` maps database `participant`, `committee`, and `admin` roles to the existing UI role labels and omits privileges for a pending request.

- [ ] **Step 2: Run the focused test file**

Run: `npm test -- src/lib/supabase/auth.test.ts`
Expected: FAIL because the module and test script do not yet exist.

- [ ] **Step 3: Add the test runner and implement the focused auth module**

Add the smallest TypeScript test setup compatible with the repository, then implement the exported functions above around `createClient()`. Keep Supabase credentials environment-only and return typed, display-safe errors.

- [ ] **Step 4: Replace the local-storage auth provider**

Subscribe to Supabase auth state, fetch the persisted profile after a session arrives, expose loading state, and call Supabase for login/logout. Remove `campus_active_user` and `campus_users` from active authentication paths.

- [ ] **Step 5: Run type, lint, and unit checks**

Run: `npm run lint && npm test -- src/lib/supabase/auth.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit the auth boundary**

```bash
git add package.json package-lock.json src/lib/data.ts src/lib/supabase/auth.ts src/lib/supabase/auth.test.ts src/components/auth-context.tsx
git commit -m "feat: use Supabase authentication"
```

### Task 3: Build secure signup, login, recovery, and account experiences

**Files:**
- Modify: `src/app/signup/page.tsx`
- Modify: `src/app/login/page.tsx`
- Create: `src/app/forgot-password/page.tsx`
- Create: `src/app/update-password/page.tsx`
- Create: `src/app/account/page.tsx`
- Modify: `src/app/signup-success/page.tsx`
- Test: `src/app/account/page.test.tsx`

**Interfaces:**
- Consumes Task 2 auth functions.
- Produces authenticated participant, pending organizer request, account update, and reset flows.
- Consumed by the navbar and browser verification.

- [ ] **Step 1: Write failing UI tests**

Test that participant signup does not call `request_role`, Club Member signup calls `request_role('committee', clubSlug)`, Faculty/Admin calls `request_role('admin', null)`, and account form calls only `updateProfile` with display name/avatar path.

- [ ] **Step 2: Run the focused UI test file**

Run: `npm test -- src/app/account/page.test.tsx`
Expected: FAIL because the pages and mocks are absent.

- [ ] **Step 3: Implement Supabase-backed signup and login**

Require password and confirmation, retain role choice cards, create accounts through Supabase, request elevated access only after signup, and direct successful flows to the existing celebration routes with pending-request context.

- [ ] **Step 4: Implement password recovery and account management**

Add generic-success reset request and reset completion forms. Add profile image upload/remove, display-name editing, signed-in email, role, pending-request state, and sign-out without exposing approver configuration.

- [ ] **Step 5: Run focused UI tests and lint**

Run: `npm test -- src/app/account/page.test.tsx && npm run lint`
Expected: PASS.

- [ ] **Step 6: Commit account flows**

```bash
git add src/app/signup/page.tsx src/app/login/page.tsx src/app/forgot-password/page.tsx src/app/update-password/page.tsx src/app/account/page.tsx src/app/signup-success/page.tsx src/app/account/page.test.tsx
git commit -m "feat: add account management flows"
```

### Task 4: Add approve/reject controls for allowlisted team members

**Files:**
- Create: `src/app/member-requests/page.tsx`
- Modify: `src/components/navbar.tsx`
- Test: `src/app/member-requests/page.test.tsx`

**Interfaces:**
- Consumes `isApprovalAdmin`, `listPendingRoleRequests`, and `decideRoleRequest` from Task 2.
- Produces an approval surface visible only to an allowlisted user.

- [ ] **Step 1: Write failing request-review tests**

Test that an unallowlisted profile sees no route entry and that approve/reject call `decideRoleRequest(requestId, 'approved' | 'rejected')` once with the selected decision.

- [ ] **Step 2: Run the focused request-review test**

Run: `npm test -- src/app/member-requests/page.test.tsx`
Expected: FAIL because the page and functions are absent.

- [ ] **Step 3: Implement the page and navigation entry**

Render pending requests with requester email, requested role, optional club, and creation date. Gate the route and navigation with `isApprovalAdmin`; rely on the database function—not the UI gate—for enforcement.

- [ ] **Step 4: Run focused tests and lint**

Run: `npm test -- src/app/member-requests/page.test.tsx && npm run lint`
Expected: PASS.

- [ ] **Step 5: Commit approval UI**

```bash
git add src/app/member-requests/page.tsx src/app/member-requests/page.test.tsx src/components/navbar.tsx
git commit -m "feat: add membership approvals"
```

### Task 5: Replace active local event data with the Supabase repository

**Files:**
- Create: `src/lib/supabase/repository.ts`
- Modify: `src/lib/store.ts`
- Modify: `src/app/events/page.tsx`
- Modify: `src/app/events/[id]/page.tsx`
- Modify: `src/app/events/[id]/rsvp/page.tsx`
- Modify: `src/app/events/new/page.tsx`
- Modify: `src/app/events/[id]/edit/page.tsx`
- Modify: `src/app/clubs/page.tsx`
- Modify: `src/app/clubs/[clubSlug]/page.tsx`
- Modify: `src/app/clubs/manage/page.tsx`
- Modify: `src/app/dashboard/page.tsx`
- Modify: `src/app/calendar/page.tsx`
- Test: `src/lib/supabase/repository.test.ts`

**Interfaces:**
- Consumes Task 2 `CampusUser` and Supabase tables from the initial migration.
- Produces async event, club, RSVP, question, and analytics operations preserving current UI model shapes.

- [ ] **Step 1: Write failing record-mapping tests**

Test `mapEventRecord`, `mapClubRecord`, and RSVP answer conversion preserve event times, club slug, capacity, and questionnaire answer values.

- [ ] **Step 2: Run the mapping tests**

Run: `npm test -- src/lib/supabase/repository.test.ts`
Expected: FAIL because the repository does not exist.

- [ ] **Step 3: Implement the async repository and migrate active routes**

Read and mutate Supabase clubs, events, questions, RSVPs, and organizer analytics. Replace active `localStorage` store calls with loading, empty, and recoverable error states; do not fall back to seed data on configured-database failures.

- [ ] **Step 4: Run mapping tests, lint, and production build**

Run: `npm test -- src/lib/supabase/repository.test.ts && npm run lint && npm run build`
Expected: PASS.

- [ ] **Step 5: Commit shared data integration**

```bash
git add src/lib/supabase/repository.ts src/lib/supabase/repository.test.ts src/lib/store.ts src/app/events src/app/clubs src/app/dashboard/page.tsx src/app/calendar/page.tsx
git commit -m "feat: persist campus data in Supabase"
```

### Task 6: Make the shared UI and affected routes mobile-safe

**Files:**
- Modify: `src/components/navbar.tsx`
- Modify: `src/app/page.tsx`
- Modify: `src/app/events/page.tsx`
- Modify: `src/app/events/[id]/page.tsx`
- Modify: `src/app/events/[id]/rsvp/page.tsx`
- Modify: `src/app/events/new/page.tsx`
- Modify: `src/app/events/[id]/edit/page.tsx`
- Modify: `src/app/clubs/page.tsx`
- Modify: `src/app/clubs/[clubSlug]/page.tsx`
- Modify: `src/app/clubs/manage/page.tsx`
- Modify: `src/app/dashboard/page.tsx`
- Modify: `src/app/calendar/page.tsx`
- Modify: `src/app/login/page.tsx`
- Modify: `src/app/signup/page.tsx`
- Modify: `src/app/account/page.tsx`
- Modify: `src/app/globals.css`
- Test: browser viewport verification notes in `docs/superpowers/plans/2026-10-04-mobile-account-approval.md`

**Interfaces:**
- Consumes all completed pages and `Navbar` state.
- Produces accessible navigation and no horizontal page overflow from 320px upward.

- [ ] **Step 1: Add an accessible mobile navigation state test**

Test that the menu toggle has an accessible name, exposes/updates `aria-expanded`, and closes after following a navigation link.

- [ ] **Step 2: Run the navigation test before responsive implementation**

Run: `npm test -- src/components/navbar.test.tsx`
Expected: FAIL because the mobile menu behavior is absent.

- [ ] **Step 3: Implement mobile-first layout updates**

Use compact phone gutters, breakpoint-based grid columns, stacked form/action groups, a mobile navigation disclosure, and compact calendar containment. Retain existing desktop behavior, colors, backgrounds, and animations.

- [ ] **Step 4: Run responsive browser checks**

At 320px, 375px, 768px, and desktop, check landing, login, signup, events, calendar, clubs, dashboard, account, and member requests for reachable controls, no horizontal page overflow, and no runtime/console errors.

- [ ] **Step 5: Run full static verification**

Run: `npm run lint && npm run build`
Expected: PASS.

- [ ] **Step 6: Commit responsive UI**

```bash
git add src/components/navbar.tsx src/components/navbar.test.tsx src/app
git commit -m "feat: make Campus Pulse mobile responsive"
```

### Task 7: Final integration and safe release verification

**Files:**
- Modify: `.env.example` only if variables are newly required
- Modify: `supabase/README.md` with setup and non-secret verification steps

**Interfaces:**
- Consumes all previous tasks.
- Produces a reproducible local/Supabase setup and verified production build.

- [ ] **Step 1: Verify environment hygiene**

Run: `git check-ignore .env.local && git diff -- .env.local && git status --short`
Expected: `.env.local` is ignored and no secret value appears in tracked diffs.

- [ ] **Step 2: Verify configured Supabase connectivity without printing credentials**

Run a read-only connection/auth reachability probe that reports only success/failure.
Expected: database and Auth endpoint reachable.

- [ ] **Step 3: Run the complete automated and browser suite**

Run: `npm test && npm run lint && npm run build`, then the Task 6 browser viewport checks.
Expected: all commands pass and no console/runtime errors appear.

- [ ] **Step 4: Commit verification documentation**

```bash
git add .env.example supabase/README.md
git commit -m "docs: document secure Supabase setup"
```

## Self-Review

- **Spec coverage:** Tasks 1–2 provide the secure authorization/session source; Task 3 provides profile, avatar, and recovery UI; Task 4 provides human approval; Task 5 migrates active data; Task 6 covers the responsive requirement; Task 7 verifies safety and release readiness.
- **Step scan:** Each task starts with a failing behavior check, implements a defined interface, and ends with an explicit verification and commit step.
- **Type consistency:** Task 1’s database functions are consumed by Task 2; Task 2’s `CampusUser` and account functions are consumed by Tasks 3–5; Task 6 only consumes completed UI surfaces.
- **Review focus:** Each listed concern is pinned to Tasks 1, 3, 4, or 6’s tests and policy/browser checks.
- **Proportion:** The plan specifies contracts and checks rather than implementation bodies; it remains scoped to the approved design.
