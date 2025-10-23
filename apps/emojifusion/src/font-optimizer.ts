// Font Optimization and Performance Manager for EmojiFusion
export class FontOptimizer {
  private static instance: FontOptimizer;
  private fontsLoaded = new Set<string>();
  private loadingPromises = new Map<string, Promise<void>>();

  static getInstance(): FontOptimizer {
    if (!FontOptimizer.instance) {
      FontOptimizer.instance = new FontOptimizer();
    }
    return FontOptimizer.instance;
  }

  async init() {
    // Check font loading API support
    if ('fonts' in document) {
      document.fonts.addEventListener('loadingdone', (event) => {
        console.log('📝 Fonts loaded:', event.fontfaces.map(f => f.family));
      });
    }

    // Preload critical system fonts
    await this.preloadSystemFonts();
    
    // Load emoji fonts on demand
    this.setupEmojiFont();
  }

  private async preloadSystemFonts() {
    const criticalFonts = [
      'system-ui',
      '-apple-system',
      'Segoe UI',
      'Roboto'
    ];

    // Create font face for better control
    const systemFont = new FontFace(
      'SystemUI',
      'local("system-ui"), local("-apple-system"), local("Segoe UI"), local("Roboto")',
      {
        display: 'swap',
        weight: '100 900'
      }
    );

    try {
      await systemFont.load();
      document.fonts.add(systemFont);
      this.fontsLoaded.add('SystemUI');
      console.log('✅ System fonts preloaded');
    } catch (error) {
      console.warn('⚠️ System font preload failed:', error);
    }
  }

  private setupEmojiFont() {
    // Create optimized emoji font with subsetting
    const emojiFont = `
      @font-face {
        font-family: 'NotoColorEmoji';
        src: url('data:font/woff2;base64,') format('woff2');
        font-display: optional;
        unicode-range: U+1F600-1F64F, U+1F300-1F5FF, U+1F680-1F6FF, U+1F1E0-1F1FF;
      }
    `;

    // Only load if emojis are needed
    const style = document.createElement('style');
    style.textContent = emojiFont;
    document.head.appendChild(style);
  }

  async loadAsciiFont(): Promise<void> {
    if (this.fontsLoaded.has('ASCII')) {
      return;
    }

    if (this.loadingPromises.has('ASCII')) {
      return this.loadingPromises.get('ASCII')!;
    }

    const loadPromise = this.loadAsciiFontInternal();
    this.loadingPromises.set('ASCII', loadPromise);
    
    try {
      await loadPromise;
      this.fontsLoaded.add('ASCII');
    } catch (error) {
      console.warn('⚠️ ASCII font load failed:', error);
    }
    
    return loadPromise;
  }

  private async loadAsciiFontInternal(): Promise<void> {
    // Create monospace font for ASCII art
    const asciiFont = new FontFace(
      'ASCIIMono',
      'local("ui-monospace"), local("SFMono-Regular"), local("Menlo"), local("Monaco"), local("Consolas")',
      {
        display: 'swap',
        weight: 'normal',
        style: 'normal'
      }
    );

    await asciiFont.load();
    document.fonts.add(asciiFont);
    console.log('✅ ASCII font loaded');
  }

  // Font loading with fallback
  async ensureFont(fontFamily: string): Promise<boolean> {
    if (!('fonts' in document)) {
      return true; // Assume loaded on older browsers
    }

    try {
      await document.fonts.load(`16px ${fontFamily}`);
      return document.fonts.check(`16px ${fontFamily}`);
    } catch (error) {
      console.warn(`⚠️ Font check failed for ${fontFamily}:`, error);
      return false;
    }
  }

  // Get optimal font stack based on capabilities
  getOptimalFontStack(type: 'ui' | 'emoji' | 'mono' = 'ui'): string {
    switch (type) {
      case 'emoji':
        return this.fontsLoaded.has('NotoColorEmoji') 
          ? 'NotoColorEmoji, Apple Color Emoji, Segoe UI Emoji, system-ui'
          : 'Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, system-ui';
      
      case 'mono':
        return this.fontsLoaded.has('ASCIIMono')
          ? 'ASCIIMono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace'
          : 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, Courier New, monospace';
      
      case 'ui':
      default:
        return this.fontsLoaded.has('SystemUI')
          ? 'SystemUI, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif'
          : 'system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen, Ubuntu, Cantarell, sans-serif';
    }
  }
}

// Performance monitoring utilities
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics = new Map<string, number>();

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  init() {
    // Core Web Vitals tracking
    this.trackWebVitals();
    
    // Custom metrics
    this.trackCustomMetrics();
    
    // Memory monitoring
    this.monitorMemory();
  }

  private trackWebVitals() {
    // LCP (Largest Contentful Paint)
    if ('PerformanceObserver' in window) {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.metrics.set('LCP', lastEntry.startTime);
        console.log('📊 LCP:', lastEntry.startTime.toFixed(2), 'ms');
      });
      
      try {
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      } catch (e) {
        console.warn('LCP observation not supported');
      }

      // FID (First Input Delay)
      const fidObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.metrics.set('FID', (entry as any).processingStart - entry.startTime);
          console.log('📊 FID:', ((entry as any).processingStart - entry.startTime).toFixed(2), 'ms');
        }
      });
      
      try {
        fidObserver.observe({ entryTypes: ['first-input'] });
      } catch (e) {
        console.warn('FID observation not supported');
      }

      // CLS (Cumulative Layout Shift)
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
          }
        }
        this.metrics.set('CLS', clsValue);
        console.log('📊 CLS:', clsValue.toFixed(4));
      });
      
      try {
        clsObserver.observe({ entryTypes: ['layout-shift'] });
      } catch (e) {
        console.warn('CLS observation not supported');
      }
    }
  }

  private trackCustomMetrics() {
    // Time to Interactive
    this.measureTTI();
    
    // Generation latency
    this.setupGenerationTracking();
  }

  private measureTTI() {
    const ttiStartTime = performance.now();
    
    const checkInteractive = () => {
      const now = performance.now();
      
      // Check if main thread is idle
      if (this.isMainThreadIdle()) {
        const tti = now - ttiStartTime;
        this.metrics.set('TTI', tti);
        console.log('📊 TTI:', tti.toFixed(2), 'ms');
      } else {
        // Check again in 100ms
        setTimeout(checkInteractive, 100);
      }
    };

    // Start checking after initial load
    setTimeout(checkInteractive, 1000);
  }

  private isMainThreadIdle(): boolean {
    // Simplified idle detection
    const taskStartTime = performance.now();
    const endTime = taskStartTime + 5; // 5ms budget
    
    while (performance.now() < endTime) {
      // Busy wait to test main thread
    }
    
    return performance.now() - taskStartTime < 10; // Allow some overhead
  }

  private setupGenerationTracking() {
    // Track generation performance
    window.addEventListener('generation-start', () => {
      performance.mark('generation-start');
    });

    window.addEventListener('generation-complete', () => {
      performance.mark('generation-end');
      performance.measure('generation-duration', 'generation-start', 'generation-end');
      
      const measure = performance.getEntriesByName('generation-duration')[0];
      this.metrics.set('GenerationTime', measure.duration);
      console.log('📊 Generation:', measure.duration.toFixed(2), 'ms');
    });
  }

  private monitorMemory() {
    if ('memory' in performance) {
      setInterval(() => {
        const memInfo = (performance as any).memory;
        const memoryUsage = memInfo.usedJSHeapSize / memInfo.jsHeapSizeLimit;
        
        this.metrics.set('MemoryUsage', memoryUsage);
        
        if (memoryUsage > 0.8) {
          console.warn('⚠️ High memory usage:', (memoryUsage * 100).toFixed(1), '%');
          
          // Trigger cleanup
          this.triggerCleanup();
        }
      }, 30000); // Check every 30 seconds
    }
  }

  private triggerCleanup() {
    // Clear old performance entries
    performance.clearMarks();
    performance.clearMeasures();
    
    // Clear caches if possible
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'CLEAN_CACHE'
      });
    }

    // Force garbage collection if available
    if ('gc' in window) {
      (window as any).gc();
    }
  }

  getMetrics(): Record<string, number> {
    return Object.fromEntries(this.metrics.entries());
  }

  // Performance budget alerts
  checkPerformanceBudget() {
    const lcp = this.metrics.get('LCP') || 0;
    const fid = this.metrics.get('FID') || 0;
    const cls = this.metrics.get('CLS') || 0;
    const tti = this.metrics.get('TTI') || 0;

    const alerts = [];

    if (lcp > 2500) alerts.push(`LCP: ${lcp.toFixed(0)}ms (target: <2500ms)`);
    if (fid > 100) alerts.push(`FID: ${fid.toFixed(0)}ms (target: <100ms)`);
    if (cls > 0.1) alerts.push(`CLS: ${cls.toFixed(3)} (target: <0.1)`);
    if (tti > 1800) alerts.push(`TTI: ${tti.toFixed(0)}ms (target: <1800ms)`);

    if (alerts.length > 0) {
      console.warn('⚠️ Performance budget exceeded:', alerts);
    } else {
      console.log('✅ Performance budget met');
    }

    return alerts;
  }
}

// Network optimization utilities
export class NetworkOptimizer {
  private requestQueue: Array<() => Promise<any>> = [];
  private isProcessing = false;
  private debounceTimers = new Map<string, NodeJS.Timeout>();

  async init() {
    // Setup connection monitoring
    this.monitorConnection();
    
    // Process request queue
    this.processQueue();
  }

  private monitorConnection() {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      
      console.log('📡 Connection:', {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt
      });

      // Adjust strategy based on connection
      if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
        console.log('🐌 Slow connection detected, enabling optimizations');
        document.body.classList.add('slow-connection');
      }
    }
  }

  // Debounced API calls
  debounceRequest(key: string, fn: () => Promise<any>, delay = 300): Promise<any> {
    return new Promise((resolve, reject) => {
      // Clear existing timer
      if (this.debounceTimers.has(key)) {
        clearTimeout(this.debounceTimers.get(key)!);
      }

      // Set new timer
      const timer = setTimeout(async () => {
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          this.debounceTimers.delete(key);
        }
      }, delay);

      this.debounceTimers.set(key, timer);
    });
  }

  // Queue requests for offline handling
  queueRequest(requestFn: () => Promise<any>) {
    this.requestQueue.push(requestFn);
    this.processQueue();
  }

  private async processQueue() {
    if (this.isProcessing || this.requestQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.requestQueue.length > 0) {
      const requestFn = this.requestQueue.shift()!;
      
      try {
        await requestFn();
      } catch (error) {
        console.error('Queued request failed:', error);
        // Re-queue if offline
        if (!navigator.onLine) {
          this.requestQueue.unshift(requestFn);
          break;
        }
      }

      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    this.isProcessing = false;
  }
}

// Initialize all optimizers
export async function initializeOptimizers() {
  const fontOptimizer = FontOptimizer.getInstance();
  const performanceMonitor = PerformanceMonitor.getInstance();
  const networkOptimizer = new NetworkOptimizer();

  await Promise.all([
    fontOptimizer.init(),
    performanceMonitor.init(),
    networkOptimizer.init()
  ]);

  console.log('🚀 All optimizers initialized');

  // Make available globally for debugging
  (window as any).emojiFusionOptimizers = {
    fontOptimizer,
    performanceMonitor,
    networkOptimizer
  };
}