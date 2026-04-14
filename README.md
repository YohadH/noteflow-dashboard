# NoteFlow Dashboard

The frontend is now wired to a Supabase backend while keeping the existing UI intact.

## Setup

1. Create a Supabase project.
2. Copy `.env.example` to `.env` and fill in:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Apply the SQL migrations in order:
   - [supabase/migrations/20260413_initial_schema.sql](supabase/migrations/20260413_initial_schema.sql)
   - [supabase/migrations/20260414_shared_boards.sql](supabase/migrations/20260414_shared_boards.sql)
   - [supabase/migrations/20260415_board_webhooks.sql](supabase/migrations/20260415_board_webhooks.sql)
4. Run the app with `npm run dev`.

## What Was Added

- Supabase auth-backed login and signup
- Postgres schema for profiles, settings, notes, reminders, alerts, email actions, categories, and tags
- RLS policies for per-user data isolation
- Trigger-based syncing from notes to reminders, alerts, and email actions
- API/service layer in `src/api`
- Supabase-backed Zustand stores that preserve the current UI contract
- Edge function stubs for processing alerts and email actions

## Backend Files

- Supabase client: [src/lib/supabase/client.ts](src/lib/supabase/client.ts)
- DB types: [src/lib/supabase/types.ts](src/lib/supabase/types.ts)
- API layer: [src/api](src/api)
- Migration: [supabase/migrations/20260413_initial_schema.sql](supabase/migrations/20260413_initial_schema.sql)
- Workers:
  - [supabase/functions/process-alerts/index.ts](supabase/functions/process-alerts/index.ts)
  - [supabase/functions/process-email-actions/index.ts](supabase/functions/process-email-actions/index.ts)

## Notes

- If Supabase email confirmation is enabled, signup may require email verification before the user can enter the app.
- `process-alerts` now posts due alerts to the `Webhook URL` saved on the active board. Shared/family boards can use one shared webhook destination.
- To enable webhook delivery in Supabase:
  - Deploy the function: `supabase functions deploy process-alerts`
  - Optionally set a bearer token for your receiver: `supabase secrets set ALERT_WEBHOOK_AUTH_TOKEN=your-token`
  - Schedule the function to run periodically, or invoke it from your own job runner.
- Webhook payloads are sent as JSON with `x-noteflow-event: note.alert.triggered` and `x-noteflow-alert-id: <alert-id>` headers.
