import "server-only";

const RAWG_BASE_URL = "https://api.rawg.io/api";

export type RawgGameSummary = {
  rawgId: number;
  name: string;
  coverUrl: string | null;
  platforms: string[];
  genres: string[];
  releaseDate: string | null;
};

type RawgSearchResponse = {
  results: {
    id: number;
    name: string;
    background_image: string | null;
    platforms?: { platform: { id: number; name: string } }[];
    genres?: { id: number; name: string }[];
    released: string | null;
  }[];
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

  return data.results.map((g) => ({
    rawgId: g.id,
    name: g.name,
    coverUrl: g.background_image,
    platforms: (g.platforms ?? []).map((p) => p.platform.name),
    genres: (g.genres ?? []).map((genre) => genre.name),
    releaseDate: g.released,
  }));
}
