import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import meta from "./emoji-meta.json";
import { seedFrom, sanitizeLine, Result, Mode } from "./fusion";
import { apiCache } from "./cache";
import { exportPNG } from "./export";

const tones = [
  { id: "cute", icon: "🐣", label: "cute" },
  { id: "cool", icon: "😎", label: "cool" },
  { id: "chaotic", icon: "⚡", label: "chaotic" },
  { id: "romantic", icon: "💕", label: "romantic" },
  { id: "minimal", icon: "◽", label: "minimal" },
  { id: "nostalgic", icon: "🌙", label: "nostalgic" }
];

const modes = [
  { id: "both", label: "Combo" },
  { id: "emoji", label: "Emoji" },
  { id: "ascii", label: "ASCII" }
];

const examplePrompts = [
  "space cat",
  "rainy nights", 
  "coffee mornings",
  "pixel dreams",
  "neon vibes",
  "cute magic"
];

export default function App() {
  const [words, setWords] = useState("");
  const [mode, setMode] = useState<Mode>("both");
  const [tone, setTone] = useState("cute");
  const [loading, setLoading] = useState(false);
  const [res, setRes] = useState<Result | null>(null);
  const [history, setHistory] = useState<Result[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [notification, setNotification] = useState("");
  const [showSkeleton, setShowSkeleton] = useState(false);
  const [longPressCard, setLongPressCard] = useState<number | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showCopySuccess, setShowCopySuccess] = useState(false);
  const [copiedText, setCopiedText] = useState("");
  const [showConfetti, setShowConfetti] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const longPressTimer = useRef<NodeJS.Timeout>();
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem("ef-history");
    if (saved) setHistory(JSON.parse(saved));
    
    const savedFavorites = localStorage.getItem("ef-favorites");
    if (savedFavorites) setFavorites(JSON.parse(savedFavorites));
  }, []);

  useEffect(() => {
    localStorage.setItem("ef-history", JSON.stringify(history.slice(0, 40)));
  }, [history]);

  useEffect(() => {
    localStorage.setItem("ef-favorites", JSON.stringify(favorites));
  }, [favorites]);

  // Update body data-tone attribute for dynamic backgrounds
  useEffect(() => {
    document.body.setAttribute('data-tone', tone);
    return () => {
      document.body.removeAttribute('data-tone');
    };
  }, [tone]);

  // Callback definitions (must be before useEffects that use them)
  const showNotification = useCallback((message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(""), 3000);
  }, []);

  const triggerHaptic = useCallback((pattern: 'light' | 'medium' | 'heavy' | 'success' | 'error' = 'light') => {
    if (!navigator.vibrate) return;

    const patterns = {
      light: [10],
      medium: [20],
      heavy: [30],
      success: [10, 50, 10],
      error: [20, 100, 20, 100, 20]
    };

    navigator.vibrate(patterns[pattern]);
  }, []);

  const triggerConfetti = useCallback(() => {
    setShowConfetti(true);
    setTimeout(() => {
      setShowConfetti(false);
    }, 3500); // Duration matches longest confetti animation
  }, []);

  // PWA install prompt handling
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);

      // Don't show if user already dismissed it this session
      if (sessionStorage.getItem('install-prompt-dismissed')) return;

      // Don't show if user recently dismissed it (within 24 hours)
      const lastDismissed = localStorage.getItem('install-prompt-last-dismissed');
      if (lastDismissed && Date.now() - parseInt(lastDismissed) < 24 * 60 * 60 * 1000) return;

      // Show install prompt after user has generated a few combos
      const generationCount = parseInt(localStorage.getItem('ef-generation-count') || '0');
      if (generationCount >= 2) {
        setTimeout(() => {
          if (!sessionStorage.getItem('install-prompt-dismissed')) {
            setShowInstallPrompt(true);
          }
        }, 8000); // Show after 8 seconds if they've generated 2+ times
      }
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setShowInstallPrompt(false);
      showNotification("📱 App installed successfully!");
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []); // showNotification is stable (empty deps) so no need to include

  const defaultSeed = useMemo(
    () => seedFrom([words, mode, tone].join("|")),
    [words, mode, tone]
  );

  async function generate() {
    if (!words.trim() || loading) return;

    setLoading(true);
    setIsGenerating(true);
    setShowSkeleton(true);
    triggerHaptic('medium');
    
    // Dispatch custom events for performance monitoring
    window.dispatchEvent(new CustomEvent('generation-start'));
    
    // Hide skeleton after instant feedback period
    setTimeout(() => setShowSkeleton(false), 150);
    
    try {
      const r = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ words, mode, tone, seed: defaultSeed })
      });
      
      if (!r.ok) throw new Error(await r.text());
      
      const j: Result = await r.json();

      // Cache the successful response
      apiCache.set(words.trim(), mode, tone, 1, j);
      
      // Track generation count for install prompt
      const currentCount = parseInt(localStorage.getItem('ef-generation-count') || '0');
      localStorage.setItem('ef-generation-count', (currentCount + 1).toString());
      
      setRes(j);
      setHistory((h) => [j, ...h].slice(0, 50));
      triggerHaptic('success');
      triggerConfetti();
      showNotification("✨ Generated new combos!");
      
      window.dispatchEvent(new CustomEvent('generation-complete'));
    } catch (e) {
      console.error('Generation failed:', e);
      triggerHaptic('error');
      showNotification("❌ Generation failed. Please try again.");
    } finally {
      setLoading(false);
      setIsGenerating(false);
    }
  }

  function randomize() {
    const randomPrompt = examplePrompts[Math.floor(Math.random() * examplePrompts.length)];
    const randomTone = tones[Math.floor(Math.random() * tones.length)];
    const randomMode = modes[Math.floor(Math.random() * modes.length)];
    
    setWords(randomPrompt);
    setTone(randomTone.id);
    setMode(randomMode.id as Mode);
    triggerHaptic('medium');
    showNotification("🎲 Randomized everything!");
    
    // Auto-generate after randomize
    setTimeout(() => {
      generate();
    }, 400);
  }

  function copy(text: string, type: string = 'combo') {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedText(text);
      setShowCopySuccess(true);
      triggerHaptic('light');
      
      // Hide overlay after 1.5 seconds
      setTimeout(() => {
        setShowCopySuccess(false);
      }, 1500);
    }).catch(() => {
      triggerHaptic('error');
      showNotification("❌ Copy failed");
    });
  }

  function share(text: string, title: string) {
    if (navigator.share) {
      navigator.share({
        title: `EmojiFusion: ${title}`,
        text: text,
        url: window.location.href
      }).then(() => {
        showNotification("🎉 Shared successfully!");
        triggerHaptic();
      }).catch(() => {
        copy(text, 'share link');
      });
    } else {
      copy(text, 'share link');
    }
  }

  function toggleFavorite(combo: string) {
    setFavorites(prev => {
      const newFavorites = prev.includes(combo) 
        ? prev.filter(f => f !== combo)
        : [...prev, combo];
      
      showNotification(
        prev.includes(combo) ? "💔 Removed from favorites" : "⭐ Added to favorites!"
      );
      triggerHaptic();
      
      return newFavorites;
    });
  }

  function handleExampleClick(example: string) {
    setWords(example);
    triggerHaptic();
    showNotification("💡 Example loaded!");
    
    // Focus input after setting example
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  }

  function handleLongPressStart(index: number) {
    longPressTimer.current = setTimeout(() => {
      setLongPressCard(index);
      triggerHaptic();
    }, 500);
  }

  function handleLongPressEnd() {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
  }

  function handleLongPressCancel() {
    handleLongPressEnd();
    setLongPressCard(null);
  }

  async function handleInstallClick() {
    if (!deferredPrompt) return;

    const result = await deferredPrompt.prompt();
    console.log('Install result:', result.outcome);
    
    if (result.outcome === 'accepted') {
      showNotification("📱 Installing app...");
      triggerHaptic('success');
    }
    
    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  }

  function dismissInstallPrompt() {
    setShowInstallPrompt(false);
    triggerHaptic('light');
    
    // Don't show again for this session
    sessionStorage.setItem('install-prompt-dismissed', 'true');
    
    // Remember dismissal for 24 hours
    localStorage.setItem('install-prompt-last-dismissed', Date.now().toString());
  }

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Enter = Generate
      if (e.key === 'Enter' && !e.shiftKey && !loading) {
        e.preventDefault();
        generate();
      }
      
      // / = Focus input
      if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        inputRef.current?.focus();
      }
      
      // Ctrl/Cmd + R = Randomize
      if ((e.metaKey || e.ctrlKey) && e.key === 'r') {
        e.preventDefault();
        randomize();
      }
      
      // Ctrl/Cmd + K = Focus input
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
      
      // Escape = Clear input
      if (e.key === 'Escape') {
        if (words) {
          setWords('');
        }
        setLongPressCard(null);
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [loading, words]);

  // Handle input changes with overflow protection
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value.slice(0, 200); // Prevent overflow
    setWords(value);

    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  };

  function loadFromHistory(result: Result) {
    setRes(result);
    setShowHistory(false);
    triggerHaptic('light');
    showNotification("📜 Loaded from history!");
  }

  async function downloadCombo(element: HTMLElement, combo: string, title: string) {
    try {
      triggerHaptic('medium');
      showNotification("📸 Generating PNG...");

      const blob = await exportPNG(element, 1024);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `emojifusion-${title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      triggerHaptic('success');
      showNotification("✅ PNG downloaded!");
    } catch (error) {
      console.error('Download failed:', error);
      triggerHaptic('error');
      showNotification("❌ Download failed");
    }
  }

  return (
    <div className="mobile-container">
      <div className="title-bar">
        <h1 className="mobile-title">EmojiFusion</h1>
        {history.length > 0 && (
          <button
            className="history-toggle"
            onClick={() => {
              setShowHistory(!showHistory);
              triggerHaptic('light');
            }}
            aria-label="Toggle history"
            title={`History (${history.length})`}
          >
            <span role="img" aria-hidden="true">📜</span>
            <span className="history-count">{history.length}</span>
          </button>
        )}
      </div>
      
      {/* Input Section */}
      <div className="input-section">
        <textarea
          ref={inputRef}
          className="query-input"
          placeholder="e.g., taco space neon cat"
          value={words}
          onChange={handleInputChange}
          aria-label="Words to combine"
          autoComplete="off"
          autoCapitalize="off"
          spellCheck="false"
          rows={1}
          style={{ resize: 'none', overflow: 'hidden' }}
        />
        
        {/* Mode and Tone Controls */}
        <div className="mode-tone-wrapper">
          <div className="control-group">
            <label className="control-label" htmlFor="mode-select">Mode</label>
            <select
              id="mode-select"
              className="control-dropdown"
              value={mode}
              onChange={(e) => {
                setMode(e.target.value as Mode);
                triggerHaptic();
              }}
              aria-label="Select mode"
            >
              {modes.map(m => (
                <option key={m.id} value={m.id}>{m.label}</option>
              ))}
            </select>
          </div>
          
          <div className="control-group">
            <label className="control-label" htmlFor="tone-select">Tone</label>
            <select
              id="tone-select"
              className="control-dropdown"
              value={tone}
              onChange={(e) => {
                setTone(e.target.value);
                triggerHaptic();
              }}
              aria-label="Select tone"
            >
              {tones.map(t => (
                <option key={t.id} value={t.id}>{t.icon} {t.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Example Chips */}
      {!words && (
        <div className="examples-section">
          <div className="examples-label">✨ Try these examples</div>
          <div className="example-chips">
            {examplePrompts.map((example, idx) => (
              <button
                key={idx}
                className="example-chip"
                onClick={() => handleExampleClick(example)}
                aria-label={`Try example: ${example}`}
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results Section */}
      <div className="results-section">
        {showSkeleton && (
          <div className="skeleton-grid" aria-label="Loading results">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton-item" />
            ))}
          </div>
        )}
        
        {!showSkeleton && res && (
          <div className="results-grid" role="grid" aria-label="Generated combinations">
            {renderList(res).map(({ title, combo, kind }, idx) => (
              <div
                key={idx}
                className={`result-card ${longPressCard === idx ? 'long-press' : ''}`}
                onTouchStart={() => handleLongPressStart(idx)}
                onTouchEnd={handleLongPressEnd}
                onTouchCancel={handleLongPressCancel}
                onMouseDown={() => handleLongPressStart(idx)}
                onMouseUp={handleLongPressEnd}
                onMouseLeave={handleLongPressCancel}
                onClick={() => copy(combo, kind)}
                role="gridcell"
                tabIndex={0}
                aria-label={`${kind} combo: ${title}. Click to copy.`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    copy(combo, kind);
                  }
                }}
              >
                <div className={`result-combo ${kind === 'ascii' ? 'ascii' : ''}`}>
                  {combo}
                </div>
                
                <div className="quick-actions" role="toolbar" aria-label="Quick actions">
                  <button
                    className="quick-action"
                    onClick={(e) => {
                      e.stopPropagation();
                      copy(combo, kind);
                      setLongPressCard(null);
                    }}
                    aria-label="Copy to clipboard"
                  >
                    Copy
                  </button>
                  <button
                    className="quick-action"
                    onClick={(e) => {
                      e.stopPropagation();
                      share(combo, title);
                      setLongPressCard(null);
                    }}
                    aria-label="Share this combo"
                  >
                    Share
                  </button>
                  <button
                    className="quick-action"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(combo);
                      setLongPressCard(null);
                    }}
                    aria-label={favorites.includes(combo) ? "Remove from favorites" : "Add to favorites"}
                  >
                    {favorites.includes(combo) ? '★' : '☆'}
                  </button>
                  <button
                    className="quick-action"
                    onClick={(e) => {
                      e.stopPropagation();
                      const cardElement = e.currentTarget.closest('.result-card') as HTMLElement;
                      if (cardElement) {
                        downloadCombo(cardElement, combo, title);
                      }
                      setLongPressCard(null);
                    }}
                    aria-label="Download as PNG"
                  >
                    PNG
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {!res && !showSkeleton && (
          <div className="empty-state">
            <h3>Ready to create amazing combos!</h3>
            <p>
              Enter some words above, pick your style, and tap Generate to see emoji and ASCII art combinations.
            </p>
            <div style={{ marginTop: 'var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
              <div>💡 Press <kbd style={{ padding: '2px 6px', background: 'var(--bg-tertiary)', borderRadius: '4px', fontFamily: 'monospace' }}>/</kbd> to focus input</div>
              <div>⚡ Press <kbd style={{ padding: '2px 6px', background: 'var(--bg-tertiary)', borderRadius: '4px', fontFamily: 'monospace' }}>Enter</kbd> to generate</div>
              <div>🎲 Press <kbd style={{ padding: '2px 6px', background: 'var(--bg-tertiary)', borderRadius: '4px', fontFamily: 'monospace' }}>Ctrl+R</kbd> to randomize</div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Bar */}
      <div className="bottom-bar">
        <div className="bottom-actions">
          <button
            className={`generate-btn ${isGenerating ? 'loading' : ''}`}
            onClick={generate}
            disabled={loading || !words.trim()}
            aria-label="Generate combinations"
            aria-describedby={!words.trim() ? "generate-disabled-hint" : undefined}
          >
            {isGenerating ? (
              <>
                <span className="sr-only">Generating...</span>
                <span aria-hidden="true">Generating</span>
              </>
            ) : (
              'Generate'
            )}
          </button>
          
          <button
            className="randomize-btn"
            onClick={randomize}
            disabled={loading}
            aria-label="Randomize prompt, mode, and tone"
            title="Randomize everything (Ctrl+R)"
          >
            <span role="img" aria-hidden="true">🎲</span>
            <span className="sr-only">Randomize</span>
          </button>
        </div>
      </div>
      
      {!words.trim() && (
        <div id="generate-disabled-hint" className="sr-only">
          Enter some words to enable generation
        </div>
      )}

      {/* Floating Regenerate Button */}
      {res && (
        <button
          className={`regen-fab ${res ? 'visible' : ''}`}
          onClick={generate}
          disabled={loading}
          aria-label="Generate more like this"
          title="More like this"
        >
          <span role="img" aria-hidden="true">✨</span>
        </button>
      )}

      {/* Confetti Animation */}
      {showConfetti && (
        <div className="confetti-container">
          {Array.from({ length: 10 }, (_, i) => (
            <div key={i} className={`confetti ${showConfetti ? 'burst' : ''}`} />
          ))}
        </div>
      )}

      {/* Copy Success Overlay */}
      <div className={`copy-success-overlay ${showCopySuccess ? 'show' : ''}`}>
        <div className="copy-success-content">
          <div className="copy-checkmark">
            ✓
          </div>
          <div className="copy-success-text">Copied!</div>
          <div className="copy-success-subtext">
            {copiedText.length > 20 ? copiedText.substring(0, 20) + '...' : copiedText}
          </div>
        </div>
      </div>

      {/* PWA Install Prompt */}
      {showInstallPrompt && deferredPrompt && (
        <div className="install-prompt-overlay">
          <div className="install-prompt">
            <div className="install-prompt-content">
              <div className="install-prompt-icon">📱</div>
              <h3>Install EmojiFusion</h3>
              <p>Get the full app experience with faster loading and offline access!</p>
              <div className="install-prompt-actions">
                <button 
                  className="install-prompt-btn install-btn"
                  onClick={handleInstallClick}
                  aria-label="Install EmojiFusion app"
                >
                  Install
                </button>
                <button 
                  className="install-prompt-btn dismiss-btn"
                  onClick={dismissInstallPrompt}
                  aria-label="Dismiss install prompt"
                >
                  Not Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notification */}
      {notification && (
        <div
          className={`notification ${notification ? 'show' : ''}`}
          role="status"
          aria-live="polite"
        >
          {notification}
        </div>
      )}

      {/* History Panel */}
      {showHistory && (
        <div className="history-overlay" onClick={() => setShowHistory(false)}>
          <div className="history-panel" onClick={(e) => e.stopPropagation()}>
            <div className="history-header">
              <h2>History & Cache</h2>
              <button
                className="history-close"
                onClick={() => setShowHistory(false)}
                aria-label="Close history"
              >
                ✕
              </button>
            </div>

            <div className="history-content">
              {history.length === 0 ? (
                <div className="history-empty">
                  <span style={{ fontSize: '3rem', opacity: 0.5 }}>📜</span>
                  <p>No history yet</p>
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
                    Generate some combos to see them here!
                  </p>
                </div>
              ) : (
                <div className="history-list">
                  {history.map((item, idx) => (
                    <div
                      key={idx}
                      className="history-item"
                      onClick={() => loadFromHistory(item)}
                    >
                      <div className="history-item-preview">
                        {renderList(item).slice(0, 3).map((combo, i) => (
                          <span key={i} className="history-preview-emoji">
                            {combo.combo}
                          </span>
                        ))}
                      </div>
                      <div className="history-item-info">
                        <span className="history-item-count">
                          {(item.emoji?.length || 0) + (item.ascii?.length || 0)} combos
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function renderList(res: Result) {
  const L: { title: string, combo: string, kind: "emoji" | "ascii" }[] = [];
  (res.emoji || []).forEach(x => L.push({
    title: sanitizeLine(x.name, 40),
    combo: sanitizeLine(x.combo, 40),
    kind: "emoji"
  }));
  (res.ascii || []).forEach(x => L.push({
    title: sanitizeLine(x.name, 40),
    combo: x.combo.split("\n").slice(0, 2).map(l => sanitizeLine(l, 20)).join("\n"),
    kind: "ascii"
  }));
  return L.slice(0, 12);
}