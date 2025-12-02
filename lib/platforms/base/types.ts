/**
 * Base types for platform adapters
 * All platforms must implement these interfaces
 */

export type MarketCategory = "POLITICS" | "SPORTS" | "CRYPTO" | "SOCIAL" | "DATA" | "Other";

export interface MarketConfig {
  key: string;
  searchTerms: string[];
  category: MarketCategory;
  image: string;
}

export interface Candidate {
  name: string;
  odds: number;
}

export interface ProcessedMarket {
  title: string;
  candidates: Candidate[];
  volume: string;
  url: string;
  image?: string;
}

export interface MarketSearchResult {
  title: string;
  candidates: Candidate[];
  volume: string;
  url: string;
  image?: string;
}

/**
 * Platform adapter interface
 * Each platform (Polymarket, Kalshi, etc.) must implement this
 */
export interface PlatformAdapter {
  /**
   * Platform name (e.g., "Polymarket", "Kalshi")
   */
  readonly name: string;

  /**
   * API base URL
   */
  readonly apiBase: string;

  /**
   * Website base URL
   */
  readonly websiteBase: string;

  /**
   * Market configurations for this platform
   */
  readonly configs: MarketConfig[];

  /**
   * Search for a market using search terms
   * @param searchTerms - Array of search terms to match
   * @returns Market data or null if not found
   */
  searchMarket(searchTerms: string[]): Promise<MarketSearchResult | null>;

  /**
   * Get referral URL for a market
   * @param slug - Market slug/identifier
   * @returns URL with referral code
   */
  getReferralUrl(slug: string): string;

  /**
   * Extract category from market data
   * @param market - Raw market data from API
   * @returns Category string
   */
  extractCategory(market: any): MarketCategory;
}




