export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const lat = params.get("latitude") ?? "47.422",
    lon = params.get("longitude") ?? "40.093";
  const latitude = Number(lat),
    longitude = Number(lon);
  if (
    !lat.trim() ||
    !lon.trim() ||
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    Math.abs(latitude) > 90 ||
    Math.abs(longitude) > 180
  )
    return Response.json({ error: "Некорректные координаты" }, { status: 400 });
  try {
    const url = new URL("https://api.open-meteo.com/v1/forecast");
    url.search = new URLSearchParams({
      latitude: latitude.toFixed(4),
      longitude: longitude.toFixed(4),
      current: "temperature_2m,weather_code,is_day,wind_speed_10m",
      timezone: "auto",
    }).toString();
    const response = await fetch(url, {
      signal: AbortSignal.timeout(8000),
      next: { revalidate: 900 },
    });
    if (!response.ok) throw Error();
    const data = (await response.json()) as {
      current?: {
        temperature_2m: number;
        weather_code: number;
        is_day: number;
        wind_speed_10m: number;
        time: string;
      };
    };
    if (!data.current || !Number.isFinite(data.current.temperature_2m))
      throw Error();
    return Response.json(data.current, {
      headers: { "Cache-Control": "public,max-age=900" },
    });
  } catch {
    return Response.json(
      { error: "Погода временно недоступна" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
