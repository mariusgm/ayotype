export const config = { runtime: "edge" };

// Curated themes with descriptions
const THEMES = [
  { name: "space vibes", tone: "cool", description: "Cosmic and otherworldly", words: "starlight dreams" },
  { name: "cozy mornings", tone: "cute", description: "Warm and comforting", words: "coffee cuddles" },
  { name: "neon dreams", tone: "chaotic", description: "Bold and electrifying", words: "cyber glow" },
  { name: "pixel art", tone: "nostalgic", description: "Retro and playful", words: "8-bit magic" },
  { name: "rainy nights", tone: "romantic", description: "Peaceful and serene", words: "storm whispers" },
  { name: "coffee magic", tone: "cute", description: "Energizing and delightful", words: "brew bliss" },
  { name: "sunset beach", tone: "romantic", description: "Peaceful and serene", words: "golden waves" },
  { name: "cyber punk", tone: "cool", description: "Futuristic and edgy", words: "neon city" },
  { name: "forest mystical", tone: "nostalgic", description: "Enchanting and earthy", words: "woodland dreams" },
  { name: "party lights", tone: "chaotic", description: "Vibrant and energetic", words: "dance fever" },
  { name: "zen garden", tone: "minimal", description: "Calm and balanced", words: "peaceful flow" },
  { name: "starry wishes", tone: "romantic", description: "Dreamy and hopeful", words: "moonlit magic" },
  { name: "retro arcade", tone: "nostalgic", description: "Fun and colorful", words: "game on" },
  { name: "neon cats", tone: "chaotic", description: "Quirky and fun", words: "meow mayhem" },
  { name: "moonlight dance", tone: "romantic", description: "Elegant and ethereal", words: "lunar glow" }
];

// Deterministic theme selection based on date
function getThemeForDate(dateStr: string): typeof THEMES[0] {
  const hash = dateStr.split('').reduce((acc, char) => {
    return acc + char.charCodeAt(0);
  }, 0);
  return THEMES[hash % THEMES.length];
}

// Generate combo for a specific date
async function generateComboForDate(dateStr: string): Promise<any> {
  const theme = getThemeForDate(dateStr);

  // Call the generation API with deterministic seed
  const seed = `combo-${dateStr}`;
  // Use relative path for API calls on Vercel (automatically routed)
  const apiUrl = 'https://emojifusion.ayotype.com/api/generate';

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        words: theme.words,
        mode: 'both',
        tone: theme.tone,
        seed: seed,
        lines: 1
      })
    });

    if (!response.ok) {
      throw new Error('Generation failed');
    }

    const data = await response.json();

    // Pick the first combo from the results
    const combo = data.emoji?.[0] || data.ascii?.[0];

    if (!combo) {
      throw new Error('No combo generated');
    }

    return {
      date: dateStr,
      combo: combo.combo || combo.text,
      name: combo.name || theme.name,
      theme: theme.name,
      tone: theme.tone,
      description: theme.description,
      all_results: {
        emoji: data.emoji || [],
        ascii: data.ascii || []
      }
    };
  } catch (error) {
    console.error('Combo generation error:', error);

    // Fallback combo if generation fails
    return {
      date: dateStr,
      combo: "✨ (^_^) daily vibes",
      name: "fallback combo",
      theme: theme.name,
      tone: theme.tone,
      description: theme.description,
      all_results: { emoji: [], ascii: [] }
    };
  }
}

export default async function handler(req: Request) {
  // CORS headers for cross-origin requests
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  // Handle OPTIONS request (CORS preflight)
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  if (req.method !== 'GET') {
    return new Response('Method Not Allowed', { status: 405, headers });
  }

  try {
    // Get today's date in YYYY-MM-DD format (UTC)
    const today = new Date().toISOString().split('T')[0];

    // Generate or fetch today's combo
    const combo = await generateComboForDate(today);

    return new Response(JSON.stringify(combo), {
      status: 200,
      headers
    });
  } catch (error) {
    console.error('Combo of the Day error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to load combo' }),
      { status: 500, headers }
    );
  }
}
