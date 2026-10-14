"use client";
import { useEffect, useState, type CSSProperties } from "react";
export function useEditorLayout(active: boolean, panel = 390) {
  const [width, setWidth] = useState(1280);
  useEffect(() => {
    const resize = () => setWidth(window.innerWidth);
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);
  const base = Math.min(1080, width - 96),
    available = width - panel,
    scale = active && width > 900 ? Math.min(1, (available - 48) / base) : 1;
  return {
    "--preview-width": `${base}px`,
    "--preview-scale": scale,
    "--preview-margin": `${(available - base * scale) / 2 / scale}px`,
    "--editor-width": `${panel}px`,
  } as CSSProperties;
}
