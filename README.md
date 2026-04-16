# Strikeman Meta Command Center

A lightweight dashboard for ranking live Meta ads, comparing week-over-week, month-over-month, or custom-range performance, and surfacing the actual copy and creative metadata used in each ad.

## Files

- `server.py` serves the dashboard and exposes `/api/dashboard`.
- `index.html`, `styles.css`, and `app.js` render the dashboard UI.
- `.env.example` shows the local environment variables the server reads.

## Run locally

1. Copy `.env.example` to `.env.local` and fill in the Meta values, or export the same variables in your shell.
2. Start the server:

```bash
python3 server.py
```

3. Open [http://localhost:8000](http://localhost:8000).

## Notes

- When valid Meta credentials are present, the UI loads Meta ad-level insights from `/api/dashboard` and includes ads with delivery in the selected reporting window.
- The dashboard supports the built-in 7-day and 30-day presets plus any exact custom `since` / `until` date range you apply from the UI.
- The Ad Content tab shows the primary text, headlines, descriptions, CTA metadata, landing pages, and returned creative variants for the ads currently in view.
- Average watch time is still a placeholder field in the current backend response and can be upgraded with additional Meta video metrics in the next pass.
- Landing-page visitation is currently inferred from Meta landing-page signals and ad destination URLs. If you want exact product-page visit attribution, the next integration layer should pull in Shopify or GA4 data as well.

## Git And Deploy

- Use this folder as the canonical source repo: `/Users/jeck/Desktop/Justin's Dev Projects/Meta Creative Dashboard`
- Keep secrets only in `.env.local` locally and in Vercel environment variables for hosted environments.
- Push production-ready changes to the `main` branch.
- Create feature branches for future optimizations, then merge back into `main` after review.
- This project is currently structured as a local Python server prototype. Before a true Vercel production deployment, the backend should be adapted to a Vercel-friendly serverless shape.
