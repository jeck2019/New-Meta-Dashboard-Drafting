#!/usr/bin/env python3

import json
import math
import os
import time
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


class MetaAPIError(Exception):
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
        'PORT': merged.get('PORT', '8000').strip(),
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


def request_json(url):
    req = request.Request(
        url,
        headers={
            'Accept': 'application/json',
            'User-Agent': 'StrikemanMetaCommandCenter/1.0',
        },
    )

    try:
        with request.urlopen(req, timeout=30) as response:
            return json.loads(response.read().decode('utf-8'))
    except error.HTTPError as exc:
        payload = exc.read().decode('utf-8')
        try:
            data = json.loads(payload)
        except json.JSONDecodeError:
            data = {'error': {'message': payload or 'Unknown Meta API error'}}
        message = data.get('error', {}).get('message', 'Unknown Meta API error')
        raise MetaAPIError(message, status=exc.code, payload=data)
    except error.URLError as exc:
        raise MetaAPIError(f'Unable to reach Meta API: {exc.reason}')


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


def build_dashboard_payload(settings, force_refresh=False, custom_since=None, custom_until=None):
    token = settings['META_ACCESS_TOKEN']
    account_id = settings['META_AD_ACCOUNT_ID']

    if not token or not account_id:
        return {
            'source': 'mock',
            'configured': False,
            'error': 'Missing META_ACCESS_TOKEN or META_AD_ACCOUNT_ID in .env.local.',
            'ads': [],
            'generatedAt': datetime.utcnow().isoformat() + 'Z',
        }

    custom_cache_key = ''
    if custom_since and custom_until:
        custom_cache_key = f"{custom_since.isoformat()}:{custom_until.isoformat()}"

    cache_key = (account_id, token[-10:], custom_cache_key)
    cached = CACHE.get(cache_key)
    if cached and not force_refresh and time.time() - cached['time'] < CACHE_TTL_SECONDS:
        return cached['data']

    account = meta_get(account_id, {'fields': 'id,name,account_status,currency,timezone_name,business'}, token)
    windows = build_windows(custom_since=custom_since, custom_until=custom_until)
    ads_rows = fetch_account_ads(token, account_id)
    ads_by_id = {row.get('id'): row for row in ads_rows if row.get('id')}
    insights_by_window = {name: fetch_window_insights(token, account_id, window) for name, window in windows.items()}
    daily_sales_series = fetch_daily_sales_series(token, account_id, windows['30d'])
    if 'custom' in windows:
        custom_series = fetch_daily_sales_series(token, account_id, windows['custom'])
        daily_sales_series = merge_daily_series(daily_sales_series, custom_series)
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
    }

    CACHE[cache_key] = {'time': time.time(), 'data': payload}
    return payload


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
