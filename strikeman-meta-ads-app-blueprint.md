# Strikeman Meta Ads Intelligence App Blueprint

## Short answer

Yes, this is doable.

The core reporting layer can be built from the Meta Marketing API at the ad level, and the creative intelligence layer can be combined from Meta asset breakdowns, video engagement metrics, and site-side event tracking. For the product-page and landing-page detail you want, we should pair Meta ad data with storefront tracking data instead of relying on Meta alone.

## What the app should do

1. Sync all live ads from the Meta ad account.
2. Report ad-level KPIs for current and prior periods.
3. Rank ads by performance.
4. Break down creative performance by asset and copy.
5. Show week-over-week and month-over-month change.
6. Recommend optimization actions for underperformers.

## Feasibility by requirement

### Available directly from Meta Insights API

- Spend
- Reach
- Clicks
- Frequency
- ROAS
- Video watch metrics
- Landing page efficiency metrics
- Ad-level time series for week-over-week and month-over-month comparisons

### Available from Meta if purchase tracking is configured correctly

- Sales / purchase value
- Order volume / purchase count
- Cost per purchase
- Purchase ROAS

### Best sourced from storefront analytics + Meta tracking

- Which product pages are being visited from ads
- Product-level page visit counts tied to ads
- Cleaner copy-to-landing-page attribution

### Available with caveats

- Top-performing copy: strongest when ads use Dynamic Creative or asset-level breakdowns
- Quality scores: use Meta diagnostics when exposed in the account; otherwise compute an internal quality score from CTR, landing-page-view rate, hook rate, CPA, and ROAS
- Hook rate: not a single native Meta metric, but easy to derive from video engagement fields

## Recommended data model

### Core entities

- `campaign`
- `ad_set`
- `ad`
- `creative`
- `creative_asset`
- `landing_page`
- `daily_ad_snapshot`
- `recommendation`

### Key facts to store per ad per day

- Spend
- Reach
- Clicks
- Frequency
- Purchases
- Purchase value
- ROAS
- Cost per purchase
- Outbound clicks
- Landing page view rate
- Video plays
- 25 / 50 / 75 / 95 / 100 percent watch counts
- Asset IDs for body, title, image, video, CTA, and link URL when available

## KPI and insight formulas

### Performance KPIs

- `sales = purchase_value`
- `order_volume = purchases`
- `roas = sales / spend`
- `cost_per_purchase = spend / purchases`
- `wow_change = (current_7d - previous_7d) / previous_7d`
- `mom_change = (current_30d - previous_30d) / previous_30d`

### Creative metrics

- `hook_rate = video_plays_3s_or_p25 / impressions`
- `hold_rate_50 = video_p50 / video_plays`
- `hold_rate_75 = video_p75 / video_plays`
- `landing_page_efficiency = landing_page_views / link_clicks`
- `interaction_rate = interactions / reach` or `interactions / impressions`

### Ranking model

Use a weighted score instead of one metric:

- 35% ROAS
- 20% cost per purchase
- 15% purchase volume
- 10% hook rate
- 10% landing-page efficiency
- 10% trend score (improving vs declining)

This lets us avoid over-rewarding low-spend ads with noisy ROAS.

## Recommendations engine

### Example recommendation rules

- High spend + low ROAS + weak hook rate: replace first 3 seconds of video
- Good CTR + poor landing-page efficiency: review landing page relevance and load speed
- Strong hook rate + weak purchase rate: test offer, CTA, or landing-page alignment
- High frequency + declining ROAS: rotate creative or reduce audience saturation
- Strong CPA + low spend: increase budget gradually

### Recommendation output

For each underperformer, show:

- Why it is underperforming
- Which KPI is lagging
- Which stronger ad it should be compared against
- What specific test to run next

## Best build approach

### Frontend

- Next.js dashboard app
- Motion-style layout with:
  - left navigation
  - dense KPI cards
  - ad table with filters
  - sticky comparison controls
  - drill-in detail panels

### Backend

- Node.js API routes or separate worker service
- Scheduled Meta sync jobs
- Postgres for historical reporting
- Optional Redis for queueing and caching

### Sync cadence

- Hourly for live ad performance
- Daily backfill for prior-day finalized values
- On-demand resync for specific campaigns, ad sets, or ads

## UI modules for V1

### 1. Executive dashboard

- Total spend
- Total sales
- Total ROAS
- Purchases
- Top winners
- Biggest decliners

### 2. Live ads table

- One row per live ad
- Sort and filter by campaign, product, status, spend, ROAS, CPA, frequency
- WoW and MoM deltas inline

### 3. Ad detail page

- Creative preview
- Copy and headline
- Current-period vs prior-period KPIs
- Daily trend chart
- Audience / placement / asset notes

### 4. Creative intelligence view

- Top hooks
- Best body copy
- Best headlines
- Best videos
- Best landing pages

### 5. Recommendations view

- Ranked underperformers
- Suggested fixes
- Priority level

## What I would need from you

### Required

- Meta ad account access with reporting permissions
- Access method for the Meta account:
  - preferred: system user token for your business app
  - acceptable: OAuth flow through a Meta app we configure
- Clear attribution standard to use:
  - `7-day click`
  - `1-day click`
  - another business-standard window you already use

### Strongly recommended

- Shopify access or at least reporting/event visibility
- Confirmation of which purchase event is your source of truth
- Access to GTM / GA4 if you want page-path level landing-page analysis beyond Meta event totals
- A few screenshots of the Motion reference UI, since the linked page shell is public but the exact in-app screen content is not fully accessible without session context

## Important implementation notes

### 1. Sales and order volume depend on attribution consistency

We should define one attribution window and use it everywhere in the app.

### 2. Product-page reporting should not rely on Meta alone

Meta can tell us performance and tracked conversion events, but for exact product-page destination reporting we should also store:

- final landing URL
- normalized product handle
- UTM tags
- storefront page-view / ViewContent events

### 3. Copy-level analysis works best with asset mapping

If your account uses Dynamic Creative, Meta asset breakdowns make this much better. If not, we can still analyze copy by reading the ad creative objects and grouping ad results by creative fingerprint.

## Suggested phase plan

### Phase 1

- Meta connection
- Live ad sync
- KPI dashboard
- WoW / MoM comparisons
- Ad ranking

### Phase 2

- Creative asset breakdowns
- Video hook metrics
- Copy ranking
- Recommendation engine

### Phase 3

- Shopify / landing-page attribution
- Product-page visit reporting
- Advanced creative benchmarking
- Saved views and alerts

## My recommendation

Build this as a dedicated internal analytics app, not a one-off report.

Your public storefront appears to already be on Shopify and already loads Meta and Google tracking infrastructure, which lowers implementation risk. With Meta account access plus confirmation of the source-of-truth purchase event, we can build a very strong V1 quickly.
