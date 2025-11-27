/**
 * Matches events/markets by search terms
 * Requires 50%+ term match, sorted by match score + volume
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
    
    let matchCount = 0;
    searchTerms.forEach(term => {
      const lowerTerm = term.toLowerCase();
      if (title.includes(lowerTerm) || slug.includes(lowerTerm)) {
        matchCount++;
      }
    });
    
    return { event, score: matchCount, totalTerms: searchTerms.length };
  });
  
  // Filter to events that match at least 50% of terms, then sort by best match
  const validMatches = scoredEvents
    .filter(({ score, totalTerms }) => score >= Math.ceil(totalTerms * 0.5))
    .sort((a, b) => {
      // Sort by match score (descending), then by volume (descending)
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      const volA = getVolume(a.event);
      const volB = getVolume(b.event);
      return volB - volA;
    });
  
  return validMatches.length > 0 ? validMatches[0].event : null;
}

