/**
 * ConsentBanner - GDPR/CCPA compliant consent UI
 * Transparent, accessible, and user-friendly
 */

import React, { useState, useEffect } from 'react';
import { consentManager } from './ConsentManager';

export interface ConsentBannerProps {
  position?: 'bottom' | 'top';
  privacyPolicyUrl?: string;
  className?: string;
}

export const ConsentBanner: React.FC<ConsentBannerProps> = ({
  position = 'bottom',
  privacyPolicyUrl = '/privacy',
  className = ''
}) => {
  const [visible, setVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState({
    advertising: false,
    analytics: false,
    personalization: false
  });

  useEffect(() => {
    // Show banner if user hasn't made a choice
    setVisible(consentManager.shouldShowBanner());

    // Listen for consent changes
    const unsubscribe = consentManager.onChange((state) => {
      if (state !== 'unknown') {
        setVisible(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleAcceptAll = () => {
    consentManager.acceptAll();
    setVisible(false);
  };

  const handleRejectAll = () => {
    consentManager.rejectAll();
    setVisible(false);
  };

  const handleSavePreferences = () => {
    consentManager.setPreferences({
      state: 'partial',
      ...preferences
    });
    setVisible(false);
  };

  if (!visible) {
    return null;
  }

  return (
    <div className={`consent-banner consent-banner--${position} ${className}`} role="dialog" aria-label="Cookie consent" aria-modal="true">
      <div className="consent-banner__container">
        <div className="consent-banner__content">
          <h2 className="consent-banner__title">🍪 We value your privacy</h2>

          <p className="consent-banner__text">
            We use cookies and similar technologies to enhance your experience,
            analyze site traffic, and show personalized ads. By clicking "Accept
            All", you consent to our use of cookies.
          </p>

          {showDetails && (
            <div className="consent-banner__details">
              <label className="consent-banner__checkbox">
                <input
                  type="checkbox"
                  checked={preferences.advertising}
                  onChange={(e) =>
                    setPreferences({ ...preferences, advertising: e.target.checked })
                  }
                />
                <span>
                  <strong>Advertising</strong> - Show personalized ads based on
                  your interests
                </span>
              </label>

              <label className="consent-banner__checkbox">
                <input
                  type="checkbox"
                  checked={preferences.analytics}
                  onChange={(e) =>
                    setPreferences({ ...preferences, analytics: e.target.checked })
                  }
                />
                <span>
                  <strong>Analytics</strong> - Help us improve our site by
                  collecting usage data
                </span>
              </label>

              <label className="consent-banner__checkbox">
                <input
                  type="checkbox"
                  checked={preferences.personalization}
                  onChange={(e) =>
                    setPreferences({
                      ...preferences,
                      personalization: e.target.checked
                    })
                  }
                />
                <span>
                  <strong>Personalization</strong> - Remember your preferences
                  and settings
                </span>
              </label>
            </div>
          )}

          <p className="consent-banner__link">
            <a href={privacyPolicyUrl} target="_blank" rel="noopener noreferrer">
              Privacy Policy
            </a>
            {' • '}
            <button
              type="button"
              onClick={() => setShowDetails(!showDetails)}
              className="consent-banner__link-button"
            >
              {showDetails ? 'Hide' : 'Show'} details
            </button>
          </p>
        </div>

        <div className="consent-banner__actions">
          {showDetails ? (
            <>
              <button
                onClick={handleSavePreferences}
                className="consent-banner__button consent-banner__button--primary"
                type="button"
              >
                Save Preferences
              </button>
              <button
                onClick={handleRejectAll}
                className="consent-banner__button consent-banner__button--secondary"
                type="button"
              >
                Reject All
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleAcceptAll}
                className="consent-banner__button consent-banner__button--primary"
                type="button"
              >
                Accept All
              </button>
              <button
                onClick={handleRejectAll}
                className="consent-banner__button consent-banner__button--secondary"
                type="button"
              >
                Reject All
              </button>
            </>
          )}
        </div>
      </div>

      <style jsx>{`
        .consent-banner {
          position: fixed;
          left: 0;
          right: 0;
          z-index: 9999;
          background: #fff;
          box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.15);
          padding: 20px;
          font-family: system-ui, -apple-system, sans-serif;
          animation: slideIn 0.3s ease-out;
        }

        .consent-banner--bottom {
          bottom: 0;
        }

        .consent-banner--top {
          top: 0;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
        }

        @keyframes slideIn {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .consent-banner__container {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .consent-banner__title {
          font-size: 18px;
          font-weight: 600;
          margin: 0 0 8px 0;
          color: #1a1a1a;
        }

        .consent-banner__text {
          font-size: 14px;
          line-height: 1.5;
          color: #4a4a4a;
          margin: 0;
        }

        .consent-banner__details {
          margin-top: 16px;
          padding: 16px;
          background: #f8f9fa;
          border-radius: 4px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .consent-banner__checkbox {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          cursor: pointer;
          font-size: 13px;
          line-height: 1.4;
        }

        .consent-banner__checkbox input {
          margin-top: 2px;
          cursor: pointer;
        }

        .consent-banner__link {
          font-size: 12px;
          margin-top: 8px;
          color: #6c757d;
        }

        .consent-banner__link a {
          color: #0066cc;
          text-decoration: none;
        }

        .consent-banner__link a:hover {
          text-decoration: underline;
        }

        .consent-banner__link-button {
          background: none;
          border: none;
          color: #0066cc;
          cursor: pointer;
          padding: 0;
          font-size: inherit;
          text-decoration: none;
        }

        .consent-banner__link-button:hover {
          text-decoration: underline;
        }

        .consent-banner__actions {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .consent-banner__button {
          padding: 10px 20px;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }

        .consent-banner__button--primary {
          background: #0066cc;
          color: #fff;
        }

        .consent-banner__button--primary:hover {
          background: #0052a3;
        }

        .consent-banner__button--primary:focus {
          outline: 2px solid #0066cc;
          outline-offset: 2px;
        }

        .consent-banner__button--secondary {
          background: #e9ecef;
          color: #495057;
        }

        .consent-banner__button--secondary:hover {
          background: #dee2e6;
        }

        .consent-banner__button--secondary:focus {
          outline: 2px solid #6c757d;
          outline-offset: 2px;
        }

        /* Mobile responsive */
        @media (min-width: 768px) {
          .consent-banner__container {
            flex-direction: row;
            align-items: flex-start;
            justify-content: space-between;
          }

          .consent-banner__content {
            flex: 1;
          }

          .consent-banner__actions {
            flex-shrink: 0;
            align-items: flex-start;
          }
        }

        /* Accessibility: Reduced motion */
        @media (prefers-reduced-motion: reduce) {
          .consent-banner {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
};
