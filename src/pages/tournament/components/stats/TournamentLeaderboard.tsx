import { resolveTeamFromStore } from "../../../../data/wc2026TeamCatalog";
import type { Team, TournamentPlayerStat } from "../../../../types";
import { teamLabel } from "../../../../lib/aggregateTournamentStats";
import { wcCareerGoalsForDisplay } from "../../../../lib/mergeWcCareerGoals";
import { TeamFlag } from "../../../../components/team/TeamFlag";
import { TeamClickTarget } from "../../../../components/team/TeamClickTarget";
import { PlayerPhoto } from "../../../../components/player/PlayerPhoto";
import styles from "../../TournamentView.module.css";

type Props = {
  title: string;
  stats: TournamentPlayerStat[];
  teams: Record<string, Team>;
  unit?: string;
  /** When set, shows World Cup career totals from the reference merge. */
  topScorers2026?: TournamentPlayerStat[];
};

export function TournamentLeaderboard({
  title,
  stats,
  teams,
  unit = "G",
  topScorers2026,
}: Props) {
  if (stats.length === 0) {
    return (
      <section className={styles.statsSection}>
        <h3 className={styles.statsSectionTitle}>{title}</h3>
        <p className={styles.statsEmptyNote}>No data yet — updates as goals are recorded in live feeds.</p>
      </section>
    );
  }

  return (
    <section className={styles.statsSection}>
      <h3 className={styles.statsSectionTitle}>{title}</h3>
      <ol className={styles.leaderboardList}>
        {stats.slice(0, 15).map((stat, i) => {
          const team = resolveTeamFromStore(teams, stat.teamId);
          const wcCareer =
            topScorers2026 != null
              ? wcCareerGoalsForDisplay(stat.player.displayName, topScorers2026)
              : undefined;
          return (
            <li key={`${stat.player.id}-${stat.teamId}`} className={styles.leaderboardRow}>
              <span className={styles.leaderboardRank}>{i + 1}</span>
              <TeamFlag team={team} teamId={stat.teamId} size="sm" />
              <div className={styles.leaderboardMeta}>
                <span className={styles.leaderboardNameRow}>
                  <PlayerPhoto name={stat.player.displayName} size="sm" />
                  <span className={styles.leaderboardName}>{stat.player.displayName}</span>
                </span>
                <TeamClickTarget teamId={stat.teamId} className={styles.leaderboardTeamBtn}>
                  <span className={styles.leaderboardTeam}>{teamLabel(stat.teamId, teams)}</span>
                </TeamClickTarget>
              </div>
              <div className={styles.leaderboardValues}>
                <span className={styles.leaderboardValue}>
                  {stat.value}
                  <span className={styles.leaderboardUnit}>{unit}</span>
                </span>
                {wcCareer != null ? (
                  <span className={styles.leaderboardCareer} title="World Cup career goals">
                    {wcCareer}
                    <span className={styles.leaderboardCareerUnit}>WC</span>
                  </span>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
