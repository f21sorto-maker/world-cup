import { isApiEnabled } from "../config/apiFlags";
import { getWeatherByCity, isWeatherDisabled, type WeatherData } from "./WeatherClient";

const TTL_MS = 30 * 60 * 1000;

type CacheEntry = {
  data: WeatherData;
  fetchedAt: number;
};

const cache = new Map<string, CacheEntry>();
const inFlight = new Map<string, Promise<WeatherData | null>>();

function cacheKey(city: string): string {
  return city.toLowerCase().replace(/\s+/g, "_");
}

export async function getWeather(city: string): Promise<WeatherData | null> {
  if (!isApiEnabled("openWeather") || isWeatherDisabled()) return null;

  const key = cacheKey(city);
  const cached = cache.get(key);
  if (cached && Date.now() - cached.fetchedAt < TTL_MS) {
    return cached.data;
  }

  const existing = inFlight.get(key);
  if (existing) return existing;

  const promise = getWeatherByCity(city).then((data) => {
    inFlight.delete(key);
    if (data) {
      cache.set(key, { data, fetchedAt: Date.now() });
    }
    return data;
  });

  inFlight.set(key, promise);
  return promise;
}

/** Invalidate a city entry (e.g. for tests) */
export function invalidateWeatherCache(city?: string): void {
  if (city) {
    cache.delete(cacheKey(city));
  } else {
    cache.clear();
  }
}
