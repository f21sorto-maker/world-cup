import type { MergedMatch, PenaltyShootout } from "../../types";
import styles from "./PenaltyShootoutBar.module.css";

type Props = {
  match: MergedMatch;
  shootout: PenaltyShootout;
  compact?: boolean;
};

function KickDot({ scored }: { scored: boolean }) {
  return (
    <span
      className={`${styles.kick} ${scored ? styles.kickScored : styles.kickMissed}`}
      aria-hidden
    />
  );
}

export function PenaltyShootoutBar({ match, shootout, compact }: Props) {
  const homeFt = match.homeScore ?? 0;
  const awayFt = match.awayScore ?? 0;
  const label = `FT ${homeFt}–${awayFt} · Pens ${shootout.homeScore}–${shootout.awayScore}`;

  return (
    <div className={`${styles.bar} ${compact ? styles.barCompact : ""}`} aria-label={label}>
      <div className={styles.kicks} aria-hidden>
        <div className={styles.side}>
          {shootout.home.map((kick, i) => (
            <KickDot key={`h-${i}`} scored={kick.scored} />
          ))}
        </div>
        <div className={styles.side}>
          {shootout.away.map((kick, i) => (
            <KickDot key={`a-${i}`} scored={kick.scored} />
          ))}
        </div>
      </div>
      <span className={styles.label}>{label}</span>
    </div>
  );
}

export function penaltyShootoutForMatch(match: MergedMatch): PenaltyShootout | undefined {
  return match.penaltyShootout;
}
