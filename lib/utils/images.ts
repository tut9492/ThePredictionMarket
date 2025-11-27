/**
 * Gets image URL with fallback logic
 * Priority: API image (if valid) > Fallback image
 */
export function getImageUrl(
  apiImage: string | undefined,
  fallback: string
): string {
  if (apiImage && apiImage.trim() !== '' && apiImage.startsWith('http')) {
    return apiImage;
  }
  return fallback;
}

/**
 * Normalizes image URLs from different formats
 * Handles relative URLs, absolute URLs, etc.
 */
export function normalizeImageUrl(
  imageUrl: string,
  baseDomain: string = 'polymarket.com'
): string {
  if (imageUrl.startsWith('/')) {
    return `https://${baseDomain}${imageUrl}`;
  }
  if (imageUrl.startsWith('http')) {
    return imageUrl;
  }
  return `https://${baseDomain}/${imageUrl}`;
}

/**
 * Extracts image from event/market data with fallback
 * Checks multiple possible image fields
 */
export function extractImageUrl(
  event: any,
  market: any,
  fallback: string = ''
): string {
  const imageUrl = event.image || 
                   event.icon || 
                   market.image || 
                   market.icon ||
                   (event as any).imageUrl ||
                   (event as any).thumbnail ||
                   (market as any).imageUrl ||
                   (market as any).thumbnail;
  
  if (imageUrl && imageUrl.trim() !== '') {
    return normalizeImageUrl(imageUrl);
  }
  
  return fallback;
}

