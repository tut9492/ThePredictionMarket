/**
 * Utility functions for Polymarket integration
 */

const REFERRAL_CODE = 'tut';

/**
 * Adds referral parameter to Polymarket URLs
 * @param url - The Polymarket URL (can be full URL or just path)
 * @returns URL with ?via=tut parameter added
 */
export function addPolymarketReferral(url: string): string {
  if (!url || typeof url !== 'string') return url || '';
  
  // Handle both full URLs and relative paths
  try {
    // If URL doesn't start with http, assume it's a relative path
    const fullUrl = url.startsWith('http') ? url : `https://polymarket.com${url.startsWith('/') ? url : '/' + url}`;
    const urlObj = new URL(fullUrl);
    
    // Only add referral if it's a polymarket.com URL
    if (urlObj.hostname === 'polymarket.com' || urlObj.hostname.includes('polymarket.com')) {
      urlObj.searchParams.set('via', REFERRAL_CODE);
      return urlObj.toString();
    }
    
    return url;
  } catch (error) {
    // If URL parsing fails, try simple string manipulation
    if (url.includes('polymarket.com')) {
      const separator = url.includes('?') ? '&' : '?';
      return `${url}${separator}via=${REFERRAL_CODE}`;
    }
    return url;
  }
}

/**
 * Gets the referral code being used
 */
export function getReferralCode(): string {
  return REFERRAL_CODE;
}

