/**
 * Matches events/markets by search terms
 * Requires 60%+ term match with at least one exact word match
 * Prioritizes exact word matches over substring matches
 */
export interface SearchResult {
  event: any;
  score: number;
  totalTerms: number;
}

export function matchSearchTerms(
  events: any[],
  searchTerms: string[],
  getTitle: (event: any) => string = (e) => e.title || '',
  getSlug: (event: any) => string = (e) => e.slug || '',
  getVolume: (event: any) => number = (e) => e.volume || e.volume24hr || 0
): any | null {
  // Score each event based on how many search terms match
  const scoredEvents = events.map((event: any) => {
    const title = getTitle(event).toLowerCase();
    const slug = getSlug(event).toLowerCase();
    
    // Split into words for exact matching
    const titleWords = title.split(/\s+/);
    const slugWords = slug.split(/\s+/);
    const allWords = [...titleWords, ...slugWords];
    
    let matchCount = 0;
    let exactMatchCount = 0;
    
    searchTerms.forEach(term => {
      const lowerTerm = term.toLowerCase();
      // Check for exact word match (more important)
      if (allWords.includes(lowerTerm)) {
        exactMatchCount++;
        matchCount++;
      } else if (title.includes(lowerTerm) || slug.includes(lowerTerm)) {
        // Substring match (less important)
        matchCount++;
      }
    });
    
    return { 
      event, 
      score: matchCount, 
      exactScore: exactMatchCount,
      totalTerms: searchTerms.length 
    };
  });
  
  // Require at least 60% match AND at least one exact word match
  const minMatch = Math.ceil(searchTerms.length * 0.6);
  const validMatches = scoredEvents
    .filter(({ score, exactScore, totalTerms }) => 
      score >= minMatch && exactScore > 0
    )
    .sort((a, b) => {
      // Sort by exact matches first, then total matches, then volume
      if (b.exactScore !== a.exactScore) {
        return b.exactScore - a.exactScore;
      }
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      const volA = getVolume(a.event);
      const volB = getVolume(b.event);
      return volB - volA;
    });
  
  return validMatches.length > 0 ? validMatches[0].event : null;
}



