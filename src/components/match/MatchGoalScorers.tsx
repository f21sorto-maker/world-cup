import type { MatchEvent } from "../../types";

type Props = {
  events: MatchEvent[];
  homeTeamId: string;
  awayTeamId: string;
};

/** Compact goal scorers for live cards and result rows. */
export function MatchGoalScorers({ events, homeTeamId, awayTeamId }: Props) {
  const homeGoals = events.filter((e) => (e.type === "goal" || e.type === "own_goal") && e.teamId === homeTeamId);
  const awayGoals = events.filter((e) => (e.type === "goal" || e.type === "own_goal") && e.teamId === awayTeamId);

  if (homeGoals.length === 0 && awayGoals.length === 0) return null;

  const formatGoal = (e: MatchEvent) => {
    const extra = e.minuteExtra ? `+${e.minuteExtra}` : "";
    const suffix = e.type === "own_goal" ? " (OG)" : "";
    return `${e.playerName} ${e.minute}${extra}'${suffix}`;
  };

  return (
    <div className="match-goal-scorers" aria-label="Goal scorers">
      <div className="match-goal-scorers-col">
        {homeGoals.map((e) => (
          <span key={e.providerId} className="match-goal-scorers-item">
            {formatGoal(e)}
          </span>
        ))}
      </div>
      <div className="match-goal-scorers-col match-goal-scorers-col--away">
        {awayGoals.map((e) => (
          <span key={e.providerId} className="match-goal-scorers-item">
            {formatGoal(e)}
          </span>
        ))}
      </div>
    </div>
  );
}
