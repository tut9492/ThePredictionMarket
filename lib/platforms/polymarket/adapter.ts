/**
 * Polymarket Platform Adapter
 * Implements PlatformAdapter interface for Polymarket integration
 */

import { PlatformAdapter, MarketConfig, MarketSearchResult, MarketCategory, Candidate } from '../base/types';
import { formatVolume } from '../../utils/volume';
import { extractImageUrl } from '../../utils/images';
import { matchSearchTerms } from '../../utils/search';
import { extractCandidatesFromPolymarket } from '../../utils/candidates';
import { addPolymarketReferral } from '../../utils/polymarket';

export class PolymarketAdapter implements PlatformAdapter {
  readonly name = 'Polymarket';
  readonly apiBase = 'https://gamma-api.polymarket.com';
  readonly websiteBase = 'https://polymarket.com';
  
  readonly configs: MarketConfig[] = [
    {
      key: "superBowl",
      searchTerms: ["super", "bowl", "champion", "2026"],
      category: "SPORTS",
      image: "/superbowl.png",
    },
    {
      key: "demNominee2028",
      searchTerms: ["democratic", "presidential", "nominee", "2028"],
      category: "POLITICS",
      image: "/democrats.jpg",
    },
    {
      key: "pokerChampionship",
      searchTerms: ["heads-up", "poker", "championship", "2025", "national"],
      category: "SPORTS",
      image: "/superbowl.png",
    },
    {
      key: "f1Champion",
      searchTerms: ["f1", "drivers", "champion", "lando", "norris"],
      category: "SPORTS",
      image: "/superbowl.png",
    },
    {
      key: "fedDecision",
      searchTerms: ["fed", "decision", "december", "bps"],
      category: "CRYPTO",
      image: "/superbowl.png",
    },
    {
      key: "presElection2028",
      searchTerms: ["presidential", "election", "winner", "2028"],
      category: "POLITICS",
      image: "/democrats.jpg",
    },
    {
      key: "premierLeague",
      searchTerms: ["english", "premier", "league", "winner", "arsenal"],
      category: "SPORTS",
      image: "/superbowl.png",
    },
    {
      key: "repNominee2028",
      searchTerms: ["republican", "presidential", "nominee", "2028"],
      category: "POLITICS",
      image: "/democrats.jpg",
    },
    {
      key: "championsLeague",
      searchTerms: ["uefa", "champions", "league", "winner"],
      category: "SPORTS",
      image: "/superbowl.png",
    },
    {
      key: "chileElection",
      searchTerms: ["chile", "presidential", "election"],
      category: "POLITICS",
      image: "/democrats.jpg",
    },
    {
      key: "highestGrossingMovie",
      searchTerms: ["highest", "grossing", "movie", "2025", "wicked"],
      category: "SOCIAL",
      image: "/superbowl.png",
    },
    {
      key: "bitcoinPrice2025",
      searchTerms: ["bitcoin", "price", "2025", "hit"],
      category: "CRYPTO",
      image: "/superbowl.png",
    },
    {
      key: "xiJinpingOut",
      searchTerms: ["xi", "jinping", "out", "2025"],
      category: "POLITICS",
      image: "/democrats.jpg",
    },
    {
      key: "nbaChampion2026",
      searchTerms: ["nba", "champion", "2026", "thunder"],
      category: "SPORTS",
      image: "/superbowl.png",
    },
    {
      key: "largestCompany2025",
      searchTerms: ["largest", "company", "2025", "nvidia"],
      category: "CRYPTO",
      image: "/superbowl.png",
    },
    {
      key: "ethereumPrice2025",
      searchTerms: ["ethereum", "price", "2025", "hit"],
      category: "CRYPTO",
      image: "/superbowl.png",
    },
    {
      key: "bitcoinPriceNovember",
      searchTerms: ["bitcoin", "price", "november", "200000"],
      category: "CRYPTO",
      image: "/superbowl.png",
    },
    {
      key: "spotifyArtist2025",
      searchTerms: ["spotify", "artist", "2025", "bad", "bunny"],
      category: "SOCIAL",
      image: "/superbowl.png",
    },
    {
      key: "russiaUkraineCeasefire",
      searchTerms: ["russia", "ukraine", "ceasefire", "2025"],
      category: "POLITICS",
      image: "/democrats.jpg",
    },
    {
      key: "laLigaWinner",
      searchTerms: ["la", "liga", "winner", "real", "madrid"],
      category: "SPORTS",
      image: "/superbowl.png",
    },
  ];

  async searchMarket(searchTerms: string[]): Promise<MarketSearchResult | null> {
    try {
      const url = new URL(`${this.apiBase}/events`);
      url.searchParams.set("active", "true");
      url.searchParams.set("closed", "false");
      url.searchParams.set("limit", "200");
      url.searchParams.set("order", "volume");
      url.searchParams.set("ascending", "false");

      const response = await fetch(url.toString(), {
        next: { revalidate: 60 },
        signal: AbortSignal.timeout(15000),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.error(`[${this.name}] API error: ${response.status}`);
        return null;
      }

      const events: any[] = await response.json();
      
      if (!Array.isArray(events) || events.length === 0) {
        return null;
      }

      // Use utility function to match search terms
      const matchingEvent = matchSearchTerms(
        events,
        searchTerms,
        (e) => e.title || '',
        (e) => e.slug || '',
        (e) => e.volume || e.volume24hr || 0
      );

      if (!matchingEvent) {
        console.warn(`[${this.name}] No match found for: ${searchTerms.join(', ')}`);
        return null;
      }
      
      console.log(`[${this.name}] Matched "${matchingEvent.title}" for search: ${searchTerms.join(', ')}`);

      const markets = matchingEvent.markets || [];
      if (markets.length === 0) {
        return null;
      }

      // Extract candidates using utility function
      const candidates = extractCandidatesFromPolymarket(markets, matchingEvent.title || '');

      // Get volume - prefer all-time volume, fallback to 24h volume
      const volume = matchingEvent.volume || matchingEvent.volume24hr || matchingEvent.volume7d || 0;
      const volumeNum = typeof volume === 'string' ? parseFloat(volume) : volume;
      const volumeFormatted = formatVolume(volumeNum);
      
      // Extract image using utility function
      const imageUrl = extractImageUrl(matchingEvent, markets[0], '');
      
      // Build URL with referral
      const slug = matchingEvent.slug || matchingEvent.ticker || '';
      const baseUrl = `${this.websiteBase}/event/${slug}`;
      const urlWithReferral = addPolymarketReferral(baseUrl);

      return {
        title: matchingEvent.title || markets[0].question || 'Unknown Market',
        candidates,
        volume: volumeFormatted,
        url: urlWithReferral,
        image: imageUrl || undefined,
      };
    } catch (error) {
      console.error(`[${this.name}] Error searching markets:`, error);
      return null;
    }
  }

  getReferralUrl(slug: string): string {
    const baseUrl = `${this.websiteBase}/event/${slug}`;
    return addPolymarketReferral(baseUrl);
  }

  extractCategory(market: any): MarketCategory {
    // First try Polymarket's category
    if (market.category) {
      return market.category as MarketCategory;
    }
    
    // Fallback: infer from question text
    const question = (market.question || '').toLowerCase();
    
    if (question.includes('bitcoin') || 
        question.includes('crypto') || 
        question.includes('ethereum') ||
        question.includes('btc') ||
        question.includes('eth')) {
      return 'CRYPTO';
    }
    
    if (question.includes('nfl') || 
        question.includes('nba') || 
        question.includes('mlb') ||
        question.includes('champion') ||
        question.includes('sports') ||
        question.includes('team') ||
        question.includes('match')) {
      return 'SPORTS';
    }
    
    if (question.includes('election') || 
        question.includes('president') || 
        question.includes('trump') ||
        question.includes('biden') ||
        question.includes('politics') ||
        question.includes('government') ||
        question.includes('congress')) {
      return 'POLITICS';
    }
    
    if (question.includes('social') ||
        question.includes('twitter') ||
        question.includes('tiktok')) {
      return 'SOCIAL';
    }
    
    if (question.includes('data') ||
        question.includes('statistics') ||
        question.includes('metric')) {
      return 'DATA';
    }
    
    return 'Other';
  }
}

