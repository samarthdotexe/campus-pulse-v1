# Campus Pulse Mobile, Account, and Approval Design

## Goal

Make Campus Pulse usable on phones and add secure account management and membership approval. Participants may register immediately. Club Member and Faculty Member/Admin requests require approval from a database-enforced team-email allowlist before their requested privileges take effect.

## Intent and Success Criteria

The public site retains its existing dark, animated Campus Pulse visual language at every viewport. A first-time participant can sign up and RSVP without administrator intervention. Organizers only gain Club Member or Faculty Member/Admin access after an approved team member accepts their request. Every signed-in user can manage their public profile, inspect their signed-in email and role, upload a profile photo, and recover a forgotten password.

The initial and only approver is `samarthrathod161207@gmail.com`. It is authorization configuration, not an application secret, and is stored in the secured Supabase approver roster rather than exposed to the browser.

## Selected Approach

Three approaches were considered:

1. Browser-managed roles and approval state: fastest, but users could bypass it by altering local storage. Rejected.
2. A static list embedded in a database policy: secure, but requires changing policy code for every team change. Rejected.
3. A protected approver roster checked by database functions: secure, auditable, and editable through controlled database administration. Selected.

The application uses Supabase Auth for sessions, Postgres for public profiles and membership requests, and Supabase Storage for avatars. Browser pages call constrained RPC functions or RLS-protected tables; they never write roles or approval state directly.

## Authentication and Authorization

Supabase Auth replaces `campus_active_user`, `campus_users`, and the local-only login/signup flow. The authenticated Supabase user is the sole source of session email and identity. A trigger creates a `profiles` row with the `participant` role after each new account is created.

Signup offers these role intents:

- **Club Participant:** creates an active participant profile immediately.
- **Club Member:** creates an active participant profile plus a pending request for the `committee` role and selected club.
- **Faculty Member/Admin:** creates an active participant profile plus a pending request for the `admin` role.

The requested role is not granted at signup. A `role_requests` record stores the requester, requested role, optional club, status, reviewer, and review timestamp. A partial unique index permits only one pending request per user.

An `approval_admins` roster stores normalized approver email addresses. The initial migration seeds only `samarthrathod161207@gmail.com`. A security-definer `is_approval_admin()` function compares the authenticated JWT email to this roster. It is used by policies and by the single role-request decision RPC. On approval, that RPC atomically changes the profile role/club, marks the request approved, and records the reviewer. Rejection leaves the account as a participant and records the decision. Direct writes to role, club assignment, reviewer, and request status are denied.

The profile update path is a constrained RPC that may change only display name and avatar path. It prevents a user from changing their own role or organizer club assignment. Existing profile policies are tightened accordingly.

## Account Management

`/account` is available to every signed-in user and presents:

- profile photo with upload/remove controls;
- editable display name (the user-facing username);
- authenticated email address, current role, and membership-request status;
- a link to send a password-reset email; and
- sign-out.

Avatar uploads use a private `avatars` Storage bucket, in a user-id folder. Storage policies permit each signed-in user to create, replace, read, and delete only objects in their own folder. The app saves an object path, not a permanent public URL, and creates a short-lived signed URL for display.

`/forgot-password` accepts an email address and calls `resetPasswordForEmail` with the app’s `/update-password` redirect URL. `/update-password` verifies the recovery session and calls `updateUser({ password })`. Both pages use generic success/error copy so they do not disclose whether an email address has an account.

## Organizer Administration

Approved allowlisted Faculty Member/Admin users see a **Member requests** surface alongside existing club management and dashboard controls. It lists pending Club Member and Faculty Member/Admin requests and permits only approve or reject actions. The UI displays requester email, requested role, requested club where applicable, and submission time.

Existing event, club, RSVP, and dashboard permissions continue to use the persisted profile role and club assignment. Until a request is approved, the user receives the participant view and has no organizer controls.

## Mobile-First Responsive UI

The responsive work is confined to active UI pages and shared components; unrelated project code is not audited or reworked. The target range is 320px through desktop.

- The shared navigation becomes a compact mobile header with an accessible menu toggle and a stacked menu panel. Desktop links and role actions retain their current layout from the medium breakpoint upward.
- Page gutters use a small mobile inset and progressively expand at `sm`/`lg` breakpoints. Headers wrap or stack rather than clipping.
- Statistic rows use one column on narrow phones, two columns where legible, and their existing multi-column layouts only at wider breakpoints.
- Two-field forms stack on phones and become two columns at `sm`; action groups wrap with full-width primary actions when needed.
- Event, club, RSVP, dashboard, and account cards change from fixed multi-column grids to mobile-first grids. Tables retain readable labelled card alternatives or horizontal containment where a true table is required.
- Calendar content retains seven days but uses compact weekday labels, minimum tap targets, and horizontal containment instead of forcing the full desktop width into the viewport.
- Existing backgrounds, glow effects, hover/entrance animation, type scale hierarchy, and confirmation screens remain intact. The landing header continues to use the specified “Welcome to / Campus Pulse” treatment.

## Data Integration

The existing Supabase migration design remains a prerequisite: the active app reads Supabase profiles, clubs, events, RSVP questions, and RSVPs rather than treating `localStorage` as canonical data. A focused async data layer maps database records to the existing UI models. Pages present explicit loading, empty, and recoverable-error states. No fallback to local seeded data occurs when a configured database request fails.

## Error Handling

- Auth, profile, request, and storage failures are shown in the page action area without losing typed form input.
- If a user’s session expires, protected actions return them to login and preserve a safe return path.
- An already-pending role request is rendered as pending rather than duplicated.
- Unauthorized approval, role-change, profile-field, and avatar-folder attempts are rejected by Postgres or Storage policies even if the UI is bypassed.
- Password reset always returns a neutral completion response to prevent account enumeration.

## Testing and Verification

Automated checks cover record mapping, allowlist decisions, role-request state transitions, profile update constraints, password-reset request handling, and responsive navigation state. Database tests/policy checks prove a participant cannot self-promote, cannot approve a request, cannot read other users’ private avatars, and cannot modify another profile.

Browser verification covers 320px, 375px, 768px, and desktop widths on the landing page, auth pages, events, dashboard, club management, and account page. It also checks mobile navigation, signup states, pending-request visibility, admin approval visibility, profile upload controls, password-reset flow, and absence of console/runtime errors. Testing does not create a persistent production account unless explicitly authorized.

## Constraints

- Do not print, commit, or transmit Supabase URL, publishable key, or any other secret.
- The approver email is authorization configuration and must not be rendered as public UI data.
- Preserve the existing visual language and requested confirmation copy.
- Limit changes to the shared UI, auth/account, Supabase integration, and affected event/club/dashboard flows.
