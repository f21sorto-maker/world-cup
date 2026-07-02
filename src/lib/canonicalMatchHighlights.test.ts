import { describe, expect, it, vi } from "vitest";
import type { MergedMatch, Team } from "../types";
import { resolveCanonicalMatchHighlightVideos } from "./canonicalMatchHighlights";
import {
  resetYouTubeMatchHighlightsSessionForTests,
  resolveYouTubeMatchVideos,
} from "../services/YouTubeMatchHighlightsClient";
import { verifyYouTubeMatchVideo } from "../services/youtubeHighlights/verifyYouTubeMatchVideo";
import {
  FIFA_CHANNEL_ID,
  FOX_SPORTS_CHANNEL_ID,
  TELEMUNDO_CADENA_CHANNEL_ID,
  TELEMUNDO_DEPORTES_CHANNEL_ID,
} from "../config/youtubeHighlightsEndpoints";

const m75Match: MergedMatch = {
  id: "M75",
  matchId: "M75",
  espnEventId: "760489",
  date: "2026-06-29T20:30:00Z",
  homeTeamId: "ger",
  awayTeamId: "par",
  status: "completed",
  homeScore: 1,
  awayScore: 1,
  homeConduct: 0,
  awayConduct: 0,
  locked: true,
  source: "espn",
  stage: "R32",
};

const germanyTeam: Team = {
  id: "ger",
  name: "Germany",
  shortName: "Germany",
  abbreviation: "GER",
  group: "E",
  rating: 88,
};

const paraguayTeam: Team = {
  id: "par",
  name: "Paraguay",
  shortName: "Paraguay",
  abbreviation: "PAR",
  nameEs: "Paraguay",
  group: "D",
  rating: 75,
};

describe("canonicalMatchHighlights", () => {
  it("returns verified FOX, FIFA, and Telemundo clips for M75", () => {
    const videos = resolveCanonicalMatchHighlightVideos({
      match: m75Match,
      homeTeam: germanyTeam,
      awayTeam: paraguayTeam,
      homeTeamName: "Germany",
      awayTeamName: "Paraguay",
    });

    expect(videos.length).toBeGreaterThanOrEqual(3);
    expect(videos.some((v) => v.videoId === "-gtI96YhJek" && v.provider === "fox")).toBe(true);
    expect(videos.some((v) => v.videoId === "Gw6vNwAvkTs" && v.provider === "fifa")).toBe(true);
    expect(videos.some((v) => v.provider === "telemundo")).toBe(true);
  });

  it("returns empty for non-canonical matches", () => {
    const videos = resolveCanonicalMatchHighlightVideos({
      match: { ...m75Match, id: "M99", matchId: "M99" },
      homeTeam: germanyTeam,
      awayTeam: paraguayTeam,
      homeTeamName: "Germany",
      awayTeamName: "Paraguay",
    });
    expect(videos).toEqual([]);
  });
});

describe("verifyYouTubeMatchVideo — FIFA and Telemundo Cadena", () => {
  it("accepts FIFA channel highlights for Germany vs Paraguay", () => {
    const verified = verifyYouTubeMatchVideo(
      {
        videoId: "Gw6vNwAvkTs",
        title: "Highlights | Germany (3)1-1(4) Paraguay | FIFA World Cup 2026",
        channelId: FIFA_CHANNEL_ID,
        channelTitle: "FIFA",
        source: "youtube138",
      },
      {
        match: m75Match,
        homeTeam: germanyTeam,
        awayTeam: paraguayTeam,
        homeTeamName: "Germany",
        awayTeamName: "Paraguay",
      }
    );
    expect(verified?.kind).toBe("highlights");
    expect(verified?.provider).toBe("fifa");
    expect(verified?.verified).toBe(true);
  });

  it("accepts Telemundo Cadena channel with Spanish team names", () => {
    const verified = verifyYouTubeMatchVideo(
      {
        videoId: "abc12345678",
        title: "Alemania vs Paraguay | Resumen | Copa Mundial | Telemundo",
        channelId: TELEMUNDO_CADENA_CHANNEL_ID,
        channelTitle: "Telemundo",
        source: "youtube138",
      },
      {
        match: m75Match,
        homeTeam: germanyTeam,
        awayTeam: paraguayTeam,
        homeTeamName: "Germany",
        awayTeamName: "Paraguay",
      }
    );
    expect(verified?.kind).toBe("highlights");
    expect(verified?.provider).toBe("telemundo");
    expect(verified?.verified).toBe(true);
  });

  it("accepts FOX Sports Germany vs Paraguay highlights", () => {
    const verified = verifyYouTubeMatchVideo(
      {
        videoId: "-gtI96YhJek",
        title: "Germany vs Paraguay Highlights | 2026 FIFA World Cup | Round of 32",
        channelId: FOX_SPORTS_CHANNEL_ID,
        channelTitle: "FOX Sports",
        source: "youtube138",
      },
      {
        match: m75Match,
        homeTeam: germanyTeam,
        awayTeam: paraguayTeam,
        homeTeamName: "Germany",
        awayTeamName: "Paraguay",
      }
    );
    expect(verified?.provider).toBe("fox");
    expect(verified?.verified).toBe(true);
  });

  it("accepts Telemundo Deportes resumen titles", () => {
    const verified = verifyYouTubeMatchVideo(
      {
        videoId: "zGZGTRKNxvs",
        title: "Alemania vs Paraguay | Resumen y Goles | Copa Mundial de la FIFA 2026 | Telemundo Deportes",
        channelId: TELEMUNDO_DEPORTES_CHANNEL_ID,
        channelTitle: "Telemundo Deportes",
        source: "youtube138",
      },
      {
        match: m75Match,
        homeTeam: germanyTeam,
        awayTeam: paraguayTeam,
        homeTeamName: "Germany",
        awayTeamName: "Paraguay",
      }
    );
    expect(verified?.provider).toBe("telemundo");
    expect(verified?.verified).toBe(true);
  });
});

describe("resolveYouTubeMatchVideos canonical fallback", () => {
  it("returns bundled M75 clips without RapidAPI", async () => {
    vi.resetModules();
    vi.doMock("../config/apiFlags", () => ({
      isApiEnabled: () => false,
    }));

    resetYouTubeMatchHighlightsSessionForTests();

    const { resolveYouTubeMatchVideos: resolveWithApiOff } = await import(
      "../services/YouTubeMatchHighlightsClient"
    );

    const result = await resolveWithApiOff({
      match: m75Match,
      homeTeam: germanyTeam,
      awayTeam: paraguayTeam,
      homeTeamName: "Germany",
      awayTeamName: "Paraguay",
    });

    expect(result.videos.length).toBeGreaterThan(0);
    expect(result.source).toBe("canonical");
    expect(result.videos[0]?.videoId).toBe("-gtI96YhJek");

    vi.doUnmock("../config/apiFlags");
    vi.resetModules();
  });
});
