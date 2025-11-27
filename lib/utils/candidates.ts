/**
 * Extracts candidate names from multi-outcome markets
 * Handles different patterns: "Will [TEAM] win?", "[EVENT] - [TEAM]", etc.
 */
export interface Candidate {
  name: string;
  odds: number;
}

/**
 * Extracts candidate name from market question using various patterns
 */
function extractCandidateName(question: string, eventTitle: string): string {
  // Pattern 1: "Will [TEAM] win [EVENT]?" -> extract team name
  const willWinMatch = question.match(/will\s+(.+?)\s+win\s+/i);
  if (willWinMatch) {
    return willWinMatch[1].trim();
  }
  
  // Pattern 2: "[EVENT] - [TEAM]" -> extract team name
  if (question.includes(' - ')) {
    return question.split(' - ').pop()?.trim() || question;
  }
  
  // Pattern 3: Remove event title and clean up
  if (question.includes(eventTitle)) {
    let candidateName = question.replace(eventTitle, '').trim();
    // Remove common prefixes/suffixes
    candidateName = candidateName.replace(/^[-–—]\s*/, '').trim();
    candidateName = candidateName.replace(/^will\s+/i, '').trim();
    candidateName = candidateName.replace(/\?$/, '').trim();
    return candidateName;
  }
  
  // Pattern 4: "Who will win [EVENT]? [TEAM]" -> extract team
  const parts = question.split(/[?\-–—]/);
  if (parts.length > 1) {
    return parts[parts.length - 1].trim();
  }
  
  return question;
}

/**
 * Extracts candidates from Polymarket markets
 * Handles multi-outcome markets (teams, candidates) and binary Yes/No markets
 */
export function extractCandidatesFromPolymarket(
  markets: any[],
  eventTitle: string
): Candidate[] {
  const candidates: Candidate[] = [];
  
  try {
    // For multi-outcome markets (like Super Bowl teams), each outcome is a separate market
    if (markets.length > 1) {
      markets.forEach((m: any) => {
        const question = m.question || '';
        let candidateName = extractCandidateName(question, eventTitle);
        
        // Clean up the name
        candidateName = candidateName.replace(/^(will|who|what|when|where)\s+/i, '').trim();
        candidateName = candidateName.replace(/\?$/, '').trim();
        
        // Parse price for this market
        const outcomePrices = typeof m.outcomePrices === 'string' 
          ? JSON.parse(m.outcomePrices) 
          : m.outcomePrices;
        
        if (Array.isArray(outcomePrices) && outcomePrices.length > 0) {
          const price = outcomePrices[0]; // First outcome price (Yes price for binary markets)
          if (price !== undefined && price !== null && candidateName && 
              candidateName.toLowerCase() !== 'yes' && 
              candidateName.toLowerCase() !== 'no' &&
              candidateName.trim() !== '') {
            candidates.push({
              name: candidateName.toUpperCase(),
              odds: Math.round(Number(price) * 100),
            });
          }
        }
      });
      
      // Sort by odds (highest first) and take top 2
      if (candidates.length > 0) {
        candidates.sort((a, b) => b.odds - a.odds);
        return candidates.slice(0, 2);
      }
    }
    
    // If we didn't get candidates from multiple markets, try parsing from single market
    const market = markets[0];
    const outcomePrices = typeof market.outcomePrices === 'string' 
      ? JSON.parse(market.outcomePrices) 
      : market.outcomePrices;
    
    const outcomes = typeof market.outcomes === 'string' 
      ? JSON.parse(market.outcomes) 
      : market.outcomes || [];
    
    let yes = 50;
    let no = 50;
    
    if (Array.isArray(outcomePrices) && outcomePrices.length >= 2) {
      yes = Math.round(Number(outcomePrices[0]) * 100);
      no = Math.round(Number(outcomePrices[1]) * 100);
    }

    // Get candidate names from outcomes array
    if (Array.isArray(outcomes) && outcomes.length > 0) {
      // Check if this is a binary Yes/No market or has named candidates
      const hasNamedCandidates = outcomes.some((o: string) => 
        o !== 'Yes' && o !== 'No' && o.trim() !== ''
      );
      
      if (hasNamedCandidates) {
        // Market with named candidates - map each outcome to its price
        outcomes.forEach((name: string, idx: number) => {
          if (name && name !== 'Yes' && name !== 'No') {
            const price = outcomePrices[idx];
            if (price !== undefined && price !== null) {
              candidates.push({
                name: name.toUpperCase(),
                odds: Math.round(Number(price) * 100),
              });
            }
          }
        });
        
        // Sort by odds and take top 2
        if (candidates.length > 0) {
          candidates.sort((a, b) => b.odds - a.odds);
          return candidates.slice(0, 2);
        }
      }
    }
    
    // If still no named candidates, use Yes/No
    if (candidates.length === 0) {
      return [
        { name: "YES", odds: yes },
        { name: "NO", odds: no },
      ];
    }
  } catch (e) {
    console.warn(`[Candidates] Failed to parse market data:`, e);
    return [
      { name: "YES", odds: 50 },
      { name: "NO", odds: 50 },
    ];
  }
  
  return candidates;
}

