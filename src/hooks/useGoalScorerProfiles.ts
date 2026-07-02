import { useEffect, useMemo, useRef, useState } from "react";
import type { GoalScorerProfile, MatchEvent, Team } from "../types";
import { countGoalEventsInStore } from "../lib/matchEventsStats";
import {
  resolveGoalScorerProfiles,
  resolveGoalScorerProfilesSync,
} from "../services/playerProfile/resolveGoalScorerProfiles";
import { useStore } from "../store";

type Input = {
  events: MatchEvent[];
  homeTeam?: Team;
  awayTeam?: Team;
};

export function useGoalScorerProfiles(input: Input): {
  profiles: GoalScorerProfile[];
  loading: boolean;
} {
  const eventsRef = useRef(input.events);
  const homeTeamRef = useRef(input.homeTeam);
  const awayTeamRef = useRef(input.awayTeam);
  eventsRef.current = input.events;
  homeTeamRef.current = input.homeTeam;
  awayTeamRef.current = input.awayTeam;

  const globalGoalCount = useStore((s) => countGoalEventsInStore(s.matchEvents));

  const goalEvents = useMemo(
    () => input.events.filter((e) => e.type === "goal" || e.type === "own_goal"),
    [input.events]
  );

  const goalKey = useMemo(
    () =>
      goalEvents
        .map((e) => `${e.providerId}:${e.playerName}:${e.minute}`)
        .join("|"),
    [goalEvents]
  );

  const homeTeamId = input.homeTeam?.id;
  const awayTeamId = input.awayTeam?.id;

  const [profiles, setProfiles] = useState<GoalScorerProfile[]>([]);
  const [loading, setLoading] = useState(false);

  // Cheap sync refresh when goals or tournament-wide goal totals change.
  useEffect(() => {
    if (goalEvents.length === 0) {
      setProfiles([]);
      return;
    }

    const allMatchEvents = useStore.getState().matchEvents;
    setProfiles(
      resolveGoalScorerProfilesSync({
        events: eventsRef.current,
        allMatchEvents,
      })
    );
  }, [goalKey, globalGoalCount, goalEvents.length]);

  // Roster enrichment only when scorers or teams change — not on every poll.
  useEffect(() => {
    if (goalEvents.length === 0) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    const allMatchEvents = useStore.getState().matchEvents;
    resolveGoalScorerProfiles({
      events: eventsRef.current,
      homeTeam: homeTeamRef.current,
      awayTeam: awayTeamRef.current,
      allMatchEvents,
    })
      .then((result) => {
        if (!cancelled) setProfiles(result);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [goalKey, homeTeamId, awayTeamId, goalEvents.length]);

  return { profiles, loading };
}
