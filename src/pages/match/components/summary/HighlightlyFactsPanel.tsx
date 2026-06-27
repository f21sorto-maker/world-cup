import type { HighlightlyMatch, HighlightlyMatchDetail } from "../../../../types/sportHighlights";
import styles from "./HighlightlyFactsPanel.module.css";

type Props = {
  detail: HighlightlyMatchDetail | null;
  lastFiveHome: HighlightlyMatch[];
  lastFiveAway: HighlightlyMatch[];
  homeTeamName: string;
  awayTeamName: string;
};

function parseScore(score?: string | null): { home: number; away: number } | null {
  if (!score) return null;
  const m = score.match(/(\d+)\s*-\s*(\d+)/);
  if (!m) return null;
  return { home: Number(m[1]), away: Number(m[2]) };
}

function FormRow({ label, matches }: { label: string; matches: HighlightlyMatch[] }) {
  if (matches.length === 0) return null;
  return (
    <div className={styles.formBlock}>
      <h4>{label}</h4>
      <ul className={styles.formList}>
        {matches.map((m) => {
          const parsed = parseScore(m.state?.score?.current);
          return (
            <li key={m.id} className={styles.formItem}>
              <span className={styles.formDate}>{m.date.slice(0, 10)}</span>
              <span className={styles.formTeams}>
                {m.homeTeam.name} vs {m.awayTeam.name}
              </span>
              <span className={styles.formScore}>
                {parsed ? `${parsed.home}–${parsed.away}` : m.state?.description ?? "—"}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function HighlightlyFactsPanel({
  detail,
  lastFiveHome,
  lastFiveAway,
  homeTeamName,
  awayTeamName,
}: Props) {
  const prematch = detail?.predictions?.prematch?.[0];
  const hasVenue = Boolean(detail?.venue?.name);
  const hasWeather = Boolean(detail?.forecast?.status || detail?.forecast?.temperature);
  const hasRef = Boolean(detail?.referee?.name);
  const hasForm = lastFiveHome.length > 0 || lastFiveAway.length > 0;

  if (!detail && !hasForm) return null;

  return (
    <section className={styles.wrap} aria-label="Match facts from Highlightly">
      {detail ? (
        <>
          {(hasVenue || hasWeather || hasRef) ? (
            <div className={styles.factsGrid}>
              {hasVenue ? (
                <div className={styles.fact}>
                  <span className={styles.factLabel}>Venue</span>
                  <span className={styles.factValue}>
                    {detail.venue?.name}
                    {detail.venue?.city ? ` · ${detail.venue.city}` : ""}
                    {detail.venue?.capacity ? ` (${detail.venue.capacity})` : ""}
                  </span>
                </div>
              ) : null}
              {hasRef ? (
                <div className={styles.fact}>
                  <span className={styles.factLabel}>Referee</span>
                  <span className={styles.factValue}>
                    {detail.referee?.name}
                    {detail.referee?.nationality ? ` (${detail.referee.nationality})` : ""}
                  </span>
                </div>
              ) : null}
              {hasWeather ? (
                <div className={styles.fact}>
                  <span className={styles.factLabel}>Forecast</span>
                  <span className={styles.factValue}>
                    {[detail.forecast?.status, detail.forecast?.temperature].filter(Boolean).join(" · ")}
                  </span>
                </div>
              ) : null}
            </div>
          ) : null}

          {prematch?.description ? (
            <div className={styles.prediction}>
              <span className={styles.factLabel}>Pre-match outlook</span>
              <p className={styles.predictionText}>{prematch.description}</p>
              {prematch.probabilities ? (
                <p className={styles.probRow}>
                  {homeTeamName} {prematch.probabilities.home ?? "—"} · Draw{" "}
                  {prematch.probabilities.draw ?? "—"} · {awayTeamName}{" "}
                  {prematch.probabilities.away ?? "—"}
                </p>
              ) : null}
            </div>
          ) : null}
        </>
      ) : null}

      {hasForm ? (
        <div className={styles.formSection}>
          <h3 className={styles.sectionTitle}>Last five games</h3>
          <FormRow label={homeTeamName} matches={lastFiveHome} />
          <FormRow label={awayTeamName} matches={lastFiveAway} />
        </div>
      ) : null}
    </section>
  );
}
