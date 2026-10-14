import { cookies } from "next/headers";
import {
  adminConfig,
  checkPassword,
  sameOrigin,
  sessionToken,
} from "../../../lib/auth";
const attempts = new Map<string, { count: number; until: number }>();
export async function POST(request: Request) {
  if (!(await sameOrigin(request)))
    return Response.json({ error: "Недопустимый источник" }, { status: 403 });
  const key = "admin";
  let rate = attempts.get(key);
  if (rate && rate.until > Date.now() && rate.count >= 10)
    return Response.json(
      { error: "Слишком много попыток. Подождите 15 минут." },
      { status: 429 },
    );
  if (!rate || rate.until < Date.now()) {
    rate = { count: 0, until: Date.now() + 900000 };
    attempts.set(key, rate);
  }
  rate.count++;
  let body;
  try {
    body = JSON.parse((await request.text()).slice(0, 4096)) as {
      username?: string;
      password?: string;
    };
  } catch {
    return Response.json({ error: "Некорректный запрос" }, { status: 400 });
  }
  const config = await adminConfig();
  if (!config)
    return Response.json(
      {
        error:
          "Сначала создайте администратора командой из инструкции по установке.",
      },
      { status: 503 },
    );
  if (
    typeof body.password !== "string" ||
    body.password.length > 1024 ||
    body.username !== config.username ||
    !checkPassword(body.password, config)
  )
    return Response.json(
      { error: "Неверный логин или пароль" },
      { status: 401 },
    );
  attempts.delete(key);
  (await cookies()).set("portfolio_session", sessionToken(config.secret), {
    httpOnly: true,
    secure:
      process.env.PUBLIC_ORIGIN?.startsWith("https://") ||
      request.headers.get("x-forwarded-proto") === "https",
    sameSite: "lax",
    path: "/",
    maxAge: 43200,
  });
  return Response.json({ ok: true });
}
export async function DELETE(request: Request) {
  if (!(await sameOrigin(request))) return new Response(null, { status: 403 });
  (await cookies()).delete("portfolio_session");
  return Response.json({ ok: true });
}
