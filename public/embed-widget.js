/**
 * EmojiFusion Widget - Standalone JavaScript
 * Embeddable Combo of the Day widget
 *
 * Usage:
 * <div id="emojifusion-widget"></div>
 * <script src="https://emojifusion.ayotype.com/embed-widget.js"></script>
 */

(function() {
  'use strict';

  // Configuration - Use localhost for development, production URL for deploy
  const API_URL = window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost'
    ? 'http://127.0.0.1:3000/api/combo-of-the-day'
    : 'https://ayotype.com/api/combo-of-the-day';
  const WIDGET_ID = 'emojifusion-widget';

  // Tone emoji mapping
  const toneEmojis = {
    cute: '🐣',
    cool: '😎',
    chaotic: '⚡',
    romantic: '💕',
    minimal: '◽',
    nostalgic: '🌙'
  };

  // Widget styles
  const styles = `
    .emojifusion-widget {
      font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;
      background: linear-gradient(135deg, #1a1a1a, #0a0a0a);
      border-radius: 16px;
      padding: 24px;
      text-align: center;
      max-width: 400px;
      margin: 0 auto;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
    .emojifusion-widget-title {
      color: #ffb6c1;
      font-size: 18px;
      font-weight: 700;
      margin: 0 0 16px 0;
    }
    .emojifusion-widget-combo {
      font-size: 48px;
      line-height: 1.2;
      margin: 16px 0;
      min-height: 58px;
    }
    .emojifusion-widget-theme {
      color: #b6b6b1;
      font-size: 16px;
      margin: 8px 0;
      font-weight: 600;
    }
    .emojifusion-widget-description {
      color: #9a9a96;
      font-size: 14px;
      margin: 8px 0 16px 0;
      line-height: 1.5;
    }
    .emojifusion-widget-cta {
      display: inline-block;
      background: linear-gradient(135deg, #FF79C6, #FFD94E);
      color: #0a0a0a;
      padding: 10px 24px;
      border-radius: 20px;
      text-decoration: none;
      font-weight: 600;
      font-size: 14px;
      transition: transform 0.2s;
    }
    .emojifusion-widget-cta:hover {
      transform: translateY(-2px);
    }
    .emojifusion-widget-loading {
      color: #9a9a96;
      font-size: 14px;
      padding: 40px 20px;
    }
    .emojifusion-widget-error {
      color: #ff6b6b;
      font-size: 14px;
      padding: 20px;
    }
    .emojifusion-widget-date {
      color: #666;
      font-size: 12px;
      margin-top: 16px;
    }
  `;

  // Inject styles
  function injectStyles() {
    if (document.getElementById('emojifusion-widget-styles')) return;

    const styleEl = document.createElement('style');
    styleEl.id = 'emojifusion-widget-styles';
    styleEl.textContent = styles;
    document.head.appendChild(styleEl);
  }

  // Format date
  function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  // Render widget
  function renderWidget(container, data) {
    const toneEmoji = toneEmojis[data.tone] || '✨';

    container.innerHTML = `
      <div class="emojifusion-widget-title">✨ Combo of the Day</div>
      <div class="emojifusion-widget-combo">${data.combo}</div>
      <div class="emojifusion-widget-theme">${data.theme} ${toneEmoji}</div>
      <div class="emojifusion-widget-description">${data.description}</div>
      <a href="https://emojifusion.ayotype.com" class="emojifusion-widget-cta" target="_blank" rel="noopener">
        Try EmojiFusion
      </a>
      <div class="emojifusion-widget-date">${formatDate(data.date)}</div>
    `;
  }

  // Show error
  function showError(container, message) {
    container.innerHTML = `
      <div class="emojifusion-widget-error">
        ${message || 'Failed to load combo'}
      </div>
      <a href="https://emojifusion.ayotype.com" class="emojifusion-widget-cta" target="_blank" rel="noopener">
        Visit EmojiFusion
      </a>
    `;
  }

  // Show loading
  function showLoading(container) {
    container.innerHTML = '<div class="emojifusion-widget-loading">Loading combo...</div>';
  }

  // Fetch combo data
  async function loadCombo(container) {
    showLoading(container);

    try {
      const response = await fetch(API_URL);
      if (!response.ok) {
        throw new Error('Failed to fetch');
      }
      const data = await response.json();
      renderWidget(container, data);
    } catch (error) {
      console.error('EmojiFusion Widget Error:', error);
      showError(container);
    }
  }

  // Initialize widget
  function init() {
    const container = document.getElementById(WIDGET_ID);

    if (!container) {
      console.error('EmojiFusion Widget: Element with id "emojifusion-widget" not found');
      return;
    }

    container.classList.add('emojifusion-widget');
    injectStyles();
    loadCombo(container);
  }

  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose API for manual initialization
  window.EmojiFusionWidget = {
    init: init,
    version: '1.0.0'
  };
})();
