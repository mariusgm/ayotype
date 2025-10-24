/**
 * Consent storage utilities
 * Handles persistence of user consent preferences (GDPR/CCPA compliant)
 */

import type { ConsentPreferences, ConsentState } from '../core/types';

const CONSENT_KEY = 'ayotype_ad_consent';
const CONSENT_VERSION = '1.0';
const CONSENT_DURATION = 365 * 24 * 60 * 60 * 1000; // 365 days in ms

/**
 * Save consent preferences
 * @param preferences Consent preferences
 */
export function saveConsent(preferences: Partial<ConsentPreferences>): void {
  const fullPreferences: ConsentPreferences = {
    state: preferences.state || 'unknown',
    advertising: preferences.advertising ?? false,
    analytics: preferences.analytics ?? false,
    personalization: preferences.personalization ?? false,
    timestamp: Date.now(),
    version: CONSENT_VERSION
  };

  try {
    // Save to localStorage
    localStorage.setItem(CONSENT_KEY, JSON.stringify(fullPreferences));

    // Also save to cookie for server-side access
    const expiryDate = new Date(Date.now() + CONSENT_DURATION);
    document.cookie = `${CONSENT_KEY}=${encodeURIComponent(
      JSON.stringify(fullPreferences)
    )}; expires=${expiryDate.toUTCString()}; path=/; SameSite=Lax`;

    console.log('[ConsentStorage] Saved consent:', fullPreferences);
  } catch (error) {
    console.error('[ConsentStorage] Failed to save consent:', error);
  }
}

/**
 * Load consent preferences
 * @returns Consent preferences or null if not found
 */
export function loadConsent(): ConsentPreferences | null {
  try {
    // Try localStorage first
    const stored = localStorage.getItem(CONSENT_KEY);
    if (stored) {
      const preferences = JSON.parse(stored) as ConsentPreferences;

      // Check if consent is expired (older than 365 days)
      if (Date.now() - preferences.timestamp > CONSENT_DURATION) {
        console.log('[ConsentStorage] Consent expired, clearing');
        clearConsent();
        return null;
      }

      // Check if consent version matches
      if (preferences.version !== CONSENT_VERSION) {
        console.log('[ConsentStorage] Consent version mismatch, clearing');
        clearConsent();
        return null;
      }

      return preferences;
    }

    // Fallback to cookie
    const cookies = document.cookie.split('; ');
    const consentCookie = cookies.find((c) => c.startsWith(`${CONSENT_KEY}=`));
    if (consentCookie) {
      const value = decodeURIComponent(consentCookie.split('=')[1]);
      return JSON.parse(value) as ConsentPreferences;
    }

    return null;
  } catch (error) {
    console.error('[ConsentStorage] Failed to load consent:', error);
    return null;
  }
}

/**
 * Clear consent preferences
 */
export function clearConsent(): void {
  try {
    // Clear localStorage
    localStorage.removeItem(CONSENT_KEY);

    // Clear cookie
    document.cookie = `${CONSENT_KEY}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;

    console.log('[ConsentStorage] Cleared consent');
  } catch (error) {
    console.error('[ConsentStorage] Failed to clear consent:', error);
  }
}

/**
 * Get current consent state
 * @returns Consent state ('granted', 'denied', or 'unknown')
 */
export function getConsentState(): ConsentState {
  const preferences = loadConsent();
  return preferences?.state || 'unknown';
}

/**
 * Check if user has given consent for ads
 * @returns True if user accepted advertising
 */
export function hasAdConsent(): boolean {
  const preferences = loadConsent();
  return preferences?.advertising === true;
}

/**
 * Check if user has given consent for analytics
 * @returns True if user accepted analytics
 */
export function hasAnalyticsConsent(): boolean {
  const preferences = loadConsent();
  return preferences?.analytics === true;
}

/**
 * Check if consent is required based on user location
 * @returns True if consent is required (GDPR/CCPA regions)
 */
export function isConsentRequired(): boolean {
  // In a real implementation, you would check user's location
  // via IP geolocation or accept-language header

  // For now, require consent for everyone (safest approach)
  return true;
}
