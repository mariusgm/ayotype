/**
 * AdLoader - Asynchronous ad script loading with performance optimization
 * Prevents render blocking and manages script lifecycle
 */

export class AdLoader {
  private loadedScripts: Set<string> = new Set();
  private pendingScripts: Map<string, Promise<void>> = new Map();

  /**
   * Load external ad script asynchronously
   * @param src Script URL
   * @param attributes Optional attributes (async, defer, etc.)
   * @returns Promise that resolves when script is loaded
   */
  async loadScript(
    src: string,
    attributes: Record<string, string> = {}
  ): Promise<void> {
    // Return existing promise if script is already loading
    if (this.pendingScripts.has(src)) {
      return this.pendingScripts.get(src)!;
    }

    // Return immediately if script is already loaded
    if (this.loadedScripts.has(src)) {
      return Promise.resolve();
    }

    // Create new loading promise
    const loadPromise = new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.async = true; // Non-blocking by default

      // Add custom attributes
      Object.entries(attributes).forEach(([key, value]) => {
        script.setAttribute(key, value);
      });

      script.onload = () => {
        this.loadedScripts.add(src);
        this.pendingScripts.delete(src);
        resolve();
      };

      script.onerror = () => {
        this.pendingScripts.delete(src);
        reject(new Error(`Failed to load script: ${src}`));
      };

      // Append to head (preferred over body for ad scripts)
      document.head.appendChild(script);
    });

    this.pendingScripts.set(src, loadPromise);
    return loadPromise;
  }

  /**
   * Load Google AdSense
   * @param publisherId Google AdSense publisher ID
   */
  async loadAdSense(publisherId: string): Promise<void> {
    const src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${publisherId}`;

    await this.loadScript(src, {
      'data-ad-client': publisherId,
      'crossorigin': 'anonymous'
    });

    // Initialize adsbygoogle array if not exists
    (window as any).adsbygoogle = (window as any).adsbygoogle || [];
  }

  /**
   * Load script only when browser is idle (requestIdleCallback)
   * Falls back to setTimeout if requestIdleCallback not supported
   * @param src Script URL
   * @param timeout Max wait time before forcing load (ms)
   */
  async loadWhenIdle(src: string, timeout: number = 2000): Promise<void> {
    return new Promise((resolve, reject) => {
      const load = () => {
        this.loadScript(src).then(resolve).catch(reject);
      };

      if ('requestIdleCallback' in window) {
        requestIdleCallback(load, { timeout });
      } else {
        setTimeout(load, 0);
      }
    });
  }

  /**
   * Preload script (hint browser to fetch but not execute)
   * Useful for ads that will load soon
   * @param src Script URL
   */
  preloadScript(src: string): void {
    if (document.querySelector(`link[rel="preload"][href="${src}"]`)) {
      return; // Already preloaded
    }

    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'script';
    link.href = src;
    document.head.appendChild(link);
  }

  /**
   * Remove loaded script (cleanup)
   * @param src Script URL
   */
  unloadScript(src: string): void {
    const script = document.querySelector(`script[src="${src}"]`);
    if (script) {
      script.remove();
      this.loadedScripts.delete(src);
    }
  }

  /**
   * Check if script is loaded
   * @param src Script URL
   */
  isLoaded(src: string): boolean {
    return this.loadedScripts.has(src);
  }
}

// Singleton instance
export const adLoader = new AdLoader();
