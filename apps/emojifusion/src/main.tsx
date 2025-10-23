import React, { Suspense, lazy } from "react";
import { createRoot } from "react-dom/client";
import "./app.css";
import { initializeOptimizers } from "./font-optimizer";

// Lazy load the main app component for better performance
const App = lazy(() => import("./App"));

// Loading component for code splitting
function AppLoadingFallback() {
  return (
    <div className="mobile-container" style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '100vh',
      flexDirection: 'column',
      gap: '1rem'
    }}>
      <div style={{ 
        fontSize: '2rem',
        animation: 'bounce 1s infinite'
      }}>✨</div>
      <div style={{ 
        color: 'var(--text-secondary)',
        fontSize: 'var(--text-sm)'
      }}>Loading EmojiFusion...</div>
    </div>
  );
}

// Enhanced PWA capabilities
class PWAManager {
  private registration: ServiceWorkerRegistration | null = null;

  async init() {
    // Register service worker with enhanced features
    if ('serviceWorker' in navigator) {
      try {
        this.registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
          updateViaCache: 'none'
        });

        console.log('✅ PWA: Service Worker registered');

        // Listen for updates
        this.registration.addEventListener('updatefound', () => {
          console.log('🔄 PWA: Update found, installing...');
          const newWorker = this.registration?.installing;
          
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('🎉 PWA: Update ready');
                this.showUpdateAvailable();
              }
            });
          }
        });

        // Background sync registration
        if ('sync' in window.ServiceWorkerRegistration.prototype) {
          await this.registration.sync.register('api-queue-sync');
        }

      } catch (error) {
        console.error('❌ PWA: Service Worker registration failed:', error);
      }
    }

    // Initialize other PWA features
    this.initInstallPrompt();
    this.initNetworkStatus();
    this.initPerformanceOptimizations();
  }

  private initInstallPrompt() {
    let deferredPrompt: any;

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      
      // Show custom install button
      this.showInstallPrompt(deferredPrompt);
    });

    window.addEventListener('appinstalled', () => {
      console.log('🎉 PWA: App installed!');
      this.hideInstallPrompt();
    });
  }

  private showInstallPrompt(prompt: any) {
    // Create install banner
    const banner = document.createElement('div');
    banner.innerHTML = `
      <div style="
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        background: linear-gradient(135deg, #FF79C6, #FFD94E);
        color: #0a0a0a;
        padding: 12px 16px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        z-index: 10000;
        font-weight: 600;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      ">
        <span>📱 Install EmojiFusion for the best experience!</span>
        <div>
          <button id="install-btn" style="
            background: rgba(10,10,10,0.2);
            border: none;
            color: #0a0a0a;
            padding: 8px 16px;
            border-radius: 20px;
            font-weight: 700;
            margin-right: 8px;
            cursor: pointer;
          ">Install</button>
          <button id="dismiss-btn" style="
            background: none;
            border: none;
            color: #0a0a0a;
            font-size: 18px;
            cursor: pointer;
            padding: 4px;
          ">✕</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(banner);

    // Add event listeners
    banner.querySelector('#install-btn')?.addEventListener('click', async () => {
      prompt.prompt();
      const result = await prompt.userChoice;
      console.log('Install prompt result:', result);
      this.hideInstallPrompt();
    });

    banner.querySelector('#dismiss-btn')?.addEventListener('click', () => {
      this.hideInstallPrompt();
    });
  }

  private hideInstallPrompt() {
    const banner = document.querySelector('[style*="Install EmojiFusion"]')?.parentElement;
    banner?.remove();
  }

  private initNetworkStatus() {
    // Network status handling
    const updateNetworkStatus = () => {
      const isOnline = navigator.onLine;
      const indicator = document.getElementById('network-status');
      
      if (!isOnline && !indicator) {
        const statusBar = document.createElement('div');
        statusBar.id = 'network-status';
        statusBar.innerHTML = `
          <div style="
            position: fixed;
            bottom: 20px;
            left: 20px;
            right: 20px;
            background: #1a1a1a;
            border: 1px solid #333;
            border-radius: 12px;
            padding: 12px 16px;
            color: #f7f7f5;
            text-align: center;
            z-index: 9999;
            font-size: 14px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.5);
          ">
            📱 You're offline - saved combos will sync when reconnected
          </div>
        `;
        document.body.appendChild(statusBar);
      } else if (isOnline && indicator) {
        indicator.remove();
      }
    };

    window.addEventListener('online', updateNetworkStatus);
    window.addEventListener('offline', updateNetworkStatus);
    updateNetworkStatus();
  }

  private initPerformanceOptimizations() {
    // Preload critical resources
    this.preloadCriticalResources();
    
    // Memory pressure detection
    this.handleMemoryPressure();
    
    // Performance monitoring
    this.initPerformanceMonitoring();
  }

  private preloadCriticalResources() {
    // Preload emoji metadata
    const emojiMetaLink = document.createElement('link');
    emojiMetaLink.rel = 'preload';
    emojiMetaLink.href = '/src/emoji-meta.json';
    emojiMetaLink.as = 'fetch';
    emojiMetaLink.crossOrigin = 'anonymous';
    document.head.appendChild(emojiMetaLink);

    // Preload critical fonts
    const fontLink = document.createElement('link');
    fontLink.rel = 'preload';
    fontLink.href = 'data:font/woff2;base64,'; // Noto Color Emoji subset would go here
    fontLink.as = 'font';
    fontLink.type = 'font/woff2';
    fontLink.crossOrigin = 'anonymous';
    // document.head.appendChild(fontLink); // Uncomment when font is available
  }

  private handleMemoryPressure() {
    // Detect low memory devices
    const deviceMemory = (navigator as any).deviceMemory;
    const hardwareConcurrency = navigator.hardwareConcurrency;
    
    if (deviceMemory && deviceMemory < 4) {
      console.log('🔧 PWA: Low memory device detected, enabling optimizations');
      document.body.classList.add('low-memory');
      
      // Reduce animation complexity
      document.documentElement.style.setProperty('--animation-duration', '0.1s');
    }

    // Memory pressure API (experimental)
    if ('memory' in performance) {
      const memoryInfo = (performance as any).memory;
      if (memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit > 0.8) {
        console.log('⚠️ PWA: High memory usage detected');
        // Trigger garbage collection hints
        if ('gc' in window) {
          (window as any).gc();
        }
      }
    }
  }

  private initPerformanceMonitoring() {
    // Core Web Vitals monitoring
    if ('web-vitals' in window) {
      // This would integrate with web-vitals library
      console.log('📊 PWA: Performance monitoring initialized');
    }

    // Time to Interactive tracking
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming;
            console.log('📈 PWA: TTI:', navEntry.loadEventEnd - navEntry.fetchStart);
          }
        }
      });
      
      observer.observe({ entryTypes: ['navigation'] });
    }
  }

  private showUpdateAvailable() {
    const updateBanner = document.createElement('div');
    updateBanner.innerHTML = `
      <div style="
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        background: linear-gradient(135deg, #67e8f9, #FFD94E);
        color: #0a0a0a;
        padding: 12px 16px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        z-index: 10001;
        font-weight: 600;
        animation: slideDown 0.3s ease-out;
      ">
        <span>🎉 New version available!</span>
        <button id="update-btn" style="
          background: rgba(10,10,10,0.2);
          border: none;
          color: #0a0a0a;
          padding: 8px 16px;
          border-radius: 20px;
          font-weight: 700;
          cursor: pointer;
        ">Update Now</button>
      </div>
    `;

    document.body.appendChild(updateBanner);

    updateBanner.querySelector('#update-btn')?.addEventListener('click', () => {
      window.location.reload();
    });

    // Auto-dismiss after 10 seconds
    setTimeout(() => {
      updateBanner.remove();
    }, 10000);
  }
}

// Initialize PWA
const pwaManager = new PWAManager();

// Enhanced app initialization
async function initApp() {
  try {
    // Add performance mark
    performance.mark('app-init-start');
    
    // Initialize optimizers in parallel with PWA
    const [, ] = await Promise.all([
      pwaManager.init(),
      initializeOptimizers()
    ]);
    
    // Render the app with Suspense for code splitting
    const root = createRoot(document.getElementById("root")!);
    root.render(
      <Suspense fallback={<AppLoadingFallback />}>
        <App />
      </Suspense>
    );
    
    // Performance measurement
    performance.mark('app-init-end');
    performance.measure('app-init-duration', 'app-init-start', 'app-init-end');
    
    const initDuration = performance.getEntriesByName('app-init-duration')[0]?.duration;
    console.log(`🚀 EmojiFusion Mobile initialized in ${initDuration?.toFixed(2)}ms`);
    
    // Check performance budget after initialization
    setTimeout(() => {
      const perfMonitor = (window as any).emojiFusionOptimizers?.performanceMonitor;
      if (perfMonitor) {
        perfMonitor.checkPerformanceBudget();
      }
    }, 3000);
    
  } catch (error) {
    console.error('❌ App initialization failed:', error);
    
    // Fallback: render basic app
    const root = createRoot(document.getElementById("root")!);
    root.render(
      <Suspense fallback={<AppLoadingFallback />}>
        <App />
      </Suspense>
    );
  }
}

// Start the app
initApp();