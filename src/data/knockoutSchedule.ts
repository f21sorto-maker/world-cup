// Official FIFA World Cup 2026 knockout schedule (M73–M104).
// Source: 2026 FIFA World Cup knockout stage — Wikipedia.
// Times are the published venue-local kick-offs, encoded as absolute instants
// with each city's summer UTC offset so they render correctly in any timezone.
// PDT = -07:00 · MDT = -06:00 · CDT = -05:00 · EDT = -04:00 · Mexico CST = -06:00

export type KnockoutInfo = { date: string; venue: string };

export const knockoutSchedule: Record<string, KnockoutInfo> = {
  M73: { date: "2026-06-28T12:00:00-07:00", venue: "Los Angeles" },
  M74: { date: "2026-06-29T16:30:00-04:00", venue: "Boston" },
  M75: { date: "2026-06-29T19:00:00-06:00", venue: "Monterrey" },
  M76: { date: "2026-06-29T12:00:00-05:00", venue: "Houston" },
  M77: { date: "2026-06-30T17:00:00-04:00", venue: "New York" },
  M78: { date: "2026-06-30T12:00:00-05:00", venue: "Dallas" },
  M79: { date: "2026-06-30T19:00:00-06:00", venue: "Mexico City" },
  M80: { date: "2026-07-01T12:00:00-04:00", venue: "Atlanta" },
  M81: { date: "2026-07-01T17:00:00-07:00", venue: "San Francisco" },
  M82: { date: "2026-07-01T13:00:00-07:00", venue: "Seattle" },
  M83: { date: "2026-07-02T19:00:00-04:00", venue: "Toronto" },
  M84: { date: "2026-07-02T12:00:00-07:00", venue: "Los Angeles" },
  M85: { date: "2026-07-02T20:00:00-07:00", venue: "Vancouver" },
  M86: { date: "2026-07-03T18:00:00-04:00", venue: "Miami" },
  M87: { date: "2026-07-03T20:30:00-05:00", venue: "Kansas City" },
  M88: { date: "2026-07-03T13:00:00-05:00", venue: "Dallas" },
  M89: { date: "2026-07-04T17:00:00-04:00", venue: "Philadelphia" },
  M90: { date: "2026-07-04T12:00:00-05:00", venue: "Houston" },
  M91: { date: "2026-07-05T16:00:00-04:00", venue: "New York" },
  M92: { date: "2026-07-05T18:00:00-06:00", venue: "Mexico City" },
  M93: { date: "2026-07-06T14:00:00-05:00", venue: "Dallas" },
  M94: { date: "2026-07-06T17:00:00-07:00", venue: "Seattle" },
  M95: { date: "2026-07-07T12:00:00-04:00", venue: "Atlanta" },
  M96: { date: "2026-07-07T13:00:00-07:00", venue: "Vancouver" },
  M97: { date: "2026-07-09T16:00:00-04:00", venue: "Boston" },
  M98: { date: "2026-07-10T12:00:00-07:00", venue: "Los Angeles" },
  M99: { date: "2026-07-11T17:00:00-04:00", venue: "Miami" },
  M100: { date: "2026-07-11T20:00:00-05:00", venue: "Kansas City" },
  M101: { date: "2026-07-14T14:00:00-05:00", venue: "Dallas" },
  M102: { date: "2026-07-15T15:00:00-04:00", venue: "Atlanta" },
  M104: { date: "2026-07-19T15:00:00-04:00", venue: "New York" }
};
