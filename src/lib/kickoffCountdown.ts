export type KickoffCountdownParts = {
  totalMs: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  expired: boolean;
};

export type KickoffFixtureRef = {
  id: string;
  matchId?: string;
  date: string;
};

/** Earliest valid kickoff timestamp among fixtures, or null when none. */
export function getNextKickoffMs(fixtures: KickoffFixtureRef[]): number | null {
  let next: number | null = null;
  for (const fixture of fixtures) {
    const kickoffMs = Date.parse(fixture.date);
    if (Number.isNaN(kickoffMs)) continue;
    if (next === null || kickoffMs < next) next = kickoffMs;
  }
  return next;
}

/** True when fixture shares the next kickoff instant (includes concurrent slates). */
export function isNextKickoffFixture(fixture: KickoffFixtureRef, nextKickoffMs: number | null): boolean {
  if (nextKickoffMs === null) return false;
  const kickoffMs = Date.parse(fixture.date);
  if (Number.isNaN(kickoffMs)) return false;
  return kickoffMs === nextKickoffMs;
}

/** All fixtures kicking off at the next scheduled time. */
export function getNextKickoffFixtures<T extends KickoffFixtureRef>(fixtures: T[]): T[] {
  const nextKickoffMs = getNextKickoffMs(fixtures);
  if (nextKickoffMs === null) return [];
  return fixtures.filter((fixture) => isNextKickoffFixture(fixture, nextKickoffMs));
}

export function getKickoffCountdownParts(kickoffIso: string, nowMs = Date.now()): KickoffCountdownParts {
  const kickoffMs = Date.parse(kickoffIso);
  if (Number.isNaN(kickoffMs)) {
    return { totalMs: 0, days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
  }

  const totalMs = Math.max(0, kickoffMs - nowMs);
  const expired = kickoffMs <= nowMs;

  const totalSeconds = Math.floor(totalMs / 1000);
  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return { totalMs, days, hours, minutes, seconds, expired };
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** Human-readable countdown label for kickoff displays. */
export function formatKickoffCountdown(kickoffIso: string, nowMs = Date.now()): string {
  const parts = getKickoffCountdownParts(kickoffIso, nowMs);
  if (parts.expired) return "Starting soon";

  if (parts.days > 0) {
    return `${parts.days}d ${pad2(parts.hours)}:${pad2(parts.minutes)}:${pad2(parts.seconds)}`;
  }

  return `${pad2(parts.hours)}:${pad2(parts.minutes)}:${pad2(parts.seconds)}`;
}
