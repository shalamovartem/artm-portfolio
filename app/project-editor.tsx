"use client";
import { useState } from "react";
import MarkdownEditor from "./markdown";
import { pagePath, type Document, type Project } from "../lib/document";
export default function ProjectEditor({
  doc,
  onChange,
  initialSlug,
}: {
  doc: Document;
  onChange: (d: Document) => void;
  initialSlug?: string;
}) {
  const [slug, setSlug] = useState(initialSlug || doc.projects[0]?.slug || "");
  const [status, setStatus] = useState("");
  const p = doc.projects.find((p) => p.slug === slug);
  const patch = (v: Partial<Project>) =>
    p &&
    onChange({
      ...doc,
      projects: doc.projects.map((q) => (q.slug === slug ? { ...q, ...v } : q)),
    });
  async function upload(file: File | undefined, gallery = false) {
    if (!file || !p) return;
    if (file.size > 5000000) {
      setStatus("Максимум 5 МБ");
      return;
    }
    try {
      setStatus("Загружаю…");
      const r = await fetch("/api/images", {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      const d = (await r.json()) as { url: string; error?: string };
      if (!r.ok) throw Error(d.error);
      patch(gallery ? { gallery: [...p.gallery, d.url] } : { image: d.url });
      setStatus("Фото добавлено. Сохраните изменения.");
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Ошибка загрузки");
    }
  }
  if (p?.pageType === "html")
    return (
      <section className="project-editor fields html-editor">
        <label>
          Название вкладки браузера
          <input
            value={p.browserTitle}
            placeholder={p.title + " — " + doc.name}
            maxLength={200}
            onChange={(e) => patch({ browserTitle: e.target.value })}
          />
        </label>
        <label>
          Название в хедере
          <input
            value={p.title}
            onChange={(e) => patch({ title: e.target.value })}
          />
        </label>
        <label>
          Фон хедера
          <input
            type="color"
            value={p.shellBackground}
            onChange={(e) => patch({ shellBackground: e.target.value })}
          />
        </label>
        <label>
          Цвет текста хедера
          <input
            type="color"
            value={p.shellColor}
            onChange={(e) => patch({ shellColor: e.target.value })}
          />
        </label>
        <label>
          Фон футера
          <input
            type="color"
            value={p.footerBackground}
            onChange={(e) => patch({ footerBackground: e.target.value })}
          />
        </label>
        <label>
          Цвет текста футера
          <input
            type="color"
            value={p.footerColor}
            onChange={(e) => patch({ footerColor: e.target.value })}
          />
        </label>
        <label className="html-code-label">
          HTML страницы
          <textarea
            spellCheck={false}
            className="html-source"
            value={p.html}
            onChange={(e) => patch({ html: e.target.value })}
          />
        </label>
      </section>
    );
  return (
    <section className="project-editor fields">
      <h3>Страница сайта</h3>
      {!initialSlug && (
        <label>
          Выберите страницу
          <select value={slug} onChange={(e) => setSlug(e.target.value)}>
            {doc.projects.map((q) => (
              <option key={q.slug} value={q.slug}>
                {q.title}
              </option>
            ))}
          </select>
        </label>
      )}
      {p && (
        <>
          <label>
            Название вкладки браузера
            <input
              value={p.browserTitle}
              placeholder={p.title + " — " + doc.name}
              maxLength={200}
              onChange={(e) => patch({ browserTitle: e.target.value })}
            />
          </label>
          <a
            className="project-preview-link"
            href={pagePath(p)}
            target="_blank"
            rel="noreferrer"
          >
            Открыть страницу ↗
          </a>
          {(["title", "subtitle", "year", "kind", "note"] as const).map(
            (k, i) => (
              <label key={k}>
                {
                  [
                    "Название",
                    "Подзаголовок",
                    "Год / период",
                    "Категория",
                    "Примечание",
                  ][i]
                }
                <textarea
                  rows={2}
                  value={p[k]}
                  onChange={(e) => patch({ [k]: e.target.value })}
                />
              </label>
            ),
          )}
          <label>
            Заголовок связанных страниц
            <input
              value={p.versionsTitle}
              onChange={(e) => patch({ versionsTitle: e.target.value })}
            />
          </label>
          <h3>Текст проекта</h3>
          <MarkdownEditor value={p.body} onChange={(body) => patch({ body })} />
          <label>
            Обложка
            <input
              value={p.image}
              onChange={(e) => patch({ image: e.target.value })}
            />
          </label>
          <label>
            Загрузить обложку
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={(e) => {
                upload(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
          </label>
          <h3>Детали</h3>
          {p.facts.map((f, i) => (
            <div className="project-link-edit" key={i}>
              <input
                aria-label={"Название детали " + (i + 1)}
                value={f.label}
                onChange={(e) =>
                  patch({
                    facts: p.facts.map((v, j) =>
                      i === j ? { ...v, label: e.target.value } : v,
                    ),
                  })
                }
              />
              <input
                aria-label={"Значение детали " + (i + 1)}
                value={f.url}
                onChange={(e) =>
                  patch({
                    facts: p.facts.map((v, j) =>
                      i === j ? { ...v, url: e.target.value } : v,
                    ),
                  })
                }
              />
              <button
                onClick={() =>
                  patch({ facts: p.facts.filter((_, j) => j !== i) })
                }
              >
                Удалить деталь
              </button>
            </div>
          ))}
          <button
            disabled={p.facts.length >= 20}
            onClick={() =>
              patch({ facts: [...p.facts, { label: "Деталь", url: "" }] })
            }
          >
            Добавить деталь
          </button>
          <h3>Ссылки и файлы</h3>
          {p.links.map((f, i) => (
            <div className="project-link-edit" key={i}>
              <input
                aria-label={"Название ссылки " + (i + 1)}
                value={f.label}
                onChange={(e) =>
                  patch({
                    links: p.links.map((v, j) =>
                      i === j ? { ...v, label: e.target.value } : v,
                    ),
                  })
                }
              />
              <input
                aria-label={"URL ссылки " + (i + 1)}
                value={f.url}
                onChange={(e) =>
                  patch({
                    links: p.links.map((v, j) =>
                      i === j ? { ...v, url: e.target.value } : v,
                    ),
                  })
                }
              />
              <button
                onClick={() =>
                  patch({ links: p.links.filter((_, j) => j !== i) })
                }
              >
                Удалить ссылку
              </button>
            </div>
          ))}
          <button
            disabled={p.links.length >= 30}
            onClick={() =>
              patch({ links: [...p.links, { label: "Ссылка", url: "" }] })
            }
          >
            Добавить ссылку
          </button>
          <h3>Галерея</h3>
          {p.gallery.map((url, i) => (
            <div className="project-link-edit" key={i}>
              <img
                src={url}
                alt={"Фото " + (i + 1)}
                style={{ width: "100%", height: 100, objectFit: "contain" }}
              />
              <input
                aria-label={"Фото " + (i + 1)}
                value={url}
                onChange={(e) =>
                  patch({
                    gallery: p.gallery.map((v, j) =>
                      i === j ? e.target.value : v,
                    ),
                  })
                }
              />
              <button
                onClick={() =>
                  patch({ gallery: p.gallery.filter((_, j) => j !== i) })
                }
              >
                Удалить фото
              </button>
            </div>
          ))}
          <label>
            Добавить фото
            <input
              disabled={p.gallery.length >= 30}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={(e) => {
                upload(e.target.files?.[0], true);
                e.target.value = "";
              }}
            />
          </label>
          <h3>Связанные страницы</h3>
          {doc.projects
            .filter((q) => q.slug !== p.slug)
            .map((q) => (
              <label className="toggle-field" key={q.slug}>
                <input
                  type="checkbox"
                  checked={p.children.some((c) => c.slug === q.slug)}
                  onChange={(e) =>
                    patch({
                      children: e.target.checked
                        ? [...p.children, { slug: q.slug, title: q.title }]
                        : p.children.filter((c) => c.slug !== q.slug),
                    })
                  }
                />
                {q.title}
              </label>
            ))}
          <p role="status">{status}</p>
        </>
      )}
    </section>
  );
}
