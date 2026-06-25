// Official FIFA World Cup 2026 knockout schedule (M73-M104).
// Match dates and host cities follow FIFA's published match schedule.
// Stadium names and stadium-city addresses were checked against ESPN's
// structured FIFA World Cup schedule API on 2026-06-25, with the FOX/DirecTV
// broadcast schedule used as an additional venue cross-check.
// Times are the published venue-local kick-offs, encoded as absolute instants
// with each city's summer UTC offset so they render correctly in any timezone.
// PDT = -07:00 · MDT = -06:00 · CDT = -05:00 · EDT = -04:00 · Mexico CST = -06:00

export type KnockoutInfo = {
  date: string;
  stadium: string;
  hostCity: string;
  venueCity: string;
  country: string;
};

export const knockoutSchedule: Record<string, KnockoutInfo> = {
  M73: {
    date: "2026-06-28T12:00:00-07:00",
    stadium: "SoFi Stadium",
    hostCity: "Los Angeles",
    venueCity: "Inglewood",
    country: "USA"
  },
  M74: {
    date: "2026-06-29T16:30:00-04:00",
    stadium: "Gillette Stadium",
    hostCity: "Boston",
    venueCity: "Foxborough",
    country: "USA"
  },
  M75: {
    date: "2026-06-29T19:00:00-06:00",
    stadium: "Estadio BBVA",
    hostCity: "Monterrey",
    venueCity: "Guadalupe",
    country: "Mexico"
  },
  M76: {
    date: "2026-06-29T12:00:00-05:00",
    stadium: "NRG Stadium",
    hostCity: "Houston",
    venueCity: "Houston",
    country: "USA"
  },
  M77: {
    date: "2026-06-30T17:00:00-04:00",
    stadium: "MetLife Stadium",
    hostCity: "New York/New Jersey",
    venueCity: "East Rutherford",
    country: "USA"
  },
  M78: {
    date: "2026-06-30T12:00:00-05:00",
    stadium: "AT&T Stadium",
    hostCity: "Dallas",
    venueCity: "Arlington",
    country: "USA"
  },
  M79: {
    date: "2026-06-30T19:00:00-06:00",
    stadium: "Estadio Banorte",
    hostCity: "Mexico City",
    venueCity: "Mexico City",
    country: "Mexico"
  },
  M80: {
    date: "2026-07-01T12:00:00-04:00",
    stadium: "Mercedes-Benz Stadium",
    hostCity: "Atlanta",
    venueCity: "Atlanta",
    country: "USA"
  },
  M81: {
    date: "2026-07-01T17:00:00-07:00",
    stadium: "Levi's Stadium",
    hostCity: "San Francisco Bay Area",
    venueCity: "Santa Clara",
    country: "USA"
  },
  M82: {
    date: "2026-07-01T13:00:00-07:00",
    stadium: "Lumen Field",
    hostCity: "Seattle",
    venueCity: "Seattle",
    country: "USA"
  },
  M83: {
    date: "2026-07-02T19:00:00-04:00",
    stadium: "BMO Field",
    hostCity: "Toronto",
    venueCity: "Toronto",
    country: "Canada"
  },
  M84: {
    date: "2026-07-02T12:00:00-07:00",
    stadium: "SoFi Stadium",
    hostCity: "Los Angeles",
    venueCity: "Inglewood",
    country: "USA"
  },
  M85: {
    date: "2026-07-02T20:00:00-07:00",
    stadium: "BC Place",
    hostCity: "Vancouver",
    venueCity: "Vancouver",
    country: "Canada"
  },
  M86: {
    date: "2026-07-03T18:00:00-04:00",
    stadium: "Hard Rock Stadium",
    hostCity: "Miami",
    venueCity: "Miami Gardens",
    country: "USA"
  },
  M87: {
    date: "2026-07-03T20:30:00-05:00",
    stadium: "GEHA Field at Arrowhead Stadium",
    hostCity: "Kansas City",
    venueCity: "Kansas City",
    country: "USA"
  },
  M88: {
    date: "2026-07-03T13:00:00-05:00",
    stadium: "AT&T Stadium",
    hostCity: "Dallas",
    venueCity: "Arlington",
    country: "USA"
  },
  M89: {
    date: "2026-07-04T17:00:00-04:00",
    stadium: "Lincoln Financial Field",
    hostCity: "Philadelphia",
    venueCity: "Philadelphia",
    country: "USA"
  },
  M90: {
    date: "2026-07-04T12:00:00-05:00",
    stadium: "NRG Stadium",
    hostCity: "Houston",
    venueCity: "Houston",
    country: "USA"
  },
  M91: {
    date: "2026-07-05T16:00:00-04:00",
    stadium: "MetLife Stadium",
    hostCity: "New York/New Jersey",
    venueCity: "East Rutherford",
    country: "USA"
  },
  M92: {
    date: "2026-07-05T18:00:00-06:00",
    stadium: "Estadio Banorte",
    hostCity: "Mexico City",
    venueCity: "Mexico City",
    country: "Mexico"
  },
  M93: {
    date: "2026-07-06T14:00:00-05:00",
    stadium: "AT&T Stadium",
    hostCity: "Dallas",
    venueCity: "Arlington",
    country: "USA"
  },
  M94: {
    date: "2026-07-06T17:00:00-07:00",
    stadium: "Lumen Field",
    hostCity: "Seattle",
    venueCity: "Seattle",
    country: "USA"
  },
  M95: {
    date: "2026-07-07T12:00:00-04:00",
    stadium: "Mercedes-Benz Stadium",
    hostCity: "Atlanta",
    venueCity: "Atlanta",
    country: "USA"
  },
  M96: {
    date: "2026-07-07T13:00:00-07:00",
    stadium: "BC Place",
    hostCity: "Vancouver",
    venueCity: "Vancouver",
    country: "Canada"
  },
  M97: {
    date: "2026-07-09T16:00:00-04:00",
    stadium: "Gillette Stadium",
    hostCity: "Boston",
    venueCity: "Foxborough",
    country: "USA"
  },
  M98: {
    date: "2026-07-10T12:00:00-07:00",
    stadium: "SoFi Stadium",
    hostCity: "Los Angeles",
    venueCity: "Inglewood",
    country: "USA"
  },
  M99: {
    date: "2026-07-11T17:00:00-04:00",
    stadium: "Hard Rock Stadium",
    hostCity: "Miami",
    venueCity: "Miami Gardens",
    country: "USA"
  },
  M100: {
    date: "2026-07-11T20:00:00-05:00",
    stadium: "GEHA Field at Arrowhead Stadium",
    hostCity: "Kansas City",
    venueCity: "Kansas City",
    country: "USA"
  },
  M101: {
    date: "2026-07-14T14:00:00-05:00",
    stadium: "AT&T Stadium",
    hostCity: "Dallas",
    venueCity: "Arlington",
    country: "USA"
  },
  M102: {
    date: "2026-07-15T15:00:00-04:00",
    stadium: "Mercedes-Benz Stadium",
    hostCity: "Atlanta",
    venueCity: "Atlanta",
    country: "USA"
  },
  M103: {
    date: "2026-07-18T17:00:00-04:00",
    stadium: "Hard Rock Stadium",
    hostCity: "Miami",
    venueCity: "Miami Gardens",
    country: "USA"
  },
  M104: {
    date: "2026-07-19T15:00:00-04:00",
    stadium: "MetLife Stadium",
    hostCity: "New York/New Jersey",
    venueCity: "East Rutherford",
    country: "USA"
  }
};
