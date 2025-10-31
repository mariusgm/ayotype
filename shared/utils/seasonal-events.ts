/**
 * Seasonal Events Utility
 *
 * Detects seasonal events and holidays to generate contextual combo themes.
 * Helps drive traffic through trending seasonal content.
 */

export interface SeasonalEvent {
  name: string;
  keywords: string[];
  priority: 'high' | 'medium' | 'low';
  dateRange?: { start: Date; end: Date };
}

export interface SeasonalTheme {
  name: string;
  tone: 'cool' | 'cute' | 'chaotic' | 'romantic' | 'nostalgic' | 'minimal';
  description: string;
  words: string;
  seoKeywords: string[];
}

/**
 * Detect seasonal event for a given date
 */
export function detectSeasonalEvent(date: Date): SeasonalEvent | null {
  // Use UTC methods to avoid timezone issues
  const month = date.getUTCMonth() + 1; // JavaScript months are 0-indexed, convert to 1-12
  const day = date.getUTCDate();

  // Halloween - October 31
  if (month === 10 && day === 31) {
    return {
      name: 'Halloween',
      keywords: ['Halloween', 'spooky', 'trick-or-treat', 'haunted', 'costume', 'pumpkin', 'ghost'],
      priority: 'high'
    };
  }

  // New Year - December 31 or January 1
  if ((month === 12 && day === 31) || (month === 1 && day === 1)) {
    return {
      name: 'New Year',
      keywords: ['New Year', 'celebration', 'resolution', 'countdown', 'fireworks', 'party'],
      priority: 'high'
    };
  }

  // Valentine's Day - February 14
  if (month === 2 && day === 14) {
    return {
      name: 'Valentine\'s Day',
      keywords: ['Valentine', 'love', 'hearts', 'romantic', 'couple', 'date'],
      priority: 'high'
    };
  }

  // Independence Day - July 4
  if (month === 7 && day === 4) {
    return {
      name: 'Independence Day',
      keywords: ['July 4th', 'independence', 'fireworks', 'summer', 'celebration', 'patriotic'],
      priority: 'high'
    };
  }

  // Christmas - December 20-26
  if (month === 12 && day >= 20 && day <= 26) {
    return {
      name: 'Christmas',
      keywords: ['Christmas', 'festive', 'holiday', 'merry', 'santa', 'winter', 'celebration'],
      priority: 'high'
    };
  }

  // Thanksgiving - November 20-30
  if (month === 11 && day >= 20 && day <= 30) {
    return {
      name: 'Thanksgiving',
      keywords: ['Thanksgiving', 'grateful', 'autumn', 'harvest', 'feast'],
      priority: 'medium'
    };
  }

  // Spring - March, April, May
  if (month === 3 || month === 4 || month === 5) {
    return {
      name: 'Spring',
      keywords: ['spring', 'blooming', 'fresh', 'flowers', 'renewal'],
      priority: 'low'
    };
  }

  // Summer - June, July, August
  if (month === 6 || month === 7 || month === 8) {
    return {
      name: 'Summer',
      keywords: ['summer', 'sunny', 'beach', 'vacation', 'warm'],
      priority: 'low'
    };
  }

  // Fall - September, October, November
  if (month === 9 || month === 10 || month === 11) {
    return {
      name: 'Fall',
      keywords: ['fall', 'autumn', 'cozy', 'leaves', 'harvest'],
      priority: 'low'
    };
  }

  // Winter - December, January, February
  if (month === 12 || month === 1 || month === 2) {
    return {
      name: 'Winter',
      keywords: ['winter', 'cold', 'snow', 'cozy', 'frost'],
      priority: 'low'
    };
  }

  return null;
}

/**
 * Get seasonal theme for combo generation
 */
export function getSeasonalTheme(date: Date): SeasonalTheme {
  const event = detectSeasonalEvent(date);

  if (!event) {
    // Default fallback
    return {
      name: 'daily vibes',
      tone: 'cool',
      description: 'Fresh and unique',
      words: 'creative flow',
      seoKeywords: ['emoji', 'creative', 'daily combo', 'emoji fusion']
    };
  }

  const month = date.getMonth() + 1;
  const year = date.getFullYear();

  // Generate theme based on detected event
  switch (event.name) {
    case 'Halloween':
      return {
        name: 'halloween night',
        tone: 'chaotic',
        description: 'Spooky and eerie halloween celebration',
        words: 'spooky haunted trick-or-treat',
        seoKeywords: [
          'Halloween',
          'Halloween 2025',
          'spooky emoji',
          'halloween aesthetic',
          'October',
          'trick or treat emoji',
          'emoji fusion',
          'halloween vibes'
        ]
      };

    case 'Christmas':
      return {
        name: 'festive holidays',
        tone: 'cute',
        description: 'Warm and joyful christmas celebration',
        words: 'merry christmas festive jolly',
        seoKeywords: [
          'Christmas',
          `Christmas ${year}`,
          'festive emoji',
          'holiday vibes',
          'December',
          'merry christmas',
          'emoji fusion',
          'christmas aesthetic'
        ]
      };

    case 'New Year':
      return {
        name: 'new year celebration',
        tone: 'chaotic',
        description: 'Exciting countdown and fresh beginnings',
        words: 'countdown fireworks celebration new',
        seoKeywords: [
          'New Year',
          `New Year ${year}`,
          'countdown emoji',
          'celebration vibes',
          'January',
          'new beginnings',
          'emoji fusion',
          'party aesthetic'
        ]
      };

    case 'Valentine\'s Day':
      return {
        name: 'love and romance',
        tone: 'romantic',
        description: 'Sweet and heartfelt valentine celebration',
        words: 'love hearts romantic sweet',
        seoKeywords: [
          'Valentine\'s Day',
          `Valentine ${year}`,
          'love emoji',
          'romantic vibes',
          'February',
          'hearts emoji',
          'emoji fusion',
          'love aesthetic'
        ]
      };

    case 'Summer':
      return {
        name: 'summer vibes',
        tone: 'romantic',
        description: 'Warm and sunny summer days',
        words: 'sunny beach vacation warm',
        seoKeywords: [
          'Summer',
          `Summer ${year}`,
          'summer emoji',
          'beach vibes',
          'vacation aesthetic',
          'emoji fusion',
          'sunny days'
        ]
      };

    case 'Fall':
      return {
        name: 'autumn cozy',
        tone: 'nostalgic',
        description: 'Cozy and colorful fall season',
        words: 'cozy autumn leaves harvest',
        seoKeywords: [
          'Fall',
          'Autumn',
          `Fall ${year}`,
          'cozy emoji',
          'autumn vibes',
          'emoji fusion',
          'fall aesthetic'
        ]
      };

    case 'Winter':
      return {
        name: 'winter wonderland',
        tone: 'cute',
        description: 'Cold and magical winter season',
        words: 'snow cozy frost magical',
        seoKeywords: [
          'Winter',
          `Winter ${year}`,
          'winter emoji',
          'cozy vibes',
          'snow aesthetic',
          'emoji fusion',
          'winter wonderland'
        ]
      };

    case 'Spring':
      return {
        name: 'spring blooming',
        tone: 'cute',
        description: 'Fresh and blooming spring season',
        words: 'blooming fresh flowers renewal',
        seoKeywords: [
          'Spring',
          `Spring ${year}`,
          'spring emoji',
          'blooming vibes',
          'fresh aesthetic',
          'emoji fusion',
          'spring flowers'
        ]
      };

    default:
      // Generic seasonal theme
      return {
        name: event.name.toLowerCase(),
        tone: 'cool',
        description: `${event.name} celebration`,
        words: event.keywords.slice(0, 3).join(' '),
        seoKeywords: [
          event.name,
          `${event.name} ${year}`,
          ...event.keywords.slice(0, 3),
          'emoji fusion'
        ]
      };
  }
}
