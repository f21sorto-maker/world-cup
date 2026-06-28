/**
 * Legacy Meteosource RapidAPI normalizers — kept for proxy fallback and unit tests.
 */

export type MeteosourceWeatherData = {
  city: string;
  tempF: number;
  tempC: number;
  description: string;
  icon: string;
  rainChancePercent: number;
  humidity: number;
  windMph: number;
};

export type MeteosourcePointResponse = {
  units?: string;
  current?: {
    icon?: string;
    icon_num?: number;
    summary?: string;
    weather?: string;
    temperature?: number;
    humidity?: number;
    wind?: { speed?: number; dir?: string };
    precipitation?: { total?: number; type?: string };
  };
  hourly?: {
    data?: Array<{
      probability?: { precipitation?: number };
      precipitation?: { total?: number };
    }>;
  };
};

function cToF(c: number): number {
  return Math.round((c * 9) / 5 + 32);
}

function fToC(f: number): number {
  return Math.round(((f - 32) * 5) / 9);
}

function mpsToMph(mps: number): number {
  return Math.round(mps * 2.237);
}

function kphToMph(kph: number): number {
  return Math.round(kph * 0.621371);
}

function normalizeTemperature(temp: number, units?: string): { tempC: number; tempF: number } {
  if (units === "us" || units === "uk" || units === "ca") {
    return { tempF: Math.round(temp), tempC: fToC(temp) };
  }
  return { tempC: Math.round(temp), tempF: cToF(temp) };
}

function normalizeWindMph(speed: number, units?: string): number {
  if (units === "us" || units === "uk") return Math.round(speed);
  if (units === "ca") return kphToMph(speed);
  return mpsToMph(speed);
}

function rainChanceFromPoint(d: MeteosourcePointResponse): number {
  const hourlyProb = d.hourly?.data?.[0]?.probability?.precipitation;
  if (typeof hourlyProb === "number") return Math.min(100, Math.round(hourlyProb));

  const precipTotal = d.current?.precipitation?.total;
  if (typeof precipTotal === "number" && precipTotal > 0) {
    return Math.min(100, Math.round(precipTotal * 20));
  }
  return 0;
}

/** Normalize Meteosource /point JSON into app weather shape. */
export function normalizeMeteosourcePoint(
  raw: MeteosourcePointResponse,
  displayCity: string
): MeteosourceWeatherData | null {
  const current = raw.current;
  if (!current || typeof current.temperature !== "number") return null;

  const iconNum = current.icon_num ?? Number(current.icon);
  const icon = Number.isFinite(iconNum) ? String(iconNum) : "1";
  const { tempC, tempF } = normalizeTemperature(current.temperature, raw.units);
  const description = current.summary ?? current.weather ?? "";

  return {
    city: displayCity,
    tempF,
    tempC,
    description,
    icon,
    rainChancePercent: rainChanceFromPoint(raw),
    humidity: typeof current.humidity === "number" ? Math.round(current.humidity) : 0,
    windMph: normalizeWindMph(current.wind?.speed ?? 0, raw.units),
  };
}

export function getWeatherIconUrl(icon: string): string {
  const iconNum = Number(icon);
  if (Number.isFinite(iconNum) && iconNum >= 1 && iconNum <= 36) {
    return `https://www.meteosource.com/static/img/ico/weather/${iconNum}.svg`;
  }
  if (icon) {
    return `https://openweathermap.org/img/wn/${icon}@2x.png`;
  }
  return "";
}
