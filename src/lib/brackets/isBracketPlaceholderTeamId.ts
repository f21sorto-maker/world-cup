/** Bracket template labels stored as team ids before qualification resolves (e.g. "2nd Group A"). */
export function isBracketPlaceholderTeamId(teamId: string | undefined | null): boolean {
  if (!teamId?.trim()) return true;
  const value = teamId.trim();
  return (
    /^(1st|2nd|3rd)\s+Group\s+[A-L]\b/i.test(value) ||
    /^Best 3rd\b/i.test(value) ||
    /^W\d+/i.test(value)
  );
}
