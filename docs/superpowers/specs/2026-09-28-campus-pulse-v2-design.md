# Campus Pulse v2 — Auth, Calendar, RSVP, Event Management

## Context

Campus Pulse is a Next.js 16 + React 19 + Tailwind v4 event discovery platform. Currently has no auth, hardcoded mock data in `src/lib/data.ts`, two nav tabs (Events, Clubs), and static event cards. This spec adds: role-based mock login, calendar view, RSVP flow with custom forms, event CRUD for committee members, club card restyle, and club renames.

All state persists to localStorage. No backend, no real auth provider.

---

## Data Model Changes (`src/lib/data.ts`)

### New Types

```ts
export type UserRole = "participant" | "committee";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  clubSlug?: string; // committee only: which club they manage
}

export interface RsvpQuestion {
  id: string;
  type: "text" | "textarea" | "select" | "checkbox" | "radio";
  label: string;
  options?: string[]; // for select/radio/checkbox types
  required: boolean;
}

export interface RsvpResponse {
  id: string;
  eventId: string;
  userId: string;
  answers: Record<string, string | string[] | boolean>;
  submittedAt: string;
}
```

### CampusEvent Additions

Two new optional fields:
- `rsvpQuestions?: RsvpQuestion[]` — custom form questions set by committee on event creation
- `createdBy?: string` — user ID of the committee member who created the event

### Club Renames

| Old Slug | New Slug | New Name |
|----------|----------|----------|
| codecraft | tech-club | Tech Club |
| entrepreneurship-cell | entrepreneur-club | Entrepreneur Club |
| design-collective | ai-ml-club | AI/ML Club |
| music-society | dsa-club | DSA Club |
| debate-club | sports-club | Sports Club |
| sports-council | communications-club | Communications Club |

Categories, colors, member counts, taglines, descriptions updated to match. All event `clubSlug` references updated accordingly.

---

## Auth System (`src/lib/auth-context.tsx`)

React context provider, client-side only.

- State: `User | null`
- On mount: hydrate from `localStorage.getItem("cp_user")`
- `login(name, email, role, clubSlug?)`: creates User with `crypto.randomUUID()` id, saves to state + localStorage
- `logout()`: clears state + localStorage
- Wraps app in `layout.tsx`

Navbar shows Login button when logged out, user name + role badge + Logout button when logged in.

No middleware. Pages guard via `useAuth()` hook checking role client-side.

---

## LocalStorage Store (`src/lib/store.ts`)

Thin wrapper around localStorage for events and RSVPs.

- `getEvents(): CampusEvent[]` — returns stored events or seeds from `data.ts` if empty
- `saveEvents(events)` — writes to localStorage
- `addEvent(event)` / `updateEvent(id, partial)`
- `getRsvps(): RsvpResponse[]` / `addRsvp(response)`

All pages read events through this store instead of importing `data.ts` directly.

---

## Routes

| Route | Access | Description |
|-------|--------|-------------|
| `/login` | Public | Role picker + login form |
| `/calendar` | Public | Month-view calendar browsing |
| `/events/create` | Committee only | Create event + build RSVP form |
| `/events/[id]/edit` | Committee (own) | Edit their event |
| `/events/[id]/rsvp` | Participant only | Submit RSVP with custom questions |

Navbar updated to: Events, Calendar, Clubs (left) + auth controls (right).

---

## Page Designs

### Login Page (`/login`)

Single page, two-step flow:
1. **Role selection**: Two large clickable cards — "Club Participant" and "Club Committee Member". Selected card gets highlighted border/background.
2. **Form**: Name input, email input. If committee selected: dropdown to pick their club. Submit button calls `auth.login()` then redirects to `/` (or `?redirect=` param).

Dark theme consistent with rest of site. Uses aurora-veil shader as background or plain dark gradient.

### Calendar Page (`/calendar`)

Client component. Pure CSS grid month-view calendar, no external library.

- Header: `< April 2026 >` with prev/next month arrows
- 7-column grid (Sun–Sat), each cell showing day number
- Colored dots per day indicate events (dot color = club color)
- Clicking a day: right sidebar or below-panel shows that day's events using the existing event card component
- Events sourced from `store.getEvents()`

### Event Create (`/events/create`)

Guarded: redirect to `/login` if not committee.

Form fields: title, description, date (native `<input type="date">`), time, location, capacity, club (pre-filled from user's clubSlug, readonly).

**RSVP Question Builder** section below event form:
- List of question rows, each with: type selector dropdown, label input, required toggle, delete button
- For select/radio/checkbox types: inline option list with add/remove
- "Add Question" button appends a new row
- Up/down buttons for reordering (no drag-and-drop)
- On submit: generates `RsvpQuestion[]` with UUID ids, saves event via `store.addEvent()`

### Event Edit (`/events/[id]/edit`)

Same form as create, pre-populated. Guarded: only renders if `event.createdBy === user.id`. Otherwise shows "not authorized" message.

### RSVP Flow (`/events/[id]/rsvp`)

Guarded: must be logged in as participant.

- Fetches event, reads `event.rsvpQuestions`
- If questions exist: renders dynamic form mapping each question type to an input
- If no questions: renders default confirmation (name + email display, confirm button)
- On submit: creates `RsvpResponse`, increments `event.rsvps`, saves both to localStorage
- Success state shown inline

Event cards across all pages get an "RSVP" button visible when user role is participant. Unauthenticated users clicking RSVP are redirected to `/login?redirect=/events/[id]/rsvp`.

---

## Club Card Restyle (Home Page "Browse by Club")

Current: horizontal flex row with small initial avatar, name, tagline, arrow.
New: vertical card with colored top border (matching club color), larger circular initial avatar centered at top, name, tagline truncated, member count badge, hover glow effect using club color. Grid changes to `grid-cols-2 md:grid-cols-3 lg:grid-cols-6`.

Consistent with the existing clubs page card style but more compact for the home page section.

---

## Files Changed

| File | Change |
|------|--------|
| `src/lib/data.ts` | Add types, rename clubs, update events, add rsvpQuestions/createdBy to CampusEvent |
| `src/lib/auth-context.tsx` | **New** — AuthProvider, useAuth hook |
| `src/lib/store.ts` | **New** — localStorage CRUD for events and RSVPs |
| `src/app/layout.tsx` | Wrap children in AuthProvider |
| `src/components/navbar.tsx` | Add Calendar link, auth controls (login/logout/user badge) |
| `src/app/login/page.tsx` | **New** — login page |
| `src/app/calendar/page.tsx` | **New** — calendar page |
| `src/app/events/create/page.tsx` | **New** — event creation with RSVP builder |
| `src/app/events/[id]/edit/page.tsx` | **New** — event edit |
| `src/app/events/[id]/rsvp/page.tsx` | **New** — RSVP submission |
| `src/app/page.tsx` | Update club cards section, use store instead of direct import, add RSVP buttons to event cards |
| `src/app/clubs/page.tsx` | Use store for events |
| `src/app/clubs/[clubSlug]/page.tsx` | Use store, update slugs, add RSVP buttons |
