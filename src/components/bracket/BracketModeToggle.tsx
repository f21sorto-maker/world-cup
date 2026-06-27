import { APP_COPY } from "../../lib/appCopy";
import { useStore } from "../../store";

export function BracketModeToggle() {
  const copy = APP_COPY.bracket;
  const mode = useStore((s) => s.bracketViewMode);
  const setMode = useStore((s) => s.setBracketViewMode);

  return (
    <div className="bracket-toggle" role="tablist" aria-label={copy.modeLabel}>
      <button
        type="button"
        role="tab"
        className={mode === "projected" ? "active" : ""}
        aria-selected={mode === "projected"}
        onClick={() => setMode("projected")}
      >
        <span className="bracket-toggle-label">{copy.projectedLabel}</span>
        <span className="bracket-toggle-subtitle">{copy.projectedSubtitle}</span>
      </button>
      <button
        type="button"
        role="tab"
        className={mode === "confirmed" ? "active" : ""}
        aria-selected={mode === "confirmed"}
        onClick={() => setMode("confirmed")}
      >
        <span className="bracket-toggle-label">{copy.confirmedLabel}</span>
        <span className="bracket-toggle-subtitle">{copy.confirmedSubtitle}</span>
      </button>
    </div>
  );
}
