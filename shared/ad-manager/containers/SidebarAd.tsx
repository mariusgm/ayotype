/**
 * SidebarAd - Desktop sidebar ad placement
 * Standard 300x250 Medium Rectangle or 300x600 Half Page
 */

import React from 'react';
import { AdContainer } from './AdContainer';
import type { AdManagerConfig } from '../core/types';
import { AdManager } from '../core/AdManager';

export interface SidebarAdProps {
  adManager: AdManager;
  className?: string;
  sticky?: boolean; // Whether ad should stick when scrolling
}

export const SidebarAd: React.FC<SidebarAdProps> = ({
  adManager,
  className = '',
  sticky = false
}) => {
  const slot = {
    id: 'sidebar-ad-1',
    position: 'sidebar' as const,
    format: 'display' as const,
    sizes: [
      { width: 300, height: 250, label: 'Medium Rectangle' },
      { width: 300, height: 600, label: 'Half Page' }
    ],
    lazyLoad: true,
    priority: 2,
    minViewportWidth: 1024 // Desktop only
  };

  return (
    <aside className={`sidebar-ad-container ${className}`}>
      <AdContainer
        slot={slot}
        adManager={adManager}
        style={{
          position: sticky ? 'sticky' : 'static',
          top: sticky ? '20px' : undefined,
          maxWidth: '300px',
          margin: '0 auto'
        }}
      />
      <style jsx>{`
        .sidebar-ad-container {
          width: 100%;
          padding: 16px;
        }

        @media (max-width: 1023px) {
          .sidebar-ad-container {
            display: none;
          }
        }

        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
          .sidebar-ad-container * {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>
    </aside>
  );
};
