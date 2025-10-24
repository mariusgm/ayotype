export const config = { runtime: "edge" };

// Helper function to escape XML special characters
function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Helper function to format date for RSS (RFC 822)
function formatRssDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toUTCString();
}

// Fetch combo for a specific date
async function fetchComboForDate(dateStr: string): Promise<any> {
  try {
    const baseUrl = 'https://ayotype.com';
    const response = await fetch(`${baseUrl}/api/combo-of-the-day?date=${dateStr}`);

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error(`Failed to fetch combo for ${dateStr}:`, error);
    return null;
  }
}

export default async function handler(req: Request) {
  if (req.method !== 'GET') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    // Generate combos for the last 30 days
    const today = new Date();
    const combos: any[] = [];

    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const combo = await fetchComboForDate(dateStr);
      if (combo) {
        combos.push(combo);
      }
    }

    // Generate RSS XML
    const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Combo of the Day — AyoType</title>
    <link>https://ayotype.com/combo-archive</link>
    <description>Daily curated emoji and ASCII art combinations. Fresh inspiration every day.</description>
    <language>en-US</language>
    <lastBuildDate>${formatRssDate(new Date().toISOString().split('T')[0])}</lastBuildDate>
    <atom:link href="https://ayotype.com/api/combo-of-the-day/rss" rel="self" type="application/rss+xml" />
    <image>
      <url>https://ayotype.com/og-image-emojifusion.png</url>
      <title>Combo of the Day</title>
      <link>https://ayotype.com/combo-archive</link>
    </image>
${combos.map(combo => `    <item>
      <title>${escapeXml(combo.combo)} — ${escapeXml(combo.theme)}</title>
      <link>https://ayotype.com/combo-archive?date=${combo.date}</link>
      <guid isPermaLink="false">combo-${combo.date}</guid>
      <pubDate>${formatRssDate(combo.date)}</pubDate>
      <description>${escapeXml(`${combo.combo}\n\nTheme: ${combo.theme}\nTone: ${combo.tone}\nVibe: ${combo.description}\n\nToday's featured combination brings ${combo.tone} energy to your messages and content.`)}</description>
      <category>${escapeXml(combo.tone)}</category>
      <category>${escapeXml(combo.theme)}</category>
    </item>`).join('\n')}
  </channel>
</rss>`;

    return new Response(rssXml, {
      status: 200,
      headers: {
        'Content-Type': 'application/rss+xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      }
    });

  } catch (error) {
    console.error('RSS feed generation error:', error);
    return new Response('Failed to generate RSS feed', { status: 500 });
  }
}
