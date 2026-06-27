import type { HighlightlyHighlight } from "../../../../types/sportHighlights";
import styles from "./MatchHighlightsTab.module.css";

type Props = {
  highlights: HighlightlyHighlight[];
  loading: boolean;
  homeTeamName: string;
  awayTeamName: string;
};

function highlightHost(url?: string): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

export function MatchHighlightsTab({
  highlights,
  loading,
  homeTeamName,
  awayTeamName,
}: Props) {
  if (loading && highlights.length === 0) {
    return (
      <div className={styles.panel}>
        <p className={styles.muted}>Loading highlights…</p>
      </div>
    );
  }

  if (highlights.length === 0) {
    return (
      <div className={styles.panel}>
        <p className={styles.emptyTitle}>No highlights yet</p>
        <p className={styles.muted}>
          Clips for {homeTeamName} vs {awayTeamName} appear after kickoff — full recaps
          usually land within 1–48 hours. Free-tier coverage varies by league.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.panel}>
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
    </div>
  );
}
