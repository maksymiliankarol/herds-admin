// Usage: pnpm news <city> <room> [--count N]
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { z } from "zod";
import { getMarkdown } from "./fetch/browser.ts";
import { summarize } from "./ai/summarize.ts";
import { pickNewestLinks } from "./ai/extract.ts";

const Source = z.object({ title: z.string(), url: z.url() });
const Rooms = z.array(z.object({ room: z.string(), src: z.array(Source) }));
const Cities = z.array(
  z.object({ id: z.string(), country: z.string().length(2), name: z.string() }),
);
type Source = z.infer<typeof Source>;

const readConfig = <T extends z.ZodType>(path: string, schema: T): z.infer<T> =>
  schema.parse(JSON.parse(readFileSync(path, "utf8")));

// --- CLI options ---
const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: { count: { type: "string", default: "1" } },
});
const [cityId, roomName] = positionals;
if (!cityId || !roomName) {
  throw new Error("Usage: pnpm news <city> <room> [--count N]");
}
const count = Number(values.count);
if (!Number.isInteger(count) || count < 1 || count > 5) {
  throw new Error("--count must be a whole number from 1 to 5");
}

// --- Config ---
// The city must be listed in cities.jsonc, and the file path is built from the
// listed id, never from raw CLI input.
const city = readConfig("config/cities.jsonc", Cities).find((c) => c.id === cityId);
if (!city) throw new Error(`Unknown city "${cityId}"`);

const rooms = readConfig(`config/cities/${city.id}.jsonc`, Rooms);
const room = rooms.find((r) => r.room === roomName);
if (!room || room.src.length === 0) throw new Error(`Room "${roomName}" has no sources`);

console.log(`${city.name} (${city.country}) / ${room.room}`);

// --- Read the newest `count` articles of one source ---
type Article = { title: string; url: string; page: string };

async function fetchArticles(source: Source): Promise<Article[]> {
  console.log(`\n[${source.title}] reading listing...`);
  const items = await pickNewestLinks(await getMarkdown(source.url), count);
  if (items.length === 0) console.warn("   no dated articles found");

  const articles: Article[] = [];
  for (const item of items) {
    console.log(`   ${item.date} ${item.title}`);
    try {
      articles.push({ title: item.title, url: item.url, page: await getMarkdown(item.url) });
    } catch (err) {
      console.warn(`   skipped ${item.url}: ${(err as Error).message}`);
    }
  }
  return articles;
}

// --- Collect articles, one source at a time (keeps us under rate limits) ---
const articles: Article[] = [];
for (const source of room.src) {
  try {
    articles.push(...(await fetchArticles(source)));
  } catch (err) {
    console.warn(`   skipped source "${source.title}": ${(err as Error).message}`);
  }
}
if (articles.length === 0) throw new Error("No articles could be fetched");

// --- Summarize, then add a link list under the summary ---
console.log("\nSummarizing...");
const links = articles.map((a, i) => `- [${i + 1}](${a.url.replaceAll(")", "%29")})`).join("\n");
const text = `${await summarize(room.room, articles.map((a) => a.page))}\n\n${links}`;

// --- Save to articles/dd-mm-yyyy/city-room.md ---
const today = new Date().toLocaleDateString("en-GB").replaceAll("/", "-"); // dd-mm-yyyy
const dir = join("articles", today);
mkdirSync(dir, { recursive: true }); // creates the date folder only if missing
const file = join(dir, `${city.id}-${room.room}.md`);
writeFileSync(file, `${text}\n`);

console.log(`\n${text}\n\nSaved to ${file}`);