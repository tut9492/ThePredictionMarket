/**
 * Gets image URL with fallback logic
 * Priority: API image (if valid) > Fallback image
 * Handles full URLs, relative URLs, and other formats
 */
export function getImageUrl(
  apiImage: string | undefined,
  fallback: string
): string {
  if (!apiImage || apiImage.trim() === '') {
    return fallback;
  }
  
  const trimmed = apiImage.trim();
  
  // If already a full URL, use it
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  
  // If relative URL (starts with /), make it absolute
  if (trimmed.startsWith('/')) {
    return `https://polymarket.com${trimmed}`;
  }
  
  // If it looks like a valid URL path, try to normalize
  if (trimmed.length > 0 && !trimmed.includes(' ')) {
    // Check if it's a valid image URL pattern
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
    const hasImageExtension = imageExtensions.some(ext => trimmed.toLowerCase().includes(ext));
    
    if (hasImageExtension || trimmed.includes('polymarket') || trimmed.includes('s3')) {
      // Likely a valid image URL, normalize it
      return `https://polymarket.com/${trimmed}`;
    }
  }
  
  // If we can't determine it's a valid image URL, use fallback
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



