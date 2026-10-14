"use client";
import { useEffect, useRef, useState } from "react";
import type { Card } from "../lib/document";
type Place = {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  admin1?: string;
};
export default function MapEditor({
  card,
  onChange,
}: {
  card: Card;
  onChange: (patch: Partial<Card>) => void;
}) {
  const [query, setQuery] = useState(""),
    [results, setResults] = useState<Place[]>([]),
    [status, setStatus] = useState(""),
    [busy, setBusy] = useState(false);
  const [latitude, setLatitude] = useState(String(card.latitude)),
    [longitude, setLongitude] = useState(String(card.longitude));
  const request = useRef<AbortController | null>(null);
  useEffect(() => {
    setLatitude(String(card.latitude));
    setLongitude(String(card.longitude));
    setResults([]);
    setStatus("");
  }, [card.id, card.latitude, card.longitude]);
  useEffect(() => () => request.current?.abort(), []);
  async function search() {
    if (query.trim().length < 2) return;
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setBusy(true);
    setStatus("");
    setResults([]);
    try {
      const r = await fetch(
        "/api/places?q=" + encodeURIComponent(query.trim()),
        { signal: controller.signal },
      );
      const data = await r.json();
      if (!r.ok) throw Error(data.error || "Поиск недоступен");
      setResults(data.results);
      if (!data.results.length)
        setStatus(
          "Ничего не найдено. Попробуйте другое название или укажите координаты.",
        );
    } catch (e) {
      if (!controller.signal.aborted)
        setStatus(e instanceof Error ? e.message : "Не удалось найти город");
    } finally {
      if (!controller.signal.aborted) setBusy(false);
    }
  }
  function applyCoordinates() {
    const lat = Number(latitude.replace(",", ".")),
      lon = Number(longitude.replace(",", "."));
    if (
      !latitude.trim() ||
      !longitude.trim() ||
      !Number.isFinite(lat) ||
      !Number.isFinite(lon) ||
      Math.abs(lat) > 90 ||
      Math.abs(lon) > 180
    ) {
      setStatus("Широта: от −90 до 90. Долгота: от −180 до 180.");
      return;
    }
    onChange({ latitude: lat, longitude: lon });
    setStatus("Карта и погода обновлены. Сохраните изменения.");
  }
  return (
    <section className="map-editor fields">
      <h3>Место на карте</h3>
      <label>
        Найти город
        <input
          value={query}
          placeholder="Например, Санкт-Петербург"
          onChange={(e) => {
            request.current?.abort();
            setBusy(false);
            setResults([]);
            setQuery(e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void search();
            }
          }}
        />
      </label>
      <button
        type="button"
        disabled={busy || query.trim().length < 2}
        onClick={search}
      >
        {busy ? "Ищу…" : "Найти место"}
      </button>
      <div className="place-results">
        {results.map((place) => (
          <button
            type="button"
            key={place.id}
            onClick={() => {
              onChange({
                title: place.name,
                latitude: place.latitude,
                longitude: place.longitude,
              });
              setResults([]);
              setQuery(place.name);
            }}
          >
            <strong>{place.name}</strong>
            <span>
              {[place.admin1, place.country].filter(Boolean).join(", ")}
            </span>
          </button>
        ))}
      </div>
      <div className="field-row">
        <label>
          Широта
          <input
            inputMode="decimal"
            value={latitude}
            onChange={(e) => setLatitude(e.target.value)}
          />
        </label>
        <label>
          Долгота
          <input
            inputMode="decimal"
            value={longitude}
            onChange={(e) => setLongitude(e.target.value)}
          />
        </label>
      </div>
      <button type="button" onClick={applyCoordinates}>
        Применить координаты
      </button>
      <label>
        Масштаб карты · {card.mapZoom.toFixed(1)}
        <input
          type="range"
          min={2}
          max={18}
          step={0.1}
          value={card.mapZoom}
          onChange={(e) => onChange({ mapZoom: Number(e.target.value) })}
        />
      </label>
      <p className="hint">
        Название на карточке меняется в поле «Заголовок». Поиск — GeoNames /
        Open-Meteo.
      </p>
      {status && (
        <p className="hint" role="status">
          {status}
        </p>
      )}
    </section>
  );
}
