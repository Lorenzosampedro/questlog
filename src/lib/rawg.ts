import "server-only";
import { mapRawgGame, type RawgApiGame, type RawgGameSummary } from "@/lib/rawg-mapper";

export type { RawgGameSummary } from "@/lib/rawg-mapper";

const RAWG_BASE_URL = "https://api.rawg.io/api";

type RawgSearchResponse = {
  results: RawgApiGame[];
};

export async function searchGames(query: string): Promise<RawgGameSummary[]> {
  if (!query.trim()) return [];

  const url = new URL(`${RAWG_BASE_URL}/games`);
  url.searchParams.set("key", process.env.RAWG_API_KEY!);
  url.searchParams.set("search", query);
  url.searchParams.set("page_size", "10");

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`RAWG search failed: ${res.status}`);
  }

  const data: RawgSearchResponse = await res.json();

  return data.results.map(mapRawgGame);
}
