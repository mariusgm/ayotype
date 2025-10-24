/**
 * AnchorAd - Mobile sticky bottom ad
 * Dismissible, non-intrusive placement
 */

import React, { useState } from 'react';
import { AdContainer } from './AdContainer';
import { AdManager } from '../core/AdManager';

export interface AnchorAdProps {
  adManager: AdManager;
  dismissible?: boolean; // Allow user to close ad
  className?: string;
}

export const AnchorAd: React.FC<AnchorAdProps> = ({
  adManager,
  dismissible = true,
  className = ''
}) => {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) {
    return null;
  }

  const slot = {
    id: 'anchor-ad-1',
    position: 'anchor' as const,
    format: 'display' as const,
    sizes: [{ width: 320, height: 50, label: 'Mobile Banner' }],
    lazyLoad: false, // Load immediately for anchor ads
    priority: 1, // High priority (loads first)
    maxViewportWidth: 767 // Mobile only
  };

  return (
    <div className={`anchor-ad-wrapper ${className}`}>
      <div className="anchor-ad-container">
        {dismissible && (
          <button
            className="anchor-ad-close"
            onClick={() => setDismissed(true)}
            aria-label="Close advertisement"
            type="button"
          >
            ✕
          </button>
        )}
        <AdContainer
          slot={slot}
          adManager={adManager}
          style={{
            width: '100%',
            maxWidth: '320px',
            margin: '0 auto'
          }}
        />
      </div>
      <style jsx>{`
        .anchor-ad-wrapper {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          z-index: 1000;
          background: #fff;
          box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
          padding: 8px;
          display: none; /* Hidden by default */
        }

        /* Show only on mobile */
        @media (max-width: 767px) {
          .anchor-ad-wrapper {
            display: block;
          }
        }

        .anchor-ad-container {
          position: relative;
          width: 100%;
          max-width: 320px;
          margin: 0 auto;
        }

        .anchor-ad-close {
          position: absolute;
          top: -4px;
          right: -4px;
          background: #000;
          color: #fff;
          border: none;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 14px;
          line-height: 1;
          z-index: 2;
          transition: background 0.2s;
        }

        .anchor-ad-close:hover {
          background: #333;
        }

        .anchor-ad-close:focus {
          outline: 2px solid #0066cc;
          outline-offset: 2px;
        }

        /* Prevent CLS by reserving space */
        .anchor-ad-wrapper::before {
          content: '';
          display: block;
          height: 58px; /* 50px ad + 8px padding */
        }

        /* Accessibility: Reduced motion */
        @media (prefers-reduced-motion: reduce) {
          .anchor-ad-wrapper {
            transition: none !important;
          }
        }
      `}</style>
    </div>
  );
};
