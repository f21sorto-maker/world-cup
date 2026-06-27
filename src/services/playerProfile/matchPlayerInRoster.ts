import type { Wc2026Player } from "../WorldCup2026Client";
import { playerNamesMatch } from "./normalizePlayerName";

export function matchPlayerInRoster(
  roster: Wc2026Player[],
  opts: { playerId?: string; playerName: string }
): Wc2026Player | undefined {
  if (opts.playerId) {
    const byId = roster.find((p) => p.id === opts.playerId);
    if (byId) return byId;
  }

  const exact = roster.find((p) => playerNamesMatch(p.fullName, opts.playerName));
  if (exact) return exact;

  return roster.find((p) => {
    const last = p.lastName ?? p.fullName.split(" ").pop() ?? "";
    return last.length > 2 && opts.playerName.toLowerCase().includes(last.toLowerCase());
  });
}
