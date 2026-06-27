/** Normalizes player names for fuzzy roster matching. */
export function normalizePlayerName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Returns true when two names likely refer to the same player. */
export function playerNamesMatch(a: string, b: string): boolean {
  const na = normalizePlayerName(a);
  const nb = normalizePlayerName(b);
  if (!na || !nb) return false;
  if (na === nb) return true;

  const aParts = na.split(" ");
  const bParts = nb.split(" ");
  const aLast = aParts[aParts.length - 1];
  const bLast = bParts[bParts.length - 1];
  if (aLast && bLast && aLast === bLast) {
    const aFirst = aParts[0];
    const bFirst = bParts[0];
    if (aFirst && bFirst && (aFirst.startsWith(bFirst[0]!) || bFirst.startsWith(aFirst[0]!))) {
      return true;
    }
  }

  return na.includes(nb) || nb.includes(na);
}
