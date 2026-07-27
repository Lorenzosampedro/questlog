export type RawgGameSummary = {
  rawgId: number;
  name: string;
  coverUrl: string | null;
  platforms: string[];
  genres: string[];
  releaseDate: string | null;
};

export type RawgApiGame = {
  id: number;
  name: string;
  background_image: string | null;
  platforms?: { platform: { id: number; name: string } }[];
  genres?: { id: number; name: string }[];
  released: string | null;
};

export function mapRawgGame(game: RawgApiGame): RawgGameSummary {
  return {
    rawgId: game.id,
    name: game.name,
    coverUrl: game.background_image,
    platforms: (game.platforms ?? []).map((p) => p.platform.name),
    genres: (game.genres ?? []).map((genre) => genre.name),
    releaseDate: game.released,
  };
}
