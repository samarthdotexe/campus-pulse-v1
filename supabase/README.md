# Campus Pulse database

1. Create a free project at [Supabase](https://database.new).
2. Open the project's SQL Editor and run `migrations/202610030001_initial_schema.sql`, then `migrations/202610040001_account_approvals.sql`, and finally `migrations/202610040002_shared_event_support.sql`.
3. Copy `.env.example` to `.env.local` and set the project URL and publishable key from the Supabase Connect dialog.
4. Create your first account through Supabase Auth; the migration automatically creates its participant profile. Then run the final `update public.profiles` command in the migration with that account's UUID to make it an admin.
5. In **Authentication → URL Configuration**, add `http://localhost:3000/update-password` for local recovery testing and add your production `/update-password` URL before launch.

The migration enables Row Level Security. Public visitors can browse clubs and events; RSVP data is visible only to the participant who submitted it and to authorized organizers. Admins manage clubs, and committee members manage events for their assigned club.

The second migration provides the public RSVP count used by event cards and the organizer-only RSVP report used by the dashboard. The account-approvals migration adds secure role requests, the initial approver roster, and private avatar storage. After applying it, run `verify-account-approvals.sql` in the SQL Editor. Do not run database migrations from the browser or add a service-role key to `.env.local`.

If the initial schema is already present, apply only `202610040001_account_approvals.sql` and `202610040002_shared_event_support.sql`, in that order. The initial approver can sign up as Faculty Member/Admin, then review that pending request from **Member requests** after signing in; every other Club Member or Faculty Member/Admin request remains pending until an allowlisted approver decides it.
