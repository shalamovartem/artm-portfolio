import fs from "node:fs/promises";
import path from "node:path";
const root = process.cwd();
const lock = JSON.parse(await fs.readFile("package-lock.json", "utf8"));
const entries = [];
const notices = [];
async function licenseFiles(dir, recursive = false) {
  const result = [];
  for (const item of await fs.readdir(dir, { withFileTypes: true })) {
    const filename = path.join(dir, item.name);
    if (
      item.isFile() &&
      /^(licen[cs]e|copying|notice)([.\-]|$)/i.test(item.name)
    ) {
      result.push({
        file: path.relative(root, filename),
        text: await fs.readFile(filename, "utf8"),
      });
    } else if (recursive && item.isDirectory())
      result.push(...(await licenseFiles(filename, true)));
  }
  return result;
}
for (const [location, info] of Object.entries(lock.packages)) {
  if (!location) continue;
  const name = location.split("node_modules/").at(-1);
  let texts = [];
  let manifest = {};
  try {
    manifest = JSON.parse(
      await fs.readFile(path.join(root, location, "package.json"), "utf8"),
    );
    texts = await licenseFiles(path.join(root, location));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  entries.push({
    name,
    version: info.version,
    license:
      manifest.license || info.license || "Не установлен — см. лицензию пакета",
    development: !!info.dev,
    optional: !!info.optional,
  });
  for (const item of texts)
    notices.push(`${name}@${info.version}\n${item.file}\n\n${item.text}`);
}
// Next bundles additional libraries whose notices are not separate npm entries.
for (const item of await licenseFiles(
  path.join(root, "node_modules/next/dist/compiled"),
  true,
)) {
  notices.push(`${item.file}\n\n${item.text}`);
}
entries.sort((a, b) => a.name.localeCompare(b.name));
await fs.mkdir("public/legal", { recursive: true });
await fs.writeFile(
  "lib/third-party.json",
  JSON.stringify(entries, null, 2) + "\n",
);
await fs.writeFile(
  "public/legal/THIRD-PARTY-NOTICES.txt",
  "Third-party license texts from the installed dependencies.\nOptional platform packages are listed in the catalogue; their distribution carries their own notices.\n\n" +
    notices.join("\n\n" + "=".repeat(80) + "\n\n"),
);
console.log(
  `Recorded ${entries.length} dependency versions and ${notices.length} license notices.`,
);
