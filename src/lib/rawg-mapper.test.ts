import { describe, expect, it } from "vitest";
import { mapRawgGame, type RawgApiGame } from "./rawg-mapper";

function makeGame(overrides: Partial<RawgApiGame> = {}): RawgApiGame {
  return {
    id: 9767,
    name: "Hollow Knight",
    background_image: "https://media.rawg.io/media/games/hollow-knight.jpg",
    platforms: [{ platform: { id: 1, name: "PC" } }, { platform: { id: 2, name: "Nintendo Switch" } }],
    genres: [{ id: 1, name: "Platformer" }, { id: 2, name: "Indie" }],
    released: "2017-02-23",
    ...overrides,
  };
}

describe("mapRawgGame", () => {
  it("maps a fully-populated RAWG result to a RawgGameSummary", () => {
    expect(mapRawgGame(makeGame())).toEqual({
      rawgId: 9767,
      name: "Hollow Knight",
      coverUrl: "https://media.rawg.io/media/games/hollow-knight.jpg",
      platforms: ["PC", "Nintendo Switch"],
      genres: ["Platformer", "Indie"],
      releaseDate: "2017-02-23",
    });
  });

  it("defaults platforms to an empty array when absent", () => {
    const result = mapRawgGame(makeGame({ platforms: undefined }));
    expect(result.platforms).toEqual([]);
  });

  it("defaults genres to an empty array when absent", () => {
    const result = mapRawgGame(makeGame({ genres: undefined }));
    expect(result.genres).toEqual([]);
  });

  it("passes through null cover image and release date", () => {
    const result = mapRawgGame(makeGame({ background_image: null, released: null }));
    expect(result.coverUrl).toBeNull();
    expect(result.releaseDate).toBeNull();
  });
});
