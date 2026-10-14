import { authenticated } from "../../../lib/auth";
export async function GET(request: Request) {
  if (!(await authenticated()))
    return Response.json({ error: "Войдите в редактор" }, { status: 401 });
  const query = new URL(request.url).searchParams.get("q")?.trim() || "";
  if (query.length < 2 || query.length > 150)
    return Response.json(
      { error: "Введите от 2 до 150 символов" },
      { status: 400 },
    );
  try {
    const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
    url.search = new URLSearchParams({
      name: query,
      count: "6",
      language: "ru",
      format: "json",
    }).toString();
    const response = await fetch(url, {
      signal: AbortSignal.timeout(8000),
      next: { revalidate: 86400 },
    });
    if (!response.ok) throw Error();
    const data = (await response.json()) as {
      results?: Array<{
        id: number;
        name: string;
        latitude: number;
        longitude: number;
        country?: string;
        admin1?: string;
      }>;
    };
    return Response.json({
      results: (data.results || [])
        .filter(
          (p) => Number.isFinite(p.latitude) && Number.isFinite(p.longitude),
        )
        .map(({ id, name, latitude, longitude, country, admin1 }) => ({
          id,
          name,
          latitude,
          longitude,
          country,
          admin1,
        })),
    });
  } catch {
    return Response.json(
      { error: "Поиск временно недоступен. Можно указать координаты вручную." },
      { status: 503 },
    );
  }
}
