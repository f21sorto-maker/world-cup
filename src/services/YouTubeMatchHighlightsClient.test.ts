import { describe, expect, it } from "vitest";
import type { MergedMatch, Team } from "../types";
import {
  normalizeGoogleVideoCandidate,
  normalizeWebsiteContacts,
  normalizeYouTube138Candidate,
  youtubeScreenshotUrl,
} from "./YouTubeMatchHighlightsClient";
import { verifyYouTubeMatchVideo } from "./youtubeHighlights/verifyYouTubeMatchVideo";
import {
  FOX_SOCCER_CHANNEL_ID,
  FOX_SPORTS_CHANNEL_ID,
  TELEMUNDO_DEPORTES_CHANNEL_ID,
} from "../config/youtubeHighlightsEndpoints";

const match: MergedMatch = {
  id: "m1",
  matchId: "101",
  date: "2026-06-20T20:00:00Z",
  homeTeamId: "bra",
  awayTeamId: "fra",
  status: "completed",
  homeScore: 2,
  awayScore: 1,
  homeConduct: 0,
  awayConduct: 0,
  locked: true,
  source: "manual",
};

const homeTeam: Team = {
  id: "bra",
  name: "Brazil",
  shortName: "Brazil",
  abbreviation: "BRA",
  group: "A",
  rating: 90,
};

const awayTeam: Team = {
  id: "fra",
  name: "France",
  shortName: "France",
  abbreviation: "FRA",
  group: "A",
  rating: 90,
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

const franceTeam: Team = {
  id: "fra",
  name: "France",
  shortName: "France",
  abbreviation: "FRA",
  nameEs: "Francia",
  group: "D",
  rating: 90,
};

const parFraMatch: MergedMatch = {
  ...match,
  id: "m90",
  matchId: "M90",
  homeTeamId: "par",
  awayTeamId: "fra",
};

describe("YouTubeMatchHighlightsClient normalize", () => {
  it("normalizes youtube138 channel video shapes", () => {
    const candidate = normalizeYouTube138Candidate({
      video: {
        videoId: "PuQFESk0BrA",
        title: "Brazil vs France highlights | FIFA World Cup | FOX Soccer",
        channelTitle: "FOX Soccer",
        thumbnails: [{ url: "https://example.com/thumb.jpg" }],
      },
    });
    expect(candidate?.videoId).toBe("PuQFESk0BrA");
    expect(candidate?.thumbnailUrl).toBe("https://example.com/thumb.jpg");
  });

  it("normalizes Google video results with YouTube URLs", () => {
    const candidate = normalizeGoogleVideoCandidate({
      title: "Brazil vs France preview | Telemundo Deportes",
      link: "https://www.youtube.com/watch?v=PuQFESk0BrA",
      source: "Telemundo Deportes",
    });
    expect(candidate?.videoId).toBe("PuQFESk0BrA");
    expect(candidate?.channelTitle).toBe("Telemundo Deportes");
  });

  it("normalizes website social contacts", () => {
    expect(
      normalizeWebsiteContacts({
        contacts: [{ type: "youtube", url: "https://www.youtube.com/@foxsoccer" }],
      })[0]?.url
    ).toContain("youtube.com");
  });

  it("builds screenshot proxy URL in browser mode", () => {
    expect(youtubeScreenshotUrl("PuQFESk0BrA")).toContain("video_id=PuQFESk0BrA");
  });
});

describe("verifyYouTubeMatchVideo", () => {
  it("accepts official videos that match both teams and kind", () => {
    const verified = verifyYouTubeMatchVideo(
      {
        videoId: "PuQFESk0BrA",
        title: "Brazil vs France extended highlights | FIFA World Cup | FOX Soccer",
        channelId: FOX_SOCCER_CHANNEL_ID,
        channelTitle: "FOX Soccer",
        source: "youtube138",
      },
      { match, homeTeam, awayTeam, homeTeamName: "Brazil", awayTeamName: "France" }
    );
    expect(verified?.kind).toBe("highlights");
    expect(verified?.verified).toBe(true);
  });

  it("accepts FOX Sports channel highlights", () => {
    const verified = verifyYouTubeMatchVideo(
      {
        videoId: "abc12345678",
        title: "Brazil vs France extended highlights | FIFA World Cup | FOX Sports",
        channelId: FOX_SPORTS_CHANNEL_ID,
        channelTitle: "FOX Sports",
        source: "youtube138",
      },
      { match, homeTeam, awayTeam, homeTeamName: "Brazil", awayTeamName: "France" }
    );
    expect(verified?.kind).toBe("highlights");
    expect(verified?.provider).toBe("fox");
    expect(verified?.verified).toBe(true);
  });

  it("accepts Telemundo Spanish titles with catalog team names", () => {
    const verified = verifyYouTubeMatchVideo(
      {
        videoId: "xyz98765432",
        title: "Paraguay vs. Francia | Resumen | Copa Mundial | Telemundo Deportes",
        channelId: TELEMUNDO_DEPORTES_CHANNEL_ID,
        channelTitle: "Telemundo Deportes",
        source: "youtube138",
      },
      {
        match: parFraMatch,
        homeTeam: paraguayTeam,
        awayTeam: franceTeam,
        homeTeamName: "Paraguay",
        awayTeamName: "France",
      }
    );
    expect(verified?.kind).toBe("highlights");
    expect(verified?.provider).toBe("telemundo");
    expect(verified?.verified).toBe(true);
  });

  it("rejects unrelated videos from an official channel", () => {
    const verified = verifyYouTubeMatchVideo(
      {
        videoId: "PuQFESk0BrA",
        title: "Spain vs Germany highlights | FIFA World Cup | FOX Soccer",
        channelId: FOX_SOCCER_CHANNEL_ID,
        channelTitle: "FOX Soccer",
        source: "youtube138",
      },
      { match, homeTeam, awayTeam, homeTeamName: "Brazil", awayTeamName: "France" }
    );
    expect(verified).toBeNull();
  });
});

