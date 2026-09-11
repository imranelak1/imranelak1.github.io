import { useEffect, useState } from "react";

export type DayPhase = "day" | "sunset" | "night";
export type WeatherKind = "clear" | "cloudy" | "fog" | "rain" | "snow" | "storm";
type Report = {
  current: { time: number; temperature_2m: number; weather_code: number; cloud_cover: number; is_day: number };
  daily: { sunrise: number[]; sunset: number[] };
};
const cache = new Map<string, { at: number; report: Report }>();
const refreshMs = 10 * 60 * 1000;

export function weatherKind(code: number): WeatherKind {
  if (code >= 95) return "storm";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "snow";
  if (code >= 51) return "rain";
  if (code === 45 || code === 48) return "fog";
  return code >= 2 ? "cloudy" : "clear";
}

export function useMapWeather(latitude: number, longitude: number) {
  const key = `${latitude.toFixed(2)},${longitude.toFixed(2)}`;
  const [entry, setEntry] = useState<{ key: string; report: Report } | null>(null);
  const [failed, setFailed] = useState("");
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    let disposed = false;
    let active: AbortController | undefined;
    const update = async () => {
      if (document.hidden) return;
      setNow(Date.now());
      const cached = cache.get(key);
      if (cached && Date.now() - cached.at < refreshMs) {
        setEntry({ key, report: cached.report });
        setFailed("");
        return;
      }
      active?.abort();
      const controller = new AbortController();
      active = controller;
      const timeout = window.setTimeout(() => controller.abort(), 8000);
      try {
        const params = new URLSearchParams({
          latitude: String(latitude), longitude: String(longitude),
          current: "temperature_2m,weather_code,cloud_cover,is_day",
          daily: "sunrise,sunset", timezone: "auto", timeformat: "unixtime", forecast_days: "2",
        });
        const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, { signal: controller.signal });
        if (!response.ok) throw new Error("Weather unavailable");
        const report = await response.json() as Report;
        if (!report.current || ![report.current.time, report.current.temperature_2m, report.current.weather_code, report.current.cloud_cover, report.current.is_day].every(Number.isFinite)
          || !Array.isArray(report.daily?.sunrise) || !Array.isArray(report.daily?.sunset)
          || !report.daily.sunrise.length || !report.daily.sunset.length
          || ![...report.daily.sunrise, ...report.daily.sunset].every(Number.isFinite)
          || Math.abs(Date.now() / 1000 - report.current.time) > 5400) throw new Error("Invalid or stale weather");
        if (!disposed) {
          cache.set(key, { at: Date.now(), report });
          setEntry({ key, report });
          setFailed("");
        }
      } catch {
        if (!disposed && active === controller) setFailed(key);
      } finally { clearTimeout(timeout); }
    };
    void update();
    const timer = window.setInterval(() => void update(), refreshMs);
    const tick = window.setInterval(() => { if (!document.hidden) setNow(Date.now()); }, 60000);
    document.addEventListener("visibilitychange", update);
    return () => {
      disposed = true;
      active?.abort();
      clearInterval(timer); clearInterval(tick);
      document.removeEventListener("visibilitychange", update);
    };
  }, [key, latitude, longitude]);

  const report = entry?.key === key && failed !== key
    && Math.abs(now / 1000 - entry.report.current.time) < 5400 ? entry.report : null;
  const localTime = new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Casablanca", hour: "2-digit", minute: "2-digit" }).format(now);
  const hour = Number(localTime.split(":")[0]);
  let phase: DayPhase = hour >= 7 && hour < 19 ? "day" : "night";
  if (report) {
    const seconds = now / 1000;
    const index = report.daily.sunrise.findIndex((rise, i) => seconds >= rise - 3600 && seconds <= report.daily.sunset[i] + 3600);
    if (index >= 0) {
      const rise = report.daily.sunrise[index], set = report.daily.sunset[index];
      phase = Math.abs(seconds - rise) < 2700 || Math.abs(seconds - set) < 2700 ? "sunset" : seconds > rise && seconds < set ? "day" : "night";
    } else phase = "night";
  }
  return {
    phase, kind: report ? weatherKind(report.current.weather_code) : "clear" as WeatherKind,
    cloud: report ? report.current.cloud_cover / 100 : 0,
    temperature: report ? Math.round(report.current.temperature_2m) : null,
    localTime, available: !!report, loading: !report && failed !== key,
  };
}
