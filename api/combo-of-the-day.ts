export const config = { runtime: "edge" };

import { getSeasonalTheme } from '../shared/utils/seasonal-events';

// Get theme based on date using seasonal event detection
function getThemeForDate(dateStr: string): { name: string; tone: string; description: string; words: string } {
  const date = new Date(dateStr + 'T00:00:00Z'); // Parse as UTC
  const seasonalTheme = getSeasonalTheme(date);

  return {
    name: seasonalTheme.name,
    tone: seasonalTheme.tone,
    description: seasonalTheme.description,
    words: seasonalTheme.words
  };
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
    // Parse URL to get query parameters
    const url = new URL(req.url);
    const dateParam = url.searchParams.get('date');

    // Use provided date or default to today
    let targetDate: string;
    if (dateParam) {
      // Validate date format (YYYY-MM-DD)
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
        return new Response(
          JSON.stringify({ error: 'Invalid date format. Use YYYY-MM-DD' }),
          { status: 400, headers }
        );
      }
      targetDate = dateParam;
    } else {
      // Get today's date in YYYY-MM-DD format (UTC)
      targetDate = new Date().toISOString().split('T')[0];
    }

    // Try to fetch from pre-generated JSON first (if available)
    try {
      const jsonUrl = 'https://ayotype.com/combo-of-the-day.json';
      const jsonResponse = await fetch(jsonUrl);

      if (jsonResponse.ok) {
        const combos = await jsonResponse.json();
        const preGenerated = combos.find((c: any) => c.date === targetDate);

        if (preGenerated) {
          // Return pre-generated combo (faster, uses cached data)
          return new Response(JSON.stringify(preGenerated), {
            status: 200,
            headers: {
              ...headers,
              'X-Data-Source': 'pre-generated'
            }
          });
        }
      }
    } catch (jsonError) {
      // JSON file not available or doesn't contain this date, fall through to generation
      console.log('Pre-generated data not available, generating on-the-fly');
    }

    // Fall back to on-the-fly generation
    const combo = await generateComboForDate(targetDate);

    return new Response(JSON.stringify(combo), {
      status: 200,
      headers: {
        ...headers,
        'X-Data-Source': 'generated'
      }
    });
  } catch (error) {
    console.error('Combo of the Day error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to load combo' }),
      { status: 500, headers }
    );
  }
}
