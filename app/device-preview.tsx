"use client";
import { useEffect, useRef } from "react";
import { normalizeDocument, type Document } from "../lib/document";
export function usePreviewDocument(onDocument: (doc: Document) => void) {
  const callback = useRef(onDocument);
  callback.current = onDocument;
  useEffect(() => {
    if (
      !new URLSearchParams(location.search).has("preview") ||
      window.parent === window
    )
      return;
    const receive = (e: MessageEvent) => {
      if (
        e.origin !== location.origin ||
        e.source !== window.parent ||
        e.data?.type !== "portfolio-preview"
      )
        return;
      try {
        callback.current(normalizeDocument(e.data.document));
      } catch {}
    };
    window.addEventListener("message", receive);
    window.parent.postMessage(
      { type: "portfolio-preview-ready" },
      location.origin,
    );
    return () => window.removeEventListener("message", receive);
  }, []);
}
export default function DevicePreview({
  doc,
  path = "/",
  onSelect,
  onSection,
}: {
  doc: Document;
  path?: string;
  onSelect?: (id: string) => void;
  onSection?: (id: string) => void;
}) {
  const frame = useRef<HTMLIFrameElement>(null);
  const initialPath = useRef(path);
  const current = useRef(doc);
  current.current = doc;
  const send = () =>
    frame.current?.contentWindow?.postMessage(
      { type: "portfolio-preview", document: current.current },
      location.origin,
    );
  useEffect(send, [doc]);
  useEffect(() => {
    const receive = (e: MessageEvent) => {
      if (
        e.origin !== location.origin ||
        e.source !== frame.current?.contentWindow
      )
        return;
      if (e.data?.type === "portfolio-preview-ready") send();
      if (e.data?.type === "portfolio-section" && typeof e.data.id === "string")
        onSection?.(e.data.id);
      if (e.data?.type === "portfolio-select" && typeof e.data.id === "string")
        onSelect?.(e.data.id);
    };
    window.addEventListener("message", receive);
    return () => window.removeEventListener("message", receive);
  }, [onSelect, onSection]);
  return (
    <div className="device-stage">
      <div className="device-caption">Мобильный экран · 390 × 780</div>
      <div className="device-frame">
        <iframe
          ref={frame}
          title="Мобильный предпросмотр сайта"
          src={
            initialPath.current +
            (initialPath.current.includes("?") ? "&" : "?") +
            "preview=1"
          }
          onLoad={send}
        />
      </div>
    </div>
  );
}
