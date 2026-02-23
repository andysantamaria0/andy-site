# Andy Site — Project Notes

## Supabase

**Production Supabase project**: `fbnnicarsnzipzbvszrx` (`https://fbnnicarsnzipzbvszrx.supabase.co`)

The Supabase CLI may be linked to a *different* project (`kpydatxnzibtzakurcwr`). Do NOT use `supabase db push` blindly — it will run migrations on the wrong database.

**To run migrations on production**, connect directly:
```
postgresql://postgres.fbnnicarsnzipzbvszrx:romXof-gekma7-zawwoc@aws-1-us-east-1.pooler.supabase.com:5432/postgres
```

After running DDL, reload the PostgREST schema cache:
```sql
NOTIFY pgrst, 'reload schema';
```

## Vercel

Deployed on Vercel. The production env vars (including `NEXT_PUBLIC_SUPABASE_URL`) point to `fbnnicarsnzipzbvszrx`.

## Stack

- Next.js (App Router, server components + API routes)
- Supabase (Postgres, Auth, RLS)
- CSS custom properties with `v-` prefix convention (see `app/trips/trips.css`)
- Anthropic Claude API for AI features (smart paste, suggestions, concierge)

## Conventions

- API routes: `const { tripId } = await params; const supabase = await createClient();`
- Server Supabase client: `lib/supabase/server.js` (uses `@supabase/ssr` with anon key + cookies)
- Migrations live in `supabase/migrations/` with numeric prefix (e.g., `029_suggestions.sql`)
