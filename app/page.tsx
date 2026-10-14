import { preferredTheme } from "../lib/theme";
import Portfolio from "./portfolio";
import { readState } from "../lib/storage";
export const dynamic = "force-dynamic";
export default async function Home() {
  const s = await readState();
  return (
    <Portfolio
      initialDocument={s.published}
      visitorTheme={await preferredTheme(s.published.theme)}
    />
  );
}
