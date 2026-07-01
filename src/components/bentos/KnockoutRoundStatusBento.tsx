import { useMemo } from "react";
import { knockoutStageFromMatchId } from "../../lib/brackets/knockoutStageFromMatchId";
import { useStore } from "../../store";
import { useTournamentPhase } from "../../hooks/useTournamentPhase";
import { TeamFlag } from "../team/TeamFlag";
import { teamDisplayNameFromId } from "../../lib/matchTeamDisplay";
import { resolveMatchWinner, isKnockoutMatch } from "../../lib/resolveMatchWinner";
import type { MergedMatch, Team } from "../../types";
import styles from "./KnockoutRoundStatusBento.module.css";

const ROUND_ORDER = ["R32", "R16", "QF", "SF", "Final"] as const;
type KnockoutStage = (typeof ROUND_ORDER)[number];

const ROUND_LABELS: Record<KnockoutStage, string> = {
  R32: "Round of 32",
  R16: "Round of 16",
  QF: "Quarter-finals",
  SF: "Semi-finals",
  Final: "Final",
};

export interface KnockoutRoundSummary {
  stage: KnockoutStage;
  label: string;
  advancing: string[];
  eliminated: string[];
}

function deriveStageFromMatchId(matchId: string): string {
  return knockoutStageFromMatchId(matchId) ?? "";
}

export function buildKnockoutRoundSummaries(
  matches: MergedMatch[],
  teams: Record<string, Team>
): KnockoutRoundSummary[] {
  const confirmedKnockout = matches.filter(
    (m) => m.status === "completed" && m.locked === true && isKnockoutMatch(m)
  );

  const byStage = new Map<KnockoutStage, MergedMatch[]>();
  for (const m of confirmedKnockout) {
    const stage = (m.stage ?? deriveStageFromMatchId(m.matchId ?? m.id)) as KnockoutStage;
    if (!ROUND_ORDER.includes(stage)) continue;
    if (!byStage.has(stage)) byStage.set(stage, []);
    byStage.get(stage)!.push(m);
  }

  const summaries: KnockoutRoundSummary[] = [];

  for (const stage of ROUND_ORDER) {
    const stageMatches = byStage.get(stage) ?? [];
    if (stageMatches.length === 0) continue;

    const advancing: string[] = [];
    const eliminated: string[] = [];

    for (const m of stageMatches) {
      const winnerId = resolveMatchWinner(m, teams);
      if (!winnerId) continue;

      advancing.push(winnerId);

      const loserId = [m.homeTeamId, m.awayTeamId]
        .filter(Boolean)
        .find((id) => id !== winnerId);
      if (loserId) eliminated.push(loserId);
    }

    if (advancing.length === 0 && eliminated.length === 0) continue;

    summaries.push({
      stage,
      label: ROUND_LABELS[stage],
      advancing,
      eliminated,
    });
  }

  return summaries;
}

export function useKnockoutRoundSummaries(): KnockoutRoundSummary[] {
  const liveMatches = useStore((s) => s.liveMatches);
  const teams = useStore((s) => s.teams);

  return useMemo(() => {
    const allMatches = Object.values(liveMatches);
    return buildKnockoutRoundSummaries(allMatches, teams);
  }, [liveMatches, teams]);
}

function TeamPill({ teamId, variant }: { teamId: string; variant: "advancing" | "eliminated" }) {
  const teams = useStore((s) => s.teams);
  const team = teams[teamId];
  const name = teamDisplayNameFromId(teamId, teams);
  return (
    <span
      className={`${styles.pill} ${variant === "eliminated" ? styles.pillElim : styles.pillAdv}`}
      title={name}
    >
      <TeamFlag team={team} teamId={teamId} size="sm" compact />
      <span className={styles.pillName}>{name}</span>
    </span>
  );
}

function RoundCard({ round }: { round: KnockoutRoundSummary }) {
  return (
    <article className={styles.roundCard}>
      <header className={styles.roundHead}>
        <h3 className={styles.roundLabel}>{round.label}</h3>
      </header>

      {round.advancing.length > 0 && (
        <div className={styles.section}>
          <span className={styles.sectionLabel}>✓ Advanced</span>
          <div className={styles.pillGrid}>
            {round.advancing.map((id) => (
              <TeamPill key={id} teamId={id} variant="advancing" />
            ))}
          </div>
        </div>
      )}

      {round.eliminated.length > 0 && (
        <div className={styles.section}>
          <span className={styles.sectionLabel}>✕ Eliminated</span>
          <div className={styles.pillGrid}>
            {round.eliminated.map((id) => (
              <TeamPill key={id} teamId={id} variant="eliminated" />
            ))}
          </div>
        </div>
      )}
    </article>
  );
}

type PanelProps = {
  summaries: KnockoutRoundSummary[];
};

export function KnockoutRoundStatusPanel({ summaries }: PanelProps) {
  if (summaries.length === 0) return null;

  return (
    <article className={styles.stripPanel} aria-label="Knockout stage overview">
      <header className={styles.header}>
        <span className={styles.kicker}>CONFIRMED RESULTS</span>
        <h2 className={styles.title}>Knockout Stage</h2>
      </header>
      <div className={styles.grid}>
        {summaries.map((round) => (
          <RoundCard key={round.stage} round={round} />
        ))}
      </div>
    </article>
  );
}

export function KnockoutRoundStatusBento() {
  const { isKnockoutActive } = useTournamentPhase();
  const summaries = useKnockoutRoundSummaries();

  if (!isKnockoutActive || summaries.length === 0) return null;

  return (
    <section className={styles.root} aria-label="Knockout stage overview">
      <KnockoutRoundStatusPanel summaries={summaries} />
    </section>
  );
}
