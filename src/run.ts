// Usage: pnpm news <city> <room>
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { z } from "zod";
import { getMarkdown } from "./fetch/browser.ts";
import { summarize } from "./ai/summarize.ts";
import { pickNewest } from "./ai/extract.ts";
import { getBlueskyPosts } from "./fetch/bluesky.ts";

const Source = z.object({
  title: z.string(),
  url: z.url(),
  type: z.enum(["articles", "bluesky"]).default("articles"),
});
const Rooms = z.array(z.object({ room: z.string(), src: z.array(Source) }));
const Cities = z.array(
  z.object({
    id: z.string(),
    country: z.string().length(2),
    name: z.string(),
    language: z.string().min(1),
  }),
);
type Source = z.infer<typeof Source>;

const readConfig = <T extends z.ZodType>(path: string, schema: T): z.infer<T> =>
  schema.parse(JSON.parse(readFileSync(path, "utf8")));

// --- CLI arguments ---
const { positionals } = parseArgs({ allowPositionals: true });
const [cityId, roomName] = positionals;
if (!cityId || !roomName) {
  throw new Error("Usage: pnpm news <city> <room>");
}

// --- Config ---
// The city must be listed in cities.json, and the file path is built from the
// listed id, never from raw CLI input.
const city = readConfig("config/cities.json", Cities).find((c) => c.id === cityId);
if (!city) throw new Error(`Unknown city "${cityId}"`);

const rooms = readConfig(`config/cities/${city.id}.json`, Rooms);
const room = rooms.find((r) => r.room === roomName);
if (!room || room.src.length === 0) throw new Error(`Room "${roomName}" has no sources`);

console.log(`${city.name} (${city.country}) / ${room.room}`);

// --- Read the newest items of one source ---
// "articles": the page lists articles: pick the newest one, then open it on its own.
// "bluesky": the newest posts come straight from the API, so no second fetch is needed.
type Article = { url: string; page: string; date: string };

async function fetchArticles(source: Source): Promise<Article[]> {
  console.log(`\n[${source.title}] reading ${source.type}...`);
  if (source.type === "bluesky") return getBlueskyPosts(source.url);

  const item = await pickNewest(await getMarkdown(source.url));
  if (!item) {
    console.warn("   no dated article found");
    return [];
  }
  console.log(`   ${item.date} ${item.title}`);
  return [{ url: item.url, date: item.date, page: await getMarkdown(item.url) }];
}

// --- Collect articles, one source at a time (keeps us under rate limits) ---
const articles: Article[] = [];
for (const source of room.src) {
  try {
    articles.push(...(await fetchArticles(source)));
  } catch (err) {
    console.warn(`   skipped "${source.title}": ${(err as Error).message}`);
  }
}
if (articles.length === 0) throw new Error("No articles could be fetched");

// 2026-11-27 -> 27-11-26
const ddmmyy = (iso: string) => {
  const [y, m, d] = iso.split("-");
  return `${d}-${m}-${y.slice(2)}`;
};

// --- Summarize, then add a link list under the summary ---
console.log("\nSummarizing...");
const links = articles
  .map((a, i) => `- [${i + 1}](${a.url.replaceAll(")", "%29")})(${ddmmyy(a.date)})`)
  .join("\n");
const text = `${await summarize(city.language, room.room, articles.map((a) => a.page))}\n\n${links}`;

// --- Save to articles/dd-mm-yyyy/city-room.md ---
const today = new Date().toLocaleDateString("en-GB").replaceAll("/", "-"); // dd-mm-yyyy
const dir = join("articles", today);
mkdirSync(dir, { recursive: true }); // creates the date folder only if missing
const file = join(dir, `${city.id}-${room.room}.md`);
writeFileSync(file, `${text}\n`);

console.log(`\n${text}\n\nSaved to ${file}`);