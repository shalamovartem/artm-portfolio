import { authenticated, sameOrigin } from "../../../lib/auth";
import { readState, writeState } from "../../../lib/storage";
import { documentSchema } from "../../../lib/document";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const draft = new URL(request.url).searchParams.get("draft") === "1";
  if (draft && !(await authenticated()))
    return Response.json(
      { error: "Войдите для редактирования" },
      { status: 401 },
    );
  const s = await readState();
  return Response.json(
    { document: draft ? s.draft : s.published, revision: s.revision },
    { headers: { "Cache-Control": "no-store" } },
  );
}
export async function PUT(request: Request) {
  // Reading published content is public; all writes require an owner session and same-origin request.
  if (!(await authenticated()))
    return Response.json(
      { error: "Войдите для редактирования" },
      { status: 401 },
    );
  if (!(await sameOrigin(request)))
    return Response.json(
      { error: "Недопустимый источник запроса" },
      { status: 403 },
    );
  const raw = await request.text();
  if (new TextEncoder().encode(raw).length > 800000)
    return Response.json(
      {
        error:
          "Тексты и встроенные данные превышают 800 КБ. Загружайте фото через кнопку загрузки.",
      },
      { status: 413 },
    );
  let body;
  try {
    body = JSON.parse(raw);
  } catch {
    return Response.json({ error: "Некорректный JSON" }, { status: 400 });
  }
  const parsed = documentSchema.safeParse(body.document);
  if (
    !parsed.success ||
    !Number.isInteger(body.revision) ||
    !["draft", "publish"].includes(body.action)
  )
    return Response.json(
      { error: "Проверьте поля и адреса карточек" },
      { status: 400 },
    );
  if (
    !(await writeState(parsed.data, body.revision, body.action === "publish"))
  )
    return Response.json(
      {
        error:
          "Страница изменена в другой вкладке. Обновите её перед сохранением.",
      },
      { status: 409 },
    );
  return Response.json({ revision: body.revision + 1 });
}
