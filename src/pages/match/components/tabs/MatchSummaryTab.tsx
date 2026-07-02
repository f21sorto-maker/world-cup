import type { GoalScorerProfile, MatchEvent, MergedMatch, Team } from "../../../../types";
import type { MatchBundle } from "../../../../services/matchDetail/fetchMatchBundle";
import { MatchFactsPanel } from "../summary/MatchFactsPanel";
import { MatchEventTimeline } from "../summary/MatchEventTimeline";
import type { HighlightlyMatchBundle } from "../../../../types/sportHighlights";
import { HighlightlyFactsPanel } from "../summary/HighlightlyFactsPanel";
import { HighlightlyStatsPanel } from "../statistics/HighlightlyStatsPanel";
import { GoalScorersPanel } from "../../../../components/match/GoalScorersPanel";
import styles from "../../MatchDetailView.module.css";

type Props = {
  match: MergedMatch;
  bundle: Partial<MatchBundle> | null;
  events: MatchEvent[];
  homeTeamName: string;
  awayTeamName: string;
  homeTeam?: Team;
  awayTeam?: Team;
  highlightly?: HighlightlyMatchBundle & { loading?: boolean };
  scorerProfiles: GoalScorerProfile[];
  scorersLoading?: boolean;
};

export function MatchSummaryTab({
  match,
  bundle: _bundle,
  events,
  homeTeamName,
  awayTeamName,
  homeTeam,
  awayTeam,
  highlightly,
  scorerProfiles,
  scorersLoading = false,
}: Props) {
  const hasEvents = events.length > 0;
  const isLive = match.status === "live";
  const isDone = match.status === "completed";

  if (!isLive && !isDone) {
    return (
      <div className={styles.emptyState}>
        <p>Match has not started yet.</p>
        <p style={{ marginTop: 8, fontSize: 12 }}>
          Key events will appear here when the match begins.
        </p>
      </div>
    );
  }

  if (!hasEvents) {
    return (
      <div className={styles.emptyState}>
        <p>No key events recorded yet.</p>
        <p style={{ marginTop: 8, fontSize: 12 }}>
          Goals, cards, and substitutions will populate from live feeds as they are reported.
        </p>
      </div>
    );
  }

  return (
    <>
      <GoalScorersPanel
        profiles={scorerProfiles}
        homeTeam={homeTeam}
        awayTeam={awayTeam}
        loading={scorersLoading}
      />
      {highlightly ? (
        <>
          <HighlightlyFactsPanel
            detail={highlightly.matchDetail}
            lastFiveHome={highlightly.lastFiveHome}
            lastFiveAway={highlightly.lastFiveAway}
            homeTeamName={homeTeamName}
            awayTeamName={awayTeamName}
          />
          <HighlightlyStatsPanel
            statistics={highlightly.statistics}
            homeTeamName={homeTeamName}
            awayTeamName={awayTeamName}
          />
        </>
      ) : null}
      <MatchFactsPanel
        events={events}
        homeConduct={match.homeConduct}
        awayConduct={match.awayConduct}
        homeTeamName={homeTeamName}
        awayTeamName={awayTeamName}
      />
      <MatchEventTimeline
        events={events}
        homeTeamId={match.homeTeamId}
        awayTeamId={match.awayTeamId}
        homeTeamName={homeTeamName}
        awayTeamName={awayTeamName}
        homeTeam={homeTeam}
        awayTeam={awayTeam}
      />
    </>
  );
}
