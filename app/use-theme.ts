"use client";
import { useEffect, useState } from "react";
type Theme = "dark" | "light";
export function useTheme(initial: Theme) {
  const [theme, setTheme] = useState<Theme>(initial);
  useEffect(() => {
    function read() {
      const saved = document.cookie
        .split("; ")
        .find((v) => v.startsWith("portfolio_theme="))
        ?.split("=")[1];
      if (saved === "dark" || saved === "light") setTheme(saved);
    }
    read();
    window.addEventListener("pageshow", read);
    window.addEventListener("focus", read);
    return () => {
      window.removeEventListener("pageshow", read);
      window.removeEventListener("focus", read);
    };
  }, []);
  function update(next: Theme) {
    setTheme(next);
    document.cookie = `portfolio_theme=${next}; Path=/; Max-Age=31536000; SameSite=Lax`;
    document.documentElement.dataset.theme = next;
  }
  return [theme, update] as const;
}
