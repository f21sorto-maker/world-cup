/** Static lat/lon for each WC 2026 stadium, keyed by exact venue name from matchSchedule.json */
export type VenueCoords = { lat: number; lon: number; city: string };

export const VENUE_COORDINATES: Record<string, VenueCoords> = {
  "Estadio Azteca":       { lat: 19.303,  lon: -99.151,  city: "Mexico City" },
  "Estadio Akron":        { lat: 20.679,  lon: -103.467, city: "Guadalajara" },
  "Estadio BBVA":         { lat: 25.669,  lon: -100.246, city: "Monterrey" },
  "BMO Field":            { lat: 43.633,  lon: -79.418,  city: "Toronto" },
  "BC Place":             { lat: 49.277,  lon: -123.112, city: "Vancouver" },
  "SoFi Stadium":         { lat: 33.953,  lon: -118.339, city: "Los Angeles" },
  "Levi's Stadium":       { lat: 37.403,  lon: -121.970, city: "Santa Clara" },
  "MetLife Stadium":      { lat: 40.814,  lon: -74.074,  city: "East Rutherford" },
  "Gillette Stadium":     { lat: 42.091,  lon: -71.264,  city: "Foxborough" },
  "NRG Stadium":          { lat: 29.685,  lon: -95.411,  city: "Houston" },
  "AT&T Stadium":         { lat: 32.748,  lon: -97.093,  city: "Arlington" },
  "Lincoln Financial Field": { lat: 39.901, lon: -75.168, city: "Philadelphia" },
  "Mercedes-Benz Stadium": { lat: 33.755, lon: -84.401,  city: "Atlanta" },
  "Lumen Field":          { lat: 47.595,  lon: -122.332, city: "Seattle" },
  "Hard Rock Stadium":    { lat: 25.958,  lon: -80.239,  city: "Miami" },
  "Arrowhead Stadium":    { lat: 39.049,  lon: -94.484,  city: "Kansas City" },
};

export function getVenueCoords(venueName: string): VenueCoords | undefined {
  return VENUE_COORDINATES[venueName];
}
