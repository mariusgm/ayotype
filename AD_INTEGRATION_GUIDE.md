# Ad Integration Quick Start Guide

## Setup (5 minutes)

### 1. Initialize Ad Manager

```typescript
// In your app's entry point (e.g., main.tsx, App.tsx)
import { AdManager, consentManager, ConsentBanner } from '@/shared/ad-manager';

const adManager = new AdManager({
  publisherId: 'pub-9365314553407219', // Your Google AdSense ID
  testMode: process.env.NODE_ENV === 'development', // Show placeholders in dev
  consentRequired: true, // Require GDPR consent
  lazyLoadThreshold: 500, // Load ads 500px before viewport
  performanceBudget: {
    maxCLS: 0.05,
    maxLCPDelay: 200,
    maxBundleSize: 51200 // 50KB
  },
  abTesting: {
    enabled: true,
    userIdKey: 'ayotype_user_id'
  }
});

// Initialize on page load
if (document.readyState === 'complete') {
  adManager.init();
} else {
  window.addEventListener('load', () => {
    requestIdleCallback(() => adManager.init(), { timeout: 2000 });
  });
}
```

### 2. Add Consent Banner

```tsx
// In your root App component
import { ConsentBanner } from '@/shared/ad-manager';

export function App() {
  return (
    <>
      <ConsentBanner
        position="bottom"
        privacyPolicyUrl="/privacy"
      />

      {/* Your app content */}
    </>
  );
}
```

### 3. Add Ads to Your Pages

#### Landing Page Example

```tsx
import { SidebarAd, InFeedAd } from '@/shared/ad-manager';

export function LandingPage() {
  return (
    <div className="landing-page">
      <header>...</header>

      <main className="content-grid">
        <article className="main-content">
          <section>Hero content...</section>

          {/* In-feed ad after hero */}
          <InFeedAd adManager={adManager} adNumber={1} />

          <section>More content...</section>
        </article>

        <aside className="sidebar">
          {/* Sidebar ad (desktop only) */}
          <SidebarAd adManager={adManager} sticky={true} />
        </aside>
      </main>

      <footer>...</footer>
    </div>
  );
}
```

#### Mobile App Example

```tsx
import { AnchorAd, InFeedAd } from '@/shared/ad-manager';

export function MobileApp() {
  return (
    <>
      <div className="app-content">
        <header>...</header>

        {/* Results list */}
        {results.map((result, index) => (
          <div key={result.id}>
            <ResultCard data={result} />

            {/* Show ad after every 10 results */}
            {(index + 1) % 10 === 0 && (
              <InFeedAd
                adManager={adManager}
                adNumber={Math.floor(index / 10) + 1}
              />
            )}
          </div>
        ))}
      </div>

      {/* Mobile sticky bottom ad */}
      <AnchorAd adManager={adManager} dismissible={true} />
    </>
  );
}
```

## A/B Testing

### Setup a Test

```typescript
import { ABTestManager } from '@/shared/ad-manager';

const abTestManager = new ABTestManager();

// Register test
abTestManager.registerTest({
  id: 'sidebar_test_2025_10',
  name: 'Landing Sidebar Presence',
  variants: [
    { id: 'control', weight: 50, config: { showSidebar: false } },
    { id: 'treatment', weight: 50, config: { showSidebar: true } }
  ],
  metrics: ['ctr', 'bounce_rate', 'time_on_page', 'rpm'],
  startDate: '2025-10-25T00:00:00Z',
  endDate: '2025-11-25T23:59:59Z',
  active: true
});

// Get variant for user
const variant = abTestManager.getVariant('sidebar_test_2025_10');
const showSidebar = variant?.config.showSidebar ?? false;

// Render conditionally
{showSidebar && <SidebarAd adManager={adManager} />}

// Track metrics
abTestManager.trackMetric('sidebar_test_2025_10', 'ctr', 0.85);
```

## Monitoring Performance

### Track CLS Impact

```typescript
import { adManager } from './your-ad-config';

// Listen for ad events
adManager.on('ad-loaded', (event) => {
  console.log('Ad loaded:', event.adId, event.position);

  // Measure CLS after ad loads
  measureCLS((clsValue) => {
    if (clsValue > 0.1) {
      console.warn('High CLS detected after ad load:', clsValue);
    }
  });
});

adManager.on('ad-error', (event) => {
  console.error('Ad failed to load:', event.adId, event.data);
  // Track error in analytics
});
```

### Core Web Vitals Integration

```typescript
import { getCLS, getLCP, getFID } from 'web-vitals';

getCLS(console.log); // Track Cumulative Layout Shift
getLCP(console.log); // Track Largest Contentful Paint
getFID(console.log); // Track First Input Delay
```

## Consent Management

### Check Consent State

```typescript
import { consentManager } from '@/shared/ad-manager';

// Check if user has granted ad consent
if (consentManager.hasAdConsent()) {
  // Load ads
} else {
  // Show placeholder or hide ads
}

// Listen for consent changes
consentManager.onChange((state) => {
  console.log('Consent state changed:', state);

  if (state === 'granted') {
    adManager.init(); // Initialize ads after consent
  }
});
```

### Programmatic Consent Control

```typescript
// Accept all
consentManager.acceptAll();

// Reject all
consentManager.rejectAll();

// Custom preferences
consentManager.setPreferences({
  state: 'partial',
  advertising: true,
  analytics: false,
  personalization: true
});

// Revoke consent (GDPR right to be forgotten)
consentManager.revokeConsent();
```

## Troubleshooting

### Ads Not Showing

1. **Check test mode**: Set `testMode: false` in production
2. **Verify consent**: Ensure user has granted ad consent
3. **Check console**: Look for AdManager initialization logs
4. **Verify ads.txt**: Ensure `https://ayotype.com/ads.txt` is accessible
5. **AdSense approval**: Confirm your AdSense account is approved

### CLS Issues

1. **Check aspect ratios**: Ensure ad containers have proper aspect-ratio CSS
2. **Verify reserved space**: Ad containers should reserve space before loading
3. **Test on slow connections**: Use Chrome DevTools throttling
4. **Monitor CLS**: Use Lighthouse or web-vitals library

### Consent Banner Not Showing

1. **Check state**: `consentManager.shouldShowBanner()` should return `true`
2. **Clear storage**: Delete `ayotype_ad_consent` from localStorage/cookies
3. **Verify import**: Ensure `ConsentBanner` is imported and rendered

## Production Checklist

- [ ] Set `testMode: false` in AdManager config
- [ ] Verify ads.txt is accessible at root domain
- [ ] Test consent banner on first visit
- [ ] Check ad visibility on all breakpoints (mobile/tablet/desktop)
- [ ] Measure Core Web Vitals (CLS < 0.1, LCP < 2.5s)
- [ ] Verify GDPR compliance (consent required before tracking)
- [ ] Test ad loading with slow 3G connection
- [ ] Confirm accessibility with screen reader
- [ ] Monitor error rates in production logs
- [ ] Set up A/B tests for optimization

## Resources

- [AD_ARCHITECTURE.md](./AD_ARCHITECTURE.md) - Complete architecture documentation
- [CLAUDE.md](./CLAUDE.md) - Project knowledge base
- [Google AdSense Best Practices](https://support.google.com/adsense/answer/17957)
- [Web Vitals Guide](https://web.dev/vitals/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
