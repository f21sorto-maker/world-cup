import type { HighlightlyHighlight, HighlightlyMatchIntro } from "../../../../types/sportHighlights";
import type { YouTubeMatchVideo } from "../../../../types/youtubeHighlights";
import type { MatchStatus } from "../../../../types";
import { LoadingState } from "../../../../components/shared/LoadingState";
import styles from "./MatchHighlightsTab.module.css";

type Props = {
  highlights: HighlightlyHighlight[];
  loading: boolean;
  homeTeamName: string;
  awayTeamName: string;
  introHighlight?: HighlightlyHighlight | null;
  attribution?: string;
  quotaLabel?: string;
  fallbackHighlightsUrl?: string;
  youtubeVideos?: YouTubeMatchVideo[];
  youtubeLoading?: boolean;
  matchStatus?: MatchStatus;
};

function highlightHost(url?: string): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

function providerLabel(provider: YouTubeMatchVideo["provider"]): string {
  if (provider === "fox") return "FOX";
  if (provider === "telemundo") return "Telemundo";
  return "YouTube";
}

function YouTubeVideoCard({ video }: { video: YouTubeMatchVideo }) {
  return (
    <li className={styles.card}>
      {video.thumbnailUrl ? (
        <img src={video.thumbnailUrl} alt="" className={styles.thumb} loading="lazy" decoding="async" />
      ) : (
        <div className={styles.thumbPlaceholder} aria-hidden>
          ▶
        </div>
      )}
      <div className={styles.body}>
        <div className={styles.meta}>
          <span className={styles.badge}>{video.kind === "highlights" ? "Highlights" : "Preview"}</span>
          <span className={styles.providerBadge}>{providerLabel(video.provider)}</span>
        </div>
        <h3 className={styles.title}>{video.title}</h3>
        {video.description ? <p className={styles.desc}>{video.description}</p> : null}
        <a
          href={video.watchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.link}
        >
          Watch on YouTube
        </a>
      </div>
    </li>
  );
}

export function MatchHighlightsTab({
  highlights,
  loading,
  homeTeamName,
  awayTeamName,
  introHighlight,
  attribution,
  quotaLabel,
  fallbackHighlightsUrl,
  youtubeVideos = [],
  youtubeLoading = false,
  matchStatus,
}: Props) {
  const isCompleted = matchStatus === "completed";
  const highlightClips = youtubeVideos.filter((v) => v.kind === "highlights");
  const featuredYoutube = highlightClips[0] ?? null;
  const otherYoutube = youtubeVideos.filter((v) => v !== featuredYoutube);
  const hasHighlightly = highlights.length > 0;
  const hasYoutube = youtubeVideos.length > 0;
  const isLoading = (loading || youtubeLoading) && !hasHighlightly && !hasYoutube;

  if (isLoading) {
    return (
      <div className={styles.panel}>
        <LoadingState label="Loading highlights…" />
      </div>
    );
  }

  if (hasHighlightly) {
    const featured = introHighlight ?? highlights[0] ?? null;
    const featuredLink = featured?.url || featured?.embedUrl;

    return (
      <div className={styles.panel}>
        {featured ? (
          <section className={styles.intro}>
            <p className={styles.introLabel}>Match intro</p>
            <h3 className={styles.introTitle}>{featured.title ?? "Highlight recap"}</h3>
            {featured.description ? <p className={styles.desc}>{featured.description}</p> : null}
            {featuredLink ? (
              <a
                href={featuredLink}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.link}
              >
                Watch intro{highlightHost(featuredLink) ? ` on ${highlightHost(featuredLink)}` : ""}
              </a>
            ) : null}
          </section>
        ) : null}
        <ul className={styles.list}>
          {highlights.map((h) => {
            const link = h.url || h.embedUrl;
            const host = highlightHost(link);
            return (
              <li key={h.id} className={styles.card}>
                {h.imgUrl ? (
                  <img src={h.imgUrl} alt="" className={styles.thumb} loading="lazy" decoding="async" />
                ) : (
                  <div className={styles.thumbPlaceholder} aria-hidden>
                    ▶
                  </div>
                )}
                <div className={styles.body}>
                  <div className={styles.meta}>
                    {h.type ? <span className={styles.badge}>{h.type}</span> : null}
                    {h.source ? <span className={styles.source}>{h.source}</span> : null}
                  </div>
                  <h3 className={styles.title}>{h.title ?? "Highlight"}</h3>
                  {h.description ? <p className={styles.desc}>{h.description}</p> : null}
                  {link ? (
                    <a
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.link}
                    >
                      Watch{host ? ` on ${host}` : ""}
                    </a>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
        {attribution ? <p className={styles.attribution}>{attribution}</p> : null}
        {quotaLabel ? <p className={styles.quota}>{quotaLabel}</p> : null}
      </div>
    );
  }

  if (featuredYoutube) {
    return (
      <div className={styles.panel}>
        <section className={styles.youtubeFeatured}>
          <div className={styles.meta}>
            <span className={styles.badge}>Highlights</span>
            <span className={styles.providerBadge}>{providerLabel(featuredYoutube.provider)}</span>
          </div>
          <h3 className={styles.introTitle}>{featuredYoutube.title}</h3>
          <div className={styles.playerWrap}>
            <iframe
              src={featuredYoutube.embedUrl}
              title={`Highlights: ${homeTeamName} vs ${awayTeamName}`}
              className={styles.player}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
          <a
            href={featuredYoutube.watchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.link}
          >
            Open on YouTube
          </a>
        </section>
        {otherYoutube.length > 0 ? (
          <ul className={styles.list}>
            {otherYoutube.map((video) => (
              <YouTubeVideoCard key={video.id} video={video} />
            ))}
          </ul>
        ) : null}
      </div>
    );
  }

  if (hasYoutube) {
    return (
      <div className={styles.panel}>
        <ul className={styles.list}>
          {youtubeVideos.map((video) => (
            <YouTubeVideoCard key={video.id} video={video} />
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className={styles.panel}>
      <p className={styles.emptyTitle}>No highlights yet</p>
      <p className={styles.muted}>
        {isCompleted
          ? `Highlights for ${homeTeamName} vs ${awayTeamName} usually appear within 1–2 hours after full time from FOX or Telemundo on YouTube.`
          : `Clips for ${homeTeamName} vs ${awayTeamName} appear after kickoff — full recaps usually land within 1–48 hours.`}
      </p>
      {fallbackHighlightsUrl ? (
        <a
          href={fallbackHighlightsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.link}
        >
          Watch highlights{highlightHost(fallbackHighlightsUrl) ? ` on ${highlightHost(fallbackHighlightsUrl)}` : ""}
        </a>
      ) : null}
      {attribution ? <p className={styles.attribution}>{attribution}</p> : null}
      {quotaLabel ? <p className={styles.quota}>{quotaLabel}</p> : null}
    </div>
  );
}
