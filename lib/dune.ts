export type PlatformKey = "kalshi" | "polymarket";

export interface DataRow {
  timestamp: string; // ISO string (UTC)
  volume_usd: number;
  open_interest_usd: number;
}

/**
 * Fetches results from Dune Analytics API
 * First tries to get latest results, if empty, executes the query and waits for results
 */
export async function fetchDuneResults(queryId: number): Promise<any[]> {
  const apiKey = process.env.DUNE_API_KEY;
  if (!apiKey) {
    throw new Error("DUNE_API_KEY environment variable is not set");
  }

  // First, try to get latest results
  const resultsUrl = `https://api.dune.com/api/v1/query/${queryId}/results?limit=10000`;
  const resultsResponse = await fetch(resultsUrl, {
    headers: {
      "X-Dune-API-Key": apiKey,
    },
  });

  if (!resultsResponse.ok) {
    const errorText = await resultsResponse.text();
    throw new Error(`Dune API error: ${resultsResponse.status} ${resultsResponse.statusText} - ${errorText}`);
  }

  const resultsData = await resultsResponse.json();
  const rows = resultsData.result?.rows || [];
  
  // If we have results, return them
  if (rows.length > 0) {
    console.log(`[Dune] Fetched ${rows.length} rows from query ${queryId}`);
    return rows;
  }

  // If no results, try to execute the query
  console.log(`[Dune] No results found for query ${queryId}, attempting to execute...`);
  
  const executeUrl = `https://api.dune.com/api/v1/query/${queryId}/execute`;
  const executeResponse = await fetch(executeUrl, {
    method: "POST",
    headers: {
      "X-Dune-API-Key": apiKey,
      "Content-Type": "application/json",
    },
  });

  if (!executeResponse.ok) {
    const errorText = await executeResponse.text();
    console.warn(`[Dune] Failed to execute query ${queryId}: ${executeResponse.status} ${errorText}`);
    // Return empty array instead of throwing - allows fallback to other data sources
    return [];
  }

  const executeData = await executeResponse.json();
  const executionId = executeData.execution_id;
  
  if (!executionId) {
    console.warn(`[Dune] No execution_id returned for query ${queryId}`);
    return [];
  }

  // Poll for results (wait up to 30 seconds)
  console.log(`[Dune] Query ${queryId} execution started, execution_id: ${executionId}`);
  
  const maxAttempts = 30;
  const pollInterval = 1000; // 1 second
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await new Promise(resolve => setTimeout(resolve, pollInterval));
    
    const statusUrl = `https://api.dune.com/api/v1/execution/${executionId}/status`;
    const statusResponse = await fetch(statusUrl, {
      headers: {
        "X-Dune-API-Key": apiKey,
      },
    });

    if (!statusResponse.ok) {
      console.warn(`[Dune] Failed to check execution status: ${statusResponse.status}`);
      break;
    }

    const statusData = await statusResponse.json();
    
    if (statusData.state === "QUERY_STATE_COMPLETED") {
      // Get results
      const finalResultsUrl = `https://api.dune.com/api/v1/execution/${executionId}/results`;
      const finalResultsResponse = await fetch(finalResultsUrl, {
        headers: {
          "X-Dune-API-Key": apiKey,
        },
      });

      if (finalResultsResponse.ok) {
        const finalResultsData = await finalResultsResponse.json();
        const finalRows = finalResultsData.result?.rows || [];
        console.log(`[Dune] Query ${queryId} completed, fetched ${finalRows.length} rows`);
        return finalRows;
      }
    } else if (statusData.state === "QUERY_STATE_FAILED") {
      console.error(`[Dune] Query ${queryId} execution failed:`, statusData);
      break;
    }
    
    // Still running, continue polling
  }

  console.warn(`[Dune] Query ${queryId} execution timed out after ${maxAttempts} attempts`);
  return [];
}

/**
 * Maps Dune API rows to standardized DataRow format
 * Handles column name variations per platform
 */
export function mapRows(rows: any[], platform: PlatformKey): DataRow[] {
  if (!rows || rows.length === 0) {
    return [];
  }

  // Column name variations
  const timestampColumns = ["timestamp", "ts", "day", "block_time", "date", "week"];
  const volumeColumns = ["volume_usd", "volume", "volumeUSD", "volume_usd", "notional usd volume"];
  const oiColumns = ["open_interest_usd", "open_interest", "openInterestUSD", "open_interest_usd"];

  // Find actual column names (case-insensitive)
  const firstRow = rows[0];
  const keys = Object.keys(firstRow).map(k => k.toLowerCase());

  const timestampKey = Object.keys(firstRow).find(
    k => timestampColumns.some(col => k.toLowerCase() === col.toLowerCase())
  );
  const volumeKey = Object.keys(firstRow).find(
    k => volumeColumns.some(col => k.toLowerCase() === col.toLowerCase())
  );
  const oiKey = Object.keys(firstRow).find(
    k => oiColumns.some(col => k.toLowerCase() === col.toLowerCase())
  );

  if (!timestampKey) {
    console.warn(`No timestamp column found for platform ${platform}`);
    return [];
  }

  return rows
    .map(row => {
      const timestamp = row[timestampKey];
      const volume = volumeKey ? row[volumeKey] : 0;
      const openInterest = oiKey ? row[oiKey] : 0;

      // Convert timestamp to ISO string (UTC)
      let isoTimestamp: string;
      if (timestamp instanceof Date) {
        isoTimestamp = timestamp.toISOString();
      } else if (typeof timestamp === "string") {
        // Try to parse and convert to ISO
        const date = new Date(timestamp);
        if (isNaN(date.getTime())) {
          return null; // Invalid date
        }
        isoTimestamp = date.toISOString();
      } else if (typeof timestamp === "number") {
        // Assume Unix timestamp (seconds or milliseconds)
        const date = new Date(timestamp * (timestamp < 1e10 ? 1000 : 1));
        isoTimestamp = date.toISOString();
      } else {
        return null; // Unknown format
      }

      return {
        timestamp: isoTimestamp,
        volume_usd: Number(volume) || 0,
        open_interest_usd: Number(openInterest) || 0,
      };
    })
    .filter((row): row is DataRow => row !== null);
}

