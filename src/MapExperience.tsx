import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ArrowLeft,
  ArrowUpRight,
  MapPin,
  Minus,
  Plus,
  RotateCcw,
  Pause,
  Play,
  Globe2,
} from "lucide-react";
import { places, findPlace, directionsUrl } from "./places";
import { useMapWeather, type DayPhase, type WeatherKind } from "./useMapWeather";
const Globe = lazy(() => import("./Globe"));
type Props = {
  selected: string;
  exploring: boolean;
  paused: boolean;
  onExplore: (open: boolean) => void;
  onSelect: (id: string) => void;
  onPause: () => void;
  returnFocus?: HTMLElement | null;
};
export default function MapExperience({
  selected,
  exploring,
  paused,
  onExplore,
  onSelect,
  onPause,
  returnFocus,
}: Props) {
  const [style, setStyle] = useState<"noir" | "satellite">("satellite");
  const [preview, setPreview] = useState("auto");
  const [status, setStatus] = useState("Loading map…");
  const [command, setCommand] = useState<{
    type: "in" | "out" | "reset";
    tick: number;
  }>({ type: "reset", tick: 0 });
  const panel = useRef<HTMLDivElement>(null);
  const back = useRef<HTMLButtonElement>(null);
  const place = findPlace(selected);
  const weather = useMapWeather(place.latitude, place.longitude);
  const phase: DayPhase = preview === "auto" ? weather.phase : preview === "rain" ? "day" : preview as DayPhase;
  const kind: WeatherKind = preview === "auto" ? weather.kind : preview === "rain" ? "rain" : "clear";
  const cloud = preview === "auto" ? weather.cloud : preview === "rain" ? 0.9 : 0;
  const condition = { clear: "Clear", cloudy: "Cloudy", fog: "Fog", rain: "Rain", snow: "Snow", storm: "Thunderstorms" }[weather.kind];
  useEffect(() => {
    if (!exploring) return;
    const previous = returnFocus ?? document.activeElement as HTMLElement;
    const returnToMapButton = !!previous?.closest('.map-peek');
    const scroll = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    back.current?.focus();
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onExplore(false);
      }
      if (event.key === "Tab") {
        const elements = Array.from(
          panel.current?.querySelectorAll<HTMLElement>(
            "button:not([disabled]),a[href],select",
          ) ?? [],
        );
        const first = elements[0],
          last = elements[elements.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    window.addEventListener("keydown", key);
    return () => {
      document.body.style.overflow = scroll;
      window.removeEventListener("keydown", key);
      requestAnimationFrame(() => {
        if (previous?.isConnected) previous.focus();
        else if (returnToMapButton) document.querySelector<HTMLButtonElement>('.map-peek > button')?.focus();
      });
    };
  }, [exploring, onExplore, returnFocus]);
  const send = (type: "in" | "out" | "reset") =>
    setCommand((old) => ({ type, tick: old.tick + 1 }));
  return (
    <div className={`map-experience ${exploring ? "is-exploring" : ""}`} data-phase={phase} data-weather={kind} data-paused={paused}>
      <div className={`map-background ${style}`}>
        <Suspense fallback={null}>
          <Globe
            placeId={selected}
            exploring={exploring}
            paused={paused}
            style={style}
            phase={phase}
            cloud={cloud}
            onSelect={onSelect}
            onStatus={setStatus}
            command={command}
          />
        </Suspense>
      </div>
      <div className="map-atmosphere" aria-hidden="true">
        <div className="weather-haze" style={{ opacity: kind === "fog" ? 0.4 : cloud * 0.22 }} />
        <div className="weather-precipitation" />
      </div>
      <div className="map-shade" />
      {exploring ? (
        <div
          className="map-interface"
          ref={panel}
          role="dialog"
          aria-modal="true"
          aria-label="Explore the places behind my work"
        >
          <div className="map-topbar">
            <button ref={back} onClick={() => onExplore(false)}>
              <ArrowLeft />
              Back to portfolio <kbd>Esc</kbd>
            </button>
            <span>MOROCCO / MY PLACES</span>
            <button
              onClick={onPause}
              aria-label={paused ? "Play map animation" : "Pause map animation"}
            >
              {paused ? <Play /> : <Pause />}
            </button>
          </div>
          <aside className="places-panel">
            <h2>The places behind the work.</h2>
            <p>My education, internships, and projects.</p>
            <nav aria-label="Map locations">
              {places.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onSelect(item.id)}
                  aria-pressed={selected === item.id}
                >
                  <MapPin />
                  <span>
                    {item.name}
                    <span>{item.category}</span>
                  </span>
                </button>
              ))}
            </nav>
          </aside>
          <div className="map-tools">
            <select aria-label="Atmosphere" value={preview} onChange={(event) => setPreview(event.target.value)}>
              <option value="auto">Local weather</option>
              <option value="day">Preview: day</option>
              <option value="sunset">Preview: sunset</option>
              <option value="night">Preview: night</option>
              <option value="rain">Preview: rain</option>
            </select>
            <div className="map-style" role="group" aria-label="Map style">
              <button
                aria-pressed={style === "noir"}
                onClick={() => setStyle("noir")}
              >
                Noir
              </button>
              <button
                aria-pressed={style === "satellite"}
                onClick={() => setStyle("satellite")}
              >
                Satellite
              </button>
            </div>
            <button aria-label="Zoom in" onClick={() => send("in")}>
              <Plus />
            </button>
            <button aria-label="Zoom out" onClick={() => send("out")}>
              <Minus />
            </button>
            <button aria-label="Reset view" onClick={() => send("reset")}>
              <RotateCcw />
            </button>
          </div>
          <section className="place-detail" aria-live="polite">
            <p className="place-weather">
              {weather.localTime} local · {preview !== "auto" ? `${preview} preview` : weather.available ? `${weather.temperature}°C · ${condition}` : weather.loading ? "Loading weather…" : "Weather unavailable · estimated daylight"}
              {weather.available && preview === "auto" && <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">Weather: Open-Meteo</a>}
            </p>
            <p className="place-category">{place.category}</p>
            <h2>{place.name}</h2>
            <p>{place.description}</p>
            <p className="place-address">{place.address}</p>
            <div className="place-links">
              <a href={directionsUrl(place)} target="_blank" rel="noreferrer">
                {place.precision === "area"
                  ? "Find office in Google Maps"
                  : "Open in Google Maps"}
                <ArrowUpRight />
              </a>
              <a href={place.source} target="_blank" rel="noreferrer">
                Location source
                <ArrowUpRight />
              </a>
            </div>
            <span className="pin-precision">
              {place.precision === "campus"
                ? "Campus pin from EMSI"
                : place.precision === "listed"
                  ? "Business-directory map pin"
                  : place.precision === "area"
                    ? "Area only · exact office not yet confirmed"
                    : "City overview"}
            </span>
          </section>
          <div className="map-help">
            Drag to pan · Scroll to zoom · Ctrl + drag to tilt
          </div>
        </div>
      ) : createPortal(<div className="map-peek"><span><MapPin />{place.name}</span><button onClick={() => onExplore(true)}><Globe2 />Explore the map<ArrowUpRight /></button></div>, document.body)}
      <p className="map-status" role="status">
        {status}
      </p>
    </div>
  );
}
