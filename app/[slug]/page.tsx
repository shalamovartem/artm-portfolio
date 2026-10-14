import { preferredTheme } from "../../lib/theme";
import { readState } from "../../lib/storage";
import { authenticated } from "../../lib/auth";
import { notFound } from "next/navigation";
import { pagePath } from "../../lib/document";
import ProjectView from "../projects/[slug]/project-view";
export const dynamic = "force-dynamic";
async function read(draft = false) {
  const s = await readState();
  return draft ? s.draft : s.published;
}
export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ edit?: string }>;
}) {
  const { slug } = await params;
  const query = await searchParams;
  const d = await read(query.edit === "1" && (await authenticated()));
  const p = d.projects.find((p) => p.slug === slug && p.location === "root");
  return {
    title: p ? p.browserTitle || `${p.title} — ${d.name}` : "Проект не найден",
    description: p?.subtitle,
  };
}
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ edit?: string }>;
}) {
  const { slug } = await params;
  const query = await searchParams;
  const doc = await read(query.edit === "1" && !!(await authenticated()));
  const project = doc.projects.find(
    (p) => p.slug === slug && p.location === "root",
  );
  if (!project) notFound();
  return (
    <ProjectView
      project={project}
      theme={await preferredTheme(doc.theme)}
      accent={doc.accent}
      name={doc.name}
      logo={doc.logo}
      favicon={doc.favicon}
      footerText={doc.footerText}
      copyrightText={doc.copyrightText}
      pagePaths={Object.fromEntries(
        doc.projects.map((p) => [p.slug, pagePath(p)]),
      )}
    />
  );
}
