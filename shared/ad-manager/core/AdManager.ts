/**
 * AdManager - Central orchestration for ad lifecycle
 * Handles initialization, loading, consent, and performance monitoring
 */

import { adLoader } from './AdLoader';
import type {
  AdManagerConfig,
  AdUnit,
  AdSlot,
  AdEvent,
  AdEventType,
  ConsentState
} from './types';

export class AdManager {
  private config: AdManagerConfig;
  private adUnits: Map<string, AdUnit> = new Map();
  private eventListeners: Map<AdEventType, Set<(event: AdEvent) => void>> = new Map();
  private initialized: boolean = false;
  private consentState: ConsentState = 'unknown';

  constructor(config: AdManagerConfig) {
    this.config = config;
  }

  /**
   * Initialize ad manager (call once on page load)
   */
  async init(): Promise<void> {
    if (this.initialized) {
      console.warn('[AdManager] Already initialized');
      return;
    }

    console.log('[AdManager] Initializing...', {
      testMode: this.config.testMode,
      consentRequired: this.config.consentRequired
    });

    // Check consent state
    if (this.config.consentRequired) {
      await this.checkConsent();

      if (this.consentState === 'denied') {
        console.log('[AdManager] Consent denied, ads disabled');
        this.initialized = true;
        return;
      }

      if (this.consentState === 'unknown') {
        console.log('[AdManager] Waiting for consent...');
        // Don't initialize ads until consent is granted
        return;
      }
    }

    // Load ad scripts (only in production mode)
    if (!this.config.testMode) {
      try {
        await adLoader.loadAdSense(this.config.publisherId);
        console.log('[AdManager] AdSense loaded');
      } catch (error) {
        console.error('[AdManager] Failed to load AdSense:', error);
        this.emit('ad-error', { data: { error } });
      }
    }

    this.initialized = true;
    console.log('[AdManager] Initialized successfully');
  }

  /**
   * Register an ad slot
   * @param slot Ad slot configuration
   */
  registerSlot(slot: AdSlot): void {
    if (this.adUnits.has(slot.id)) {
      console.warn(`[AdManager] Slot ${slot.id} already registered`);
      return;
    }

    const adUnit: AdUnit = {
      slot,
      element: null,
      loaded: false,
      visible: false,
      error: null
    };

    this.adUnits.set(slot.id, adUnit);
    console.log(`[AdManager] Registered slot: ${slot.id}`, slot);
  }

  /**
   * Load ad into a slot
   * @param slotId Ad slot ID
   * @param element Container element
   */
  async loadAd(slotId: string, element: HTMLElement): Promise<void> {
    const adUnit = this.adUnits.get(slotId);

    if (!adUnit) {
      console.error(`[AdManager] Slot ${slotId} not registered`);
      return;
    }

    if (adUnit.loaded) {
      console.warn(`[AdManager] Ad ${slotId} already loaded`);
      return;
    }

    // Check consent
    if (this.config.consentRequired && this.consentState !== 'granted') {
      console.log(`[AdManager] Cannot load ad ${slotId} - no consent`);
      this.renderConsentPlaceholder(element);
      return;
    }

    adUnit.element = element;
    this.emit('ad-requested', { adId: slotId, position: adUnit.slot.position });

    try {
      if (this.config.testMode) {
        // Test mode: show placeholder
        this.renderTestAd(element, adUnit.slot);
      } else {
        // Production mode: load real ad
        await this.loadRealAd(element, adUnit.slot);
      }

      adUnit.loaded = true;
      adUnit.error = null;
      this.emit('ad-loaded', { adId: slotId, position: adUnit.slot.position });

      console.log(`[AdManager] Ad loaded: ${slotId}`);
    } catch (error) {
      adUnit.error = error as Error;
      this.emit('ad-error', { adId: slotId, data: { error } });
      console.error(`[AdManager] Failed to load ad ${slotId}:`, error);

      // Show error placeholder
      this.renderErrorPlaceholder(element);
    }
  }

  /**
   * Load real AdSense ad
   */
  private async loadRealAd(element: HTMLElement, slot: AdSlot): Promise<void> {
    // Create ins element for AdSense
    const ins = document.createElement('ins');
    ins.className = 'adsbygoogle';
    ins.style.display = 'block';
    ins.setAttribute('data-ad-client', this.config.publisherId);
    ins.setAttribute('data-ad-slot', slot.id);
    ins.setAttribute('data-ad-format', slot.format);

    // Add responsive sizing
    if (slot.format === 'responsive') {
      ins.setAttribute('data-full-width-responsive', 'true');
    }

    element.appendChild(ins);

    // Push to adsbygoogle for loading
    try {
      ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
    } catch (error) {
      throw new Error(`AdSense push failed: ${error}`);
    }
  }

  /**
   * Render test ad placeholder
   */
  private renderTestAd(element: HTMLElement, slot: AdSlot): void {
    const placeholder = document.createElement('div');
    placeholder.className = 'ad-test-placeholder';
    placeholder.innerHTML = `
      <div style="
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border: 2px dashed #333;
        border-radius: 8px;
        padding: 20px;
        text-align: center;
        color: white;
        font-family: monospace;
      ">
        <div style="font-size: 12px; opacity: 0.8; margin-bottom: 10px;">TEST MODE</div>
        <div style="font-size: 14px; font-weight: bold;">${slot.position.toUpperCase()} AD</div>
        <div style="font-size: 11px; margin-top: 10px; opacity: 0.7;">
          ${slot.id} | ${slot.format} | ${slot.sizes[0]?.width}x${slot.sizes[0]?.height}
        </div>
      </div>
    `;
    element.appendChild(placeholder);
  }

  /**
   * Render consent placeholder
   */
  private renderConsentPlaceholder(element: HTMLElement): void {
    element.innerHTML = `
      <div style="
        background: #f8f9fa;
        border: 1px solid #dee2e6;
        border-radius: 4px;
        padding: 16px;
        text-align: center;
        color: #6c757d;
        font-size: 13px;
      ">
        <div>📢 Accept cookies to see personalized ads</div>
      </div>
    `;
  }

  /**
   * Render error placeholder
   */
  private renderErrorPlaceholder(element: HTMLElement): void {
    element.innerHTML = `
      <div style="
        background: #fff3cd;
        border: 1px solid #ffc107;
        border-radius: 4px;
        padding: 12px;
        text-align: center;
        color: #856404;
        font-size: 12px;
      ">
        ⚠️ Ad failed to load
      </div>
    `;
  }

  /**
   * Update consent state
   * @param state New consent state
   */
  async updateConsent(state: ConsentState): Promise<void> {
    const previousState = this.consentState;
    this.consentState = state;

    console.log(`[AdManager] Consent updated: ${previousState} → ${state}`);

    if (state === 'granted' && previousState !== 'granted') {
      this.emit('consent-granted', {});

      // Initialize if not already done
      if (!this.initialized) {
        await this.init();
      }
    } else if (state === 'denied') {
      this.emit('consent-denied', {});
      // Remove any loaded ads
      this.adUnits.forEach((unit) => {
        if (unit.element) {
          unit.element.innerHTML = '';
          this.renderConsentPlaceholder(unit.element);
        }
      });
    }
  }

  /**
   * Check current consent state
   */
  private async checkConsent(): Promise<void> {
    // TODO: Integrate with consent manager
    // For now, check localStorage
    const consentData = localStorage.getItem('ad_consent');
    if (consentData) {
      try {
        const { state } = JSON.parse(consentData);
        this.consentState = state;
      } catch {
        this.consentState = 'unknown';
      }
    }
  }

  /**
   * Get current consent state
   */
  getConsentState(): ConsentState {
    return this.consentState;
  }

  /**
   * Get ad unit by ID
   */
  getAdUnit(slotId: string): AdUnit | undefined {
    return this.adUnits.get(slotId);
  }

  /**
   * Add event listener
   */
  on(eventType: AdEventType, callback: (event: AdEvent) => void): void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, new Set());
    }
    this.eventListeners.get(eventType)!.add(callback);
  }

  /**
   * Remove event listener
   */
  off(eventType: AdEventType, callback: (event: AdEvent) => void): void {
    this.eventListeners.get(eventType)?.delete(callback);
  }

  /**
   * Emit event
   */
  private emit(eventType: AdEventType, data: Partial<AdEvent>): void {
    const event: AdEvent = {
      type: eventType,
      timestamp: Date.now(),
      ...data
    };

    this.eventListeners.get(eventType)?.forEach((callback) => {
      try {
        callback(event);
      } catch (error) {
        console.error('[AdManager] Event listener error:', error);
      }
    });
  }

  /**
   * Destroy ad manager (cleanup)
   */
  destroy(): void {
    this.adUnits.forEach((unit) => {
      if (unit.element) {
        unit.element.innerHTML = '';
      }
    });

    this.adUnits.clear();
    this.eventListeners.clear();
    this.initialized = false;

    console.log('[AdManager] Destroyed');
  }
}
