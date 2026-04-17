const RANGE_COMPARE_KEY = {
  '7d': 'wow',
  '30d': 'mom',
  custom: 'customCompare',
};

const RANGE_LABEL = {
  '7d': 'Last 7 days',
  '30d': 'Last 30 days',
  custom: 'Custom range',
};

const COMPARE_LABEL = {
  '7d': 'vs previous 7-day window',
  '30d': 'vs previous 30-day window',
  custom: 'vs previous matching period',
};

const AUTO_REFRESH_INTERVAL_MS = 5 * 60 * 1000;
const RESUME_REFRESH_THRESHOLD_MS = 60 * 1000;
const AUTO_REFRESH_COPY = 'Auto-refreshing every 5 minutes while this tab is open.';
const VALID_PAGES = ['dashboard', 'live-ads', 'demographics', 'categories', 'ad-content', 'details', 'recommendations'];
const LIVE_AD_SORT_OPTIONS = [
  { value: 'performance', label: 'Performance score' },
  { value: 'spend', label: 'Spend' },
  { value: 'sales', label: 'Sales' },
  { value: 'roas', label: 'ROAS' },
  { value: 'cpa', label: 'Cost per purchase' },
  { value: 'reach', label: 'Reach' },
  { value: 'clicks', label: 'Clicks' },
  { value: 'frequency', label: 'Frequency' },
  { value: 'purchases', label: 'Orders' },
  { value: 'interactions', label: 'Interactions' },
  { value: 'hookRate', label: 'Hook rate' },
  { value: 'quality', label: 'Quality score' },
];
const DEMOGRAPHIC_DIMENSIONS = ['age', 'gender', 'device', 'country', 'region'];
const AGE_BUCKET_ORDER = ['13-17', '18-24', '25-34', '35-44', '45-54', '55-64', '65+', 'Unknown'];
const GENDER_BUCKET_ORDER = ['Male', 'Female', 'Other'];
const DEVICE_BUCKET_ORDER = ['Mobile', 'Desktop', 'Other'];
const CATEGORY_RULES = [
  {
    key: 'home-defense',
    label: 'Home defense',
    description: 'Creative centered on protecting the home, family, or personal safety at home.',
    cues: ['home defense', 'protect your home', 'defend your home', 'family safety', 'protect your family', 'bedside'],
  },
  {
    key: 'savings',
    label: 'Savings',
    description: 'Creative built around saving money, range trips, or ammo costs.',
    cues: ['save money', 'saving money', 'save on ammo', 'ammo bill', 'wasted ammo', 'less wasted ammo', 'range ammo', 'range bill', 'ammo costs'],
  },
  {
    key: 'accuracy-feedback',
    label: 'Accuracy and feedback',
    description: 'Creative promising measurable feedback, precision gains, or better shot results.',
    cues: ['instant feedback', 'shot feedback', 'feedback', 'accuracy', 'precision', 'track progress', 'measurable', 'grouping'],
  },
  {
    key: 'at-home-training',
    label: 'At-home training',
    description: 'Creative focused on consistent dry fire reps and training at home.',
    cues: ['dry fire', 'at home', 'home training', 'train smarter', 'train more often', 'practice at home', 'consistent reps', 'trigger control'],
  },
  {
    key: 'carry-readiness',
    label: 'Carry readiness',
    description: 'Creative tied to concealed carry, draw speed, or broader self-defense readiness.',
    cues: ['concealed carry', 'self defense', 'draw speed', 'carry gun', 'edc', 'carry readiness'],
  },
  {
    key: 'convenience',
    label: 'Convenience',
    description: 'Creative highlighting fast setup, easier sessions, or low-friction practice.',
    cues: ['quick setup', 'easy setup', 'minutes', 'faster', 'fast setup', 'instant', 'easy practice'],
  },
  {
    key: 'bundle-value',
    label: 'Bundle value',
    description: 'Creative framed around kits, bundles, or all-in-one value.',
    cues: ['bundle', 'starter kit', 'kit', 'all-in-one', 'everything you need', 'complete setup'],
  },
];
const CATEGORY_FALLBACK = {
  key: 'general-training',
  label: 'General training',
  description: 'Creative focused on broad dry fire improvement without one dominant theme.',
};
const COUNTRY_NAMES =
  typeof Intl !== 'undefined' && typeof Intl.DisplayNames === 'function'
    ? new Intl.DisplayNames(['en'], { type: 'region' })
    : null;
const MOCK_DEMOGRAPHIC_PROFILES = {
  age: [
    ['18-24', 0.08],
    ['25-34', 0.24],
    ['35-44', 0.27],
    ['45-54', 0.22],
    ['55-64', 0.13],
    ['65+', 0.06],
  ],
  gender: [
    ['male', 0.58],
    ['female', 0.4],
    ['unknown', 0.02],
  ],
  device: [
    ['mobile_app', 0.56],
    ['mobile_web', 0.22],
    ['desktop', 0.17],
    ['other', 0.05],
  ],
  country: [
    ['US', 0.78],
    ['CA', 0.08],
    ['AU', 0.04],
    ['GB', 0.04],
    ['DE', 0.03],
    ['NZ', 0.03],
  ],
  region: [
    ['California', 0.16],
    ['Texas', 0.12],
    ['Florida', 0.1],
    ['Georgia', 0.08],
    ['Tennessee', 0.07],
    ['Pennsylvania', 0.07],
    ['North Carolina', 0.07],
    ['Ohio', 0.06],
    ['Arizona', 0.06],
    ['Virginia', 0.05],
    ['Michigan', 0.05],
    ['Other', 0.11],
  ],
};

const ZERO_METRICS = {
  spend: 0,
  sales: 0,
  purchases: 0,
  reach: 0,
  clicks: 0,
  outboundClicks: 0,
  landingPageViews: 0,
  frequency: 0,
  interactions: 0,
  videoPlays: 0,
  p25: 0,
  p50: 0,
  p75: 0,
  p95: 0,
};

const MOCK_PAYLOAD = {
  source: 'mock',
  configured: false,
  generatedAt: new Date().toISOString(),
  account: {
    id: 'demo-account',
    name: 'Strikeman Demo Workspace',
    currency: 'USD',
    timezoneName: 'America/New_York',
    business: { id: 'demo-business', name: 'Strikeman' },
  },
  periods: {
    '7d': { since: '2026-04-07', until: '2026-04-13' },
    wow: { since: '2026-03-31', until: '2026-04-06' },
    '30d': { since: '2026-03-15', until: '2026-04-13' },
    mom: { since: '2026-02-14', until: '2026-03-15' },
  },
  ads: [
    {
      id: 'demo-1',
      name: 'Range Session Starter Kit UGC',
      campaign: 'Starter Kit Prospecting',
      product: 'Dry Fire Starter Kit',
      format: 'Video',
      currentStatus: 'ACTIVE',
      tier: 'Scale',
      tiers: { '7d': 'Scale', '30d': 'Scale' },
      headline: 'Train smarter at home with every rep.',
      copy: 'Build consistent dry fire reps with the Strikeman starter kit and instant shot feedback.',
      description: 'A short UGC cut showing setup, rep feedback, and in-home training convenience.',
      hook: 'Build consistent dry fire reps with the Strikeman starter kit',
      landingPage: '/products/dry-fire-starter-kit',
      destinationUrl: 'https://www.strikeman.io/products/dry-fire-starter-kit',
      creativeName: 'Starter Kit Home Training UGC',
      callToAction: 'ORDER_NOW',
      mediaPreviewUrl: '',
      mediaSourceUrl: '',
      mediaPermalinkUrl: '',
      mediaLengthSeconds: 14,
      videoId: 'demo-video-1',
      imageHash: 'demo-image-1',
      bodyVariants: [
        'Build consistent dry fire reps with the Strikeman starter kit and instant shot feedback.',
        'Train at home, save range ammo, and sharpen trigger control with Strikeman.',
      ],
      titleVariants: ['Train smarter at home with every rep.', 'Make every dry fire session count.'],
      descriptionVariants: ['A short UGC cut showing setup, rep feedback, and in-home training convenience.'],
      linkVariants: ['https://www.strikeman.io/products/dry-fire-starter-kit'],
      ctaVariants: ['ORDER_NOW'],
      qualityScore: 91,
      qualityScores: { '7d': 91, '30d': 89 },
      avgWatchTime: 12.4,
      trend7: [710, 840, 920, 980, 1110, 1325, 1460],
      trend30: [4020, 4390, 4675, 5010, 5480, 5940],
      trendCustomDaily: [],
      trendCustomBuckets: [],
      visitedPages: [{ path: '/products/dry-fire-starter-kit', visits: 318 }],
      visitedPagesByRange: {
        '7d': [{ path: '/products/dry-fire-starter-kit', visits: 318 }],
        '30d': [{ path: '/products/dry-fire-starter-kit', visits: 1244 }],
      },
      metrics: {
        '7d': {
          spend: 1624,
          sales: 6246,
          purchases: 57,
          reach: 49320,
          clicks: 2321,
          outboundClicks: 1744,
          landingPageViews: 1390,
          frequency: 1.84,
          interactions: 3284,
          videoPlays: 18220,
          p25: 13290,
          p50: 10040,
          p75: 7210,
          p95: 3622,
        },
        wow: {
          spend: 1510,
          sales: 5448,
          purchases: 48,
          reach: 45860,
          clicks: 2140,
          outboundClicks: 1654,
          landingPageViews: 1238,
          frequency: 1.78,
          interactions: 2960,
          videoPlays: 16740,
          p25: 12110,
          p50: 9300,
          p75: 6888,
          p95: 3440,
        },
        '30d': {
          spend: 6820,
          sales: 25280,
          purchases: 214,
          reach: 192400,
          clicks: 9100,
          outboundClicks: 7040,
          landingPageViews: 5780,
          frequency: 1.98,
          interactions: 11980,
          videoPlays: 70200,
          p25: 51100,
          p50: 38900,
          p75: 28340,
          p95: 13990,
        },
        mom: {
          spend: 6050,
          sales: 21400,
          purchases: 179,
          reach: 173100,
          clicks: 8180,
          outboundClicks: 6430,
          landingPageViews: 5150,
          frequency: 1.92,
          interactions: 10450,
          videoPlays: 62800,
          p25: 45680,
          p50: 34720,
          p75: 25210,
          p95: 12690,
        },
      },
    },
    {
      id: 'demo-2',
      name: 'Marksman Bundle Comparison Cut',
      campaign: 'Marksman Bundle Retargeting',
      product: 'Marksman Bundle',
      format: 'Video',
      currentStatus: 'ACTIVE',
      tier: 'Hold',
      tiers: { '7d': 'Hold', '30d': 'Hold' },
      headline: 'More realistic reps. Less wasted ammo.',
      copy: 'Show buyers how the Marksman bundle brings recoil-free repetition and measurable session progress.',
      description: 'Comparison-driven video creative framed around training realism and progress tracking.',
      hook: 'More realistic reps without the wasted ammo bill',
      landingPage: '/products/marksman-bundle',
      destinationUrl: 'https://www.strikeman.io/products/marksman-bundle',
      creativeName: 'Marksman Bundle Comparison Video',
      callToAction: 'SHOP_NOW',
      mediaPreviewUrl: '',
      mediaSourceUrl: '',
      mediaPermalinkUrl: '',
      mediaLengthSeconds: 12,
      videoId: 'demo-video-2',
      imageHash: 'demo-image-2',
      bodyVariants: [
        'Show buyers how the Marksman bundle brings recoil-free repetition and measurable session progress.',
        'Train more often with realistic reps and instant session feedback at home.',
      ],
      titleVariants: ['More realistic reps. Less wasted ammo.', 'A better way to build repetition.'],
      descriptionVariants: ['Comparison-driven video creative framed around training realism and progress tracking.'],
      linkVariants: ['https://www.strikeman.io/products/marksman-bundle'],
      ctaVariants: ['SHOP_NOW'],
      qualityScore: 78,
      qualityScores: { '7d': 78, '30d': 80 },
      avgWatchTime: 9.8,
      trend7: [370, 410, 465, 488, 530, 556, 601],
      trend30: [2100, 2255, 2430, 2520, 2680, 2805],
      trendCustomDaily: [],
      trendCustomBuckets: [],
      visitedPages: [{ path: '/products/marksman-bundle', visits: 194 }],
      visitedPagesByRange: {
        '7d': [{ path: '/products/marksman-bundle', visits: 194 }],
        '30d': [{ path: '/products/marksman-bundle', visits: 772 }],
      },
      metrics: {
        '7d': {
          spend: 1098,
          sales: 2748,
          purchases: 16,
          reach: 24180,
          clicks: 998,
          outboundClicks: 702,
          landingPageViews: 438,
          frequency: 2.42,
          interactions: 1348,
          videoPlays: 9360,
          p25: 6240,
          p50: 4560,
          p75: 2840,
          p95: 1320,
        },
        wow: {
          spend: 1014,
          sales: 2960,
          purchases: 17,
          reach: 23010,
          clicks: 948,
          outboundClicks: 690,
          landingPageViews: 462,
          frequency: 2.28,
          interactions: 1280,
          videoPlays: 9024,
          p25: 6300,
          p50: 4680,
          p75: 3100,
          p95: 1495,
        },
        '30d': {
          spend: 4890,
          sales: 13680,
          purchases: 82,
          reach: 104220,
          clicks: 4380,
          outboundClicks: 3120,
          landingPageViews: 2040,
          frequency: 2.38,
          interactions: 5960,
          videoPlays: 40480,
          p25: 27890,
          p50: 19950,
          p75: 12680,
          p95: 5940,
        },
        mom: {
          spend: 4350,
          sales: 12840,
          purchases: 74,
          reach: 96200,
          clicks: 4090,
          outboundClicks: 2980,
          landingPageViews: 2102,
          frequency: 2.22,
          interactions: 5500,
          videoPlays: 38150,
          p25: 27200,
          p50: 20040,
          p75: 13310,
          p95: 6230,
        },
      },
    },
    {
      id: 'demo-3',
      name: 'Laser Bullet Offer Demo',
      campaign: 'Laser Bullet Testing',
      product: 'Laser Bullet',
      format: 'Static',
      currentStatus: 'ACTIVE',
      tier: 'Repair',
      tiers: { '7d': 'Repair', '30d': 'Repair' },
      headline: 'Upgrade the session with a single cartridge.',
      copy: 'A tighter landing-page match and a stronger first frame are the fastest levers for this offer.',
      description: 'Image-led offer creative built around ease of setup and a lighter price point.',
      hook: 'Upgrade the session with a single cartridge',
      landingPage: '/products/laser-bullet',
      destinationUrl: 'https://www.strikeman.io/products/laser-bullet',
      creativeName: 'Laser Bullet Product Offer Static',
      callToAction: 'ORDER_NOW',
      mediaPreviewUrl: '',
      mediaSourceUrl: '',
      mediaPermalinkUrl: '',
      mediaLengthSeconds: 0,
      videoId: '',
      imageHash: 'demo-image-3',
      bodyVariants: [
        'A tighter landing-page match and a stronger first frame are the fastest levers for this offer.',
        'Upgrade a current training setup with a simple cartridge-based add-on.',
      ],
      titleVariants: ['Upgrade the session with a single cartridge.'],
      descriptionVariants: ['Image-led offer creative built around ease of setup and a lighter price point.'],
      linkVariants: ['https://www.strikeman.io/products/laser-bullet'],
      ctaVariants: ['ORDER_NOW'],
      qualityScore: 63,
      qualityScores: { '7d': 63, '30d': 66 },
      avgWatchTime: 0,
      trend7: [220, 195, 182, 170, 154, 138, 129],
      trend30: [1640, 1510, 1420, 1345, 1200, 1125],
      trendCustomDaily: [],
      trendCustomBuckets: [],
      visitedPages: [{ path: '/products/laser-bullet', visits: 91 }],
      visitedPagesByRange: {
        '7d': [{ path: '/products/laser-bullet', visits: 91 }],
        '30d': [{ path: '/products/laser-bullet', visits: 402 }],
      },
      metrics: {
        '7d': {
          spend: 842,
          sales: 968,
          purchases: 7,
          reach: 18380,
          clicks: 514,
          outboundClicks: 362,
          landingPageViews: 166,
          frequency: 2.96,
          interactions: 604,
          videoPlays: 0,
          p25: 0,
          p50: 0,
          p75: 0,
          p95: 0,
        },
        wow: {
          spend: 790,
          sales: 1330,
          purchases: 10,
          reach: 17620,
          clicks: 548,
          outboundClicks: 388,
          landingPageViews: 210,
          frequency: 2.7,
          interactions: 656,
          videoPlays: 0,
          p25: 0,
          p50: 0,
          p75: 0,
          p95: 0,
        },
        '30d': {
          spend: 3290,
          sales: 4680,
          purchases: 34,
          reach: 76520,
          clicks: 2130,
          outboundClicks: 1480,
          landingPageViews: 760,
          frequency: 2.88,
          interactions: 2490,
          videoPlays: 0,
          p25: 0,
          p50: 0,
          p75: 0,
          p95: 0,
        },
        mom: {
          spend: 2810,
          sales: 5940,
          purchases: 43,
          reach: 72480,
          clicks: 2280,
          outboundClicks: 1610,
          landingPageViews: 990,
          frequency: 2.62,
          interactions: 2710,
          videoPlays: 0,
          p25: 0,
          p50: 0,
          p75: 0,
          p95: 0,
        },
      },
    },
  ],
};

const state = {
  range: '7d',
  query: '',
  campaign: 'All campaigns',
  tier: 'All tiers',
  payload: null,
  connectionPayload: null,
  usingMock: false,
  selectedAdId: null,
  customSince: '',
  customUntil: '',
  isLoading: false,
  adsCollapsed: false,
  contentCollapsed: false,
  viewerOpen: false,
  viewerAdId: null,
  lastLoadedAt: 0,
  page: 'dashboard',
  liveAdsSortMetric: 'performance',
  liveAdsSortDirection: 'desc',
  liveAdsStatus: 'All statuses',
  liveAdsFormat: 'All formats',
};

let autoRefreshTimer = null;
let loadPromise = null;

const elements = {
  connectionHeading: document.querySelector('#connection-heading'),
  connectionCopy: document.querySelector('#connection-copy'),
  accountHeading: document.querySelector('#account-heading'),
  accountCopy: document.querySelector('#account-copy'),
  bannerStatus: document.querySelector('#banner-status'),
  bannerSource: document.querySelector('#banner-source'),
  bannerAccount: document.querySelector('#banner-account'),
  metricsGrid: document.querySelector('#metrics-grid'),
  tableSummary: document.querySelector('#table-summary'),
  adsPanelBody: document.querySelector('#ads-panel-body'),
  adsCollapseToggle: document.querySelector('#ads-collapse-toggle'),
  adsTbody: document.querySelector('#ads-tbody'),
  copyLeaderboard: document.querySelector('#copy-leaderboard'),
  hookLeaderboard: document.querySelector('#hook-leaderboard'),
  landingLeaderboard: document.querySelector('#landing-leaderboard'),
  detailContent: document.querySelector('#detail-content'),
  recommendationsList: document.querySelector('#recommendations-list'),
  demographicsSummary: document.querySelector('#demographics-summary'),
  demographicsOverview: document.querySelector('#demographics-overview'),
  demographicsAge: document.querySelector('#demographics-age'),
  demographicsGender: document.querySelector('#demographics-gender'),
  demographicsDevice: document.querySelector('#demographics-device'),
  demographicsCountry: document.querySelector('#demographics-country'),
  demographicsRegion: document.querySelector('#demographics-region'),
  categoriesSummary: document.querySelector('#categories-summary'),
  categoriesOverview: document.querySelector('#categories-overview'),
  categoriesGrid: document.querySelector('#categories-grid'),
  searchInput: document.querySelector('#search-input'),
  campaignFilter: document.querySelector('#campaign-filter'),
  tierFilter: document.querySelector('#tier-filter'),
  liveAdsSortMetric: document.querySelector('#live-ads-sort-metric'),
  liveAdsSortDirection: document.querySelector('#live-ads-sort-direction'),
  liveAdsStatusFilter: document.querySelector('#live-ads-status-filter'),
  liveAdsFormatFilter: document.querySelector('#live-ads-format-filter'),
  customStartDate: document.querySelector('#custom-start-date'),
  customEndDate: document.querySelector('#custom-end-date'),
  applyCustomRange: document.querySelector('#apply-custom-range'),
  customRangeStatus: document.querySelector('#custom-range-status'),
  contentSummary: document.querySelector('#content-summary'),
  contentCollapseToggle: document.querySelector('#content-collapse-toggle'),
  contentLibrary: document.querySelector('#content-library'),
  adViewer: document.querySelector('#ad-viewer'),
  adViewerDialog: document.querySelector('#ad-viewer-dialog'),
  viewerStage: document.querySelector('#viewer-stage'),
  viewerMeta: document.querySelector('#viewer-meta'),
  viewerTitle: document.querySelector('#viewer-title'),
  viewerClose: document.querySelector('#viewer-close'),
  detailAdSelect: document.querySelector('#detail-ad-select'),
  recommendationsAdSelect: document.querySelector('#recommendations-ad-select'),
  rangeButtons: Array.from(document.querySelectorAll('#range-toggle button')),
  navLinks: Array.from(document.querySelectorAll('.nav-link')),
  workspacePages: Array.from(document.querySelectorAll('.workspace-page')),
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function clamp(value, low, high) {
  return Math.max(low, Math.min(high, value));
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function titleCase(value) {
  return String(value || '')
    .toLowerCase()
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function isoDateParts(iso) {
  if (!iso) {
    return null;
  }
  const [year, month, day] = String(iso).split('-').map(Number);
  if (!year || !month || !day) {
    return null;
  }
  return new Date(year, month - 1, day);
}

function formatDateLabel(iso, includeYear = false) {
  const parsed = isoDateParts(iso);
  if (!parsed) {
    return '';
  }
  return parsed.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    ...(includeYear ? { year: 'numeric' } : {}),
  });
}

function formatWindow(window) {
  if (!window?.since || !window?.until) {
    return 'No dates selected';
  }
  const includeYear = window.since.slice(0, 4) !== window.until.slice(0, 4);
  return `${formatDateLabel(window.since, includeYear)} - ${formatDateLabel(window.until, true)}`;
}

function todayIso() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

function shiftIsoDate(iso, days) {
  const parsed = isoDateParts(iso);
  if (!parsed) {
    return '';
  }
  parsed.setDate(parsed.getDate() + days);
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const day = String(parsed.getDate()).padStart(2, '0');
  return `${parsed.getFullYear()}-${month}-${day}`;
}

function daysBetween(startIso, endIso) {
  const start = isoDateParts(startIso);
  const end = isoDateParts(endIso);
  if (!start || !end) {
    return 0;
  }
  return Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
}

function buildCustomCompareWindow(since, until) {
  const span = daysBetween(since, until);
  const compareUntil = shiftIsoDate(since, -1);
  const compareSince = shiftIsoDate(compareUntil, -(span - 1));
  return { since: compareSince, until: compareUntil };
}

function withDerived(metrics = ZERO_METRICS) {
  const reach = Number(metrics.reach || 0);
  const frequency = Number(metrics.frequency || 0);
  const impressions = reach * frequency;
  const spend = Number(metrics.spend || 0);
  const sales = Number(metrics.sales || 0);
  const purchases = Number(metrics.purchases || 0);
  const outboundClicks = Number(metrics.outboundClicks || 0);
  const landingPageViews = Number(metrics.landingPageViews || 0);
  const videoPlays = Number(metrics.videoPlays || 0);

  return {
    ...ZERO_METRICS,
    ...metrics,
    spend,
    sales,
    purchases,
    reach,
    frequency,
    outboundClicks,
    landingPageViews,
    videoPlays,
    roas: spend ? sales / spend : 0,
    cpa: purchases ? spend / purchases : 0,
    hookRate: impressions ? videoPlays / impressions : 0,
    landingRate: outboundClicks ? landingPageViews / outboundClicks : 0,
  };
}

function bucketizeValues(values, bucketCount) {
  if (!values.length) {
    return [];
  }
  const size = Math.max(1, Math.ceil(values.length / bucketCount));
  const buckets = [];
  for (let index = 0; index < values.length; index += size) {
    const slice = values.slice(index, index + size);
    const total = slice.reduce((sum, value) => sum + Number(value || 0), 0);
    buckets.push(Number(total.toFixed(2)));
  }
  return buckets.slice(0, bucketCount);
}

function expandTrend(seedValues, targetLength) {
  const values = [...seedValues];
  if (!values.length) {
    return Array.from({ length: targetLength }, () => 0);
  }
  while (values.length < targetLength) {
    values.push(values[values.length % seedValues.length]);
  }
  return values.slice(0, targetLength);
}

function blankDemographics() {
  return Object.fromEntries(
    ['7d', '30d', 'custom'].map((rangeKey) => [
      rangeKey,
      Object.fromEntries(DEMOGRAPHIC_DIMENSIONS.map((dimension) => [dimension, []])),
    ])
  );
}

function normalizeDemographicsPayload(rawDemographics = {}) {
  const output = blankDemographics();

  Object.entries(rawDemographics || {}).forEach(([rangeKey, dimensionMap]) => {
    output[rangeKey] = {
      ...output[rangeKey],
      ...Object.fromEntries(
        Object.entries(dimensionMap || {}).map(([dimension, rows]) => [
          dimension,
          (rows || []).map((row) => ({
            ...row,
            metrics: withDerived(row.metrics || ZERO_METRICS),
          })),
        ])
      ),
    };
  });

  return output;
}

function metricsHaveSignal(metrics = ZERO_METRICS) {
  return [
    metrics.spend,
    metrics.sales,
    metrics.purchases,
    metrics.reach,
    metrics.clicks,
    metrics.outboundClicks,
    metrics.landingPageViews,
    metrics.interactions,
    metrics.videoPlays,
  ].some((value) => Number(value || 0) > 0);
}

function scaleMockMetrics(metrics, share) {
  const scaled = { ...ZERO_METRICS };

  Object.keys(ZERO_METRICS).forEach((field) => {
    if (field === 'frequency') {
      scaled.frequency = Number(metrics.frequency || 0);
      return;
    }
    scaled[field] = Number((Number(metrics[field] || 0) * share).toFixed(4));
  });

  return scaled;
}

function buildMockDemographicRows(ads, rangeKey, profile) {
  const rows = [];

  (ads || []).forEach((ad) => {
    const metrics = ad.metrics?.[rangeKey] || ZERO_METRICS;
    if (!metricsHaveSignal(metrics)) {
      return;
    }

    profile.forEach(([bucket, share]) => {
      rows.push({
        adId: ad.id,
        bucket,
        metrics: scaleMockMetrics(metrics, share),
      });
    });
  });

  return rows;
}

function buildMockDemographics(ads, includeCustom = false) {
  const demographics = blankDemographics();
  const rangeKeys = ['7d', '30d', ...(includeCustom ? ['custom'] : [])];

  rangeKeys.forEach((rangeKey) => {
    Object.entries(MOCK_DEMOGRAPHIC_PROFILES).forEach(([dimension, profile]) => {
      demographics[rangeKey][dimension] = buildMockDemographicRows(ads, rangeKey, profile);
    });
  });

  return demographics;
}

function normalizePayload(payload) {
  return {
    ...payload,
    demographics: normalizeDemographicsPayload(payload.demographics),
    ads: (payload.ads || []).map((ad) => {
      const metrics = Object.fromEntries(
        Object.entries(ad.metrics || {}).map(([key, value]) => [key, withDerived(value)])
      );

      return {
        ...ad,
        metrics,
        tiers: ad.tiers || { '7d': ad.tier, '30d': ad.tier },
        qualityScores: ad.qualityScores || { '7d': ad.qualityScore, '30d': ad.qualityScore },
        bodyVariants: ad.bodyVariants || [ad.copy].filter(Boolean),
        titleVariants: ad.titleVariants || [ad.headline].filter(Boolean),
        descriptionVariants: ad.descriptionVariants || [ad.description].filter(Boolean),
        linkVariants: ad.linkVariants || [ad.destinationUrl].filter(Boolean),
        ctaVariants: ad.ctaVariants || [ad.callToAction].filter(Boolean),
        visitedPagesByRange: ad.visitedPagesByRange || { '7d': ad.visitedPages || [] },
      };
    }),
  };
}

function createMockPayload(errorMessage, customWindow = null) {
  const payload = clone(MOCK_PAYLOAD);
  payload.generatedAt = new Date().toISOString();
  payload.error = errorMessage || '';
  payload.demographics = buildMockDemographics(payload.ads, Boolean(customWindow));

  if (customWindow?.since && customWindow?.until) {
    payload.periods.custom = customWindow;
    payload.periods.customCompare = buildCustomCompareWindow(customWindow.since, customWindow.until);
    const span = daysBetween(customWindow.since, customWindow.until);

    payload.ads = payload.ads.map((ad) => ({
      ...ad,
      metrics: {
        ...ad.metrics,
        custom: { ...ad.metrics['30d'] },
        customCompare: { ...ad.metrics.mom },
      },
      tiers: { ...ad.tiers, custom: ad.tier },
      qualityScores: { ...ad.qualityScores, custom: ad.qualityScore },
      trendCustomDaily: expandTrend(ad.trend7 || [], Math.max(span, 7)),
      trendCustomBuckets: bucketizeValues(expandTrend(ad.trend7 || [], Math.max(span, 7)), 6),
      visitedPagesByRange: {
        ...ad.visitedPagesByRange,
        custom: ad.visitedPages || [],
      },
    }));

    payload.demographics = buildMockDemographics(payload.ads, true);
  }

  return normalizePayload(payload);
}

function currentCurrency() {
  return state.payload?.account?.currency || 'USD';
}

function formatCurrency(value, digits = 0) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currentCurrency(),
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(Number(value || 0));
}

function formatNumber(value, digits = 0) {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(Number(value || 0));
}

function formatPercent(value, digits = 0) {
  return `${formatNumber((value || 0) * 100, digits)}%`;
}

function formatDelta(value) {
  if (value === null || Number.isNaN(value)) {
    return 'No baseline';
  }
  const sign = value > 0 ? '+' : '';
  return `${sign}${formatNumber(value, 1)}%`;
}

function formatWatchTime(seconds) {
  if (!seconds) {
    return 'Pending';
  }
  if (seconds < 60) {
    return `${formatNumber(seconds, 1)} sec`;
  }
  return `${formatNumber(seconds / 60, 1)} min`;
}

function formatCallToAction(value) {
  return value ? titleCase(value) : 'Not mapped';
}

function percentChange(currentValue, previousValue) {
  if (!previousValue) {
    return currentValue ? null : 0;
  }
  return ((currentValue - previousValue) / previousValue) * 100;
}

function metricDeltaClass(delta, direction = 'up') {
  if (delta === null || Math.abs(delta) < 0.1) {
    return 'is-neutral';
  }
  const positive = delta > 0;
  const good = direction === 'down' ? !positive : positive;
  return good ? 'is-positive' : 'is-negative';
}

function currentCompareKey() {
  return RANGE_COMPARE_KEY[state.range] || 'wow';
}

function getWindow(rangeKey = state.range) {
  return state.payload?.periods?.[rangeKey] || null;
}

function rangeDisplayLabel(rangeKey = state.range) {
  if (rangeKey === 'custom' && getWindow('custom')) {
    return `Custom range • ${formatWindow(getWindow('custom'))}`;
  }
  return RANGE_LABEL[rangeKey] || 'Reporting range';
}

function compareDisplayLabel(rangeKey = state.range) {
  if (rangeKey === 'custom' && getWindow('customCompare')) {
    return `vs ${formatWindow(getWindow('customCompare'))}`;
  }
  return COMPARE_LABEL[rangeKey] || 'vs previous period';
}

function aggregateMetrics(ads, key) {
  const totals = { ...ZERO_METRICS };
  let weightedImpressions = 0;
  let totalReach = 0;

  ads.forEach((ad) => {
    const metrics = ad.metrics?.[key] || withDerived();
    Object.keys(ZERO_METRICS).forEach((field) => {
      totals[field] += Number(metrics[field] || 0);
    });
    weightedImpressions += Number(metrics.reach || 0) * Number(metrics.frequency || 0);
    totalReach += Number(metrics.reach || 0);
  });

  totals.frequency = totalReach ? weightedImpressions / totalReach : 0;
  return withDerived(totals);
}

function getCurrentTier(ad) {
  return ad.tiers?.[state.range] || ad.tier || 'Hold';
}

function getCurrentStatus(ad) {
  return ad.currentStatus || 'UNKNOWN';
}

function getCurrentQualityScore(ad) {
  return ad.qualityScores?.[state.range] || ad.qualityScore || 0;
}

function getVisitedPages(ad) {
  return ad.visitedPagesByRange?.[state.range] || ad.visitedPages || [];
}

function hasMetricSignal(metrics = ZERO_METRICS) {
  return [
    metrics.spend,
    metrics.sales,
    metrics.purchases,
    metrics.reach,
    metrics.clicks,
    metrics.outboundClicks,
    metrics.landingPageViews,
    metrics.interactions,
    metrics.videoPlays,
  ].some((value) => Number(value || 0) > 0);
}

function hasCurrentWindowActivity(ad, rangeKey = state.range) {
  return hasMetricSignal(ad.metrics?.[rangeKey] || ZERO_METRICS);
}

function hasRangeActivity(ad, rangeKey = state.range) {
  return hasCurrentWindowActivity(ad, rangeKey) || hasMetricSignal(ad.metrics?.[RANGE_COMPARE_KEY[rangeKey]] || ZERO_METRICS);
}


function hasPreviewMedia(ad) {
  return Boolean(ad?.mediaSourceUrl || ad?.mediaPreviewUrl || ad?.mediaPermalinkUrl);
}

function previewButtonLabel(ad) {
  if (ad?.mediaSourceUrl) {
    return 'Watch ad';
  }
  return 'View ad';
}

function renderAdsPanelState() {
  elements.adsPanelBody.hidden = state.adsCollapsed;
  elements.adsCollapseToggle.textContent = state.adsCollapsed ? 'Expand' : 'Collapse';
  elements.adsCollapseToggle.setAttribute('aria-expanded', state.adsCollapsed ? 'false' : 'true');
}

function renderContentPanelState() {
  elements.contentLibrary.hidden = state.contentCollapsed;
  elements.contentCollapseToggle.textContent = state.contentCollapsed ? 'Expand' : 'Collapse';
  elements.contentCollapseToggle.setAttribute('aria-expanded', state.contentCollapsed ? 'false' : 'true');
}

function findAdById(adId) {
  return (state.payload?.ads || []).find((ad) => ad.id === adId) || null;
}

function getPerformanceScore(ad, rangeKey = state.range) {
  const metrics = ad.metrics?.[rangeKey] || withDerived();
  const quality = ad.qualityScores?.[rangeKey] || ad.qualityScore || 0;

  return Math.round(
    quality * 0.44 +
      clamp(metrics.roas * 12, 0, 45) +
      clamp(metrics.purchases * 0.85, 0, 20) +
      clamp(metrics.landingRate * 26, 0, 18) -
      clamp((metrics.frequency - 2.7) * 6, 0, 16)
  );
}

function getVisibleAds() {
  if (!state.payload) {
    return [];
  }

  const query = state.query.trim().toLowerCase();
  return [...state.payload.ads]
    .filter((ad) => {
      const matchesCampaign = state.campaign === 'All campaigns' || ad.campaign === state.campaign;
      const matchesTier = state.tier === 'All tiers' || getCurrentTier(ad) === state.tier;
      const haystack = [ad.name, ad.campaign, ad.product, ad.copy, ad.headline, ad.hook, ad.creativeName]
        .join(' ')
        .toLowerCase();
      const matchesQuery = !query || haystack.includes(query);
      const matchesActivity = hasRangeActivity(ad);
      return matchesCampaign && matchesTier && matchesQuery && matchesActivity;
    });
}

function compareMetricsForRange(ad) {
  return ad.metrics?.[currentCompareKey()] || withDerived();
}

function currentMetricsForRange(ad) {
  return ad.metrics?.[state.range] || withDerived();
}

function liveAdsSortLabel() {
  return LIVE_AD_SORT_OPTIONS.find((option) => option.value === state.liveAdsSortMetric)?.label || 'Performance score';
}

function liveAdsMetricValue(ad, sortMetric = state.liveAdsSortMetric) {
  const metrics = currentMetricsForRange(ad);

  switch (sortMetric) {
    case 'performance':
      return getPerformanceScore(ad);
    case 'quality':
      return getCurrentQualityScore(ad);
    default:
      return Number(metrics?.[sortMetric] || 0);
  }
}

function compareLiveAds(left, right) {
  const leftValue = liveAdsMetricValue(left);
  const rightValue = liveAdsMetricValue(right);
  const directionMultiplier = state.liveAdsSortDirection === 'asc' ? 1 : -1;

  if (leftValue !== rightValue) {
    return (leftValue - rightValue) * directionMultiplier;
  }

  const leftPerformance = getPerformanceScore(left);
  const rightPerformance = getPerformanceScore(right);
  if (leftPerformance !== rightPerformance) {
    return rightPerformance - leftPerformance;
  }

  return left.name.localeCompare(right.name);
}

function getLiveAdsVisibleAds(baseVisibleAds) {
  return [...baseVisibleAds]
    .filter((ad) => {
      const matchesStatus = state.liveAdsStatus === 'All statuses' || getCurrentStatus(ad) === state.liveAdsStatus;
      const matchesFormat = state.liveAdsFormat === 'All formats' || (ad.format || 'Unknown') === state.liveAdsFormat;
      return matchesStatus && matchesFormat;
    })
    .sort(compareLiveAds);
}

function currentWindowSummary() {
  const window = getWindow(state.range);
  return window ? formatWindow(window) : 'No dates selected';
}

function normalizePage(page) {
  return VALID_PAGES.includes(page) ? page : 'dashboard';
}

function getPageFromHash() {
  return normalizePage(window.location.hash.replace(/^#/, '').trim());
}

function updatePageHash(page) {
  const nextHash = `#${page}`;
  if (window.location.hash === nextHash) {
    return;
  }
  history.replaceState(null, '', nextHash);
}

function renderPageState() {
  elements.navLinks.forEach((link) => {
    const isActive = link.dataset.page === state.page;
    link.classList.toggle('is-active', isActive);
    if (isActive) {
      link.setAttribute('aria-current', 'page');
    } else {
      link.removeAttribute('aria-current');
    }
  });

  elements.workspacePages.forEach((page) => {
    const isActive = page.dataset.page === state.page;
    page.classList.toggle('is-active', isActive);
    page.hidden = !isActive;
  });
}

function renderSelectedAdSelectors(visibleAds, selectedAd) {
  const selectors = [elements.detailAdSelect, elements.recommendationsAdSelect];
  const optionsMarkup = visibleAds.length
    ? visibleAds
        .map(
          (ad) =>
            `<option value="${escapeHtml(ad.id)}">${escapeHtml(ad.name)} • ${escapeHtml(ad.campaign)}</option>`
        )
        .join('')
    : '<option value="">No ads available in this view</option>';

  selectors.forEach((select) => {
    if (!select) {
      return;
    }
    select.innerHTML = optionsMarkup;
    select.disabled = !visibleAds.length;
    select.value = selectedAd?.id || (visibleAds[0]?.id ?? '');
  });
}

function setPage(page, options = {}) {
  state.page = normalizePage(page);
  renderPageState();

  if (options.updateHash) {
    updatePageHash(state.page);
  }

  if (options.scroll) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

function getAppliedCustomWindow() {
  const since = state.payload?.periods?.custom?.since;
  const until = state.payload?.periods?.custom?.until;
  if (!since || !until) {
    return null;
  }
  return { since, until };
}

function clearAutoRefreshTimer() {
  if (autoRefreshTimer) {
    window.clearTimeout(autoRefreshTimer);
    autoRefreshTimer = null;
  }
}

function scheduleAutoRefresh() {
  clearAutoRefreshTimer();
  if (document.visibilityState === 'hidden') {
    return;
  }
  autoRefreshTimer = window.setTimeout(() => {
    void triggerAutoRefresh('interval');
  }, AUTO_REFRESH_INTERVAL_MS);
}

function shouldRefreshOnResume() {
  if (!state.lastLoadedAt) {
    return true;
  }
  return Date.now() - state.lastLoadedAt >= RESUME_REFRESH_THRESHOLD_MS;
}

async function triggerAutoRefresh(reason = 'interval') {
  if (document.visibilityState === 'hidden') {
    return;
  }
  if (reason !== 'interval' && !shouldRefreshOnResume()) {
    scheduleAutoRefresh();
    return;
  }

  const customWindow = getAppliedCustomWindow();
  await loadDashboard({
    customSince: customWindow?.since || '',
    customUntil: customWindow?.until || '',
    forceRefresh: true,
    background: true,
  });
}

function ensureCustomDefaults(payload = state.payload) {
  if (payload?.periods?.custom?.since && payload?.periods?.custom?.until) {
    state.customSince = payload.periods.custom.since;
    state.customUntil = payload.periods.custom.until;
    return;
  }

  if (state.customSince && state.customUntil) {
    return;
  }

  const anchor = payload?.periods?.['7d']?.until || shiftIsoDate(todayIso(), -1);
  state.customUntil = anchor;
  state.customSince = shiftIsoDate(anchor, -13);
}

function renderFilters() {
  const campaigns = ['All campaigns', ...new Set((state.payload?.ads || []).map((ad) => ad.campaign))];
  const tiers = ['All tiers', 'Scale', 'Hold', 'Repair', 'Test'];

  if (!campaigns.includes(state.campaign)) {
    state.campaign = 'All campaigns';
  }
  if (!tiers.includes(state.tier)) {
    state.tier = 'All tiers';
  }

  elements.campaignFilter.innerHTML = campaigns
    .map((campaign) => `<option value="${escapeHtml(campaign)}">${escapeHtml(campaign)}</option>`)
    .join('');
  elements.tierFilter.innerHTML = tiers
    .map((tier) => `<option value="${escapeHtml(tier)}">${escapeHtml(tier)}</option>`)
    .join('');

  elements.campaignFilter.value = state.campaign;
  elements.tierFilter.value = state.tier;
  elements.rangeButtons.forEach((button) => {
    button.classList.toggle('is-active', button.dataset.range === state.range);
  });

  ensureCustomDefaults();
  elements.customStartDate.value = state.customSince;
  elements.customEndDate.value = state.customUntil;
  elements.customStartDate.max = todayIso();
  elements.customEndDate.max = todayIso();
  elements.applyCustomRange.disabled = state.isLoading;
  elements.applyCustomRange.textContent = state.isLoading ? 'Loading...' : 'Apply range';

  if (getWindow('custom')) {
    elements.customRangeStatus.textContent = `Applied ${formatWindow(getWindow('custom'))}. Comparison window: ${formatWindow(getWindow('customCompare'))}.`;
  } else {
    elements.customRangeStatus.textContent = 'Select exact dates, then apply to load a custom reporting window.';
  }
}

function renderLiveAdsControls(baseVisibleAds) {
  const statusOptions = ['All statuses', ...new Set(baseVisibleAds.map((ad) => getCurrentStatus(ad)).filter(Boolean))];
  const formatOptions = ['All formats', ...new Set(baseVisibleAds.map((ad) => ad.format || 'Unknown').filter(Boolean))];

  if (!statusOptions.includes(state.liveAdsStatus)) {
    state.liveAdsStatus = 'All statuses';
  }
  if (!formatOptions.includes(state.liveAdsFormat)) {
    state.liveAdsFormat = 'All formats';
  }
  if (!LIVE_AD_SORT_OPTIONS.some((option) => option.value === state.liveAdsSortMetric)) {
    state.liveAdsSortMetric = 'performance';
  }
  if (!['asc', 'desc'].includes(state.liveAdsSortDirection)) {
    state.liveAdsSortDirection = 'desc';
  }

  elements.liveAdsSortMetric.innerHTML = LIVE_AD_SORT_OPTIONS
    .map((option) => `<option value="${escapeHtml(option.value)}">${escapeHtml(option.label)}</option>`)
    .join('');
  elements.liveAdsStatusFilter.innerHTML = statusOptions
    .map(
      (status) =>
        `<option value="${escapeHtml(status)}">${escapeHtml(status === 'All statuses' ? status : titleCase(status))}</option>`
    )
    .join('');
  elements.liveAdsFormatFilter.innerHTML = formatOptions
    .map((format) => `<option value="${escapeHtml(format)}">${escapeHtml(format)}</option>`)
    .join('');

  elements.liveAdsSortMetric.value = state.liveAdsSortMetric;
  elements.liveAdsSortDirection.value = state.liveAdsSortDirection;
  elements.liveAdsStatusFilter.value = state.liveAdsStatus;
  elements.liveAdsFormatFilter.value = state.liveAdsFormat;
}

function currentDemographicsForRange() {
  return state.payload?.demographics?.[state.range] || {};
}

function normalizeDemographicBucket(dimension, bucket) {
  const raw = String(bucket || '').trim();
  const lowered = raw.toLowerCase();

  if (!raw || lowered === 'unknown') {
    return 'Unknown';
  }

  if (dimension === 'gender') {
    if (lowered === 'male') {
      return 'Male';
    }
    if (lowered === 'female') {
      return 'Female';
    }
    return 'Other';
  }

  if (dimension === 'device') {
    if (lowered === 'desktop') {
      return 'Desktop';
    }
    if (lowered.startsWith('mobile')) {
      return 'Mobile';
    }
    return 'Other';
  }

  if (dimension === 'country') {
    const code = raw.toUpperCase();
    if (/^[A-Z]{2}$/.test(code) && COUNTRY_NAMES) {
      return COUNTRY_NAMES.of(code) || code;
    }
    return raw;
  }

  return raw;
}

function demographicOrderIndex(dimension, label) {
  if (dimension === 'age') {
    return AGE_BUCKET_ORDER.indexOf(label);
  }
  if (dimension === 'gender') {
    return GENDER_BUCKET_ORDER.indexOf(label);
  }
  if (dimension === 'device') {
    return DEVICE_BUCKET_ORDER.indexOf(label);
  }
  return -1;
}

function compareDemographicEntries(dimension, left, right) {
  if (dimension === 'country' || dimension === 'region') {
    if (left.metrics.spend !== right.metrics.spend) {
      return right.metrics.spend - left.metrics.spend;
    }
    if (left.metrics.sales !== right.metrics.sales) {
      return right.metrics.sales - left.metrics.sales;
    }
    return left.label.localeCompare(right.label);
  }

  const leftIndex = demographicOrderIndex(dimension, left.label);
  const rightIndex = demographicOrderIndex(dimension, right.label);
  if (leftIndex !== rightIndex) {
    if (leftIndex === -1) {
      return 1;
    }
    if (rightIndex === -1) {
      return -1;
    }
    return leftIndex - rightIndex;
  }

  if (left.metrics.spend !== right.metrics.spend) {
    return right.metrics.spend - left.metrics.spend;
  }

  return left.label.localeCompare(right.label);
}

function aggregateDemographicRows(rows, visibleAds, dimension) {
  const visibleAdIds = new Set((visibleAds || []).map((ad) => ad.id));
  const grouped = new Map();

  (rows || []).forEach((row) => {
    if (!visibleAdIds.has(row.adId)) {
      return;
    }

    const label = normalizeDemographicBucket(dimension, row.bucket);
    const key = `${dimension}:${label}`;
    const metrics = row.metrics || withDerived();
    const entry =
      grouped.get(key) || {
        label,
        totals: { ...ZERO_METRICS },
        weightedImpressions: 0,
        totalReach: 0,
        adIds: new Set(),
      };

    Object.keys(ZERO_METRICS).forEach((field) => {
      entry.totals[field] += Number(metrics[field] || 0);
    });
    entry.weightedImpressions += Number(metrics.reach || 0) * Number(metrics.frequency || 0);
    entry.totalReach += Number(metrics.reach || 0);
    entry.adIds.add(row.adId);
    grouped.set(key, entry);
  });

  return [...grouped.values()]
    .map((entry) => ({
      label: entry.label,
      metrics: withDerived({
        ...entry.totals,
        frequency: entry.totalReach ? entry.weightedImpressions / entry.totalReach : 0,
      }),
      adCount: entry.adIds.size,
    }))
    .sort((left, right) => compareDemographicEntries(dimension, left, right));
}

function resonanceBucketLabel(dimension, label) {
  if (dimension === 'gender') {
    if (label === 'Male') {
      return 'Male audience';
    }
    if (label === 'Female') {
      return 'Female audience';
    }
    return 'Other audience';
  }

  if (dimension === 'age') {
    return `Age ${label}`;
  }

  return label;
}

function compareResonanceCandidates(left, right) {
  const leftMetrics = left.metrics || withDerived();
  const rightMetrics = right.metrics || withDerived();

  if (leftMetrics.sales !== rightMetrics.sales) {
    return rightMetrics.sales - leftMetrics.sales;
  }
  if (leftMetrics.purchases !== rightMetrics.purchases) {
    return rightMetrics.purchases - leftMetrics.purchases;
  }
  if (leftMetrics.roas !== rightMetrics.roas) {
    return rightMetrics.roas - leftMetrics.roas;
  }
  if (leftMetrics.clicks !== rightMetrics.clicks) {
    return rightMetrics.clicks - leftMetrics.clicks;
  }
  if (leftMetrics.reach !== rightMetrics.reach) {
    return rightMetrics.reach - leftMetrics.reach;
  }
  if (leftMetrics.interactions !== rightMetrics.interactions) {
    return rightMetrics.interactions - leftMetrics.interactions;
  }

  return left.label.localeCompare(right.label);
}

function buildResonanceLookup(visibleAds) {
  const lookup = new Map();
  const adIds = new Set((visibleAds || []).map((ad) => ad.id));
  const demographics = currentDemographicsForRange();

  visibleAds.forEach((ad) => {
    lookup.set(ad.id, { age: null, gender: null });
  });

  ['age', 'gender'].forEach((dimension) => {
    const grouped = new Map();

    (demographics[dimension] || []).forEach((row) => {
      if (!adIds.has(row.adId)) {
        return;
      }

      const label = normalizeDemographicBucket(dimension, row.bucket);
      const normalized = {
        label,
        displayLabel: resonanceBucketLabel(dimension, label),
        metrics: row.metrics || withDerived(),
      };

      grouped.set(row.adId, [...(grouped.get(row.adId) || []), normalized]);
    });

    grouped.forEach((rows, adId) => {
      const preferred = rows.filter((row) => (dimension === 'gender' ? row.label !== 'Other' : row.label !== 'Unknown'));
      const pool = preferred.length ? preferred : rows;
      const best = [...pool].sort(compareResonanceCandidates)[0] || null;
      const current = lookup.get(adId) || {};
      lookup.set(adId, { ...current, [dimension]: best });
    });
  });

  return lookup;
}

function average(values) {
  if (!values.length) {
    return 0;
  }
  return values.reduce((sum, value) => sum + Number(value || 0), 0) / values.length;
}

function buildCategoryCorpus(ad) {
  return [ad.name, ad.campaign, ad.product, ad.headline, ad.copy, ad.description, ad.hook, ad.creativeName, ad.landingPage, ad.destinationUrl]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function classifyAdCategory(ad) {
  const corpus = buildCategoryCorpus(ad);
  let bestMatch = null;

  CATEGORY_RULES.forEach((rule, index) => {
    const matchedCues = rule.cues.filter((cue) => corpus.includes(cue));
    if (!matchedCues.length) {
      return;
    }

    const score = matchedCues.reduce((sum, cue) => sum + cue.split(' ').filter(Boolean).length, 0);
    const candidate = {
      ...rule,
      matchedCues,
      score,
      index,
    };

    if (!bestMatch || candidate.score > bestMatch.score || (candidate.score === bestMatch.score && candidate.index < bestMatch.index)) {
      bestMatch = candidate;
    }
  });

  if (bestMatch) {
    return bestMatch;
  }

  return {
    ...CATEGORY_FALLBACK,
    matchedCues: [ad.product || ad.format || 'training'],
    score: 0,
    index: CATEGORY_RULES.length,
  };
}

function buildCategoryGroups(visibleAds) {
  const grouped = new Map();

  visibleAds.forEach((ad) => {
    const category = classifyAdCategory(ad);
    const metrics = currentMetricsForRange(ad);
    const existing =
      grouped.get(category.key) || {
        key: category.key,
        label: category.label,
        description: category.description,
        matchedCues: new Set(),
        totals: {
          sales: 0,
          spend: 0,
        },
        roasValues: [],
        cpaValues: [],
        ads: [],
      };

    category.matchedCues.forEach((cue) => existing.matchedCues.add(cue));
    existing.totals.sales += Number(metrics.sales || 0);
    existing.totals.spend += Number(metrics.spend || 0);
    existing.roasValues.push(Number(metrics.roas || 0));
    if (Number(metrics.purchases || 0) > 0) {
      existing.cpaValues.push(Number(metrics.cpa || 0));
    }
    existing.ads.push({
      id: ad.id,
      name: ad.name,
      campaign: ad.campaign,
      product: ad.product,
      tier: getCurrentTier(ad),
      metrics,
      matchedCues: category.matchedCues,
    });

    grouped.set(category.key, existing);
  });

  return [...grouped.values()]
    .map((group) => ({
      key: group.key,
      label: group.label,
      description: group.description,
      matchedCues: [...group.matchedCues].slice(0, 4),
      metrics: {
        sales: group.totals.sales,
        spend: group.totals.spend,
        roas: average(group.roasValues),
        cpa: average(group.cpaValues),
        purchasingAds: group.cpaValues.length,
      },
      ads: group.ads.sort(
        (left, right) =>
          Number(right.metrics.sales || 0) - Number(left.metrics.sales || 0) ||
          Number(right.metrics.spend || 0) - Number(left.metrics.spend || 0) ||
          left.name.localeCompare(right.name)
      ),
    }))
    .sort(
      (left, right) =>
        right.metrics.sales - left.metrics.sales ||
        right.metrics.spend - left.metrics.spend ||
        left.label.localeCompare(right.label)
    );
}

function renderCategoryMetric(label, value, note = '') {
  return `
    <div class="category-metric">
      <span class="small-label">${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
      ${note ? `<span class="category-metric-note">${escapeHtml(note)}</span>` : ''}
    </div>
  `;
}

function renderCategories(visibleAds) {
  const groups = buildCategoryGroups(visibleAds);
  const topSpendGroup = [...groups].sort((left, right) => right.metrics.spend - left.metrics.spend)[0] || null;

  if (elements.categoriesSummary) {
    elements.categoriesSummary.textContent = `${visibleAds.length} ads categorized • ${groups.length} themes • ${currentWindowSummary()} • themes inferred from live creative and copy`;
  }

  if (elements.categoriesOverview) {
    const overviewItems = [
      { label: 'Themes', value: groups.length ? formatNumber(groups.length) : '0' },
      { label: 'Ads categorized', value: visibleAds.length ? formatNumber(visibleAds.length) : '0' },
      { label: 'Top sales theme', value: groups[0]?.label || 'No data' },
      { label: 'Top spend theme', value: topSpendGroup?.label || 'No data' },
    ];

    elements.categoriesOverview.innerHTML = overviewItems
      .map(
        (item) => `
          <div class="overview-chip">
            <span class="overview-chip-label">${escapeHtml(item.label)}</span>
            <strong>${escapeHtml(item.value)}</strong>
          </div>
        `
      )
      .join('');
  }

  if (!visibleAds.length) {
    elements.categoriesGrid.innerHTML = `
      <div class="empty-state">
        <p class="empty-kicker">No categories yet</p>
        <h4>No ads match the current filters.</h4>
        <p>Adjust the search, campaign, tier, or reporting window to rebuild category groupings from the current ad set.</p>
      </div>
    `;
    return;
  }

  elements.categoriesGrid.innerHTML = groups
    .map(
      (group) => `
        <article class="category-card">
          <div class="category-card-head">
            <div>
              <p class="panel-kicker">Theme category</p>
              <h4>${escapeHtml(group.label)}</h4>
              <p class="category-description">${escapeHtml(group.description)}</p>
            </div>
            <div class="content-chip-row">
              <span class="metric-pill">${escapeHtml(formatNumber(group.ads.length))} ads</span>
              ${group.matchedCues
                .map((cue) => `<span class="metric-pill metric-pill-accent">${escapeHtml(titleCase(cue))}</span>`)
                .join('')}
            </div>
          </div>

          <div class="category-metrics-grid">
            ${renderCategoryMetric('Sales', formatCurrency(group.metrics.sales))}
            ${renderCategoryMetric('Spend', formatCurrency(group.metrics.spend))}
            ${renderCategoryMetric('Avg ROAS', `${formatNumber(group.metrics.roas, 2)}x`)}
            ${renderCategoryMetric(
              'Avg CPA',
              group.metrics.purchasingAds ? formatCurrency(group.metrics.cpa, 2) : 'No purchases',
              group.metrics.purchasingAds ? `${formatNumber(group.metrics.purchasingAds)} ads with purchases` : ''
            )}
          </div>

          <div class="category-ad-list">
            ${group.ads
              .map(
                (ad) => `
                  <button type="button" class="category-ad-row ${ad.id === state.selectedAdId ? 'is-selected' : ''}" data-ad-id="${escapeHtml(ad.id)}">
                    <div class="ad-meta">
                      <span class="ad-title">${escapeHtml(ad.name)}</span>
                      <span class="ad-subtitle">${escapeHtml(ad.campaign)} • ${escapeHtml(ad.product)}</span>
                    </div>
                    <div class="category-ad-stats">
                      <span>${escapeHtml(formatCurrency(ad.metrics.sales))} sales</span>
                      <span>${escapeHtml(formatCurrency(ad.metrics.spend))} spend</span>
                      <span>${escapeHtml(formatNumber(ad.metrics.roas, 2))}x ROAS</span>
                    </div>
                  </button>
                `
              )
              .join('')}
          </div>
        </article>
      `
    )
    .join('');
}

function renderDemographicTable(target, entries, segmentLabel, emptyHeading) {
  if (!target) {
    return;
  }

  if (!entries.length) {
    target.innerHTML = `
      <div class="empty-state">
        <p class="empty-kicker">No breakdown data</p>
        <h4>${escapeHtml(emptyHeading)}</h4>
        <p>Meta did not return rows for this filtered view and reporting window yet.</p>
      </div>
    `;
    return;
  }

  target.innerHTML = `
    <div class="table-shell demographics-table-shell">
      <table>
        <thead>
          <tr>
            <th>${escapeHtml(segmentLabel)}</th>
            <th>Spend</th>
            <th>Sales</th>
            <th>ROAS</th>
            <th>CPA</th>
            <th>Reach</th>
            <th>Clicks</th>
            <th>Freq.</th>
            <th>Orders</th>
          </tr>
        </thead>
        <tbody>
          ${entries
            .map((entry) => {
              const metrics = entry.metrics;
              return `
                <tr>
                  <td>
                    <div class="ad-meta">
                      <span class="ad-title">${escapeHtml(entry.label)}</span>
                      <span class="ad-subtitle">${escapeHtml(formatNumber(entry.adCount))} ads in current view</span>
                    </div>
                  </td>
                  <td>${escapeHtml(formatCurrency(metrics.spend))}</td>
                  <td>${escapeHtml(formatCurrency(metrics.sales))}</td>
                  <td>${escapeHtml(formatNumber(metrics.roas, 2))}x</td>
                  <td>${metrics.purchases ? escapeHtml(formatCurrency(metrics.cpa, 2)) : 'No purchases'}</td>
                  <td>${escapeHtml(formatNumber(metrics.reach))}</td>
                  <td>${escapeHtml(formatNumber(metrics.clicks))}</td>
                  <td>${escapeHtml(formatNumber(metrics.frequency, 2))}</td>
                  <td>${escapeHtml(formatNumber(metrics.purchases))}</td>
                </tr>
              `;
            })
            .join('')}
        </tbody>
      </table>
    </div>
  `;
}

function renderDemographics(visibleAds) {
  const demographics = currentDemographicsForRange();
  const ageEntries = aggregateDemographicRows(demographics.age, visibleAds, 'age');
  const genderEntries = aggregateDemographicRows(demographics.gender, visibleAds, 'gender');
  const deviceEntries = aggregateDemographicRows(demographics.device, visibleAds, 'device');
  const countryEntries = aggregateDemographicRows(demographics.country, visibleAds, 'country');
  const regionEntries = aggregateDemographicRows(demographics.region, visibleAds, 'region');
  const sourceLabel = state.usingMock ? 'modeled from demo ad data' : 'sourced from Meta Insights breakdowns';

  if (elements.demographicsSummary) {
    elements.demographicsSummary.textContent = `${visibleAds.length} filtered ads • ${currentWindowSummary()} • ${sourceLabel}`;
  }

  if (elements.demographicsOverview) {
    const overviewItems = [
      { label: 'Age buckets', value: ageEntries.length },
      { label: 'Gender buckets', value: genderEntries.length },
      { label: 'Device buckets', value: deviceEntries.length },
      { label: 'Countries', value: countryEntries.length },
      { label: 'States / regions', value: regionEntries.length },
    ];

    elements.demographicsOverview.innerHTML = overviewItems
      .map(
        (item) => `
          <div class="overview-chip">
            <span class="overview-chip-label">${escapeHtml(item.label)}</span>
            <strong>${escapeHtml(formatNumber(item.value))}</strong>
          </div>
        `
      )
      .join('');
  }

  renderDemographicTable(elements.demographicsAge, ageEntries, 'Age range', 'No age breakdown rows are available yet.');
  renderDemographicTable(elements.demographicsGender, genderEntries, 'Gender', 'No gender breakdown rows are available yet.');
  renderDemographicTable(elements.demographicsDevice, deviceEntries, 'Device', 'No device breakdown rows are available yet.');
  renderDemographicTable(elements.demographicsCountry, countryEntries, 'Country', 'No country breakdown rows are available yet.');
  renderDemographicTable(elements.demographicsRegion, regionEntries, 'State / region', 'No state or region rows are available yet.');
}

function renderConnection(visibleAds) {
  const payload = state.connectionPayload || {};
  const account = payload.account || state.payload?.account || {};
  const businessName = account.business?.name || 'Strikeman';
  const generatedAt = payload.generatedAt
    ? new Date(payload.generatedAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
    : 'Awaiting sync';

  if (!state.usingMock && payload.source === 'meta' && payload.stale) {
    elements.connectionHeading.textContent = 'Live Meta snapshot retained';
    elements.connectionCopy.textContent = `A fresh Meta refresh did not complete, so the dashboard is holding the last successful attributed snapshot from ${generatedAt}. ${AUTO_REFRESH_COPY}`;
    elements.bannerStatus.textContent = 'Status: retained live snapshot';
    const currentWindowAds = visibleAds.filter((ad) => hasCurrentWindowActivity(ad)).length;
    elements.bannerSource.textContent = `${currentWindowAds} ads with delivery in ${currentWindowSummary()}`;
    elements.bannerAccount.textContent = `Last successful sync ${generatedAt}`;
  } else if (!state.usingMock && payload.source === 'meta') {
    elements.connectionHeading.textContent = 'Live Meta connection confirmed';
    elements.connectionCopy.textContent = `Reading ad-level reporting directly from ${businessName}. ${AUTO_REFRESH_COPY}`;
    elements.bannerStatus.textContent = 'Status: live Meta data';
    const currentWindowAds = visibleAds.filter((ad) => hasCurrentWindowActivity(ad)).length;
    elements.bannerSource.textContent = `${currentWindowAds} ads with delivery in ${currentWindowSummary()}`;
    elements.bannerAccount.textContent = `Synced ${generatedAt}`;
  } else if (payload.configured) {
    elements.connectionHeading.textContent = 'Meta connected, demo view in use';
    elements.connectionCopy.textContent = payload.error
      ? `Meta responded with an error, so the dashboard is rendering the demo dataset for now. It will retry automatically while the tab stays open.`
      : 'The account is connected, but the dashboard is using the demo dataset right now. It will retry automatically while the tab stays open.';
    elements.bannerStatus.textContent = 'Status: demo rendering';
    elements.bannerSource.textContent = `Showing demo data for ${currentWindowSummary()}`;
    elements.bannerAccount.textContent = `Last Meta response ${generatedAt}`;
  } else {
    elements.connectionHeading.textContent = 'Waiting on local Meta credentials';
    elements.connectionCopy.textContent = payload.error
      ? `${payload.error} The dashboard is rendering demo data until credentials are available.`
      : 'Add local credentials to shift from demo mode to live account reporting.';
    elements.bannerStatus.textContent = 'Status: demo mode';
    elements.bannerSource.textContent = `Rendering demo data for ${currentWindowSummary()}`;
    elements.bannerAccount.textContent = 'No live account attached yet';
  }

  elements.accountHeading.textContent = account.name || 'Not connected yet';
  elements.accountCopy.textContent = `${businessName} • ${account.currency || 'USD'} • ${account.timezoneName || 'No timezone'} • Updated ${generatedAt}`;
}

function renderMetrics(visibleAds) {
  const current = aggregateMetrics(visibleAds, state.range);
  const compare = aggregateMetrics(visibleAds, currentCompareKey());
  const cards = [
    { label: 'Sales', value: formatCurrency(current.sales), delta: percentChange(current.sales, compare.sales), direction: 'up' },
    { label: 'Spend', value: formatCurrency(current.spend), delta: percentChange(current.spend, compare.spend), direction: 'flat' },
    { label: 'Return on ad spend', value: `${formatNumber(current.roas, 2)}x`, delta: percentChange(current.roas, compare.roas), direction: 'up' },
    { label: 'Cost per purchase', value: current.purchases ? formatCurrency(current.cpa, 2) : 'No purchases', delta: percentChange(current.cpa, compare.cpa), direction: 'down' },
    { label: 'Reach', value: formatNumber(current.reach), delta: percentChange(current.reach, compare.reach), direction: 'up' },
    { label: 'Clicks', value: formatNumber(current.clicks), delta: percentChange(current.clicks, compare.clicks), direction: 'up' },
    { label: 'Frequency', value: formatNumber(current.frequency, 2), delta: percentChange(current.frequency, compare.frequency), direction: 'down' },
    { label: 'Order volume', value: formatNumber(current.purchases), delta: percentChange(current.purchases, compare.purchases), direction: 'up' },
  ];

  elements.metricsGrid.innerHTML = cards
    .map(
      (card) => `
        <article class="metric-card">
          <div class="metric-top">
            <p>${escapeHtml(card.label)}</p>
            <span class="metric-tag">${escapeHtml(rangeDisplayLabel())}</span>
          </div>
          <h3>${escapeHtml(card.value)}</h3>
          <div class="metric-foot">
            <span class="delta ${metricDeltaClass(card.delta, card.direction)}">${escapeHtml(formatDelta(card.delta))}</span>
            <span>${escapeHtml(compareDisplayLabel())}</span>
          </div>
        </article>
      `
    )
    .join('');
}

function renderTable(visibleAds) {
  const activeFilters = [];
  if (state.liveAdsStatus !== 'All statuses') {
    activeFilters.push(`${titleCase(state.liveAdsStatus)} status`);
  }
  if (state.liveAdsFormat !== 'All formats') {
    activeFilters.push(`${state.liveAdsFormat} format`);
  }

  const sortDirectionLabel = state.liveAdsSortDirection === 'asc' ? 'lowest first' : 'highest first';
  const filterSummary = activeFilters.length ? ` • filters: ${activeFilters.join(' • ')}` : '';
  elements.tableSummary.textContent = `${visibleAds.length} ads for ${currentWindowSummary()} • sorted by ${liveAdsSortLabel()} (${sortDirectionLabel})${filterSummary}.`;
  renderAdsPanelState();

  if (!visibleAds.length) {
    elements.adsTbody.innerHTML = `
      <tr>
        <td colspan="11">
          <div class="empty-state">
            <p class="empty-kicker">No matches</p>
            <h4>Nothing fits the current filters or date range.</h4>
            <p>Adjust the search, campaign, tier, live-ad status, format, or custom date range to bring ads back into view.</p>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  elements.adsTbody.innerHTML = visibleAds
    .map((ad, index) => {
      const metrics = currentMetricsForRange(ad);
      const tier = getCurrentTier(ad);
      const tierClass = `tier-${tier.toLowerCase()}`;
      const previewDisabled = hasPreviewMedia(ad) ? '' : 'disabled';
      return `
        <tr class="ad-row ${ad.id === state.selectedAdId ? 'is-active' : ''}" data-ad-id="${escapeHtml(ad.id)}" tabindex="0">
          <td>
            <div class="ad-meta">
              <span class="table-rank">Rank #${index + 1}</span>
              <span class="ad-title">${escapeHtml(ad.name)}</span>
              <span class="ad-subtitle">${escapeHtml(ad.campaign)} • ${escapeHtml(ad.product)}</span>
            </div>
          </td>
          <td>${escapeHtml(formatCurrency(metrics.spend))}</td>
          <td>${escapeHtml(formatCurrency(metrics.sales))}</td>
          <td>${escapeHtml(formatNumber(metrics.roas, 2))}x</td>
          <td>${metrics.purchases ? escapeHtml(formatCurrency(metrics.cpa, 2)) : 'No purchases'}</td>
          <td>${escapeHtml(formatNumber(metrics.reach))}</td>
          <td>${escapeHtml(formatNumber(metrics.clicks))}</td>
          <td>${escapeHtml(formatNumber(metrics.frequency, 2))}</td>
          <td>${escapeHtml(formatNumber(metrics.purchases))}</td>
          <td><span class="tier-badge ${tierClass}">${escapeHtml(tier)}</span></td>
          <td>
            <button type="button" class="preview-button" data-preview-ad-id="${escapeHtml(ad.id)}" ${previewDisabled}>${escapeHtml(previewButtonLabel(ad))}</button>
          </td>
        </tr>
      `;
    })
    .join('');
}

function leaderboardItems(items, emptyLabel) {
  if (!items.length) {
    return `
      <div class="empty-state">
        <p class="empty-kicker">No signals yet</p>
        <h4>${escapeHtml(emptyLabel)}</h4>
        <p>As the dataset fills in, this section will populate with live ad insights.</p>
      </div>
    `;
  }

  return items
    .map(
      (item) => `
        <div class="leaderboard-item">
          <strong>${escapeHtml(item.title)}</strong>
          <span>${escapeHtml(item.meta)}</span>
        </div>
      `
    )
    .join('');
}

function renderLeaderboards(visibleAds) {
  const copyMap = new Map();
  const hookMap = new Map();
  const landingMap = new Map();

  visibleAds.forEach((ad) => {
    const metrics = currentMetricsForRange(ad);
    const copyKey = ad.copy || ad.headline || ad.name;
    const existingCopy = copyMap.get(copyKey) || { title: copyKey, sales: 0, spend: 0, count: 0 };
    existingCopy.sales += metrics.sales;
    existingCopy.spend += metrics.spend;
    existingCopy.count += 1;
    copyMap.set(copyKey, existingCopy);

    const hookKey = ad.hook || ad.headline || ad.name;
    const existingHook = hookMap.get(hookKey) || { title: hookKey, hookRateWeighted: 0, impressions: 0, ads: 0 };
    const impressions = metrics.reach * metrics.frequency;
    existingHook.hookRateWeighted += metrics.hookRate * impressions;
    existingHook.impressions += impressions;
    existingHook.ads += 1;
    hookMap.set(hookKey, existingHook);

    getVisitedPages(ad).forEach((page) => {
      const key = page.path || ad.landingPage || '/';
      const existingPage = landingMap.get(key) || { path: key, visits: 0, sales: 0 };
      existingPage.visits += Number(page.visits || 0);
      existingPage.sales += metrics.sales;
      landingMap.set(key, existingPage);
    });
  });

  const topCopy = [...copyMap.values()]
    .map((entry) => ({
      title: entry.title,
      meta: `${formatCurrency(entry.sales)} sales • ${entry.spend ? `${formatNumber(entry.sales / entry.spend, 2)}x ROAS` : 'No spend'} • ${entry.count} ads`,
      score: entry.spend ? entry.sales / entry.spend : 0,
    }))
    .sort((left, right) => right.score - left.score)
    .slice(0, 3);

  const topHooks = [...hookMap.values()]
    .map((entry) => ({
      title: entry.title,
      meta: `${formatPercent(entry.impressions ? entry.hookRateWeighted / entry.impressions : 0, 1)} hook rate • ${entry.ads} ads`,
      score: entry.impressions ? entry.hookRateWeighted / entry.impressions : 0,
    }))
    .sort((left, right) => right.score - left.score)
    .slice(0, 3);

  const landingPages = [...landingMap.values()]
    .map((entry) => ({
      title: entry.path,
      meta: `${formatNumber(entry.visits)} visits • ${formatCurrency(entry.sales)} revenue`,
      score: entry.visits,
    }))
    .sort((left, right) => right.score - left.score)
    .slice(0, 4);

  elements.copyLeaderboard.innerHTML = leaderboardItems(topCopy, 'Creative copy will appear here once ad text is available.');
  elements.hookLeaderboard.innerHTML = leaderboardItems(topHooks, 'Hook analysis appears as video delivery data accumulates.');
  elements.landingLeaderboard.innerHTML = leaderboardItems(landingPages, 'Landing destinations will appear once ads begin driving page visits.');
}

function comparisonCard(label, currentValue, previousValue, formatter, direction = 'up') {
  const delta = percentChange(currentValue, previousValue);
  return `
    <div class="comparison-card">
      <span class="small-label">${escapeHtml(label)}</span>
      <strong>${escapeHtml(formatter(currentValue))}</strong>
      <span class="delta ${metricDeltaClass(delta, direction)}">${escapeHtml(formatDelta(delta))}</span>
    </div>
  `;
}

function sparklineMarkup(values, prefix) {
  if (!values.length) {
    return '<p class="small-note">Trend data will appear once daily sales points are available.</p>';
  }

  const maxValue = Math.max(...values, 1);
  return `
    <div class="spark-grid" style="grid-template-columns: repeat(${values.length}, minmax(0, 1fr));">
      ${values
        .map((value, index) => {
          const height = clamp((value / maxValue) * 100, 14, 100);
          return `
            <div class="spark-bar">
              <span class="spark-value">${escapeHtml(formatCurrency(value))}</span>
              <div class="spark-fill" style="height: ${height}%"></div>
              <span class="spark-label">${escapeHtml(prefix)}${index + 1}</span>
            </div>
          `;
        })
        .join('')}
    </div>
  `;
}

function getTrendConfig(ad) {
  if (state.range === 'custom') {
    const daily = ad.trendCustomDaily || [];
    if (daily.length <= 14) {
      return {
        heading: 'Daily attributed sales',
        prefix: 'D',
        values: daily,
      };
    }
    return {
      heading: 'Custom range bucket trend',
      prefix: 'B',
      values: ad.trendCustomBuckets?.length ? ad.trendCustomBuckets : bucketizeValues(daily, 8),
    };
  }

  if (state.range === '30d') {
    return {
      heading: 'Monthly bucket trend',
      prefix: 'W',
      values: ad.trend30 || [],
    };
  }

  return {
    heading: 'Daily attributed sales',
    prefix: 'D',
    values: ad.trend7 || [],
  };
}

function renderDetail(selectedAd) {
  if (!selectedAd) {
    elements.detailContent.innerHTML = `
      <div class="empty-state">
        <p class="empty-kicker">No ad selected</p>
        <h4>Select an ad to inspect its creative signals.</h4>
        <p>The detail panel will populate with KPI deltas, copy, landing-page flow, and optimization context.</p>
      </div>
    `;
    return;
  }

  const metrics = currentMetricsForRange(selectedAd);
  const compare = compareMetricsForRange(selectedAd);
  const visitedPages = getVisitedPages(selectedAd);
  const trendConfig = getTrendConfig(selectedAd);
  const videoDepth = metrics.videoPlays ? metrics.p50 / metrics.videoPlays : 0;
  const tier = getCurrentTier(selectedAd);

  elements.detailContent.innerHTML = `
    <div class="detail-summary">
      <div class="detail-head">
        <div>
          <h3>${escapeHtml(selectedAd.name)}</h3>
          <div class="detail-subline">
            <span>${escapeHtml(selectedAd.campaign)}</span>
            <span>${escapeHtml(selectedAd.product)}</span>
            <span>${escapeHtml(selectedAd.format)}</span>
          </div>
        </div>
        <span class="tier-badge tier-${tier.toLowerCase()}">${escapeHtml(tier)}</span>
      </div>

      <div class="stat-grid">
        <div class="stat-card">
          <span class="small-label">Quality score</span>
          <strong>${escapeHtml(formatNumber(getCurrentQualityScore(selectedAd)))}</strong>
        </div>
        <div class="stat-card">
          <span class="small-label">Hook rate</span>
          <strong>${escapeHtml(formatPercent(metrics.hookRate, 1))}</strong>
        </div>
        <div class="stat-card">
          <span class="small-label">Landing rate</span>
          <strong>${escapeHtml(formatPercent(metrics.landingRate, 1))}</strong>
        </div>
        <div class="stat-card">
          <span class="small-label">Avg watch time</span>
          <strong>${escapeHtml(formatWatchTime(selectedAd.avgWatchTime))}</strong>
        </div>
      </div>

      <div class="detail-stack">
        <div class="detail-card">
          <p class="detail-label">Creative copy</p>
          <h4>${escapeHtml(selectedAd.headline || 'No headline supplied')}</h4>
          <p class="detail-copy">${escapeHtml(selectedAd.copy || 'Creative copy is unavailable for this ad.')}</p>
        </div>

        <div class="detail-card">
          <div class="detail-block-header">
            <div>
              <p class="detail-label">Hook and interaction signals</p>
              <h4>${escapeHtml(selectedAd.hook || 'No hook captured')}</h4>
            </div>
          </div>
          <ul class="metric-list">
            <li>
              <strong>${escapeHtml(formatNumber(metrics.videoPlays))} video starts</strong>
              <span>${escapeHtml(formatPercent(videoDepth, 1))} of starters reached the midpoint.</span>
            </li>
            <li>
              <strong>${escapeHtml(formatNumber(metrics.interactions))} interactions</strong>
              <span>${escapeHtml(formatNumber(metrics.clicks))} total clicks and ${escapeHtml(formatNumber(metrics.outboundClicks))} outbound clicks.</span>
            </li>
            <li>
              <strong>${escapeHtml(formatCurrency(metrics.sales))} attributed sales</strong>
              <span>${escapeHtml(formatNumber(metrics.purchases))} purchases at ${escapeHtml(formatCurrency(metrics.cpa, 2))} CPA.</span>
            </li>
          </ul>
        </div>

        <div class="detail-card">
          <p class="detail-label">Primary landing destination</p>
          <h4>${escapeHtml(selectedAd.landingPage || 'No landing page detected')}</h4>
          <div class="visited-pages">
            ${visitedPages.length
              ? visitedPages
                  .map(
                    (page) => `
                      <div class="page-row">
                        <strong>${escapeHtml(page.path)}</strong>
                        <span>${escapeHtml(formatNumber(page.visits))} visits from ads in ${escapeHtml(rangeDisplayLabel().toLowerCase())}</span>
                      </div>
                    `
                  )
                  .join('')
              : '<p class="small-note">No landing-page visits were attributed in this period.</p>'}
          </div>
        </div>

        <div class="detail-card">
          <p class="detail-label">Period comparison</p>
          <div class="comparison-grid">
            ${comparisonCard('Sales', metrics.sales, compare.sales, (value) => formatCurrency(value), 'up')}
            ${comparisonCard('ROAS', metrics.roas, compare.roas, (value) => `${formatNumber(value, 2)}x`, 'up')}
            ${comparisonCard('CPA', metrics.cpa, compare.cpa, (value) => (metrics.purchases ? formatCurrency(value, 2) : 'No purchases'), 'down')}
            ${comparisonCard('Frequency', metrics.frequency, compare.frequency, (value) => formatNumber(value, 2), 'down')}
          </div>
        </div>

        <div class="detail-card">
          <p class="detail-label">Sales trend</p>
          <h4>${escapeHtml(trendConfig.heading)}</h4>
          ${sparklineMarkup(trendConfig.values, trendConfig.prefix)}
        </div>
      </div>
    </div>
  `;
}

function renderVariantGroup(label, values, emptyLabel) {
  const cleanValues = (values || []).filter(Boolean);
  if (!cleanValues.length) {
    return `
      <div class="variant-group">
        <span class="variant-label">${escapeHtml(label)}</span>
        <p class="small-note">${escapeHtml(emptyLabel)}</p>
      </div>
    `;
  }

  return `
    <div class="variant-group">
      <span class="variant-label">${escapeHtml(label)}</span>
      <div class="variant-list">
        ${cleanValues
          .slice(0, 4)
          .map((value) => `<span class="variant-chip">${escapeHtml(value)}</span>`)
          .join('')}
      </div>
    </div>
  `;
}

function renderContentLibrary(visibleAds) {
  elements.contentSummary.textContent = `${visibleAds.length} ads in view • ${currentWindowSummary()}`;
  renderContentPanelState();

  if (!visibleAds.length) {
    elements.contentLibrary.innerHTML = `
      <div class="empty-state">
        <p class="empty-kicker">No ad content</p>
        <h4>No ads match the current filters.</h4>
        <p>Adjust the search, campaign, tier, or custom date range to inspect the creative content in this tab.</p>
      </div>
    `;
    return;
  }

  const resonanceLookup = buildResonanceLookup(visibleAds);
  elements.contentLibrary.innerHTML = visibleAds
    .map((ad, index) => {
      const selected = ad.id === state.selectedAdId;
      const metrics = currentMetricsForRange(ad);
      const tier = getCurrentTier(ad);
      const resonance = resonanceLookup.get(ad.id) || {};
      const resonancePills = [resonance.age, resonance.gender]
        .filter(Boolean)
        .map(
          (item) =>
            `<span class="resonance-pill" title="Top-performing demographic segment from Meta reporting in the current window">${escapeHtml(item.displayLabel)}</span>`
        )
        .join('');
      const preview = ad.mediaPreviewUrl
        ? `<img src="${escapeHtml(ad.mediaPreviewUrl)}" alt="${escapeHtml(ad.name)} creative preview" loading="lazy" />`
        : `<div class="content-media-fallback">${escapeHtml(ad.format)}</div>`;
      const previewDisabled = hasPreviewMedia(ad) ? '' : 'disabled';

      return `
        <article class="content-card ${selected ? 'is-selected' : ''}" data-ad-id="${escapeHtml(ad.id)}" tabindex="0">
          <div class="content-card-top">
            <div class="content-media">${preview}</div>
            <div class="content-meta">
              <div class="content-card-toolbar">
                <span class="table-rank">Rank #${index + 1}</span>
                <button type="button" class="preview-button" data-preview-ad-id="${escapeHtml(ad.id)}" ${previewDisabled}>${escapeHtml(previewButtonLabel(ad))}</button>
              </div>
              <h4>${escapeHtml(ad.name)}</h4>
              <p class="muted">${escapeHtml(ad.campaign)} • ${escapeHtml(ad.product)}</p>
              <div class="content-chip-row">
                <span class="tier-badge tier-${tier.toLowerCase()}">${escapeHtml(tier)}</span>
                <span class="metric-pill">${escapeHtml(ad.format)}</span>
                <span class="metric-pill">${escapeHtml(formatCallToAction(ad.callToAction))}</span>
                <span class="metric-pill">${escapeHtml(formatNumber(metrics.roas, 2))}x ROAS</span>
              </div>
              <div class="resonance-row">
                <span class="resonance-label">Best resonance</span>
                <div class="resonance-pills">
                  ${
                    resonancePills ||
                    '<span class="small-note">Age and gender resonance will appear when Meta returns demographic performance rows for this ad.</span>'
                  }
                </div>
              </div>
            </div>
          </div>

          <div class="content-sections">
            <div class="content-block">
              <span class="detail-label">Creative name</span>
              <p>${escapeHtml(ad.creativeName || ad.name)}</p>
            </div>
            <div class="content-block">
              <span class="detail-label">Primary text</span>
              <p>${escapeHtml(ad.copy || 'Not available')}</p>
            </div>
            <div class="content-block">
              <span class="detail-label">Headline</span>
              <p>${escapeHtml(ad.headline || 'Not available')}</p>
            </div>
            <div class="content-block">
              <span class="detail-label">Description</span>
              <p>${escapeHtml(ad.description || 'Not available')}</p>
            </div>
            <div class="content-block">
              <span class="detail-label">Hook</span>
              <p>${escapeHtml(ad.hook || 'Not available')}</p>
            </div>
            <div class="content-block content-block-split">
              <div>
                <span class="detail-label">Landing page</span>
                <p>${escapeHtml(ad.landingPage || 'Not mapped')}</p>
              </div>
              <div>
                <span class="detail-label">Destination URL</span>
                <p class="content-url">${escapeHtml(ad.destinationUrl || 'Not mapped')}</p>
              </div>
            </div>
            <div class="content-block content-block-split">
              <div>
                <span class="detail-label">Video ID</span>
                <p>${escapeHtml(ad.videoId || 'Not available')}</p>
              </div>
              <div>
                <span class="detail-label">Image hash</span>
                <p>${escapeHtml(ad.imageHash || 'Not available')}</p>
              </div>
            </div>
          </div>

          <div class="content-variants">
            ${renderVariantGroup('Body variants', ad.bodyVariants, 'No body variants returned for this ad.')}
            ${renderVariantGroup('Headline variants', ad.titleVariants, 'No headline variants returned for this ad.')}
            ${renderVariantGroup('Description variants', ad.descriptionVariants, 'No description variants returned for this ad.')}
            ${renderVariantGroup('CTA variants', (ad.ctaVariants || []).map(formatCallToAction), 'No CTA variants returned for this ad.')}
          </div>
        </article>
      `;
    })
    .join('');
}

function openViewer(adId) {
  const ad = findAdById(adId);
  if (!ad || !hasPreviewMedia(ad)) {
    return;
  }
  state.viewerAdId = adId;
  state.viewerOpen = true;
  if (ad.id !== state.selectedAdId) {
    state.selectedAdId = ad.id;
  }
  render();
}

function closeViewer() {
  state.viewerOpen = false;
  state.viewerAdId = null;
  render();
}

function renderViewer() {
  const ad = state.viewerOpen ? findAdById(state.viewerAdId) : null;
  const isOpen = Boolean(ad);

  elements.adViewer.classList.toggle('is-hidden', !isOpen);
  elements.adViewer.classList.toggle('is-visible', isOpen);
  elements.adViewer.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
  document.body.classList.toggle('viewer-open', isOpen);

  if (!isOpen) {
    elements.viewerTitle.textContent = 'Ad viewer';
    elements.viewerStage.innerHTML = '';
    elements.viewerMeta.innerHTML = '';
    return;
  }

  const metrics = currentMetricsForRange(ad);
  const stageMarkup = ad.mediaSourceUrl
    ? `<video class="viewer-video" controls playsinline preload="metadata" poster="${escapeHtml(ad.mediaPreviewUrl || '')}" src="${escapeHtml(ad.mediaSourceUrl)}"></video>`
    : ad.mediaPreviewUrl
      ? `<img class="viewer-image" src="${escapeHtml(ad.mediaPreviewUrl)}" alt="${escapeHtml(ad.name)} preview" />`
      : `<div class="viewer-empty">No playable media was returned for this ad.</div>`;

  const links = [
    ad.mediaPermalinkUrl
      ? `<a class="viewer-link" href="${escapeHtml(ad.mediaPermalinkUrl)}" target="_blank" rel="noreferrer">Open media source</a>`
      : '',
    ad.destinationUrl
      ? `<a class="viewer-link" href="${escapeHtml(ad.destinationUrl)}" target="_blank" rel="noreferrer">Open destination page</a>`
      : '',
  ].filter(Boolean).join('');

  elements.viewerTitle.textContent = ad.name;
  elements.viewerStage.innerHTML = stageMarkup;
  elements.viewerMeta.innerHTML = `
    <div class="viewer-meta-stack">
      <div class="viewer-meta-block">
        <span class="detail-label">Campaign</span>
        <p>${escapeHtml(ad.campaign)}</p>
      </div>
      <div class="viewer-meta-grid">
        <div class="viewer-meta-card">
          <span class="small-label">Format</span>
          <strong>${escapeHtml(ad.format)}</strong>
        </div>
        <div class="viewer-meta-card">
          <span class="small-label">ROAS</span>
          <strong>${escapeHtml(formatNumber(metrics.roas, 2))}x</strong>
        </div>
        <div class="viewer-meta-card">
          <span class="small-label">Sales</span>
          <strong>${escapeHtml(formatCurrency(metrics.sales))}</strong>
        </div>
        <div class="viewer-meta-card">
          <span class="small-label">Video length</span>
          <strong>${escapeHtml(formatWatchTime(ad.mediaLengthSeconds || 0))}</strong>
        </div>
      </div>
      <div class="viewer-meta-block">
        <span class="detail-label">Headline</span>
        <p>${escapeHtml(ad.headline || 'Not available')}</p>
      </div>
      <div class="viewer-meta-block">
        <span class="detail-label">Primary text</span>
        <p>${escapeHtml(ad.copy || 'Not available')}</p>
      </div>
      <div class="viewer-meta-block">
        <span class="detail-label">Call to action</span>
        <p>${escapeHtml(formatCallToAction(ad.callToAction))}</p>
      </div>
      <div class="viewer-links">${links}</div>
    </div>
  `;
}

function buildRecommendations(visibleAds, selectedAd) {
  const items = [];
  if (!selectedAd) {
    return items;
  }

  const metrics = currentMetricsForRange(selectedAd);
  const compare = compareMetricsForRange(selectedAd);
  const salesDelta = percentChange(metrics.sales, compare.sales);

  if (getCurrentTier(selectedAd) === 'Repair' || metrics.roas < 1.8 || (salesDelta !== null && salesDelta <= -20)) {
    items.push({
      priority: 'high',
      title: `Reset the ${selectedAd.name} concept before adding more spend`,
      body: `This ad is falling below the revenue bar with ${formatNumber(metrics.roas, 2)}x ROAS and ${formatDelta(salesDelta)} sales movement. Refresh the opening angle, tighten the first frame, and cut weaker copy variants before scaling again.`,
      actions: ['Refresh opening 3 seconds', 'Trim weakest copy lines', 'Hold spend until new variant is live'],
    });
  }

  if (metrics.landingRate < 0.6 && metrics.outboundClicks >= 40) {
    items.push({
      priority: 'high',
      title: `Improve landing-page match for ${selectedAd.product}`,
      body: `${formatPercent(metrics.landingRate, 1)} of outbound clicks are turning into page visits. Align the promise in the ad with the product page headline and make sure the page above the fold mirrors the hook.`,
      actions: ['Mirror hook in page headline', 'Reduce above-the-fold friction', 'Audit page speed on mobile'],
    });
  }

  if (metrics.videoPlays > 0 && metrics.hookRate < 0.22) {
    items.push({
      priority: 'medium',
      title: `Strengthen the hook on ${selectedAd.name}`,
      body: 'The ad is converting too few impressions into video starts. Test a faster proof point, an on-screen promise in the first second, or a tighter visual cue tied to dry fire accuracy.',
      actions: ['Open with product benefit', 'Add stronger text overlay', 'Swap in quicker product demo'],
    });
  }

  if (metrics.frequency > 2.8 && metrics.reach > 10000) {
    items.push({
      priority: 'medium',
      title: `Watch for creative fatigue on ${selectedAd.name}`,
      body: `Frequency is at ${formatNumber(metrics.frequency, 2)} in the current window. If click-through softens next, rotate the thumbnail, hook, or headline before audience saturation drags efficiency further.`,
      actions: ['Refresh thumbnail', 'Rotate hook line', 'Test adjacent audience segment'],
    });
  }

  const scaleCandidates = visibleAds
    .filter((ad) => {
      const metricsCurrent = currentMetricsForRange(ad);
      return metricsCurrent.roas >= 3 && metricsCurrent.purchases >= 8;
    })
    .slice(0, 2);

  scaleCandidates.forEach((ad) => {
    const metricsCurrent = currentMetricsForRange(ad);
    items.push({
      priority: 'low',
      title: `Lean into ${ad.name}`,
      body: `${ad.name} is clearing the scale threshold at ${formatNumber(metricsCurrent.roas, 2)}x ROAS with ${formatNumber(metricsCurrent.purchases)} purchases in ${rangeDisplayLabel().toLowerCase()}. Consider a measured budget lift or copy extension before duplicating the concept.`,
      actions: ['Increase spend 10-15%', 'Launch sibling copy test', 'Repurpose winning hook into new format'],
    });
  });

  return items.slice(0, 4);
}

function renderRecommendations(visibleAds, selectedAd) {
  const recommendations = buildRecommendations(visibleAds, selectedAd);
  if (!recommendations.length) {
    elements.recommendationsList.innerHTML = `
      <div class="empty-state">
        <p class="empty-kicker">All clear</p>
        <h4>No urgent optimization flags in this view.</h4>
        <p>The current selection is stable. The next best move is usually to extend winning creative themes into one or two fresh variants instead of forcing major changes.</p>
      </div>
    `;
    return;
  }

  elements.recommendationsList.innerHTML = recommendations
    .map(
      (recommendation) => `
        <div class="recommendation-card is-${recommendation.priority}">
          <div class="recommendation-head">
            <span class="recommendation-tag">${escapeHtml(recommendation.priority)} priority</span>
          </div>
          <h4>${escapeHtml(recommendation.title)}</h4>
          <p>${escapeHtml(recommendation.body)}</p>
          <div class="recommendation-actions">
            ${recommendation.actions
              .map((action) => `<span class="recommendation-action">${escapeHtml(action)}</span>`)
              .join('')}
          </div>
        </div>
      `
    )
    .join('');
}

function ensureSelectedAd(visibleAds) {
  if (!visibleAds.length) {
    state.selectedAdId = null;
    return null;
  }

  const existing = visibleAds.find((ad) => ad.id === state.selectedAdId);
  if (existing) {
    return existing;
  }

  state.selectedAdId = visibleAds[0].id;
  return visibleAds[0];
}

function render() {
  if (!state.payload) {
    return;
  }

  renderPageState();
  renderFilters();
  const visibleAds = getVisibleAds();
  const liveAds = getLiveAdsVisibleAds(visibleAds);
  const selectedAd = ensureSelectedAd(visibleAds);

  renderSelectedAdSelectors(visibleAds, selectedAd);
  renderLiveAdsControls(visibleAds);
  renderConnection(visibleAds);
  renderMetrics(visibleAds);
  renderTable(liveAds);
  renderDemographics(visibleAds);
  renderCategories(visibleAds);
  renderLeaderboards(visibleAds);
  renderContentLibrary(visibleAds);
  renderDetail(selectedAd);
  renderRecommendations(visibleAds, selectedAd);
  renderViewer();
}

function buildDashboardUrl(customSince = '', customUntil = '', forceRefresh = false) {
  const params = new URLSearchParams();
  if (customSince && customUntil) {
    params.set('since', customSince);
    params.set('until', customUntil);
  }
  if (forceRefresh) {
    params.set('refresh', '1');
  }
  const query = params.toString();
  return query ? `/api/dashboard?${query}` : '/api/dashboard';
}

function validateCustomRangeInputs() {
  const since = elements.customStartDate.value;
  const until = elements.customEndDate.value;
  const maxDate = todayIso();

  if (!since || !until) {
    return { valid: false, message: 'Choose both a start date and an end date.' };
  }
  if (since > until) {
    return { valid: false, message: 'The start date must be on or before the end date.' };
  }
  if (until > maxDate) {
    return { valid: false, message: `The custom range cannot end after ${maxDate}.` };
  }

  return { valid: true, since, until };
}

async function loadDashboard(options = {}) {
  if (loadPromise) {
    return loadPromise;
  }

  const customSince = options.customSince || '';
  const customUntil = options.customUntil || '';
  const forceRefresh = Boolean(options.forceRefresh);
  const background = Boolean(options.background && state.payload);

  loadPromise = (async () => {
    clearAutoRefreshTimer();
    state.isLoading = true;

    if (!background) {
      renderFilters();
      elements.connectionHeading.textContent = 'Loading Meta dashboard';
      elements.connectionCopy.textContent = 'Reading account data and preparing the dashboard view.';
    }

    try {
      const response = await fetch(buildDashboardUrl(customSince, customUntil, forceRefresh));
      const payload = await response.json();
      state.connectionPayload = payload;

      if (response.ok && payload.source === 'meta') {
        state.usingMock = false;
        state.payload = normalizePayload(payload);
      } else {
        state.usingMock = true;
        state.payload = createMockPayload(payload.error, customSince && customUntil ? { since: customSince, until: customUntil } : null);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown connection error';
      state.connectionPayload = {
        source: 'mock',
        configured: false,
        error: message,
        generatedAt: new Date().toISOString(),
      };
      state.usingMock = true;
      state.payload = createMockPayload(message, customSince && customUntil ? { since: customSince, until: customUntil } : null);
    } finally {
      state.isLoading = false;
      state.lastLoadedAt = Date.now();
    }

    if (customSince && customUntil) {
      state.customSince = customSince;
      state.customUntil = customUntil;
      state.range = 'custom';
    } else {
      ensureCustomDefaults(state.payload);
    }

    render();
    scheduleAutoRefresh();
  })();

  try {
    await loadPromise;
  } finally {
    loadPromise = null;
  }
}

function selectAdFromInteraction(target) {
  const source = target.closest('[data-ad-id]');
  if (!source) {
    return false;
  }
  state.selectedAdId = source.dataset.adId;
  render();
  return true;
}

function bindEvents() {
  elements.rangeButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const nextRange = button.dataset.range;
      if (nextRange === 'custom' && !getWindow('custom')) {
        elements.customRangeStatus.textContent = 'Choose exact dates, then click Apply range to load a custom window.';
        elements.customStartDate.focus();
        return;
      }
      state.range = nextRange;
      render();
    });
  });

  elements.searchInput.addEventListener('input', (event) => {
    state.query = event.target.value || '';
    render();
  });

  elements.campaignFilter.addEventListener('change', (event) => {
    state.campaign = event.target.value;
    render();
  });

  elements.tierFilter.addEventListener('change', (event) => {
    state.tier = event.target.value;
    render();
  });

  elements.liveAdsSortMetric.addEventListener('change', (event) => {
    state.liveAdsSortMetric = event.target.value;
    render();
  });

  elements.liveAdsSortDirection.addEventListener('change', (event) => {
    state.liveAdsSortDirection = event.target.value;
    render();
  });

  elements.liveAdsStatusFilter.addEventListener('change', (event) => {
    state.liveAdsStatus = event.target.value;
    render();
  });

  elements.liveAdsFormatFilter.addEventListener('change', (event) => {
    state.liveAdsFormat = event.target.value;
    render();
  });

  const handleSelectedAdChange = (event) => {
    if (!event.target.value) {
      return;
    }
    state.selectedAdId = event.target.value;
    render();
  };

  elements.detailAdSelect.addEventListener('change', handleSelectedAdChange);
  elements.recommendationsAdSelect.addEventListener('change', handleSelectedAdChange);

  elements.customStartDate.addEventListener('change', (event) => {
    state.customSince = event.target.value;
    elements.customRangeStatus.textContent = 'Custom dates updated. Click Apply range to load that window.';
  });

  elements.customEndDate.addEventListener('change', (event) => {
    state.customUntil = event.target.value;
    elements.customRangeStatus.textContent = 'Custom dates updated. Click Apply range to load that window.';
  });

  elements.applyCustomRange.addEventListener('click', async () => {
    const validation = validateCustomRangeInputs();
    if (!validation.valid) {
      elements.customRangeStatus.textContent = validation.message;
      return;
    }

    elements.customRangeStatus.textContent = `Loading ${formatWindow({ since: validation.since, until: validation.until })}...`;
    await loadDashboard({ customSince: validation.since, customUntil: validation.until });
  });

  elements.adsCollapseToggle.addEventListener('click', () => {
    state.adsCollapsed = !state.adsCollapsed;
    renderAdsPanelState();
  });

  elements.contentCollapseToggle.addEventListener('click', () => {
    state.contentCollapsed = !state.contentCollapsed;
    renderContentPanelState();
  });

  const handlePreviewTrigger = (target) => {
    const trigger = target.closest('[data-preview-ad-id]');
    if (!trigger || trigger.disabled) {
      return false;
    }
    openViewer(trigger.dataset.previewAdId);
    return true;
  };

  elements.adsTbody.addEventListener('click', (event) => {
    if (handlePreviewTrigger(event.target)) {
      return;
    }
    selectAdFromInteraction(event.target);
  });

  elements.adsTbody.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }
    if (handlePreviewTrigger(event.target)) {
      event.preventDefault();
      return;
    }
    if (selectAdFromInteraction(event.target)) {
      event.preventDefault();
    }
  });

  elements.contentLibrary.addEventListener('click', (event) => {
    if (handlePreviewTrigger(event.target)) {
      return;
    }
    selectAdFromInteraction(event.target);
  });

  elements.contentLibrary.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }
    if (handlePreviewTrigger(event.target)) {
      event.preventDefault();
      return;
    }
    if (selectAdFromInteraction(event.target)) {
      event.preventDefault();
    }
  });

  elements.categoriesGrid.addEventListener('click', (event) => {
    selectAdFromInteraction(event.target);
  });

  elements.viewerClose.addEventListener('click', closeViewer);
  elements.adViewer.addEventListener('click', (event) => {
    if (event.target === elements.adViewer) {
      closeViewer();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && state.viewerOpen) {
      closeViewer();
    }
  });

  elements.navLinks.forEach((link) => {
    link.addEventListener('click', () => {
      setPage(link.dataset.page, { updateHash: true, scroll: true });
    });
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      clearAutoRefreshTimer();
      return;
    }
    void triggerAutoRefresh('visibility');
  });

  window.addEventListener('focus', () => {
    if (document.visibilityState === 'visible') {
      void triggerAutoRefresh('focus');
    }
  });

  window.addEventListener('hashchange', () => {
    setPage(getPageFromHash(), { scroll: true });
  });
}

bindEvents();
setPage(getPageFromHash());
loadDashboard();
