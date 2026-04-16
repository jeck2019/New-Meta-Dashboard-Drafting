create table if not exists public.meta_sync_runs (
    id text primary key,
    source text not null default 'meta',
    account_id text not null,
    account_name text not null,
    business_id text,
    business_name text,
    generated_at timestamptz not null,
    ads_count integer not null default 0,
    current_window_ads integer not null default 0,
    windows jsonb not null default '{}'::jsonb,
    window_ad_counts jsonb not null default '{}'::jsonb,
    range_summaries jsonb not null default '{}'::jsonb,
    sync_status text not null default 'running',
    error_message text,
    created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.ad_snapshots (
    snapshot_key text primary key,
    sync_run_id text not null references public.meta_sync_runs(id) on delete cascade,
    generated_at timestamptz not null,
    ad_id text not null,
    creative_id text,
    ad_name text not null,
    campaign_name text not null,
    current_status text not null default 'UNKNOWN',
    product text,
    ad_format text,
    tier text,
    quality_score integer,
    creative_name text,
    headline text,
    primary_text text,
    description text,
    hook text,
    landing_page text,
    destination_url text,
    call_to_action text,
    media_preview_url text,
    media_source_url text,
    media_permalink_url text,
    media_length_seconds numeric(12, 3),
    video_id text,
    image_hash text,
    body_variants jsonb not null default '[]'::jsonb,
    title_variants jsonb not null default '[]'::jsonb,
    description_variants jsonb not null default '[]'::jsonb,
    link_variants jsonb not null default '[]'::jsonb,
    cta_variants jsonb not null default '[]'::jsonb,
    created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.ad_window_metrics (
    metric_key text primary key,
    sync_run_id text not null references public.meta_sync_runs(id) on delete cascade,
    ad_id text not null,
    ad_name text not null,
    campaign_name text not null,
    current_status text not null default 'UNKNOWN',
    range_key text not null,
    window_since date not null,
    window_until date not null,
    spend numeric(14, 2) not null default 0,
    sales numeric(14, 2) not null default 0,
    purchases numeric(14, 2) not null default 0,
    reach numeric(14, 2) not null default 0,
    clicks numeric(14, 2) not null default 0,
    outbound_clicks numeric(14, 2) not null default 0,
    landing_page_views numeric(14, 2) not null default 0,
    frequency numeric(14, 6) not null default 0,
    interactions numeric(14, 2) not null default 0,
    video_plays numeric(14, 2) not null default 0,
    p25 numeric(14, 2) not null default 0,
    p50 numeric(14, 2) not null default 0,
    p75 numeric(14, 2) not null default 0,
    p95 numeric(14, 2) not null default 0,
    roas numeric(14, 6) not null default 0,
    cpa numeric(14, 6) not null default 0,
    hook_rate numeric(14, 6) not null default 0,
    landing_rate numeric(14, 6) not null default 0,
    quality_score integer,
    tier text,
    trend_points jsonb not null default '[]'::jsonb,
    visited_pages jsonb not null default '[]'::jsonb,
    created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.ad_daily_metrics (
    metric_key text primary key,
    sync_run_id text not null references public.meta_sync_runs(id) on delete cascade,
    metric_date date not null,
    metric_date_end date not null,
    ad_id text not null,
    ad_name text not null,
    campaign_name text not null,
    current_status text not null default 'UNKNOWN',
    spend numeric(14, 2) not null default 0,
    sales numeric(14, 2) not null default 0,
    purchases numeric(14, 2) not null default 0,
    reach numeric(14, 2) not null default 0,
    clicks numeric(14, 2) not null default 0,
    outbound_clicks numeric(14, 2) not null default 0,
    landing_page_views numeric(14, 2) not null default 0,
    frequency numeric(14, 6) not null default 0,
    interactions numeric(14, 2) not null default 0,
    video_plays numeric(14, 2) not null default 0,
    p25 numeric(14, 2) not null default 0,
    p50 numeric(14, 2) not null default 0,
    p75 numeric(14, 2) not null default 0,
    p95 numeric(14, 2) not null default 0,
    roas numeric(14, 6) not null default 0,
    cpa numeric(14, 6) not null default 0,
    hook_rate numeric(14, 6) not null default 0,
    landing_rate numeric(14, 6) not null default 0,
    created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.creative_assets (
    asset_key text primary key,
    creative_id text,
    ad_id text not null,
    ad_name text not null,
    campaign_name text not null,
    creative_name text,
    current_status text not null default 'UNKNOWN',
    ad_format text,
    headline text,
    primary_text text,
    description text,
    hook text,
    call_to_action text,
    landing_page text,
    destination_url text,
    media_preview_url text,
    media_source_url text,
    media_permalink_url text,
    media_length_seconds numeric(12, 3),
    video_id text,
    image_hash text,
    body_variants jsonb not null default '[]'::jsonb,
    title_variants jsonb not null default '[]'::jsonb,
    description_variants jsonb not null default '[]'::jsonb,
    link_variants jsonb not null default '[]'::jsonb,
    cta_variants jsonb not null default '[]'::jsonb,
    last_seen_sync_run_id text references public.meta_sync_runs(id) on delete set null,
    last_seen_at timestamptz,
    created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.landing_page_visits (
    visit_key text primary key,
    sync_run_id text not null references public.meta_sync_runs(id) on delete cascade,
    ad_id text not null,
    ad_name text not null,
    campaign_name text not null,
    range_key text not null,
    page_path text not null,
    visit_count integer not null default 0,
    created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.recommendations (
    recommendation_key text primary key,
    sync_run_id text not null references public.meta_sync_runs(id) on delete cascade,
    ad_id text not null,
    range_key text not null,
    priority text not null,
    title text not null,
    body text not null,
    actions jsonb not null default '[]'::jsonb,
    generated_at timestamptz not null,
    created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_meta_sync_runs_generated_at on public.meta_sync_runs (generated_at desc);
create index if not exists idx_ad_snapshots_sync_run_id on public.ad_snapshots (sync_run_id);
create index if not exists idx_ad_snapshots_ad_id on public.ad_snapshots (ad_id);
create index if not exists idx_ad_window_metrics_sync_run_id on public.ad_window_metrics (sync_run_id);
create index if not exists idx_ad_window_metrics_ad_id on public.ad_window_metrics (ad_id);
create index if not exists idx_ad_window_metrics_range_key on public.ad_window_metrics (range_key);
create index if not exists idx_ad_daily_metrics_sync_run_id on public.ad_daily_metrics (sync_run_id);
create index if not exists idx_ad_daily_metrics_metric_date on public.ad_daily_metrics (metric_date desc);
create index if not exists idx_ad_daily_metrics_ad_id on public.ad_daily_metrics (ad_id);
create index if not exists idx_creative_assets_creative_id on public.creative_assets (creative_id);
create index if not exists idx_creative_assets_ad_id on public.creative_assets (ad_id);
create index if not exists idx_landing_page_visits_sync_run_id on public.landing_page_visits (sync_run_id);
create index if not exists idx_landing_page_visits_ad_id on public.landing_page_visits (ad_id);
create index if not exists idx_recommendations_sync_run_id on public.recommendations (sync_run_id);
create index if not exists idx_recommendations_ad_id on public.recommendations (ad_id);
create index if not exists idx_recommendations_range_key on public.recommendations (range_key);
