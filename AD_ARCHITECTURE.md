# AyoType Ad Integration Architecture

## Overview

Modular, performance-optimized ad system following industry best practices for user experience, compliance, and revenue optimization.

## Core Principles

1. **Non-intrusive**: Ads enhance, never disrupt user experience
2. **Performance-first**: Zero impact on Core Web Vitals (CLS, LCP, FID)
3. **Privacy-compliant**: Full GDPR/CCPA compliance with consent management
4. **Revenue-optimized**: A/B testing and strategic placement for maximum CTR
5. **Accessible**: WCAG 2.1 AA compliant ad containers

---

## Architecture Components

### 1. Ad Manager Core (`shared/ad-manager/`)

Central orchestration layer handling:
- Ad lifecycle management
- Async script loading (non-blocking)
- Consent state management
- Performance monitoring
- Error handling and fallbacks

### 2. Ad Containers (`shared/ad-manager/containers/`)

Pre-built responsive ad units:
- `InFeedAd` - Native ad in content flow
- `SidebarAd` - Sticky sidebar placement
- `HeaderAd` - Top banner (optional, low priority)
- `FooterAd` - End-of-content placement
- `AnchorAd` - Bottom-sticky mobile ads

### 3. Consent Management (`shared/ad-manager/consent/`)

GDPR/CCPA compliance layer:
- Cookie consent banner
- Purpose-specific consent (ads, analytics, personalization)
- Vendor transparency (IAB TCF 2.2 compatible)
- User preference persistence
- Consent revocation support

### 4. A/B Testing Framework (`shared/ad-manager/testing/`)

Data-driven optimization:
- Position testing (sidebar vs in-feed)
- Format testing (display vs native)
- Density testing (# of ads per page)
- Performance impact measurement
- Statistical significance calculation

### 5. Performance Monitoring (`shared/ad-manager/analytics/`)

Real-time metrics:
- CLS impact per ad unit
- LCP delta (with/without ads)
- Viewability tracking
- CTR by position/format
- Revenue per 1000 impressions (RPM)

---

## Ad Placement Strategy

### Landing Page (ayotype.com)

**Conservative approach** - prioritize first impression:
- ❌ No header/top banner (reduces LCP)
- ✅ Single sidebar ad (desktop only)
- ✅ One in-feed ad after hero section
- ✅ Footer ad after CTA
- **Max 2-3 ad units per page**

### EmojiFusion App (emojifusion.ayotype.com)

**Utility-focused** - maintain tool usability:
- ❌ No ads above the fold
- ✅ Sidebar ad (desktop, non-sticky to avoid CLS)
- ✅ In-results ad after 10 generated combos
- ✅ Mobile anchor ad (dismissible)
- **Max 2 ad units per page**

### Contact Page

**No ads** - transactional page should be distraction-free

---

## Technical Implementation

### Async Ad Loading (Core Web Vitals Compliant)

```javascript
// Load ads after page interactive
if (document.readyState === 'complete') {
  initAds();
} else {
  window.addEventListener('load', () => {
    requestIdleCallback(initAds, { timeout: 2000 });
  });
}
```

### Lazy Loading Strategy

```javascript
// Load ads when they enter viewport (with 500px margin)
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting && !entry.target.dataset.loaded) {
      loadAd(entry.target);
    }
  });
}, { rootMargin: '500px' });
```

### Reserved Space (CLS Prevention)

```css
.ad-container {
  /* Fixed aspect ratios prevent layout shift */
  aspect-ratio: 16/9; /* or 1/1, 4/3, etc. */
  background: #f0f0f0; /* Placeholder while loading */
  border: 1px solid #e0e0e0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ad-container::before {
  content: 'Advertisement';
  font-size: 10px;
  color: #999;
  text-transform: uppercase;
}
```

---

## Responsive Breakpoints

### Desktop (≥1024px)
- Sidebar: 300x250 (Medium Rectangle)
- In-feed: 728x90 (Leaderboard) or Native
- Footer: 970x90 (Large Leaderboard)

### Tablet (768px-1023px)
- In-feed: 468x60 (Banner) or Native
- Footer: 728x90 (Leaderboard)

### Mobile (<768px)
- In-feed: 320x100 (Mobile Banner) or Native
- Anchor: 320x50 (Mobile Banner)

---

## Consent Management Flow

```
User visits site
    ↓
Check consent cookie
    ↓
┌─────────────────────────┐
│ No consent stored       │
└─────────────────────────┘
    ↓
Display consent banner
    ↓
User accepts/rejects
    ↓
Store preference (12 months)
    ↓
If accepted → Load ads
If rejected → Show placeholder
```

### Consent States

1. **UNKNOWN** - First visit, no preference stored
2. **GRANTED** - User accepted ad tracking
3. **DENIED** - User rejected ad tracking
4. **PARTIAL** - User accepted some vendors only

---

## A/B Testing Framework

### Test Configuration

```javascript
// Example test: Sidebar vs no sidebar
const adTest = {
  id: 'sidebar_test_2025_10',
  name: 'Landing Sidebar Presence',
  variants: [
    { id: 'control', weight: 50, hasSidebar: false },
    { id: 'treatment', weight: 50, hasSidebar: true }
  ],
  metrics: ['ctr', 'bounce_rate', 'time_on_page', 'rpm'],
  startDate: '2025-10-25',
  endDate: '2025-11-25'
};
```

### Assignment Logic

```javascript
// Stable user bucketing (same user always gets same variant)
function getUserVariant(testId, userId) {
  const hash = hashCode(testId + userId);
  const bucket = hash % 100;

  let cumWeight = 0;
  for (const variant of test.variants) {
    cumWeight += variant.weight;
    if (bucket < cumWeight) return variant;
  }
}
```

---

## Performance Budget

### Hard Limits

- **LCP increase**: < 200ms with ads vs without
- **CLS score**: < 0.05 per ad unit
- **FID increase**: < 50ms
- **Total blocking time**: < 100ms from ad scripts
- **Bundle size**: < 50KB (minified + gzipped) for ad manager

### Monitoring

```javascript
// Track CLS impact per ad
function measureAdCLS(adContainer) {
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.sources?.some(s => adContainer.contains(s.node))) {
        trackMetric('ad_cls', entry.value, { position: adContainer.id });
      }
    }
  }).observe({ type: 'layout-shift', buffered: true });
}
```

---

## Ad Networks & Integration

### Primary: Google AdSense

- **Publisher ID**: pub-9365314553407219 (configured in ads.txt)
- **Auto Ads**: DISABLED (use manual ad units for control)
- **Ad Format**: Responsive display ads + native
- **Consent**: Integrated with Google Consent Mode v2

### Backup/Alternative Networks

- **Media.net** - Contextual ads (Yahoo/Bing)
- **Ezoic** - AI-optimized placements (if traffic > 10k/month)
- **Carbon Ads** - Developer-focused (for tech content)

---

## Security & Privacy

### Ad Safety

```javascript
// Sandbox ad iframes for security
<iframe
  sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
  loading="lazy"
  src="ad-content-url"
/>
```

### Data Minimization

- Only collect essential metrics (impressions, clicks)
- No PII (personally identifiable information) shared with ad networks
- User IDs are hashed before tracking
- Ad preferences stored locally (not server-side)

### GDPR Compliance Checklist

- ✅ Consent before loading ad scripts
- ✅ Clear privacy policy explaining ad usage
- ✅ Easy opt-out mechanism
- ✅ Data retention policy (12 months max)
- ✅ Right to data deletion
- ✅ Cookie notice with vendor list

---

## Accessibility (WCAG 2.1 AA)

### Requirements

1. **Keyboard navigation**: Skip ad links (`<a href="#content">Skip ads</a>`)
2. **Screen readers**: Proper ARIA labels (`aria-label="Advertisement"`)
3. **Color contrast**: Ad labels meet 4.5:1 contrast ratio
4. **No auto-play**: Video ads require user interaction
5. **Reduced motion**: Respect `prefers-reduced-motion` setting

```css
@media (prefers-reduced-motion: reduce) {
  .ad-container * {
    animation: none !important;
    transition: none !important;
  }
}
```

---

## Rollout Strategy

### Phase 1: Foundation (Week 1-2)
- ✅ ads.txt configured
- ⏳ Implement consent management
- ⏳ Create ad container components
- ⏳ Setup performance monitoring

### Phase 2: Initial Deployment (Week 3-4)
- Deploy 1-2 ad units on landing page (A/B test)
- Monitor CLS, LCP, user engagement
- Collect baseline metrics

### Phase 3: Optimization (Week 5-8)
- Test additional placements
- Optimize ad density
- Fine-tune lazy loading thresholds
- A/B test formats (display vs native)

### Phase 4: Scale (Week 9+)
- Expand to EmojiFusion app
- Add mobile-specific formats
- Implement advanced targeting
- Explore premium ad networks

---

## Success Metrics

### User Experience (Primary)
- Bounce rate: < 5% increase with ads
- Time on site: No decrease
- Core Web Vitals: All remain "Good"

### Revenue (Secondary)
- CTR: > 0.5% (industry avg: 0.35%)
- RPM: > $2 (varies by niche)
- Viewability: > 60%

### Technical Performance
- Ad load time: < 1s
- Error rate: < 1% (failed ad loads)
- Console errors: 0 (no broken scripts)

---

## Maintenance & Monitoring

### Daily
- Check AdSense dashboard for policy violations
- Monitor error logs for ad script failures

### Weekly
- Review Core Web Vitals in Google Search Console
- Analyze A/B test results (if active)
- Check consent rates and opt-out trends

### Monthly
- Audit ad placements for UX impact
- Review RPM trends and optimize
- Update ad network integrations if needed
- Test new ad formats/positions

---

## File Structure

```
shared/
└── ad-manager/
    ├── core/
    │   ├── AdManager.ts          # Main orchestration
    │   ├── AdLoader.ts            # Async script loading
    │   └── types.ts               # TypeScript interfaces
    ├── containers/
    │   ├── InFeedAd.tsx           # Native in-content ads
    │   ├── SidebarAd.tsx          # Desktop sidebar
    │   ├── AnchorAd.tsx           # Mobile sticky bottom
    │   └── AdContainer.tsx        # Base container component
    ├── consent/
    │   ├── ConsentManager.ts      # GDPR/CCPA logic
    │   ├── ConsentBanner.tsx      # UI component
    │   └── vendors.json           # IAB vendor list
    ├── testing/
    │   ├── ABTestManager.ts       # Test orchestration
    │   ├── VariantAssigner.ts     # User bucketing
    │   └── tests.json             # Active tests config
    ├── analytics/
    │   ├── PerformanceMonitor.ts  # CLS, LCP tracking
    │   ├── AdAnalytics.ts         # CTR, RPM tracking
    │   └── reporter.ts            # Data aggregation
    └── utils/
        ├── lazy-load.ts           # Intersection Observer
        ├── consent-storage.ts     # Cookie/localStorage
        └── hash.ts                # User ID hashing
```

---

## Next Steps

1. **Implement Core Module** - Start with `AdManager.ts` and `AdContainer.tsx`
2. **Build Consent UI** - GDPR-compliant banner with vendor list
3. **Create Test Environment** - Local dev mode for ad containers (no real ads)
4. **Deploy Phase 1** - Single ad on landing page with monitoring
5. **Iterate & Optimize** - Data-driven improvements based on metrics

---

## References

- [Google AdSense Best Practices](https://support.google.com/adsense/answer/17957)
- [IAB Europe TCF 2.2](https://iabeurope.eu/tcf-2-0/)
- [Web Vitals Guide](https://web.dev/vitals/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
