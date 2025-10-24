/**
 * Lazy loading utility using Intersection Observer
 * Loads ads only when they enter viewport (with configurable margin)
 */

export interface LazyLoadOptions {
  rootMargin?: string; // e.g., '500px' to load 500px before entering viewport
  threshold?: number; // 0-1, how much of element must be visible
  onIntersect: (element: HTMLElement) => void; // Callback when element enters viewport
}

export class LazyLoader {
  private observer: IntersectionObserver | null = null;
  private observedElements: WeakMap<HTMLElement, boolean> = new WeakMap();

  constructor(private options: LazyLoadOptions) {
    // Only create observer if IntersectionObserver is supported
    if ('IntersectionObserver' in window) {
      this.observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const element = entry.target as HTMLElement;

              // Only trigger once per element
              if (!this.observedElements.get(element)) {
                this.observedElements.set(element, true);
                this.options.onIntersect(element);

                // Stop observing after triggered
                this.observer?.unobserve(element);
              }
            }
          });
        },
        {
          rootMargin: options.rootMargin || '500px',
          threshold: options.threshold || 0.01
        }
      );
    }
  }

  /**
   * Start observing an element
   * @param element Element to observe
   */
  observe(element: HTMLElement): void {
    if (!this.observer) {
      // Fallback: immediately call callback if IntersectionObserver not supported
      this.options.onIntersect(element);
      return;
    }

    // Check if already observed/triggered
    if (this.observedElements.has(element)) {
      return;
    }

    this.observer.observe(element);
  }

  /**
   * Stop observing an element
   * @param element Element to stop observing
   */
  unobserve(element: HTMLElement): void {
    this.observer?.unobserve(element);
  }

  /**
   * Disconnect observer (cleanup)
   */
  disconnect(): void {
    this.observer?.disconnect();
    this.observer = null;
  }
}

/**
 * Create a lazy loader for ads
 * @param onLoad Callback when ad enters viewport
 * @param rootMargin Distance before viewport to start loading (default: 500px)
 */
export function createAdLazyLoader(
  onLoad: (element: HTMLElement) => void,
  rootMargin: string = '500px'
): LazyLoader {
  return new LazyLoader({
    rootMargin,
    threshold: 0.01,
    onIntersect: onLoad
  });
}
