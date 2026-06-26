import { useEffect, useState } from "react";
import { getWeather } from "../../services/WeatherCache";
import { getWeatherIconUrl, type WeatherData } from "../../services/WeatherClient";

type Props = { city: string };

export function WeatherBadge({ city }: Props) {
  const [weather, setWeather] = useState<WeatherData | null>(null);

  useEffect(() => {
    let cancelled = false;
    void getWeather(city).then((data) => {
      if (!cancelled) setWeather(data);
    });
    return () => {
      cancelled = true;
    };
  }, [city]);

  if (!weather) return null;

  return (
    <span className="weather-badge" title={`${weather.city}: ${weather.description}`}>
      {weather.icon ? (
        <img
          src={getWeatherIconUrl(weather.icon)}
          alt={weather.description}
          width={16}
          height={16}
          className="weather-badge-icon"
        />
      ) : null}
      <span className="weather-badge-temp">{weather.tempF}°F</span>
      {weather.rainChancePercent > 10 ? (
        <span className="weather-badge-rain">💧{weather.rainChancePercent}%</span>
      ) : null}
    </span>
  );
}
