import type { DataRow, PlatformKey } from "../dune";

/**
 * DeFi Llama API Client
 * Documentation: https://defillama.com/docs/api
 * 
 * DeFi Llama provides daily volume data for prediction markets,
 * which gives us accurate 24-hour volume instead of weekly approximations.
 */
export interface DefiLlamaProtocolData {
  date: string; // YYYY-MM-DD
  volume: number;
  [key: string]: any;
}

/**
 * Platform mapping from our PlatformKey to DeFi Llama protocol slugs
 * Based on DeFi Llama's protocol identifiers
 */
const PLATFORM_SLUGS: Record<PlatformKey, string> = {
  kalshi: "kalshi", // May need to verify actual slug
  polymarket: "polymarket",
};

/**
 * DEX slugs for volume data (from dimensions.dexs field)
 */
const DEX_SLUGS: Record<PlatformKey, string> = {
  kalshi: "kalshi", // May need to verify
  polymarket: "polymarket",
};

/**
 * Fetches daily volume data from DeFi Llama API
 * @param platform - Platform to fetch data for
 * @param timeWindow - Time window for data (24h, 7d, 30d)
 * @returns Array of DataRow objects with daily volume
 */
export async function fetchDefiLlamaData(
  platform: PlatformKey,
  timeWindow: "24h" | "7d" | "30d" | "all"
): Promise<DataRow[]> {
  try {
    const protocolSlug = PLATFORM_SLUGS[platform];
    if (!protocolSlug) {
      console.warn(`No DeFi Llama slug found for platform: ${platform}`);
      return [];
    }

    // DeFi Llama API endpoint for protocol volume
    // Format: https://api.llama.fi/protocol/{slug}
    const baseUrl = "https://api.llama.fi";
    
    // Calculate date range
    const now = new Date();
    const endDate = new Date(now);
    let startDate = new Date(now);
    
    switch (timeWindow) {
      case "24h":
        startDate.setDate(now.getDate() - 1);
        break;
      case "7d":
        startDate.setDate(now.getDate() - 7);
        break;
      case "30d":
        startDate.setDate(now.getDate() - 30);
        break;
      case "all":
        startDate.setFullYear(2020); // Start from platform launch
        break;
    }

    // DeFi Llama API endpoints:
    // 1. Protocol info: /protocol/{slug}
    // 2. DEX volume: /dexs/{dexSlug} (for protocols with DEX dimension)
    // 3. Historical volume: Check protocol dimensions for volume endpoint
    
    // First, get protocol info to check dimensions
    const protocolUrl = `${baseUrl}/protocol/${protocolSlug}`;
    const protocolResponse = await fetch(protocolUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!protocolResponse.ok) {
      throw new Error(`DeFi Llama API error: ${protocolResponse.status} ${protocolResponse.statusText}`);
    }

    const protocolData = await protocolResponse.json();
    const dimensions = protocolData?.dimensions || {};
    
    // Try DEX volume endpoint if available
    if (dimensions.dexs) {
      const dexSlug = dimensions.dexs;
      const dexUrl = `${baseUrl}/dexs/${dexSlug}`;
      
      try {
        const dexResponse = await fetch(dexUrl, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (dexResponse.ok) {
          const dexData = await dexResponse.json();
          return transformDefiLlamaDexData(dexData, startDate, endDate);
        }
      } catch (error) {
        console.warn(`DEX endpoint failed for ${platform}, trying protocol endpoint:`, error);
      }
    }
    
    // Fallback: Try to get volume from protocol endpoint
    // Some protocols may have volume data in the protocol response
    return transformDefiLlamaData(protocolData, startDate, endDate);
  } catch (error) {
    console.error(`Error fetching DeFi Llama data for ${platform}:`, error);
    return [];
  }
}

/**
 * Transforms DeFi Llama DEX volume response to DataRow format
 */
function transformDefiLlamaDexData(
  data: any,
  startDate: Date,
  endDate: Date
): DataRow[] {
  // DeFi Llama DEX endpoint structure
  // Response may contain daily volume data in various formats
  // Common structure: { volume: [{ date: timestamp, volume: number }] }
  
  if (!data) {
    return [];
  }

  // Check for volume array in response
  let volumeData: any[] = [];
  
  if (Array.isArray(data.volume)) {
    volumeData = data.volume;
  } else if (Array.isArray(data.volumes)) {
    volumeData = data.volumes;
  } else if (Array.isArray(data)) {
    volumeData = data;
  } else if (data.data && Array.isArray(data.data)) {
    volumeData = data.data;
  } else if (data.chainData) {
    // Some DEX endpoints return chainData with volume
    const chains = Object.values(data.chainData) as any[];
    volumeData = chains.flatMap((chain: any) => chain.volume || []);
  }

  if (volumeData.length === 0) {
    return [];
  }

  // Filter by date range and transform
  return volumeData
    .filter((item: any) => {
      if (!item.date && !item.timestamp) return false;
      const itemDate = new Date(item.date * 1000 || item.timestamp * 1000 || item.date);
      return itemDate >= startDate && itemDate <= endDate;
    })
    .map((item: any) => {
      const date = new Date(item.date * 1000 || item.timestamp * 1000 || item.date);
      // Volume might be in different units (USD, millions, etc.)
      const volume = Number(item.volume || item.volumeUSD || item.dailyVolumeUSD || 0);
      return {
        timestamp: date.toISOString(),
        volume_usd: volume,
        open_interest_usd: Number(item.openInterest || item.tvl || 0),
      };
    });
}

/**
 * Transforms DeFi Llama protocol response to DataRow format
 * Protocol endpoint may not directly return volume data
 */
function transformDefiLlamaData(
  data: any,
  startDate: Date,
  endDate: Date
): DataRow[] {
  // Protocol endpoint typically returns metadata, not volume
  // Return empty array - volume should come from DEX endpoint
  return [];
}

/**
 * Fetches data for all platforms from DeFi Llama
 */
export async function fetchAllDefiLlamaData(
  timeWindow: "24h" | "7d" | "30d" | "all"
): Promise<Map<PlatformKey, DataRow[]>> {
  const platforms: PlatformKey[] = ["kalshi", "polymarket"];
  
  const results = await Promise.all(
    platforms.map(async (platform) => {
      const data = await fetchDefiLlamaData(platform, timeWindow);
      return [platform, data] as [PlatformKey, DataRow[]];
    })
  );

  return new Map(results);
}

