# Supabase Setup

1. Open the Supabase SQL Editor for the project you want to use with this dashboard.
2. Run `supabase/schema.sql`.
3. Add these environment variables locally and in Vercel:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_ENABLE_SYNC=1
```

4. Keep `SUPABASE_SERVICE_ROLE_KEY` server-side only.
5. Trigger a fresh dashboard load or call `/api/dashboard?refresh=1` to write the next Meta sync into Supabase.
