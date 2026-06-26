import { useEffect, useState } from "react";
import type { MatchPeriod } from "../types";

export type ClockDisplay = {
  label: string;
  running: boolean;
};

export function computeDisplay(
  period: MatchPeriod,
  minute: number,
  extra?: number
): ClockDisplay {
  switch (period) {
    case "not_started":
      return { label: "KO", running: false };
    case "half_time":
      return { label: "HT", running: false };
    case "first_half":
    case "second_half":
    case "extra_time_first":
    case "extra_time_second":
      if (period === "second_half" && minute >= 90 && extra) {
        return { label: `90+${extra}'`, running: true };
      }
      return { label: `${minute}'`, running: true };
    case "extra_time_break":
      return { label: "ET Break", running: false };
    case "penalties":
      return { label: "PENS", running: false };
    case "full_time":
      return { label: "FT", running: false };
    case "postponed":
      return { label: "PST", running: false };
    case "interrupted":
      return { label: "INT", running: false };
    default: {
      const _exhaustive: never = period;
      return _exhaustive;
    }
  }
}

export function useLiveClock(
  period: MatchPeriod,
  minute: number,
  extra?: number,
  running = false
): ClockDisplay {
  const [display, setDisplay] = useState(() => computeDisplay(period, minute, extra));

  useEffect(() => {
    setDisplay(computeDisplay(period, minute, extra));
    // #region agent log
    fetch('http://127.0.0.1:7681/ingest/f800a0a9-8d11-45c6-8805-1b187f693046',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'62d96e'},body:JSON.stringify({sessionId:'62d96e',location:'useLiveClock.ts:53',message:'sync-effect fired',data:{period,minute,extra,running},hypothesisId:'B1',runId:'run1',timestamp:Date.now()})}).catch(()=>{});
    // #endregion
  }, [period, minute, extra, running]);

  useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7681/ingest/f800a0a9-8d11-45c6-8805-1b187f693046',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'62d96e'},body:JSON.stringify({sessionId:'62d96e',location:'useLiveClock.ts:60',message:'no-raf-loop: running flag at mount',data:{running,period,minute},hypothesisId:'B1',runId:'run1',timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    const onVis = () => setDisplay(computeDisplay(period, minute, extra));
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [period, minute, extra]);

  return display;
}
