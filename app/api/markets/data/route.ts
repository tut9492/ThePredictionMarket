import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";

export const dynamic = 'force-dynamic';
export const revalidate = 30; // Cache for 30 seconds

const DATA_FILE = join(process.cwd(), 'data', 'markets.json');

/**
 * GET /api/markets/data
 * Returns stored market data from the backend
 */
export async function GET() {
  try {
    // Try to read the stored data file
    const fileContents = await readFile(DATA_FILE, 'utf-8');
    const markets = JSON.parse(fileContents);

    return NextResponse.json({
      success: true,
      data: markets,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    // If file doesn't exist or can't be read, return empty
    console.warn('[Markets Data] File not found or error reading:', error);
    return NextResponse.json({
      success: true,
      data: {},
      message: 'No market data available. Run /api/markets/sync first.',
      timestamp: new Date().toISOString(),
    });
  }
}




