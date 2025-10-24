/**
 * InFeedAd - Native ad that blends with content
 * Responsive sizing based on viewport
 */

import React from 'react';
import { AdContainer } from './AdContainer';
import { AdManager } from '../core/AdManager';

export interface InFeedAdProps {
  adManager: AdManager;
  adNumber?: number; // For multiple in-feed ads (1, 2, 3...)
  className?: string;
}

export const InFeedAd: React.FC<InFeedAdProps> = ({
  adManager,
  adNumber = 1,
  className = ''
}) => {
  const slot = {
    id: `in-feed-ad-${adNumber}`,
    position: 'in-feed' as const,
    format: 'native' as const,
    sizes: [
      // Responsive sizes
      { width: 728, height: 90, label: 'Leaderboard (Desktop)' },
      { width: 468, height: 60, label: 'Banner (Tablet)' },
      { width: 320, height: 100, label: 'Mobile Banner' }
    ],
    lazyLoad: true,
    priority: 3
  };

  return (
    <div className={`in-feed-ad-wrapper ${className}`}>
      <AdContainer
        slot={slot}
        adManager={adManager}
        style={{
          width: '100%',
          maxWidth: '728px',
          margin: '32px auto'
        }}
      />
      <style jsx>{`
        .in-feed-ad-wrapper {
          width: 100%;
          padding: 16px;
          display: flex;
          justify-content: center;
        }

        /* Reduce spacing on mobile */
        @media (max-width: 767px) {
          .in-feed-ad-wrapper {
            padding: 12px 16px;
            margin: 24px 0;
          }
        }

        /* Ensure ad doesn't break layout */
        .in-feed-ad-wrapper > * {
          max-width: 100%;
        }
      `}</style>
    </div>
  );
};
