"use client";
import { useEffect, useRef, useState } from "react";
import { useDialogFocus } from "./use-dialog-focus";
import { createPortal } from "react-dom";
import { marked } from "marked";
import DOMPurify from "dompurify";
import TurndownService from "turndown";
import { gfm } from "turndown-plugin-gfm";
function html(value: string) {
  return DOMPurify.sanitize(
    marked.parse(value, { async: false, breaks: true }) as string,
    { USE_PROFILES: { html: true } },
  );
}
export function Markdown({ value }: { value: string }) {
  const [content, setContent] = useState("");
  useEffect(() => setContent(html(value)), [value]);
  return (
    <div
      className="markdown-content"
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}
export default function MarkdownEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  useDialogFocus(expanded, ".md-modal");
  useEffect(() => {
    if (!expanded) return;
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") setExpanded(false);
    };
    window.addEventListener("keydown", key);
    return () => {
      document.body.style.overflow = old;
      window.removeEventListener("keydown", key);
    };
  }, [expanded]);
  const [mode, setMode] = useState<"visual" | "source">("visual");
  const ref = useRef<HTMLDivElement>(null);
  const last = useRef(value);
  useEffect(() => {
    if (
      ref.current &&
      (document.activeElement !== ref.current || last.current !== value)
    ) {
      ref.current.innerHTML = html(value);
      ref.current
        .querySelectorAll<HTMLInputElement>('input[type="checkbox"]')
        .forEach((input) => (input.disabled = false));
    }
    last.current = value;
  }, [value, mode, expanded]);
  function sync() {
    if (!ref.current) return;
    const md = new TurndownService({
      headingStyle: "atx",
      bulletListMarker: "-",
      codeBlockStyle: "fenced",
    })
      .use(gfm)
      .addRule("strike", {
        filter: (node) => ["DEL", "S", "STRIKE"].includes(node.nodeName),
        replacement: (content) => "~~" + content + "~~",
      })
      .turndown(ref.current.innerHTML);
    last.current = md;
    onChange(md);
  }
  function command(name: string, arg?: string) {
    ref.current?.focus();
    document.execCommand(name, false, arg);
    sync();
  }
  const editor = (
    <div className="markdown-editor">
      <button
        className="md-expand"
        type="button"
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? "Готово · свернуть" : "⛶ Развернуть редактор"}
      </button>
      <div className="md-tabs">
        <button
          type="button"
          className={mode === "visual" ? "active" : ""}
          onClick={() => setMode("visual")}
        >
          Визуально
        </button>
        <button
          type="button"
          className={mode === "source" ? "active" : ""}
          onClick={() => setMode("source")}
        >
          Markdown
        </button>
      </div>
      {mode === "source" ? (
        <textarea
          aria-label="Markdown проекта"
          rows={14}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <>
          <div className="md-toolbar">
            {[
              ["bold", "Жирный", "B"],
              ["italic", "Курсив", "I"],
              ["strikeThrough", "Зачёркнутый", "S"],
              ["insertUnorderedList", "Список", "•"],
              ["insertOrderedList", "Нумерация", "1."],
              ["undo", "Отменить", "↶"],
              ["redo", "Повторить", "↷"],
            ].map(([cmd, label, text]) => (
              <button
                type="button"
                key={cmd}
                title={label}
                aria-label={label}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => command(cmd)}
              >
                {text}
              </button>
            ))}
            <select
              aria-label="Стиль текста"
              defaultValue="p"
              onChange={(e) => command("formatBlock", e.target.value)}
            >
              <option value="p">Текст</option>
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={"h" + n}>
                  {"H" + n}
                </option>
              ))}
              <option value="blockquote">Цитата</option>
              <option value="pre">Код</option>
            </select>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => command("formatBlock", "p")}
            >
              Текст
            </button>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                const link = window.prompt("Адрес ссылки (https://…)");
                if (link && /^(https?:\/\/|\/(?!\/)|#|mailto:)/i.test(link))
                  command("createLink", link);
              }}
            >
              Ссылка
            </button>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() =>
                command(
                  "insertHTML",
                  "<table><thead><tr><th>Колонка 1</th><th>Колонка 2</th></tr></thead><tbody><tr><td>Значение</td><td>Значение</td></tr><tr><td>Значение</td><td>Значение</td></tr></tbody></table><p><br></p>",
                )
              }
            >
              Таблица
            </button>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() =>
                command(
                  "insertHTML",
                  '<ul><li><input type="checkbox"> Задача</li></ul><p><br></p>',
                )
              }
            >
              Задача
            </button>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => command("insertHorizontalRule")}
            >
              Разделитель
            </button>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                const url = window.prompt("URL изображения");
                if (url && /^https?:\/\//i.test(url))
                  command("insertImage", url);
              }}
            >
              Фото
            </button>
          </div>
          <div
            ref={ref}
            role="textbox"
            aria-label="Текст проекта — визуальный редактор"
            aria-multiline="true"
            className="md-visual markdown-content"
            contentEditable
            suppressContentEditableWarning
            onInput={sync}
            onChange={sync}
            onClick={(e) => {
              if (e.target instanceof HTMLInputElement) {
                if (e.target.checked) e.target.setAttribute("checked", "");
                else e.target.removeAttribute("checked");
                sync();
              }
            }}
            onPaste={(e) => {
              e.preventDefault();
              document.execCommand(
                "insertText",
                false,
                e.clipboardData.getData("text/plain"),
              );
              sync();
            }}
          />
        </>
      )}
      <p className="md-help">
        Заголовки H1–H6, списки и задачи, таблицы, цитаты, ссылки, изображения,
        код, зачёркивание и разделители. Сложную разметку можно уточнить во
        вкладке Markdown.
      </p>
    </div>
  );
  return expanded
    ? createPortal(
        <div className="md-modal-backdrop">
          <section
            className="md-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Большой редактор текста проекта"
          >
            {editor}
          </section>
        </div>,
        document.body,
      )
    : editor;
}
