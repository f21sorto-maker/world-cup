import type { MatchEvent, MergedMatch, Team } from "../../../../types";
import type { MatchBundle } from "../../../../services/matchDetail/fetchMatchBundle";
import { MatchFactsPanel } from "../summary/MatchFactsPanel";
import { MatchEventTimeline } from "../summary/MatchEventTimeline";
import { GoalScorersPanel } from "../../../../components/match/GoalScorersPanel";
import { useGoalScorerProfiles } from "../../../../hooks/useGoalScorerProfiles";
import { useStore } from "../../../../store";
import styles from "../../MatchDetailView.module.css";

type Props = {
  match: MergedMatch;
  bundle: Partial<MatchBundle> | null;
  events: MatchEvent[];
  homeTeamName: string;
  awayTeamName: string;
  homeTeam?: Team;
  awayTeam?: Team;
};

export function MatchSummaryTab({
  match,
  bundle: _bundle,
  events,
  homeTeamName,
  awayTeamName,
  homeTeam,
  awayTeam,
}: Props) {
  const matchEvents = useStore((s) => s.matchEvents);
  const { profiles, loading } = useGoalScorerProfiles({
    events,
    homeTeam,
    awayTeam,
    allMatchEvents: matchEvents,
  });
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
        profiles={profiles}
        homeTeam={homeTeam}
        awayTeam={awayTeam}
        loading={loading}
      />
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
      />
    </>
  );
}
