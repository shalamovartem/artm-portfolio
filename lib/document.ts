import { z } from "zod";
import defaultProjects from "./projects.json";
export function validLink(v: string) {
  if (!v) return true;
  if (/[\\\s\u0000-\u001f]/.test(v)) return false;
  if (/^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(v))
    return true;
  if (/^mailto:[^\s]+$/i.test(v)) return true;
  if (
    (v.startsWith("/") && !v.startsWith("//")) ||
    v.startsWith("#") ||
    v.startsWith("?")
  )
    return true;
  try {
    return ["https:", "http:"].includes(new URL(v).protocol);
  } catch {
    return false;
  }
}
const url = z
  .string()
  .max(1500000)
  .refine(validLink, "Укажите https://…, /адрес или /?section=название");
export const reservedSlugs = [
  "api",
  "login",
  "projects",
  "media",
  "license",
  "_next",
  "favicon",
  "robots",
  "sitemap",
];
export function pagePath(p: { slug: string; location?: string }) {
  return (p.location === "root" ? "/" : "/projects/") + p.slug;
}
export const sectionDescription: Record<string, string> = {
  photos: "Города, свет и моменты между делами.",
  projects: "Цифровые сервисы и вещи, которые можно потрогать.",
  career: "Команды, ответственность и операционная работа.",
  education: "Образование и профессиональные квалификации.",
  links: "Один клик — и мы на связи.",
};
export const defaultSections = [
  { id: "projects", title: "Проекты" },
  { id: "photos", title: "Фотографии" },
  { id: "career", title: "Карьера" },
  { id: "education", title: "Образование" },
  { id: "links", title: "Контакты" },
];
const slug = z
  .string()
  .min(1)
  .max(100)
  .regex(/^[a-z0-9-]+$/);
export const projectSchema = z.object({
  slug,
  location: z.enum(["projects", "root"]).default("projects"),
  browserTitle: z.string().max(200).default(""),
  shellBackground: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .default("#101110"),
  footerBackground: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .default("#101110"),
  footerColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .default("#f0f2ec"),
  shellColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .default("#f0f2ec"),
  pageType: z.enum(["standard", "html"]).default("standard"),
  html: z.string().max(200000).default(""),
  versionsTitle: z.string().max(200).default("Версии проекта"),
  title: z.string().max(200),
  subtitle: z.string().max(500),
  body: z.string().max(20000),
  year: z.string().max(100),
  kind: z.string().max(100),
  image: url,
  facts: z
    .array(z.object({ label: z.string().max(100), url: z.string().max(300) }))
    .max(20),
  links: z.array(z.object({ label: z.string().max(150), url })).max(30),
  children: z.array(z.object({ title: z.string().max(200), slug })).max(30),
  gallery: z.array(url).max(30),
  note: z.string().max(1000),
  licenseText: z.string().max(20000),
});
export const documentSchema = z
  .object({
    browserTitle: z
      .string()
      .max(200)
      .default("Артём Шаламов — инженерия, электроника, жизнь"),
    copyrightText: z.string().max(200).default("Артём Шаламов"),
    footerText: z.string().max(200).default("Форма. Электроника. Жизнь."),
    greeting: z.string().max(160).default("ПРИВЕТ, Я АРТЁМ"),
    logo: url.default("/media/ag-logo.png"),
    favicon: url.default("/media/ag-logo.png"),
    name: z.string().max(120),
    handle: z.string().max(80),
    bio: z.string().max(2000),
    avatar: url,
    theme: z.enum(["dark", "light"]),
    accent: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    sections: z
      .array(
        z.object({
          id: slug.refine((v) => v !== "home"),
          title: z.string().min(1).max(50),
          description: z.string().max(1000).default(""),
          eyebrow: z.string().max(150).default(""),
        }),
      )
      .max(20),
    projects: z.array(projectSchema).max(100),
    cards: z
      .array(
        z.object({
          id: z.string().max(100),
          latitude: z.number().min(-90).max(90).default(47.422),
          longitude: z.number().min(-180).max(180).default(40.093),
          mapZoom: z.number().min(2).max(18).default(12.4),
          icon: z
            .enum([
              "none",
              "send",
              "mail",
              "code",
              "arrow",
              "diamond",
              "pin",
              "vk",
              "steam",
              "github",
              "youtube",
              "discord",
              "twitch",
              "globe",
              "camera",
              "music",
              "gamepad",
              "cpu",
              "wrench",
              "heart",
            ])
            .default("none"),
          type: z.enum(["text", "link", "image", "project", "map"]),
          title: z.string().max(300),
          text: z.string().max(5000),
          url,
          image: url,
          size: z.enum(["small", "wide", "tall", "large"]),
          category: slug,
          home: z.boolean(),
          projectSlug: z.string().max(100),
          tone: z.enum(["neutral", "sage", "blue", "green", "lilac", "peach"]),
          hidden: z.boolean(),
        }),
      )
      .max(150),
  })
  .superRefine((d, ctx) => {
    for (const [name, arr] of [
      ["карточек", d.cards.map((c) => c.id)],
      ["разделов", d.sections.map((s) => s.id)],
      ["проектов", d.projects.map((p) => p.slug)],
    ] as const) {
      if (new Set(arr).size !== arr.length)
        ctx.addIssue({ code: "custom", message: "Повторяющиеся ID " + name });
    }
    if (
      d.projects.some(
        (p) => p.location === "root" && reservedSlugs.includes(p.slug),
      )
    )
      ctx.addIssue({
        code: "custom",
        message: "Этот адрес зарезервирован сайтом",
      });
    if (
      d.cards.some(
        (c) =>
          c.category !== "home" && !d.sections.some((s) => s.id === c.category),
      )
    )
      ctx.addIssue({ code: "custom", message: "Неизвестный раздел" });
    if (
      d.cards.some(
        (c) =>
          c.projectSlug && !d.projects.some((p) => p.slug === c.projectSlug),
      )
    )
      ctx.addIssue({ code: "custom", message: "Неизвестный проект" });
  });
export type Document = z.infer<typeof documentSchema>;
export type Card = Document["cards"][number];
export type Project = Document["projects"][number];
// Upgrade older documents without replacing custom cards or authored content.
export function normalizeDocument(value: unknown): Document {
  const d = value as Record<string, unknown>;
  const old = !Array.isArray(d.sections);
  const cards = (d.cards as Array<Record<string, unknown>>).map((c, i) => {
    let category = String(c.category);
    if (category === "experience")
      category = String(c.id).startsWith("card-1770423092420")
        ? "education"
        : "career";
    if (category === "about") category = "home";
    const slugs: Record<string, string> = {
      sphinix: "sphinix",
      lamp: "aglamp",
      button: "agbutton",
      write: "agwrite",
      license: "aglicense",
      cloud: "sphinixcloud",
      servers: "sphinixservers",
      services: "sphinixservices",
    };
    const projectSlug = String(c.projectSlug ?? slugs[String(c.id)] ?? "");
    let result: Record<string, unknown> = {
      ...c,
      icon:
        c.icon ??
        (
          {
            telegram: "send",
            channel: "send",
            mail: "mail",
            github: "code",
            cad: "diamond",
          } as Record<string, string>
        )[String(c.id)] ??
        (c.type === "link" ? "arrow" : "none"),
      category,
      home: c.home ?? i < 12,
      projectSlug,
    };
    if (old && projectSlug)
      result = { ...result, url: "/projects/" + projectSlug, type: "project" };
    if (old && c.title === "ЦНТТ RoboGrade")
      result = { ...result, text: "Директор по операционной деятельности" };
    if (old && c.id === "about" && String(c.title).startsWith("Между кодом"))
      result = {
        ...result,
        title: "От идеи\nдо настоящей вещи.",
        text: "Конструирую, собираю, испытываю. CAD, электроника, робототехника — и немного кода, чтобы всё это ожило.",
      };
    if (old && c.id === "location")
      result = { ...result, size: "wide", url: "" };
    if (old && c.id === "pixel") result = { ...result, category: "photos" };
    return result;
  });
  if (old) {
    const order = [
      "about",
      "portrait",
      "lamp",
      "cad",
      "location",
      "telegram",
      "button",
      "photo",
      "mail",
      "write",
      "sphinix",
      "github",
    ];
    cards.sort(
      (a, b) =>
        (order.includes(String(a.id)) ? order.indexOf(String(a.id)) : 100) -
        (order.includes(String(b.id)) ? order.indexOf(String(b.id)) : 100),
    );
  }
  return documentSchema.parse({
    ...d,
    bio:
      old && String(d.bio).includes("технический помощник")
        ? "Инженер-конструктор. Директор по операционной деятельности RoboGrade. Проектирую устройства, работаю с электроникой и превращаю идеи в реальные вещи."
        : d.bio,
    sections: (
      (d.sections ?? defaultSections) as Array<Record<string, unknown>>
    ).map((s, i) => ({
      ...s,
      description:
        s.description ??
        sectionDescription[String(s.id)] ??
        "Проекты, заметки и то, чем хочется поделиться.",
      eyebrow: s.eyebrow ?? "0" + (i + 2) + " / COLLECTION",
    })),
    projects: d.projects ?? defaultProjects,
    cards,
  });
}
