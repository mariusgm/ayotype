export const config = { runtime: "edge" };

// Seasonal theme detection (inlined for Edge Runtime compatibility)
function getThemeForDate(dateStr: string): { name: string; tone: string; description: string; words: string } {
  const date = new Date(dateStr + 'T00:00:00Z'); // Parse as UTC
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();
  const year = date.getUTCFullYear();

  // Halloween - October 31
  if (month === 10 && day === 31) {
    return {
      name: 'halloween night',
      tone: 'chaotic',
      description: 'Spooky and eerie halloween celebration',
      words: 'spooky haunted trick-or-treat'
    };
  }

  // Christmas - December 20-26
  if (month === 12 && day >= 20 && day <= 26) {
    return {
      name: 'festive holidays',
      tone: 'cute',
      description: 'Warm and joyful christmas celebration',
      words: 'merry christmas festive jolly'
    };
  }

  // New Year - December 31 or January 1
  if ((month === 12 && day === 31) || (month === 1 && day === 1)) {
    return {
      name: 'new year celebration',
      tone: 'chaotic',
      description: 'Exciting countdown and fresh beginnings',
      words: 'countdown fireworks celebration new'
    };
  }

  // Valentine's Day - February 14
  if (month === 2 && day === 14) {
    return {
      name: 'love and romance',
      tone: 'romantic',
      description: 'Sweet and heartfelt valentine celebration',
      words: 'love hearts romantic sweet'
    };
  }

  // Independence Day - July 4
  if (month === 7 && day === 4) {
    return {
      name: 'fireworks celebration',
      tone: 'chaotic',
      description: 'Bold and patriotic celebration',
      words: 'fireworks independence celebration'
    };
  }

  // Thanksgiving - November 20-30
  if (month === 11 && day >= 20 && day <= 30) {
    return {
      name: 'grateful harvest',
      tone: 'nostalgic',
      description: 'Warm and grateful thanksgiving',
      words: 'grateful harvest feast'
    };
  }

  // Spring - March, April, May
  if (month >= 3 && month <= 5) {
    return {
      name: 'spring blooming',
      tone: 'cute',
      description: 'Fresh and blooming spring season',
      words: 'blooming fresh flowers renewal'
    };
  }

  // Summer - June, July, August
  if (month >= 6 && month <= 8) {
    return {
      name: 'summer vibes',
      tone: 'romantic',
      description: 'Warm and sunny summer days',
      words: 'sunny beach vacation warm'
    };
  }

  // Fall - September, October, November
  if (month >= 9 && month <= 11) {
    return {
      name: 'autumn cozy',
      tone: 'nostalgic',
      description: 'Cozy and colorful fall season',
      words: 'cozy autumn leaves harvest'
    };
  }

  // Winter - December, January, February
  if (month === 12 || month === 1 || month === 2) {
    return {
      name: 'winter wonderland',
      tone: 'cute',
      description: 'Cold and magical winter season',
      words: 'snow cozy frost magical'
    };
  }

  // Default fallback
  return {
    name: 'daily vibes',
    tone: 'cool',
    description: 'Fresh and unique',
    words: 'creative flow'
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
