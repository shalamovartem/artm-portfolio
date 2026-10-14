import { cookies } from "next/headers";
export async function preferredTheme(fallback: "dark" | "light") {
  const value = (await cookies()).get("portfolio_theme")?.value;
  return value === "dark" || value === "light" ? value : fallback;
}
