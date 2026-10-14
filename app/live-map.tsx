"use client";
import { useEffect, useRef, useState } from "react";
import { Plane, Sun, Moon, Cloud, CloudRain, CloudSnow } from "lucide-react";
import "maplibre-gl/dist/maplibre-gl.css";
type Weather = {
  temperature_2m: number;
  weather_code: number;
  is_day: number;
  wind_speed_10m: number;
  time: string;
};
const mode = (w: Weather | null) =>
  !w
    ? "clear"
    : (w.weather_code >= 71 && w.weather_code <= 77) ||
        w.weather_code === 85 ||
        w.weather_code === 86
      ? "snow"
      : w.weather_code >= 51
        ? "rain"
        : w.weather_code >= 2
          ? "cloud"
          : "clear";
export default function LiveMap({
  title = "Новочеркасск",
  latitude = 47.422,
  longitude = 40.093,
  zoom = 12.4,
}: {
  title?: string;
  latitude?: number;
  longitude?: number;
  zoom?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [weather, setWeather] = useState<Weather | null>(null),
    [error, setError] = useState(false),
    [mapError, setMapError] = useState(false),
    [scene, setScene] = useState("auto"),
    [flights, setFlights] = useState(true);
  const mapRef = useRef<import("maplibre-gl").Map | null>(null),
    markerRef = useRef<import("maplibre-gl").Marker | null>(null);
  const locationRef = useRef({ latitude, longitude, zoom });
  locationRef.current = { latitude, longitude, zoom };
  useEffect(() => {
    const controller = new AbortController();
    setWeather(null);
    setError(false);
    const update = () =>
      fetch(`/api/weather?latitude=${latitude}&longitude=${longitude}`, {
        signal: controller.signal,
      })
        .then(async (r) => {
          if (!r.ok) throw Error();
          const d = (await r.json()) as Weather;
          if (!controller.signal.aborted) {
            setWeather(d);
            setError(false);
          }
        })
        .catch(() => {
          if (!controller.signal.aborted) {
            setWeather(null);
            setError(true);
          }
        });
    void update();
    const t = setInterval(update, 900000);
    return () => {
      controller.abort();
      clearInterval(t);
    };
  }, [latitude, longitude]);
  useEffect(() => {
    mapRef.current?.jumpTo({ center: [longitude, latitude], zoom });
    markerRef.current?.setLngLat([longitude, latitude]);
  }, [latitude, longitude, zoom]);
  useEffect(() => {
    let gone = false;
    let map: import("maplibre-gl").Map | undefined;
    let resize: ResizeObserver | undefined;
    import("maplibre-gl")
      .then((L) => {
        if (gone || !ref.current) return;
        L.setWorkerUrl("/vendor/maplibre-worker.mjs");
        map = new L.Map({
          container: ref.current,
          style: "https://tiles.openfreemap.org/styles/liberty",
          center: [locationRef.current.longitude, locationRef.current.latitude],
          zoom: locationRef.current.zoom,
          pitch: 0,
          attributionControl: false,
          interactive: false,
          scrollZoom: false,
        });
        mapRef.current = map;
        map.on("load", () => {
          if (ref.current) ref.current.dataset.loaded = "true";
          setMapError(false);
          for (const layer of map!.getStyle().layers) {
            if (layer.type === "background")
              map!.setPaintProperty(layer.id, "background-color", "#f1f0e9");
            if (layer.type === "fill" && /water/.test(layer.id))
              map!.setPaintProperty(layer.id, "fill-color", "#a5d8ec");
            if (layer.type === "fill" && /park|grass|wood/.test(layer.id))
              map!.setPaintProperty(layer.id, "fill-color", "#cfe1bb");
            if (layer.type === "symbol" && /poi|housenumber/.test(layer.id))
              map!.setLayoutProperty(layer.id, "visibility", "none");
          }
        });
        map.on("error", (e) => {
          if (!gone) {
            setMapError(true);
            if (ref.current) ref.current.dataset.error = e.error.message;
          }
        });
        const marker = document.createElement("div");
        marker.className = "vector-city-marker";
        markerRef.current = new L.Marker({ element: marker })
          .setLngLat([
            locationRef.current.longitude,
            locationRef.current.latitude,
          ])
          .addTo(map);
        resize = new ResizeObserver(() => map?.resize());
        resize.observe(ref.current);
      })
      .catch(() => !gone && setMapError(true));
    return () => {
      gone = true;
      resize?.disconnect();
      map?.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);
  const effect = scene === "auto" ? mode(weather) : scene;
  const night = weather?.is_day === 0;
  const W =
    effect === "rain"
      ? CloudRain
      : effect === "snow"
        ? CloudSnow
        : effect === "cloud"
          ? Cloud
          : night
            ? Moon
            : Sun;
  return (
    <div
      className={`live-map vector-map ${night ? "night" : "day"} weather-${effect}`}
    >
      <div
        className="vector-host"
        ref={ref}
        aria-label={"Карта: " + title}
        data-latitude={latitude}
        data-longitude={longitude}
      />
      {mapError && (
        <span className="map-error-note">Не все данные карты загрузились</span>
      )}
      <div className="weather-atmosphere" aria-hidden="true">
        {effect === "rain" &&
          Array.from({ length: 60 }, (_, i) => (
            <i
              className="raindrop"
              key={i}
              style={{
                left: `${(i * 37) % 100}%`,
                animationDelay: `-${i * 0.137}s`,
                animationDuration: `${0.65 + (i % 5) * 0.12}s`,
              }}
            />
          ))}
        {effect === "snow" &&
          Array.from({ length: 42 }, (_, i) => (
            <i
              className="snowflake"
              key={i}
              style={{
                left: `${(i * 31) % 100}%`,
                animationDelay: `-${i * 0.73}s`,
                animationDuration: `${4 + (i % 5)}s`,
                width: 2 + (i % 4),
                height: 2 + (i % 4),
              }}
            />
          ))}
        {effect === "cloud" && (
          <>
            <div className="cloud-shadow" />
            <div className="cloud-shadow second" />
          </>
        )}
      </div>
      {flights && (
        <div
          className="flight-layer"
          aria-hidden="true"
          style={
            {
              "--flight-duration": `${Math.max(12, 40 / (1 + (weather?.wind_speed_10m || 0) / 25))}s`,
            } as React.CSSProperties
          }
        >
          <div className="flight-route route-one">
            <div className="aircraft">
              <span />
              <svg viewBox="0 0 24 24" width="24" height="24">
                <path d="M22 12 14 9 10 2H7l3 8-6-1-2-3H0l2 6-2 6h2l2-3 6-1-3 8h3l4-7z" />
              </svg>
            </div>
          </div>
          <div className="flight-route route-two">
            <div className="aircraft">
              <span />
              <svg viewBox="0 0 24 24" width="24" height="24">
                <path d="M22 12 14 9 10 2H7l3 8-6-1-2-3H0l2 6-2 6h2l2-3 6-1-3 8h3l4-7z" />
              </svg>
            </div>
          </div>
        </div>
      )}
      <div className="map-top">
        <div className="weather-pill">
          <W size={16} />
          <strong>
            {weather ? `${Math.round(weather.temperature_2m)}°` : "—°"}
          </strong>
          <select
            aria-label="Погода на карте"
            value={scene}
            onChange={(e) => setScene(e.target.value)}
          >
            <option value="auto">Сейчас</option>
            <option value="clear">Ясно</option>
            <option value="cloud">Облака</option>
            <option value="rain">Дождь</option>
            <option value="snow">Снег</option>
          </select>
        </div>
        <button
          className={`flight-toggle ${flights ? "on" : ""}`}
          aria-label={flights ? "Выключить самолётики" : "Включить самолётики"}
          onClick={() => setFlights(!flights)}
        >
          <Plane size={15} />
        </button>
      </div>
      <div className="map-bottom">
        <h2>{title}</h2>
        <span>
          {scene !== "auto"
            ? "Атмосфера: " +
              { clear: "ясно", cloud: "облака", rain: "дождь", snow: "снег" }[
                scene
              ]
            : error
              ? "Погода временно недоступна"
              : weather
                ? `${weather.is_day ? "День" : "Ночь"} · ветер ${Math.round(weather.wind_speed_10m)} км/ч`
                : "Загружаю погоду…"}
        </span>
      </div>
      <details className="map-weather-info">
        <summary aria-label="Информация о карте">i</summary>
        <div>
          <a href="https://openfreemap.org/" target="_blank" rel="noreferrer">
            OpenFreeMap
          </a>
          <a href="https://openmaptiles.org/" target="_blank" rel="noreferrer">
            © OpenMapTiles
          </a>
          <a
            href="https://www.openstreetmap.org/copyright"
            target="_blank"
            rel="noreferrer"
          >
            © OpenStreetMap
          </a>
          <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">
            Погода: Open-Meteo
          </a>
        </div>
      </details>
    </div>
  );
}
