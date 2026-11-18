// Usage: pnpm news <city> <room> [--count N] [--summary room|source]
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { z } from "zod";
import { getMarkdown } from "./fetch/browser.ts";
import { listDatedLinks } from "./ai/extract.ts";
import { summarize } from "./ai/summarize.ts";

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
  options: {
    count: { type: "string", default: "1" },
    summary: { type: "string", default: "room" },
  },
});
const [cityId, roomName] = positionals;
if (!cityId || !roomName) {
  throw new Error("Usage: pnpm news <city> <room> [--count N] [--summary room|source]");
}
const count = Number(values.count);
const mode = values.summary;
if (!Number.isInteger(count) || count < 1 || count > 5) {
  throw new Error("--count must be a whole number from 1 to 5");
}
if (mode !== "room" && mode !== "source") {
  throw new Error('--summary must be "room" or "source"');
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
async function fetchArticles(source: Source): Promise<string[]> {
  console.log(`\n[${source.title}] reading listing...`);
  const items = await listDatedLinks(await getMarkdown(source.url));
  items.sort((a, b) => b.date.localeCompare(a.date)); // newest first

  const pages: string[] = [];
  for (const item of items.slice(0, count)) {
    console.log(`   ${item.date} ${item.title}`);
    try {
      pages.push(await getMarkdown(item.url));
    } catch (err) {
      console.warn(`   skipped ${item.url}: ${(err as Error).message}`);
    }
  }
  return pages;
}

// --- Collect articles, one source at a time (keeps us under rate limits) ---
const results: { title: string; pages: string[] }[] = [];
for (const source of room.src) {
  try {
    results.push({ title: source.title, pages: await fetchArticles(source) });
  } catch (err) {
    console.warn(`   skipped source "${source.title}": ${(err as Error).message}`);
  }
}

// --- Summarize ---
console.log("\nSummarizing...");
const parts: string[] = [];
if (mode === "room") {
  const pages = results.flatMap((r) => r.pages);
  if (pages.length > 0) parts.push(await summarize(room.room, pages));
} else {
  for (const { title, pages } of results.filter((r) => r.pages.length > 0)) {
    parts.push(`## ${title}\n\n${await summarize(room.room, pages)}`);
  }
}
if (parts.length === 0) throw new Error("No articles could be fetched");

// --- Save to articles/dd-mm-yyyy/city-room.md ---
const today = new Date().toLocaleDateString("en-GB").replaceAll("/", "-"); // dd-mm-yyyy
const dir = join("articles", today);
mkdirSync(dir, { recursive: true }); // creates the date folder only if missing
const file = join(dir, `${city.id}-${room.room}.md`);
const text = parts.join("\n\n");
writeFileSync(file, `${text}\n`);

console.log(`\n${text}\n\nSaved to ${file}`);