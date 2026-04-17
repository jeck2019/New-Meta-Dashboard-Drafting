#!/usr/bin/env python3

import json
import math
import os
import time
import uuid
from datetime import date, datetime, timedelta
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib import error, parse, request

BASE_DIR = Path(__file__).resolve().parent
GRAPH_VERSION = 'v25.0'
CACHE_TTL_SECONDS = 300
CACHE = {}
VIDEO_CACHE = {}

ZERO_METRICS = {
    'spend': 0.0,
    'sales': 0.0,
    'purchases': 0.0,
    'reach': 0.0,
    'clicks': 0.0,
    'outboundClicks': 0.0,
    'landingPageViews': 0.0,
    'frequency': 0.0,
    'interactions': 0.0,
    'videoPlays': 0.0,
    'p25': 0.0,
    'p50': 0.0,
    'p75': 0.0,
    'p95': 0.0,
}

PURCHASE_COUNT_ACTIONS = [
    'offsite_conversion.fb_pixel_purchase',
    'onsite_web_purchase',
    'purchase',
    'omni_purchase',
]

PURCHASE_VALUE_ACTIONS = [
    'offsite_conversion.fb_pixel_purchase',
    'onsite_web_purchase',
    'purchase',
    'omni_purchase',
]

VIEW_CONTENT_ACTIONS = [
    'offsite_conversion.fb_pixel_view_content',
    'onsite_web_view_content',
    'view_content',
    'omni_view_content',
]

LANDING_PAGE_ACTIONS = [
    'landing_page_view',
    'onsite_web_landing_page_view',
    'offsite_conversion.fb_pixel_view_content',
    'onsite_web_view_content',
]

INTERACTION_ACTIONS = [
    'post_engagement',
    'page_engagement',
    'post_reaction',
    'post',
]

OUTBOUND_CLICK_ACTIONS = [
    'outbound_click',
    'link_click',
]

ADS_FIELDS_FULL = ','.join([
    'id',
    'name',
    'effective_status',
    'campaign{id,name}',
    'adset{id,name}',
    'creative{id,name,object_story_spec,asset_feed_spec}',
])

ADS_FIELDS_FALLBACK = ','.join([
    'id',
    'name',
    'effective_status',
    'creative{id,name}',
])

INSIGHTS_FIELDS_FULL = ','.join([
    'ad_id',
    'ad_name',
    'spend',
    'clicks',
    'reach',
    'frequency',
    'actions',
    'action_values',
    'outbound_clicks',
    'video_play_actions',
    'video_p25_watched_actions',
    'video_p50_watched_actions',
    'video_p75_watched_actions',
    'video_p95_watched_actions',
])

INSIGHTS_FIELDS_FALLBACK = ','.join([
    'ad_id',
    'ad_name',
    'spend',
    'clicks',
    'reach',
    'frequency',
    'actions',
    'action_values',
])

SERIES_FIELDS = ','.join(['ad_id', 'action_values', 'date_start'])
DAILY_INSIGHTS_FIELDS_FULL = ','.join([
    'ad_id',
    'ad_name',
    'date_start',
    'date_stop',
    'spend',
    'clicks',
    'reach',
    'frequency',
    'actions',
    'action_values',
    'outbound_clicks',
    'video_play_actions',
    'video_p25_watched_actions',
    'video_p50_watched_actions',
    'video_p75_watched_actions',
    'video_p95_watched_actions',
])
SUPABASE_CHUNK_SIZE = 200
PRIMARY_RANGE_KEYS = ('7d', '30d', 'custom')
DEMOGRAPHIC_BREAKDOWNS = {
    'age': 'age',
    'gender': 'gender',
    'device': 'device_platform',
    'country': 'country',
    'region': 'region',
}


class MetaAPIError(Exception):
    def __init__(self, message, status=HTTPStatus.BAD_GATEWAY, payload=None):
        super().__init__(message)
        self.message = message
        self.status = status
        self.payload = payload or {}


class SupabaseAPIError(Exception):
    def __init__(self, message, status=HTTPStatus.BAD_GATEWAY, payload=None):
        super().__init__(message)
        self.message = message
        self.status = status
        self.payload = payload or {}


def load_env_file(path):
    values = {}
    if not path.exists():
        return values

    for raw_line in path.read_text().splitlines():
        line = raw_line.strip()
        if not line or line.startswith('#') or '=' not in line:
            continue
        key, value = line.split('=', 1)
        key = key.strip()
        value = value.strip()
        if value.startswith(("'", '"')) and value.endswith(("'", '"')):
            value = value[1:-1]
        values[key] = value

    return values


def get_settings():
    file_values = {}
    for name in ('.env.local', '.env'):
        file_values.update(load_env_file(BASE_DIR / name))
    merged = {**file_values, **os.environ}

    return {
        'META_ACCESS_TOKEN': merged.get('META_ACCESS_TOKEN', '').strip(),
        'META_AD_ACCOUNT_ID': merged.get('META_AD_ACCOUNT_ID', '').strip(),
        'META_BUSINESS_ID': merged.get('META_BUSINESS_ID', '').strip(),
        'SUPABASE_URL': merged.get('SUPABASE_URL', '').strip(),
        'SUPABASE_ANON_KEY': merged.get('SUPABASE_ANON_KEY', '').strip(),
        'SUPABASE_SERVICE_ROLE_KEY': merged.get('SUPABASE_SERVICE_ROLE_KEY', '').strip(),
        'SUPABASE_ENABLE_SYNC': merged.get('SUPABASE_ENABLE_SYNC', '0').strip(),
        'CRON_SECRET': merged.get('CRON_SECRET', '').strip(),
        'PORT': merged.get('PORT', '8000').strip(),
    }


def cron_request_authorized(settings, headers):
    cron_secret = settings.get('CRON_SECRET', '').strip()
    auth_header = headers.get('Authorization') or headers.get('authorization') or ''
    user_agent = headers.get('User-Agent') or headers.get('user-agent') or ''

    if cron_secret:
        return auth_header == f'Bearer {cron_secret}'
    return user_agent == 'vercel-cron/1.0'


def build_sync_summary(payload):
    storage = payload.get('storage', {})
    ok = payload.get('source') == 'meta' and storage.get('configured') and storage.get('enabled') and storage.get('persisted')
    return {
        'ok': ok,
        'source': payload.get('source'),
        'generatedAt': payload.get('generatedAt'),
        'account': (payload.get('account') or {}).get('name', ''),
        'ads': len(payload.get('ads') or []),
        'storage': storage,
    }


def clamp(value, low, high):
    return max(low, min(high, value))


def to_float(value):
    if value in (None, '', 'null'):
        return 0.0
    try:
        return float(value)
    except (TypeError, ValueError):
        return 0.0


def graph_url(path, params):
    query = parse.urlencode(params, doseq=True)
    return f'https://graph.facebook.com/{GRAPH_VERSION}/{path}?{query}'


def request_json_with_headers(url, method='GET', payload=None, headers=None, timeout=30, error_cls=MetaAPIError):
    request_headers = {
        'Accept': 'application/json',
        'User-Agent': 'StrikemanMetaCommandCenter/1.0',
        **(headers or {}),
    }
    body = None
    if payload is not None:
        if isinstance(payload, (bytes, bytearray)):
            body = payload
        else:
            body = json.dumps(payload).encode('utf-8')
            request_headers.setdefault('Content-Type', 'application/json')
    req = request.Request(url, data=body, method=method, headers=request_headers)
    try:
        with request.urlopen(req, timeout=timeout) as response:
            raw = response.read().decode('utf-8')
            if not raw:
                return {}
            return json.loads(raw)
    except error.HTTPError as exc:
        raw = exc.read().decode('utf-8', errors='replace')
        try:
            data = json.loads(raw)
        except json.JSONDecodeError:
            data = {'error': {'message': raw or 'Unknown API error'}}
        message = (
            data.get('message')
            or data.get('error_description')
            or data.get('error', {}).get('message')
            or raw
            or 'Unknown API error'
        )
        raise error_cls(message, status=exc.code, payload=data)
    except error.URLError as exc:
        raise error_cls(f'Unable to reach API: {exc.reason}')


def request_json(url):
    return request_json_with_headers(url, error_cls=MetaAPIError)


def meta_get(path, params, token):
    return request_json(graph_url(path, {**params, 'access_token': token}))


def meta_get_paginated(path, params, token, limit_pages=20):
    results = []
    page = 0
    next_url = graph_url(path, {**params, 'access_token': token})

    while next_url and page < limit_pages:
        payload = request_json(next_url)
        results.extend(payload.get('data', []))
        next_url = payload.get('paging', {}).get('next')
        page += 1

    return results


def env_flag(value):
    return str(value or '').strip().lower() in {'1', 'true', 'yes', 'on'}


def supabase_configured(settings):
    return bool(settings.get('SUPABASE_URL') and settings.get('SUPABASE_SERVICE_ROLE_KEY'))


def supabase_sync_enabled(settings):
    return supabase_configured(settings) and env_flag(settings.get('SUPABASE_ENABLE_SYNC'))


def supabase_headers(settings, prefer=None):
    token = settings['SUPABASE_SERVICE_ROLE_KEY']
    headers = {
        'apikey': token,
        'Authorization': f'Bearer {token}',
    }
    if prefer:
        headers['Prefer'] = prefer
    return headers


def supabase_url(settings, table, query=None):
    base = settings['SUPABASE_URL'].rstrip('/')
    query_string = parse.urlencode(query or {}, doseq=True)
    suffix = f'?{query_string}' if query_string else ''
    return f'{base}/rest/v1/{table}{suffix}'


def supabase_request(settings, method, table, payload=None, query=None, prefer=None):
    return request_json_with_headers(
        supabase_url(settings, table, query),
        method=method,
        payload=payload,
        headers=supabase_headers(settings, prefer=prefer),
        timeout=60,
        error_cls=SupabaseAPIError,
    )


def chunked(rows, size=SUPABASE_CHUNK_SIZE):
    for start in range(0, len(rows), size):
        yield rows[start:start + size]


def supabase_insert_rows(settings, table, rows):
    if not rows:
        return
    for batch in chunked(rows):
        supabase_request(settings, 'POST', table, payload=batch, prefer='return=minimal')


def supabase_upsert_rows(settings, table, rows, on_conflict):
    if not rows:
        return
    for batch in chunked(rows):
        supabase_request(
            settings,
            'POST',
            table,
            payload=batch,
            query={'on_conflict': on_conflict},
            prefer='resolution=merge-duplicates,return=minimal',
        )


def parse_iso_date(raw_value):
    if not raw_value:
        return None
    try:
        return date.fromisoformat(raw_value)
    except ValueError as exc:
        raise ValueError('Custom range dates must be in YYYY-MM-DD format.') from exc


def parse_custom_window(params, today=None):
    today = today or date.today()
    since_raw = params.get('since', [''])[0].strip()
    until_raw = params.get('until', [''])[0].strip()

    if not since_raw and not until_raw:
        return None, None
    if not since_raw or not until_raw:
        raise ValueError('Custom range requires both a start date and an end date.')

    since = parse_iso_date(since_raw)
    until = parse_iso_date(until_raw)
    if since > until:
        raise ValueError('Custom range start date must be on or before the end date.')
    if until > today:
        raise ValueError('Custom range cannot end after today.')

    return since, until


def window_span_days(window):
    start = date.fromisoformat(window['since'])
    end = date.fromisoformat(window['until'])
    return (end - start).days + 1


def build_windows(today=None, custom_since=None, custom_until=None):
    today = today or date.today()
    yesterday = today - timedelta(days=1)

    def make_window(days, offset_days):
        end = yesterday - timedelta(days=offset_days)
        start = end - timedelta(days=days - 1)
        return {'since': start.isoformat(), 'until': end.isoformat()}

    windows = {
        '7d': make_window(7, 0),
        'wow': make_window(7, 7),
        '30d': make_window(30, 0),
        'mom': make_window(30, 30),
    }

    if custom_since and custom_until:
        custom_window = {'since': custom_since.isoformat(), 'until': custom_until.isoformat()}
        span_days = window_span_days(custom_window)
        compare_end = custom_since - timedelta(days=1)
        compare_start = compare_end - timedelta(days=span_days - 1)
        windows['custom'] = custom_window
        windows['customCompare'] = {'since': compare_start.isoformat(), 'until': compare_end.isoformat()}

    return windows


def range_dates(window):
    start = date.fromisoformat(window['since'])
    end = date.fromisoformat(window['until'])
    cursor = start
    while cursor <= end:
        yield cursor
        cursor += timedelta(days=1)


def field_list_value(raw):
    if isinstance(raw, list):
        return sum(to_float(item.get('value')) for item in raw)
    return to_float(raw)


def pick_action_value(items, ordered_types):
    if not isinstance(items, list):
        return 0.0
    for action_type in ordered_types:
        for item in items:
            if item.get('action_type') == action_type:
                return to_float(item.get('value'))
    return 0.0


def normalize_path(url):
    if not url:
        return '/'
    parsed = parse.urlparse(url)
    path = parsed.path or url
    if not path.startswith('/'):
        path = f'/{path}'
    return path.rstrip('/') or '/'


def first_text(entries, key='text'):
    if isinstance(entries, list) and entries:
        return entries[0].get(key, '') or ''
    return ''


def first_link(entries):
    if isinstance(entries, list) and entries:
        first = entries[0]
        return first.get('website_url', '') or first.get('url', '') or ''
    return ''


def text_values(entries, key='text'):
    values = []
    seen = set()
    if isinstance(entries, list):
        for entry in entries:
            value = ' '.join((entry.get(key, '') or '').split())
            if value and value not in seen:
                seen.add(value)
                values.append(value)
    return values


def link_values(entries):
    values = []
    seen = set()
    if isinstance(entries, list):
        for entry in entries:
            value = (entry.get('website_url', '') or entry.get('url', '') or '').strip()
            if value and value not in seen:
                seen.add(value)
                values.append(value)
    return values


def string_values(values):
    output = []
    seen = set()
    if isinstance(values, list):
        for value in values:
            normalized = str(value or '').strip()
            if normalized and normalized not in seen:
                seen.add(normalized)
                output.append(normalized)
    return output


def absolute_facebook_url(url):
    if not url:
        return ''
    if url.startswith('http://') or url.startswith('https://'):
        return url
    return f'https://www.facebook.com{url}'


def pick_thumbnail_uri(thumbnails):
    items = (thumbnails or {}).get('data') or []
    for item in items:
        if item.get('is_preferred') and item.get('uri'):
            return item.get('uri')
    for item in items:
        if item.get('uri'):
            return item.get('uri')
    return ''


def extract_hook(text):
    if not text:
        return 'Creative hook not yet mapped.'
    normalized = ' '.join(text.split())
    for separator in ('. ', '! ', '? '):
        if separator in normalized:
            return normalized.split(separator, 1)[0].strip(' .!?')
    return normalized[:100].rstrip()


def infer_format(creative):
    story = creative.get('object_story_spec') or {}
    if story.get('video_data'):
        return 'Video'
    link_data = story.get('link_data') or {}
    if link_data.get('child_attachments'):
        return 'Carousel'
    return 'Static'


def infer_product(campaign_name, landing_path):
    source = f'{campaign_name} {landing_path}'.lower()
    if 'marksman' in source or 'bundle' in source:
        return 'Marksman Bundle'
    if 'laser-bullet' in source or 'laser bullet' in source:
        return 'Laser Bullet'
    if 'starter-kit' in source or 'dry-fire-starter' in source or 'home-defense' in source:
        return 'Dry Fire Starter Kit'
    return 'Pistol Training System'


def extract_creative_fields(ad):
    creative = ad.get('creative') or {}
    story = creative.get('object_story_spec') or {}
    asset_feed = creative.get('asset_feed_spec') or {}

    body = ''
    headline = ''
    description = ''
    landing_url = ''
    cta_type = ''
    preview_url = ''
    video_id = ''
    image_hash = ''

    if story.get('video_data'):
        video_data = story['video_data']
        cta = video_data.get('call_to_action') or {}
        body = video_data.get('message', '') or body
        headline = video_data.get('title', '') or headline
        description = video_data.get('link_description', '') or video_data.get('description', '') or description
        landing_url = (cta.get('value') or {}).get('link', '') or landing_url
        cta_type = cta.get('type', '') or cta_type
        preview_url = video_data.get('image_url', '') or preview_url
        video_id = video_data.get('video_id', '') or video_id
        image_hash = video_data.get('image_hash', '') or image_hash

    if story.get('link_data'):
        link_data = story['link_data']
        cta = link_data.get('call_to_action') or {}
        body = link_data.get('message', '') or body
        headline = link_data.get('name', '') or headline
        description = link_data.get('description', '') or description
        landing_url = link_data.get('link', '') or landing_url
        cta_type = cta.get('type', '') or cta_type
        preview_url = link_data.get('picture', '') or preview_url
        image_hash = link_data.get('image_hash', '') or image_hash

    if story.get('photo_data'):
        photo_data = story['photo_data']
        cta = photo_data.get('call_to_action') or {}
        body = photo_data.get('message', '') or body
        headline = photo_data.get('caption', '') or headline
        description = photo_data.get('text', '') or description
        landing_url = photo_data.get('link', '') or landing_url
        cta_type = cta.get('type', '') or cta_type
        preview_url = photo_data.get('url', '') or photo_data.get('image_url', '') or preview_url
        image_hash = photo_data.get('image_hash', '') or image_hash

    if story.get('template_data'):
        template_data = story['template_data']
        cta = template_data.get('call_to_action') or {}
        body = template_data.get('message', '') or body
        headline = template_data.get('name', '') or headline
        description = template_data.get('description', '') or description
        landing_url = template_data.get('link', '') or landing_url
        cta_type = cta.get('type', '') or cta_type
        preview_url = template_data.get('image_url', '') or preview_url
        image_hash = template_data.get('image_hash', '') or image_hash

    body_variants = text_values(asset_feed.get('bodies'))
    title_variants = text_values(asset_feed.get('titles'))
    description_variants = text_values(asset_feed.get('descriptions'))
    link_variants = link_values(asset_feed.get('link_urls'))
    cta_variants = string_values(asset_feed.get('call_to_action_types'))

    body = body or first_text(asset_feed.get('bodies'))
    headline = headline or first_text(asset_feed.get('titles'))
    description = description or first_text(asset_feed.get('descriptions'))
    landing_url = landing_url or first_link(asset_feed.get('link_urls'))

    if not body:
        body = creative.get('name', '') or ad.get('name', '')
    if not headline:
        headline = ad.get('name', '')

    if body and body not in body_variants:
        body_variants.insert(0, body)
    if headline and headline not in title_variants:
        title_variants.insert(0, headline)
    if description and description not in description_variants:
        description_variants.insert(0, description)
    if landing_url and landing_url not in link_variants:
        link_variants.insert(0, landing_url)

    landing_path = normalize_path(landing_url)

    return {
        'creativeId': creative.get('id', '') or '',
        'copy': body,
        'headline': headline,
        'description': description,
        'hook': extract_hook(body or headline),
        'landingPage': landing_path,
        'destinationUrl': landing_url,
        'format': infer_format(creative),
        'creativeName': creative.get('name', '') or ad.get('name', ''),
        'callToAction': cta_type,
        'mediaPreviewUrl': preview_url,
        'videoId': video_id,
        'imageHash': image_hash,
        'bodyVariants': body_variants,
        'titleVariants': title_variants,
        'descriptionVariants': description_variants,
        'linkVariants': link_variants,
        'ctaVariants': cta_variants,
    }


def with_derived(metrics):
    spend = metrics.get('spend', 0.0)
    sales = metrics.get('sales', 0.0)
    purchases = metrics.get('purchases', 0.0)
    outbound_clicks = metrics.get('outboundClicks', 0.0)
    reach = metrics.get('reach', 0.0)
    frequency = metrics.get('frequency', 0.0)
    impressions = reach * frequency

    return {
        **metrics,
        'roas': sales / spend if spend else 0.0,
        'cpa': spend / purchases if purchases else 0.0,
        'hookRate': metrics.get('videoPlays', 0.0) / impressions if impressions else 0.0,
        'landingRate': metrics.get('landingPageViews', 0.0) / outbound_clicks if outbound_clicks else 0.0,
    }


def compute_quality_score(metrics):
    derived = with_derived(metrics)
    roas_score = clamp(derived['roas'] / 4.0, 0.0, 1.0)
    landing_score = clamp(derived['landingRate'] / 0.85, 0.0, 1.0)
    hook_score = clamp(derived['hookRate'] / 0.28, 0.0, 1.0)
    purchase_score = clamp(derived['purchases'] / 40.0, 0.0, 1.0)
    fatigue_penalty = clamp((derived['frequency'] - 2.4) / 2.0, 0.0, 0.35)
    score = (roas_score * 0.35 + landing_score * 0.25 + hook_score * 0.2 + purchase_score * 0.2) * 100
    return max(45, min(98, round(score - fatigue_penalty * 100)))


def classify_tier(current_metrics, previous_metrics):
    current = with_derived(current_metrics)
    previous = with_derived(previous_metrics)
    prior_sales = previous.get('sales', 0.0)
    sales_delta = ((current['sales'] - prior_sales) / prior_sales * 100) if prior_sales else 0.0

    if current['spend'] < 200 or current['purchases'] < 3:
        return 'Test'
    if current['roas'] >= 3.0 and current['purchases'] >= 8 and sales_delta > -10:
        return 'Scale'
    if current['roas'] < 1.8 or sales_delta <= -20 or current['landingRate'] < 0.55:
        return 'Repair'
    return 'Hold'


def bucketize(points, bucket_count):
    if not points:
        return [0] * bucket_count
    bucket_size = max(1, math.ceil(len(points) / bucket_count))
    buckets = []
    for index in range(0, len(points), bucket_size):
        buckets.append(round(sum(points[index:index + bucket_size]), 2))
    while len(buckets) < bucket_count:
        buckets.append(0)
    return buckets[:bucket_count]


def normalize_insight(row):
    actions = row.get('actions') or []
    action_values = row.get('action_values') or []
    spend = to_float(row.get('spend'))
    purchases = pick_action_value(actions, PURCHASE_COUNT_ACTIONS)
    sales = pick_action_value(action_values, PURCHASE_VALUE_ACTIONS)
    landing_page_views = pick_action_value(actions, LANDING_PAGE_ACTIONS)
    view_content = pick_action_value(actions, VIEW_CONTENT_ACTIONS)

    return {
        **ZERO_METRICS,
        'spend': spend,
        'sales': sales,
        'purchases': purchases,
        'reach': to_float(row.get('reach')),
        'clicks': to_float(row.get('clicks')),
        'outboundClicks': field_list_value(row.get('outbound_clicks')) or pick_action_value(actions, OUTBOUND_CLICK_ACTIONS),
        'landingPageViews': landing_page_views or view_content,
        'frequency': to_float(row.get('frequency')),
        'interactions': pick_action_value(actions, INTERACTION_ACTIONS),
        'videoPlays': field_list_value(row.get('video_play_actions')) or pick_action_value(actions, ['video_view']),
        'p25': field_list_value(row.get('video_p25_watched_actions')),
        'p50': field_list_value(row.get('video_p50_watched_actions')),
        'p75': field_list_value(row.get('video_p75_watched_actions')),
        'p95': field_list_value(row.get('video_p95_watched_actions')),
    }


def merge_metrics_by_ad(rows):
    return {row.get('ad_id'): normalize_insight(row) for row in rows if row.get('ad_id')}


def fetch_account_ads(token, account_id):
    params = {'fields': ADS_FIELDS_FULL, 'limit': 100}
    try:
        rows = meta_get_paginated(f'{account_id}/ads', params, token)
    except MetaAPIError:
        rows = meta_get_paginated(f'{account_id}/ads', {'fields': ADS_FIELDS_FALLBACK, 'limit': 100}, token)
    return [row for row in rows if row.get('id')]


def fetch_window_insights(token, account_id, window):
    params = {
        'level': 'ad',
        'time_range': json.dumps(window),
        'limit': 500,
        'fields': INSIGHTS_FIELDS_FULL,
        'use_account_attribution_setting': 'true',
    }
    try:
        rows = meta_get_paginated(f'{account_id}/insights', params, token)
    except MetaAPIError:
        rows = meta_get_paginated(f'{account_id}/insights', {**params, 'fields': INSIGHTS_FIELDS_FALLBACK}, token)
    return merge_metrics_by_ad(rows)


def fetch_breakdown_insights(token, account_id, window, breakdown):
    params = {
        'level': 'ad',
        'time_range': json.dumps(window),
        'limit': 500,
        'fields': INSIGHTS_FIELDS_FULL,
        'breakdowns': breakdown,
        'use_account_attribution_setting': 'true',
    }
    try:
        rows = meta_get_paginated(f'{account_id}/insights', params, token, limit_pages=80)
    except MetaAPIError:
        rows = meta_get_paginated(
            f'{account_id}/insights',
            {**params, 'fields': INSIGHTS_FIELDS_FALLBACK},
            token,
            limit_pages=80,
        )

    normalized = []
    for row in rows:
        ad_id = row.get('ad_id')
        if not ad_id:
            continue
        normalized.append({
            'adId': ad_id,
            'bucket': row.get(breakdown, '') or 'unknown',
            'metrics': normalize_insight(row),
        })
    return normalized


def fetch_demographic_breakdowns(token, account_id, windows):
    demographics = {}
    for range_key in PRIMARY_RANGE_KEYS:
        if range_key not in windows:
            continue
        demographics[range_key] = {}
        for dimension, breakdown in DEMOGRAPHIC_BREAKDOWNS.items():
            try:
                demographics[range_key][dimension] = fetch_breakdown_insights(
                    token,
                    account_id,
                    windows[range_key],
                    breakdown,
                )
            except MetaAPIError:
                demographics[range_key][dimension] = []
    return demographics


def fetch_video_metadata(token, video_id):
    if not video_id:
        return {}
    if video_id in VIDEO_CACHE:
        return VIDEO_CACHE[video_id]

    try:
        payload = meta_get(video_id, {'fields': 'source,permalink_url,thumbnails,picture,length,title'}, token)
    except MetaAPIError:
        VIDEO_CACHE[video_id] = {}
        return {}

    data = {
        'source': payload.get('source', '') or '',
        'permalinkUrl': absolute_facebook_url(payload.get('permalink_url', '') or ''),
        'thumbnailUrl': pick_thumbnail_uri(payload.get('thumbnails') or {}) or payload.get('picture', '') or '',
        'length': to_float(payload.get('length')),
        'title': payload.get('title', '') or '',
    }
    VIDEO_CACHE[video_id] = data
    return data


def fetch_daily_sales_series(token, account_id, window):
    rows = meta_get_paginated(
        f'{account_id}/insights',
        {
            'level': 'ad',
            'time_range': json.dumps(window),
            'time_increment': 1,
            'limit': 500,
            'fields': SERIES_FIELDS,
            'use_account_attribution_setting': 'true',
        },
        token,
        limit_pages=40,
    )

    series = {}
    for row in rows:
        ad_id = row.get('ad_id')
        day = row.get('date_start')
        if not ad_id or not day:
            continue
        sale_value = pick_action_value(row.get('action_values') or [], PURCHASE_VALUE_ACTIONS)
        series.setdefault(ad_id, {})[day] = sale_value
    return series


def build_trend_points(daily_series, windows):
    trend_points = {}
    days_30 = [day.isoformat() for day in range_dates(windows['30d'])]
    custom_days = [day.isoformat() for day in range_dates(windows['custom'])] if 'custom' in windows else []
    custom_bucket_count = min(8, max(4, math.ceil(len(custom_days) / 5))) if custom_days else 0

    for ad_id, day_map in daily_series.items():
        points_30 = [round(day_map.get(day, 0.0), 2) for day in days_30]
        trend_points[ad_id] = {'trend7': points_30[-7:], 'trend30': bucketize(points_30, 6)}

        if custom_days:
            points_custom = [round(day_map.get(day, 0.0), 2) for day in custom_days]
            trend_points[ad_id]['trendCustomDaily'] = points_custom
            trend_points[ad_id]['trendCustomBuckets'] = bucketize(points_custom, custom_bucket_count)

    return trend_points


def merge_daily_series(base_series, extra_series):
    for ad_id, day_map in extra_series.items():
        base_series.setdefault(ad_id, {}).update(day_map)
    return base_series


def fetch_daily_metrics_rows(token, account_id, window):
    rows = meta_get_paginated(
        f'{account_id}/insights',
        {
            'level': 'ad',
            'time_range': json.dumps(window),
            'time_increment': 1,
            'limit': 500,
            'fields': DAILY_INSIGHTS_FIELDS_FULL,
            'use_account_attribution_setting': 'true',
        },
        token,
        limit_pages=80,
    )

    normalized = []
    for row in rows:
        ad_id = row.get('ad_id')
        date_start = row.get('date_start')
        if not ad_id or not date_start:
            continue
        normalized.append({
            'adId': ad_id,
            'adName': row.get('ad_name', '') or '',
            'dateStart': date_start,
            'dateStop': row.get('date_stop', '') or date_start,
            'metrics': normalize_insight(row),
        })
    return normalized


def build_history_window(windows):
    starts = [date.fromisoformat(window['since']) for window in windows.values()]
    ends = [date.fromisoformat(window['until']) for window in windows.values()]
    return {
        'since': min(starts).isoformat(),
        'until': max(ends).isoformat(),
    }


def has_metric_signal(metrics):
    return any(to_float(metrics.get(field)) > 0 for field in ZERO_METRICS)


def aggregate_metrics(ads, range_key):
    totals = ZERO_METRICS.copy()
    weighted_impressions = 0.0
    total_reach = 0.0

    for ad in ads:
        metrics = ad.get('metrics', {}).get(range_key, ZERO_METRICS.copy())
        for field in ZERO_METRICS:
            totals[field] += to_float(metrics.get(field))
        weighted_impressions += to_float(metrics.get('reach')) * to_float(metrics.get('frequency'))
        total_reach += to_float(metrics.get('reach'))

    totals['frequency'] = weighted_impressions / total_reach if total_reach else 0.0
    return with_derived(totals)


def percent_change(current_value, previous_value):
    if not previous_value:
        return None if current_value else 0.0
    return ((current_value - previous_value) / previous_value) * 100.0


def format_number(value, digits=0):
    return f'{to_float(value):,.{digits}f}'


def format_percent(value, digits=1):
    return f'{format_number(to_float(value) * 100, digits)}%'


def format_delta(value):
    if value is None:
        return 'No baseline'
    sign = '+' if value > 0 else ''
    return f'{sign}{format_number(value, 1)}%'


def compare_key_for_range(range_key):
    return {
        '7d': 'wow',
        '30d': 'mom',
        'custom': 'customCompare',
    }.get(range_key, 'wow')


def range_display_label(range_key):
    return {
        '7d': 'last 7 days',
        '30d': 'last 30 days',
        'custom': 'custom range',
    }.get(range_key, 'current range')


def build_recommendations_for_range(ads, range_key):
    compare_key = compare_key_for_range(range_key)
    scoped_ads = [
        ad for ad in ads
        if has_metric_signal(ad.get('metrics', {}).get(range_key, ZERO_METRICS))
        or has_metric_signal(ad.get('metrics', {}).get(compare_key, ZERO_METRICS))
    ]
    recommendations = []

    for ad in scoped_ads:
        metrics = with_derived(ad.get('metrics', {}).get(range_key, ZERO_METRICS.copy()))
        compare = with_derived(ad.get('metrics', {}).get(compare_key, ZERO_METRICS.copy()))
        sales_delta = percent_change(metrics['sales'], compare['sales'])
        current_tier = ad.get('tiers', {}).get(range_key) or ad.get('tier', 'Hold')

        if current_tier == 'Repair' or metrics['roas'] < 1.8 or (sales_delta is not None and sales_delta <= -20):
            recommendations.append({
                'adId': ad['id'],
                'priority': 'high',
                'title': f"Reset the {ad['name']} concept before adding more spend",
                'body': (
                    f"This ad is falling below the revenue bar with {format_number(metrics['roas'], 2)}x ROAS "
                    f"and {format_delta(sales_delta)} sales movement. Refresh the opening angle, tighten the "
                    'first frame, and cut weaker copy variants before scaling again.'
                ),
                'actions': ['Refresh opening 3 seconds', 'Trim weakest copy lines', 'Hold spend until new variant is live'],
            })

        if metrics['landingRate'] < 0.6 and metrics['outboundClicks'] >= 40:
            recommendations.append({
                'adId': ad['id'],
                'priority': 'high',
                'title': f"Improve landing-page match for {ad['product']}",
                'body': (
                    f"{format_percent(metrics['landingRate'], 1)} of outbound clicks are turning into page visits. "
                    'Align the promise in the ad with the product page headline and make sure the page above the fold '
                    'mirrors the hook.'
                ),
                'actions': ['Mirror hook in page headline', 'Reduce above-the-fold friction', 'Audit page speed on mobile'],
            })

        if metrics['videoPlays'] > 0 and metrics['hookRate'] < 0.22:
            recommendations.append({
                'adId': ad['id'],
                'priority': 'medium',
                'title': f"Strengthen the hook on {ad['name']}",
                'body': (
                    'The ad is converting too few impressions into video starts. Test a faster proof point, an '
                    'on-screen promise in the first second, or a tighter visual cue tied to dry fire accuracy.'
                ),
                'actions': ['Open with product benefit', 'Add stronger text overlay', 'Swap in quicker product demo'],
            })

        if metrics['frequency'] > 2.8 and metrics['reach'] > 10000:
            recommendations.append({
                'adId': ad['id'],
                'priority': 'medium',
                'title': f"Watch for creative fatigue on {ad['name']}",
                'body': (
                    f"Frequency is at {format_number(metrics['frequency'], 2)} in the current window. If click-through "
                    'softens next, rotate the thumbnail, hook, or headline before audience saturation drags '
                    'efficiency further.'
                ),
                'actions': ['Refresh thumbnail', 'Rotate hook line', 'Test adjacent audience segment'],
            })

    scale_candidates = sorted(
        [
            ad for ad in scoped_ads
            if with_derived(ad.get('metrics', {}).get(range_key, ZERO_METRICS.copy()))['roas'] >= 3
            and with_derived(ad.get('metrics', {}).get(range_key, ZERO_METRICS.copy()))['purchases'] >= 8
        ],
        key=lambda ad: (
            with_derived(ad.get('metrics', {}).get(range_key, ZERO_METRICS.copy()))['roas'],
            with_derived(ad.get('metrics', {}).get(range_key, ZERO_METRICS.copy()))['purchases'],
        ),
        reverse=True,
    )[:2]

    for ad in scale_candidates:
        metrics = with_derived(ad.get('metrics', {}).get(range_key, ZERO_METRICS.copy()))
        recommendations.append({
            'adId': ad['id'],
            'priority': 'low',
            'title': f"Lean into {ad['name']}",
            'body': (
                f"{ad['name']} is clearing the scale threshold at {format_number(metrics['roas'], 2)}x ROAS with "
                f"{format_number(metrics['purchases'])} purchases in {range_display_label(range_key)}. "
                'Consider a measured budget lift or copy extension before duplicating the concept.'
            ),
            'actions': ['Increase spend 10-15%', 'Launch sibling copy test', 'Repurpose winning hook into new format'],
        })

    return recommendations


def build_range_summaries(payload_ads, windows):
    summaries = {}
    for range_key, window in windows.items():
        totals = aggregate_metrics(payload_ads, range_key)
        summaries[range_key] = {
            'window': window,
            'spend': round(totals['spend'], 2),
            'sales': round(totals['sales'], 2),
            'purchases': round(totals['purchases'], 2),
            'reach': round(totals['reach'], 2),
            'clicks': round(totals['clicks'], 2),
            'frequency': round(totals['frequency'], 4),
            'outboundClicks': round(totals['outboundClicks'], 2),
            'landingPageViews': round(totals['landingPageViews'], 2),
            'interactions': round(totals['interactions'], 2),
            'videoPlays': round(totals['videoPlays'], 2),
            'roas': round(totals['roas'], 4),
            'cpa': round(totals['cpa'], 4),
            'hookRate': round(totals['hookRate'], 6),
            'landingRate': round(totals['landingRate'], 6),
        }
    return summaries


def build_sync_run_record(sync_run_id, payload):
    payload_ads = payload.get('ads', [])
    windows = payload.get('periods', {})
    current_window_counts = {
        key: sum(1 for ad in payload_ads if has_metric_signal(ad.get('metrics', {}).get(key, ZERO_METRICS)))
        for key in PRIMARY_RANGE_KEYS
        if key in windows
    }
    return {
        'id': sync_run_id,
        'source': payload.get('source', 'meta'),
        'account_id': (payload.get('account') or {}).get('id', ''),
        'account_name': (payload.get('account') or {}).get('name', ''),
        'business_id': ((payload.get('account') or {}).get('business') or {}).get('id', ''),
        'business_name': ((payload.get('account') or {}).get('business') or {}).get('name', ''),
        'generated_at': payload.get('generatedAt'),
        'ads_count': len(payload_ads),
        'windows': windows,
        'window_ad_counts': current_window_counts,
        'range_summaries': build_range_summaries(payload_ads, windows),
        'sync_status': 'running',
        'error_message': None,
    }


def trend_points_for_range(ad, range_key):
    if range_key == '7d':
        return ad.get('trend7', [])
    if range_key == '30d':
        return ad.get('trend30', [])
    if range_key == 'custom':
        return ad.get('trendCustomBuckets', [])
    return []


def build_snapshot_rows(sync_run_id, payload_ads, generated_at):
    rows = []
    for ad in payload_ads:
        rows.append({
            'snapshot_key': f"{sync_run_id}:{ad['id']}",
            'sync_run_id': sync_run_id,
            'generated_at': generated_at,
            'ad_id': ad['id'],
            'creative_id': ad.get('creativeId', ''),
            'ad_name': ad.get('name', ''),
            'campaign_name': ad.get('campaign', ''),
            'current_status': ad.get('currentStatus', 'UNKNOWN'),
            'product': ad.get('product', ''),
            'ad_format': ad.get('format', ''),
            'tier': ad.get('tier', ''),
            'quality_score': ad.get('qualityScore', 0),
            'creative_name': ad.get('creativeName', ''),
            'headline': ad.get('headline', ''),
            'primary_text': ad.get('copy', ''),
            'description': ad.get('description', ''),
            'hook': ad.get('hook', ''),
            'landing_page': ad.get('landingPage', ''),
            'destination_url': ad.get('destinationUrl', ''),
            'call_to_action': ad.get('callToAction', ''),
            'media_preview_url': ad.get('mediaPreviewUrl', ''),
            'media_source_url': ad.get('mediaSourceUrl', ''),
            'media_permalink_url': ad.get('mediaPermalinkUrl', ''),
            'media_length_seconds': ad.get('mediaLengthSeconds', 0.0),
            'video_id': ad.get('videoId', ''),
            'image_hash': ad.get('imageHash', ''),
            'body_variants': ad.get('bodyVariants', []),
            'title_variants': ad.get('titleVariants', []),
            'description_variants': ad.get('descriptionVariants', []),
            'link_variants': ad.get('linkVariants', []),
            'cta_variants': ad.get('ctaVariants', []),
        })
    return rows


def build_creative_asset_rows(sync_run_id, payload_ads, generated_at):
    rows_by_key = {}
    for ad in payload_ads:
        row = {
            'asset_key': ad.get('creativeId') or f"ad:{ad['id']}",
            'creative_id': ad.get('creativeId', ''),
            'ad_id': ad['id'],
            'ad_name': ad.get('name', ''),
            'campaign_name': ad.get('campaign', ''),
            'creative_name': ad.get('creativeName', ''),
            'current_status': ad.get('currentStatus', 'UNKNOWN'),
            'ad_format': ad.get('format', ''),
            'headline': ad.get('headline', ''),
            'primary_text': ad.get('copy', ''),
            'description': ad.get('description', ''),
            'hook': ad.get('hook', ''),
            'call_to_action': ad.get('callToAction', ''),
            'landing_page': ad.get('landingPage', ''),
            'destination_url': ad.get('destinationUrl', ''),
            'media_preview_url': ad.get('mediaPreviewUrl', ''),
            'media_source_url': ad.get('mediaSourceUrl', ''),
            'media_permalink_url': ad.get('mediaPermalinkUrl', ''),
            'media_length_seconds': ad.get('mediaLengthSeconds', 0.0),
            'video_id': ad.get('videoId', ''),
            'image_hash': ad.get('imageHash', ''),
            'body_variants': ad.get('bodyVariants', []),
            'title_variants': ad.get('titleVariants', []),
            'description_variants': ad.get('descriptionVariants', []),
            'link_variants': ad.get('linkVariants', []),
            'cta_variants': ad.get('ctaVariants', []),
            'last_seen_sync_run_id': sync_run_id,
            'last_seen_at': generated_at,
        }
        rows_by_key[row['asset_key']] = row
    return list(rows_by_key.values())


def build_window_metric_rows(sync_run_id, payload_ads, windows):
    rows = []
    for ad in payload_ads:
        for range_key, window in windows.items():
            metrics = with_derived(ad.get('metrics', {}).get(range_key, ZERO_METRICS.copy()))
            rows.append({
                'metric_key': f"{sync_run_id}:{ad['id']}:{range_key}",
                'sync_run_id': sync_run_id,
                'ad_id': ad['id'],
                'ad_name': ad.get('name', ''),
                'campaign_name': ad.get('campaign', ''),
                'current_status': ad.get('currentStatus', 'UNKNOWN'),
                'range_key': range_key,
                'window_since': window['since'],
                'window_until': window['until'],
                'spend': round(metrics['spend'], 2),
                'sales': round(metrics['sales'], 2),
                'purchases': round(metrics['purchases'], 2),
                'reach': round(metrics['reach'], 2),
                'clicks': round(metrics['clicks'], 2),
                'outbound_clicks': round(metrics['outboundClicks'], 2),
                'landing_page_views': round(metrics['landingPageViews'], 2),
                'frequency': round(metrics['frequency'], 6),
                'interactions': round(metrics['interactions'], 2),
                'video_plays': round(metrics['videoPlays'], 2),
                'p25': round(metrics['p25'], 2),
                'p50': round(metrics['p50'], 2),
                'p75': round(metrics['p75'], 2),
                'p95': round(metrics['p95'], 2),
                'roas': round(metrics['roas'], 6),
                'cpa': round(metrics['cpa'], 6),
                'hook_rate': round(metrics['hookRate'], 6),
                'landing_rate': round(metrics['landingRate'], 6),
                'quality_score': (ad.get('qualityScores') or {}).get(range_key),
                'tier': (ad.get('tiers') or {}).get(range_key),
                'trend_points': trend_points_for_range(ad, range_key),
                'visited_pages': (ad.get('visitedPagesByRange') or {}).get(range_key, []),
            })
    return rows


def build_landing_page_visit_rows(sync_run_id, payload_ads):
    rows = []
    for ad in payload_ads:
        for range_key in PRIMARY_RANGE_KEYS:
            for page in (ad.get('visitedPagesByRange') or {}).get(range_key, []):
                rows.append({
                    'visit_key': f"{sync_run_id}:{ad['id']}:{range_key}:{page.get('path', '/')}",
                    'sync_run_id': sync_run_id,
                    'ad_id': ad['id'],
                    'ad_name': ad.get('name', ''),
                    'campaign_name': ad.get('campaign', ''),
                    'range_key': range_key,
                    'page_path': page.get('path', '/'),
                    'visit_count': int(round(to_float(page.get('visits')))),
                })
    return rows


def build_daily_metric_records(sync_run_id, daily_metric_rows, ads_by_id):
    rows = []
    for row in daily_metric_rows:
        ad_meta = ads_by_id.get(row['adId'], {})
        metrics = with_derived(row['metrics'])
        rows.append({
            'metric_key': f"{sync_run_id}:{row['adId']}:{row['dateStart']}",
            'sync_run_id': sync_run_id,
            'metric_date': row['dateStart'],
            'metric_date_end': row['dateStop'],
            'ad_id': row['adId'],
            'ad_name': row.get('adName') or ad_meta.get('name', ''),
            'campaign_name': (ad_meta.get('campaign') or {}).get('name', 'Unmapped campaign'),
            'current_status': ad_meta.get('effective_status', 'UNKNOWN'),
            'spend': round(metrics['spend'], 2),
            'sales': round(metrics['sales'], 2),
            'purchases': round(metrics['purchases'], 2),
            'reach': round(metrics['reach'], 2),
            'clicks': round(metrics['clicks'], 2),
            'outbound_clicks': round(metrics['outboundClicks'], 2),
            'landing_page_views': round(metrics['landingPageViews'], 2),
            'frequency': round(metrics['frequency'], 6),
            'interactions': round(metrics['interactions'], 2),
            'video_plays': round(metrics['videoPlays'], 2),
            'p25': round(metrics['p25'], 2),
            'p50': round(metrics['p50'], 2),
            'p75': round(metrics['p75'], 2),
            'p95': round(metrics['p95'], 2),
            'roas': round(metrics['roas'], 6),
            'cpa': round(metrics['cpa'], 6),
            'hook_rate': round(metrics['hookRate'], 6),
            'landing_rate': round(metrics['landingRate'], 6),
        })
    return rows


def build_recommendation_rows(sync_run_id, payload_ads, windows, generated_at):
    rows = []
    for range_key in PRIMARY_RANGE_KEYS:
        if range_key not in windows:
            continue
        range_recommendations = build_recommendations_for_range(payload_ads, range_key)
        for index, recommendation in enumerate(range_recommendations):
            rows.append({
                'recommendation_key': f"{sync_run_id}:{recommendation['adId']}:{range_key}:{index}",
                'sync_run_id': sync_run_id,
                'ad_id': recommendation['adId'],
                'range_key': range_key,
                'priority': recommendation['priority'],
                'title': recommendation['title'],
                'body': recommendation['body'],
                'actions': recommendation['actions'],
                'generated_at': generated_at,
            })
    return rows


def supabase_update_rows(settings, table, payload, query):
    supabase_request(settings, 'PATCH', table, payload=payload, query=query, prefer='return=minimal')


def persist_dashboard_snapshot(settings, payload, ads_by_id, daily_metric_rows):
    sync_run_id = str(uuid.uuid4())
    generated_at = payload.get('generatedAt')
    payload_ads = payload.get('ads', [])
    windows = payload.get('periods', {})

    sync_run_record = build_sync_run_record(sync_run_id, payload)
    sync_run_record['current_window_ads'] = sum(
        1 for ad in payload_ads if has_metric_signal(ad.get('metrics', {}).get('7d', ZERO_METRICS))
    )

    supabase_insert_rows(settings, 'meta_sync_runs', [sync_run_record])

    try:
        supabase_insert_rows(settings, 'ad_snapshots', build_snapshot_rows(sync_run_id, payload_ads, generated_at))
        supabase_upsert_rows(settings, 'creative_assets', build_creative_asset_rows(sync_run_id, payload_ads, generated_at), 'asset_key')
        supabase_insert_rows(settings, 'ad_window_metrics', build_window_metric_rows(sync_run_id, payload_ads, windows))
        supabase_insert_rows(settings, 'landing_page_visits', build_landing_page_visit_rows(sync_run_id, payload_ads))
        supabase_insert_rows(settings, 'ad_daily_metrics', build_daily_metric_records(sync_run_id, daily_metric_rows, ads_by_id))
        supabase_insert_rows(settings, 'recommendations', build_recommendation_rows(sync_run_id, payload_ads, windows, generated_at))
        supabase_update_rows(
            settings,
            'meta_sync_runs',
            {
                'sync_status': 'completed',
                'error_message': None,
            },
            {'id': f'eq.{sync_run_id}'},
        )
    except SupabaseAPIError as exc:
        try:
            supabase_update_rows(
                settings,
                'meta_sync_runs',
                {
                    'sync_status': 'failed',
                    'error_message': exc.message,
                },
                {'id': f'eq.{sync_run_id}'},
            )
        except SupabaseAPIError:
            pass
        raise

    return sync_run_id


def build_dashboard_payload(settings, force_refresh=False, custom_since=None, custom_until=None):
    token = settings['META_ACCESS_TOKEN']
    account_id = settings['META_AD_ACCOUNT_ID']
    storage_state = {
        'configured': supabase_configured(settings),
        'enabled': supabase_sync_enabled(settings),
        'persisted': False,
        'syncRunId': '',
        'error': '',
    }

    if not token or not account_id:
        return {
            'source': 'mock',
            'configured': False,
            'error': 'Missing META_ACCESS_TOKEN or META_AD_ACCOUNT_ID in .env.local.',
            'ads': [],
            'storage': storage_state,
            'generatedAt': datetime.utcnow().isoformat() + 'Z',
        }

    custom_cache_key = ''
    if custom_since and custom_until:
        custom_cache_key = f"{custom_since.isoformat()}:{custom_until.isoformat()}"

    cache_key = (account_id, token[-10:], custom_cache_key)
    cached = CACHE.get(cache_key)
    if cached and not force_refresh and time.time() - cached['time'] < CACHE_TTL_SECONDS:
        return cached['data']
    try:
        account = meta_get(account_id, {'fields': 'id,name,account_status,currency,timezone_name,business'}, token)
        windows = build_windows(custom_since=custom_since, custom_until=custom_until)
        ads_rows = fetch_account_ads(token, account_id)
        ads_by_id = {row.get('id'): row for row in ads_rows if row.get('id')}
        insights_by_window = {name: fetch_window_insights(token, account_id, window) for name, window in windows.items()}
        demographics = fetch_demographic_breakdowns(token, account_id, windows)
        daily_sales_series = fetch_daily_sales_series(token, account_id, windows['30d'])
        daily_metric_rows = []
        if 'custom' in windows:
            custom_series = fetch_daily_sales_series(token, account_id, windows['custom'])
            daily_sales_series = merge_daily_series(daily_sales_series, custom_series)
        if storage_state['enabled']:
            daily_metric_rows = fetch_daily_metrics_rows(token, account_id, build_history_window(windows))
        trend_points = build_trend_points(daily_sales_series, windows)

        reported_ad_ids = set()
        for metrics_by_ad in insights_by_window.values():
            reported_ad_ids.update(metrics_by_ad.keys())

        payload_ads = []
        for ad_id in sorted(reported_ad_ids):
            ad = ads_by_id.get(ad_id, {'id': ad_id, 'name': 'Untitled ad'})
            creative_fields = extract_creative_fields(ad)
            current_7d = insights_by_window['7d'].get(ad_id, ZERO_METRICS.copy())
            current_30d = insights_by_window['30d'].get(ad_id, ZERO_METRICS.copy())
            wow = insights_by_window['wow'].get(ad_id, ZERO_METRICS.copy())
            mom = insights_by_window['mom'].get(ad_id, ZERO_METRICS.copy())
            custom_metrics = insights_by_window.get('custom', {}).get(ad_id, ZERO_METRICS.copy())
            custom_compare = insights_by_window.get('customCompare', {}).get(ad_id, ZERO_METRICS.copy())
            video_metadata = fetch_video_metadata(token, creative_fields['videoId']) if creative_fields['videoId'] else {}
            landing_page = creative_fields['landingPage']

            metrics_by_range = {'7d': current_7d, '30d': current_30d, 'wow': wow, 'mom': mom}
            quality_scores = {
                '7d': compute_quality_score(current_7d),
                '30d': compute_quality_score(current_30d),
            }
            tiers = {
                '7d': classify_tier(current_7d, wow),
                '30d': classify_tier(current_30d, mom),
            }

            if 'custom' in windows:
                metrics_by_range['custom'] = custom_metrics
                metrics_by_range['customCompare'] = custom_compare
                quality_scores['custom'] = compute_quality_score(custom_metrics)
                tiers['custom'] = classify_tier(custom_metrics, custom_compare)

            visited_pages_by_range = {
                key: [{'path': landing_page, 'visits': round(max(metrics.get('landingPageViews', 0.0), metrics.get('purchases', 0.0)))}]
                for key, metrics in metrics_by_range.items()
                if key in ('7d', '30d', 'custom')
            }

            payload_ads.append({
                'id': ad_id,
                'name': ad.get('name', 'Untitled ad'),
                'campaign': (ad.get('campaign') or {}).get('name') or 'Unmapped campaign',
                'currentStatus': ad.get('effective_status', 'UNKNOWN'),
                'creativeId': creative_fields['creativeId'],
                'product': infer_product((ad.get('campaign') or {}).get('name', ''), landing_page),
                'format': creative_fields['format'],
                'tier': tiers['7d'],
                'tiers': tiers,
                'headline': creative_fields['headline'],
                'copy': creative_fields['copy'],
                'description': creative_fields['description'],
                'hook': creative_fields['hook'],
                'landingPage': landing_page,
                'destinationUrl': creative_fields['destinationUrl'],
                'creativeName': creative_fields['creativeName'],
                'callToAction': creative_fields['callToAction'],
                'mediaPreviewUrl': creative_fields['mediaPreviewUrl'] or video_metadata.get('thumbnailUrl', ''),
                'mediaSourceUrl': video_metadata.get('source', ''),
                'mediaPermalinkUrl': video_metadata.get('permalinkUrl', ''),
                'mediaLengthSeconds': video_metadata.get('length', 0.0),
                'videoId': creative_fields['videoId'],
                'imageHash': creative_fields['imageHash'],
                'bodyVariants': creative_fields['bodyVariants'],
                'titleVariants': creative_fields['titleVariants'],
                'descriptionVariants': creative_fields['descriptionVariants'],
                'linkVariants': creative_fields['linkVariants'],
                'ctaVariants': creative_fields['ctaVariants'],
                'qualityScore': quality_scores['7d'],
                'qualityScores': quality_scores,
                'avgWatchTime': 0,
                'trend7': trend_points.get(ad_id, {}).get('trend7', [0, 0, 0, 0, 0, 0, 0]),
                'trend30': trend_points.get(ad_id, {}).get('trend30', [0, 0, 0, 0, 0, 0]),
                'trendCustomDaily': trend_points.get(ad_id, {}).get('trendCustomDaily', []),
                'trendCustomBuckets': trend_points.get(ad_id, {}).get('trendCustomBuckets', []),
                'visitedPages': visited_pages_by_range.get('7d', [{'path': landing_page, 'visits': 0}]),
                'visitedPagesByRange': visited_pages_by_range,
                'metrics': metrics_by_range,
            })

        payload = {
            'source': 'meta',
            'configured': True,
            'generatedAt': datetime.utcnow().isoformat() + 'Z',
            'account': {
                'id': account.get('id'),
                'name': account.get('name'),
                'currency': account.get('currency'),
                'timezoneName': account.get('timezone_name'),
                'business': account.get('business') or {},
            },
            'periods': windows,
            'ads': payload_ads,
            'demographics': demographics,
            'storage': storage_state,
            'stale': False,
            'staleReason': '',
        }

        if storage_state['enabled']:
            try:
                storage_state['syncRunId'] = persist_dashboard_snapshot(settings, payload, ads_by_id, daily_metric_rows)
                storage_state['persisted'] = True
            except SupabaseAPIError as exc:
                storage_state['error'] = exc.message
        payload['storage'] = storage_state

        CACHE[cache_key] = {'time': time.time(), 'data': payload}
        return payload
    except MetaAPIError as exc:
        if cached:
            stale_payload = json.loads(json.dumps(cached['data']))
            stale_payload['stale'] = True
            stale_payload['staleReason'] = exc.message
            stale_payload.setdefault('storage', {})
            stale_payload['storage']['error'] = exc.message
            return stale_payload
        raise


class AppHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(BASE_DIR), **kwargs)

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

    def do_GET(self):
        parsed = parse.urlparse(self.path)
        if parsed.path == '/api/dashboard':
            self.handle_dashboard(parsed)
            return
        if parsed.path == '/api/cron-sync':
            self.handle_cron_sync()
            return
        super().do_GET()

    def handle_dashboard(self, parsed):
        params = parse.parse_qs(parsed.query)
        force_refresh = params.get('refresh', ['0'])[0] == '1'
        try:
            custom_since, custom_until = parse_custom_window(params)
            payload = build_dashboard_payload(
                get_settings(),
                force_refresh=force_refresh,
                custom_since=custom_since,
                custom_until=custom_until,
            )
            self.respond_json(HTTPStatus.OK, payload)
        except ValueError as exc:
            self.respond_json(HTTPStatus.BAD_REQUEST, {
                'source': 'mock',
                'configured': False,
                'error': str(exc),
                'ads': [],
                'generatedAt': datetime.utcnow().isoformat() + 'Z',
            })
        except MetaAPIError as exc:
            self.respond_json(exc.status, {
                'source': 'mock',
                'configured': False,
                'error': exc.message,
                'details': exc.payload,
                'ads': [],
                'generatedAt': datetime.utcnow().isoformat() + 'Z',
            })

    def handle_cron_sync(self):
        settings = get_settings()
        if not cron_request_authorized(settings, self.headers):
            self.respond_json(HTTPStatus.UNAUTHORIZED, {
                'ok': False,
                'error': 'Unauthorized cron request.',
            })
            return

        try:
            summary = build_sync_summary(build_dashboard_payload(settings, force_refresh=True))
            self.respond_json(HTTPStatus.OK if summary['ok'] else HTTPStatus.INTERNAL_SERVER_ERROR, summary)
        except MetaAPIError as exc:
            self.respond_json(exc.status, {
                'ok': False,
                'error': exc.message,
                'details': exc.payload,
            })

    def respond_json(self, status, payload):
        body = json.dumps(payload).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)


def main():
    settings = get_settings()
    port = int(settings['PORT'] or '8000')
    server = ThreadingHTTPServer(('0.0.0.0', port), AppHandler)
    print(f'Strikeman Meta Command Center running at http://localhost:{port}')
    print(f'Serving files from {BASE_DIR}')
    print('Meta dashboard endpoint: /api/dashboard')
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print('\nShutting down server.')
    finally:
        server.server_close()


if __name__ == '__main__':
    main()
