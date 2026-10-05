# Supabase Migration Design

## Goal

Move Campus Pulse from browser-only accounts and records to Supabase Auth and Postgres so users can sign in securely and organizers can see shared RSVP activity.

## Current Finding

The Supabase database and Auth endpoint respond successfully, but the application still reads and writes `localStorage`. No live screen currently queries Supabase.

## Authentication

Sign-up and login will use Supabase email-and-password authentication. A database trigger creates a participant profile for each new account. The authenticated profile becomes the source of the Campus Pulse user state.

Roles remain database-owned. Public sign-up creates participants only. An existing admin promotes a user to club member or admin and assigns a club through secure database administration, preventing clients from elevating their own permissions.

## Shared Data

The application will query and mutate `clubs`, `events`, `rsvp_questions`, and `rsvps` through a focused browser repository. It converts between existing UI data shapes and the Postgres schema, including event date/time, club slug, and RSVP answer formats.

Pages load shared data after the Supabase session is ready. Event, club, RSVP, and dashboard displays use loading and error states rather than silently falling back to stale local data.

## Permissions

The existing Row Level Security model is retained:

- Everyone can read clubs, events, and RSVP questions.
- Participants create, view, update, and cancel only their own RSVPs.
- Club members manage events and RSVP questions for their assigned club.
- Admins manage all clubs and events.
- Organizers can read RSVP submissions for events they manage.

## Migration Scope

The prior local storage store becomes a Supabase-backed asynchronous repository. Existing seed data remains only as an empty-development fallback when Supabase is not configured; with the provided configuration, all views use Supabase.

## Testing

Tests will cover conversion between the UI and database records, role-safe profile mapping, successful authentication calls, public event reads, participant RSVP creation/cancellation, and organizer-scoped event data. Browser checks will verify the sign-up/login path and absence of console errors without publishing test accounts.

## Constraints

- Do not print, commit, or transmit credentials.
- Do not alter the existing visual language.
- Do not create a persistent production user account as part of verification.
