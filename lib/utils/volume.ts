/**
 * Formats volume numbers to human-readable strings
 * Examples: 1500000 -> "1.5M VOL", 500 -> "500 VOL"
 */
export function formatVolume(volume: number): string {
  if (volume >= 1_000_000_000) {
    return `${(volume / 1_000_000_000).toFixed(1)}B VOL`;
  } else if (volume >= 1_000_000) {
    return `${(volume / 1_000_000).toFixed(1)}M VOL`;
  } else if (volume >= 1_000) {
    return `${(volume / 1_000).toFixed(1)}K VOL`;
  }
  return `${volume.toFixed(0)} VOL`;
}





