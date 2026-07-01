import { useEffect, useRef, useState } from "react";
import { nextGoldenBootCelebrateState, type GoldenBootCelebrateState } from "./goldenBootCelebrate";

const INITIAL_STATE: GoldenBootCelebrateState = {
  mounted: false,
  prevLeaderId: "",
  prevLeaderGoals: 0,
};

/** Brief crown celebration when the golden boot leader changes or adds a goal. */
export function useGoldenBootCelebrate(
  leaderId: string,
  leaderGoals: number,
  durationMs = 900
): boolean {
  const [celebrate, setCelebrate] = useState(false);
  const stateRef = useRef<GoldenBootCelebrateState>(INITIAL_STATE);

  useEffect(() => {
    const result = nextGoldenBootCelebrateState(stateRef.current, leaderId, leaderGoals);
    stateRef.current = result.state;

    if (!result.celebrate) {
      setCelebrate(false);
      return undefined;
    }

    setCelebrate(true);
    const timer = setTimeout(() => setCelebrate(false), durationMs);
    return () => clearTimeout(timer);
  }, [leaderId, leaderGoals, durationMs]);

  return celebrate;
}
