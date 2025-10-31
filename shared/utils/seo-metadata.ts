/**
 * SEO Metadata Utility
 *
 * Generates SEO-optimized metadata for combo of the day.
 * Helps improve search engine visibility and social media sharing.
 */

export interface SEOMetadata {
  title: string;
  description: string;
  keywords: string;
  canonical: string;
}

export interface ComboData {
  date: string;
  combo: string;
  name: string;
  theme: string;
  tone: string;
  description: string;
  png_url?: string;
}

/**
 * Generate complete SEO metadata for a combo
 */
export function generateSEOMetadata(comboData: ComboData): SEOMetadata {
  const date = new Date(comboData.date);
  const year = date.getFullYear();
  const monthName = date.toLocaleDateString('en-US', { month: 'long' });

  // Generate title (max 60 characters)
  const title = generateTitle(comboData, year, monthName);

  // Generate description (max 160 characters)
  const description = generateDescription(comboData, monthName, year);

  // Generate keywords
  const keywords = generateKeywords(comboData, monthName, year);

  // Generate canonical URL
  const canonical = `https://ayotype.com/combo-of-the-day/${comboData.date}`;

  return {
    title: truncate(title, 60),
    description: truncate(description, 160),
    keywords: keywords.join(', '),
    canonical
  };
}

/**
 * Generate SEO title
 */
function generateTitle(comboData: ComboData, year: number, monthName: string): string {
  // Extract main theme word
  const mainTheme = comboData.theme.split(' ')[0];
  const capitalizedTheme = mainTheme.charAt(0).toUpperCase() + mainTheme.slice(1);

  // Format: "Halloween Emoji Combo 2025 | EmojiFusion"
  return `${capitalizedTheme} Emoji Combo ${year} | EmojiFusion`;
}

/**
 * Generate SEO description
 */
function generateDescription(comboData: ComboData, monthName: string, year: number): string {
  const mainTheme = comboData.theme.split(' ')[0];
  // Keep description lowercase for consistency
  const description = comboData.description.toLowerCase();

  // Format: "Discover today's halloween emoji combo! spooky and eerie halloween celebration. Perfect for October 2025 messages and social media."
  return `Discover today's ${mainTheme} emoji combo! ${description}. Perfect for ${monthName} ${year} messages and social media.`;
}

/**
 * Generate SEO keywords
 */
function generateKeywords(comboData: ComboData, monthName: string, year: number): string[] {
  const baseKeywords = [
    'emoji fusion',
    'emoji combo',
    'daily emoji',
    'emoji art',
    'text art',
    'emoji generator'
  ];

  const themeKeywords = comboData.theme.split(' ').map(word =>
    word.charAt(0).toUpperCase() + word.slice(1)
  );

  const dateKeywords = [
    monthName,
    year.toString(),
    `${monthName} ${year}`
  ];

  const toneKeywords = [
    comboData.tone,
    `${comboData.tone} vibes`,
    `${comboData.tone} aesthetic`
  ];

  // Add trending keywords for seasonal events
  const trendingKeywords = generateTrendingKeywords(comboData, year);

  return [
    ...themeKeywords,
    ...trendingKeywords,
    ...dateKeywords,
    ...toneKeywords,
    ...baseKeywords
  ].slice(0, 20); // Increased to 20 keywords for better SEO
}

/**
 * Generate trending keywords for seasonal events
 */
function generateTrendingKeywords(comboData: ComboData, year: number): string[] {
  const theme = comboData.theme.toLowerCase();

  if (theme.includes('halloween')) {
    return ['Halloween 2025', 'spooky emoji', 'halloween aesthetic'];
  }

  if (theme.includes('christmas') || theme.includes('festive')) {
    return ['Christmas 2025', 'festive emoji', 'holiday aesthetic'];
  }

  if (theme.includes('valentine')) {
    return ['Valentine 2025', 'love emoji', 'romantic aesthetic'];
  }

  if (theme.includes('summer')) {
    return ['Summer 2025', 'summer vibes', 'beach emoji'];
  }

  if (theme.includes('winter')) {
    return ['Winter 2025', 'cozy vibes', 'winter aesthetic'];
  }

  if (theme.includes('fall') || theme.includes('autumn')) {
    return ['Fall 2025', 'autumn vibes', 'cozy aesthetic'];
  }

  if (theme.includes('spring')) {
    return ['Spring 2025', 'spring vibes', 'blooming aesthetic'];
  }

  // Default trending keywords
  return [`${year} aesthetic`, 'trending emoji', 'viral combo'];
}

/**
 * Generate JSON-LD structured data
 */
export function generateStructuredData(comboData: ComboData): Record<string, any> {
  const imageUrl = comboData.png_url
    ? `https://ayotype.com${comboData.png_url}`
    : 'https://ayotype.com/og-image.png';

  return {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: `${comboData.name} - Combo of the Day`,
    description: comboData.description,
    datePublished: comboData.date,
    author: {
      '@type': 'Organization',
      name: 'EmojiFusion'
    },
    publisher: {
      '@type': 'Organization',
      name: 'Ayotype',
      url: 'https://ayotype.com'
    },
    image: imageUrl,
    keywords: [comboData.theme, comboData.tone, 'emoji', 'combo'].join(', ')
  };
}

/**
 * Generate Open Graph tags for social sharing
 */
export function generateOpenGraphTags(comboData: ComboData): Record<string, string> {
  const title = `${comboData.name} - Emoji Combo of the Day`;
  const description = `${comboData.description} | ${comboData.combo}`;
  const imageUrl = comboData.png_url
    ? `https://ayotype.com${comboData.png_url}`
    : 'https://ayotype.com/og-image.png';
  const url = `https://ayotype.com/combo-of-the-day/${comboData.date}`;

  return {
    'og:title': truncate(title, 60),
    'og:description': truncate(description, 160),
    'og:type': 'article',
    'og:url': url,
    'og:image': imageUrl,
    'og:image:width': '800',
    'og:image:height': '400',
    'og:site_name': 'Ayotype EmojiFusion'
  };
}

/**
 * Generate Twitter Card tags
 */
export function generateTwitterCardTags(comboData: ComboData): Record<string, string> {
  const title = `${comboData.name} - Emoji Combo`;
  const description = `${comboData.description} | ${comboData.combo}`;
  const imageUrl = comboData.png_url
    ? `https://ayotype.com${comboData.png_url}`
    : 'https://ayotype.com/og-image.png';

  return {
    'twitter:card': 'summary_large_image',
    'twitter:site': '@ayotype',
    'twitter:title': truncate(title, 60),
    'twitter:description': truncate(description, 160),
    'twitter:image': imageUrl
  };
}

/**
 * Truncate text to maximum length
 */
function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }

  // Truncate at word boundary
  const truncated = text.substring(0, maxLength - 3);
  const lastSpace = truncated.lastIndexOf(' ');

  if (lastSpace > maxLength * 0.8) {
    return truncated.substring(0, lastSpace) + '...';
  }

  return truncated + '...';
}
