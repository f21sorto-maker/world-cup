import type { HighlightlyTeamStats } from "../../../../types/sportHighlights";
import styles from "./HighlightlyStatsPanel.module.css";

type Props = {
  statistics: HighlightlyTeamStats[];
  homeTeamName: string;
  awayTeamName: string;
};

export function HighlightlyStatsPanel({ statistics, homeTeamName, awayTeamName }: Props) {
  if (statistics.length < 2) return null;

  const homeRow = statistics[0];
  const awayRow = statistics[1];
  const labels = new Set<string>();
  for (const row of statistics) {
    for (const s of row.statistics) labels.add(s.displayName);
  }
  const ordered = [...labels];

  if (ordered.length === 0) return null;

  const valueFor = (row: HighlightlyTeamStats, label: string) =>
    row.statistics.find((s: { displayName: string; value: number | string }) => s.displayName === label)?.value ?? "—";

  return (
    <section className={styles.wrap} aria-label="Highlightly match statistics">
      <h3 className={styles.title}>Match statistics</h3>
      <div className={styles.header}>
        <span>{homeTeamName}</span>
        <span>{awayTeamName}</span>
      </div>
      <ul className={styles.rows}>
        {ordered.map((label) => (
          <li key={label} className={styles.row}>
            <span className={styles.val}>{valueFor(homeRow, label)}</span>
            <span className={styles.label}>{label}</span>
            <span className={`${styles.val} ${styles.valAway}`}>{valueFor(awayRow, label)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
