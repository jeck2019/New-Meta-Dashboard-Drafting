# Strikeman Meta Command Center

A lightweight dashboard for ranking live Meta ads, comparing week-over-week, month-over-month, or custom-range performance, and surfacing the actual copy and creative metadata used in each ad.

## Files

- `server.py` serves the dashboard and exposes `/api/dashboard`.
- `index.html`, `styles.css`, and `app.js` render the dashboard UI.
- `.env.example` shows the local environment variables the server reads.
- `supabase/schema.sql` contains the database schema for historical Meta sync storage.

## Run locally

1. Copy `.env.example` to `.env.local` and fill in the Meta values, or export the same variables in your shell.
2. If you want Supabase persistence, run `supabase/schema.sql` in the Supabase SQL editor, then fill in the Supabase values and set `SUPABASE_ENABLE_SYNC=1`.
3. Start the server:

```bash
python3 server.py
```

4. Open [http://localhost:8000](http://localhost:8000).

## Notes

- When valid Meta credentials are present, the UI loads Meta ad-level insights from `/api/dashboard` and includes ads with delivery in the selected reporting window.
- When Supabase is configured and `SUPABASE_ENABLE_SYNC=1`, each fresh Meta sync writes structured history into Supabase. Cached dashboard hits do not create duplicate writes.
- The dashboard supports the built-in 7-day and 30-day presets plus any exact custom `since` / `until` date range you apply from the UI.
- The Ad Content tab shows the primary text, headlines, descriptions, CTA metadata, landing pages, and returned creative variants for the ads currently in view.
- Average watch time is still a placeholder field in the current backend response and can be upgraded with additional Meta video metrics in the next pass.
- Landing-page visitation is currently inferred from Meta landing-page signals and ad destination URLs. If you want exact product-page visit attribution, the next integration layer should pull in Shopify or GA4 data as well.

## Supabase Storage

- `meta_sync_runs` stores each normalized sync event, reporting windows, and aggregate KPI summaries.
- `ad_snapshots` stores the ad/creative state captured at each sync.
- `ad_window_metrics` stores ad performance by reporting window (`7d`, `wow`, `30d`, `mom`, `custom`, `customCompare`).
- `ad_daily_metrics` stores day-level ad metrics for the fetched history span.
- `creative_assets` stores the latest normalized creative metadata and variant sets.
- `landing_page_visits` stores attributed landing-page visit counts by ad and range.
- `recommendations` stores the generated optimization recommendations by ad and range.

## Git And Deploy

- Use this folder as the canonical source repo: `/Users/jeck/Desktop/Justin's Dev Projects/Meta Creative Dashboard`
- Keep secrets only in `.env.local` locally and in Vercel environment variables for hosted environments.
- For Supabase-backed environments, add `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and `SUPABASE_ENABLE_SYNC=1` to Vercel.
- Push production-ready changes to the `main` branch.
- Create feature branches for future optimizations, then merge back into `main` after review.
- This project is currently structured as a local Python server prototype. Before a true Vercel production deployment, the backend should be adapted to a Vercel-friendly serverless shape.
