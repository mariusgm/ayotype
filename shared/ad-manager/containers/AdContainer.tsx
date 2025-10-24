/**
 * AdContainer - Base React component for all ad placements
 * Handles lazy loading, accessibility, and responsive sizing
 */

import React, { useEffect, useRef, useState } from 'react';
import type { AdSlot, AdManagerConfig } from '../core/types';
import { AdManager } from '../core/AdManager';
import { createAdLazyLoader } from '../utils/lazy-load';

export interface AdContainerProps {
  slot: AdSlot;
  adManager: AdManager;
  className?: string;
  style?: React.CSSProperties;
}

export const AdContainer: React.FC<AdContainerProps> = ({
  slot,
  adManager,
  className = '',
  style = {}
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;

    // Register slot with ad manager
    adManager.registerSlot(slot);

    // Handle lazy loading
    if (slot.lazyLoad) {
      const lazyLoader = createAdLazyLoader((element) => {
        loadAd(element);
      });

      lazyLoader.observe(container);

      return () => {
        lazyLoader.disconnect();
      };
    } else {
      // Load immediately if not lazy
      loadAd(container);
    }
  }, [slot.id]);

  const loadAd = async (element: HTMLElement) => {
    try {
      await adManager.loadAd(slot.id, element);
      setLoaded(true);
    } catch (err) {
      setError((err as Error).message);
      console.error(`[AdContainer] Failed to load ad ${slot.id}:`, err);
    }
  };

  // Check viewport constraints
  const shouldRender = (): boolean => {
    if (typeof window === 'undefined') return false;

    const width = window.innerWidth;

    if (slot.minViewportWidth && width < slot.minViewportWidth) {
      return false;
    }

    if (slot.maxViewportWidth && width > slot.maxViewportWidth) {
      return false;
    }

    return true;
  };

  if (!shouldRender()) {
    return null;
  }

  // Calculate aspect ratio from first size
  const firstSize = slot.sizes[0];
  const aspectRatio = firstSize ? `${firstSize.width} / ${firstSize.height}` : 'auto';

  return (
    <div
      ref={containerRef}
      className={`ad-container ad-container--${slot.position} ${className}`}
      data-ad-id={slot.id}
      data-ad-position={slot.position}
      data-ad-format={slot.format}
      role="complementary"
      aria-label="Advertisement"
      style={{
        aspectRatio,
        minHeight: firstSize?.height ? `${firstSize.height}px` : undefined,
        background: '#f8f9fa',
        border: '1px solid #e9ecef',
        borderRadius: '4px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        position: 'relative',
        ...style
      }}
    >
      {/* Ad label for transparency */}
      <div
        style={{
          position: 'absolute',
          top: '4px',
          right: '4px',
          fontSize: '10px',
          color: '#6c757d',
          textTransform: 'uppercase',
          fontFamily: 'system-ui, sans-serif',
          background: 'rgba(255, 255, 255, 0.8)',
          padding: '2px 6px',
          borderRadius: '2px',
          pointerEvents: 'none',
          zIndex: 1
        }}
      >
        Ad
      </div>

      {/* Error state */}
      {error && (
        <div
          style={{
            padding: '20px',
            textAlign: 'center',
            color: '#dc3545',
            fontSize: '12px'
          }}
        >
          ⚠️ Ad failed to load
        </div>
      )}

      {/* Loading state */}
      {!loaded && !error && (
        <div
          style={{
            padding: '20px',
            textAlign: 'center',
            color: '#6c757d',
            fontSize: '12px'
          }}
        >
          Loading ad...
        </div>
      )}
    </div>
  );
};

// Skip link for accessibility (keyboard navigation)
export const AdSkipLink: React.FC<{ targetId: string }> = ({ targetId }) => (
  <a
    href={`#${targetId}`}
    style={{
      position: 'absolute',
      left: '-9999px',
      zIndex: 999,
      padding: '8px',
      background: '#000',
      color: '#fff',
      textDecoration: 'none',
      borderRadius: '4px'
    }}
    onFocus={(e) => {
      e.currentTarget.style.left = '10px';
      e.currentTarget.style.top = '10px';
    }}
    onBlur={(e) => {
      e.currentTarget.style.left = '-9999px';
    }}
  >
    Skip advertisement
  </a>
);
