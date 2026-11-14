// Step 2: ONE room -> ONE source -> 3 newest dated links -> ONE summary.
import { readFileSync } from "node:fs";
import { getMarkdown } from "./fetch/browser.ts";
import { listDatedLinks } from "./ai/extract.ts";
import { summarize } from "./ai/summarize.ts";

const COUNT = 3;

type Room = { room: string; src: { title: string; url: string }[] };

const roomName = process.argv[2] ?? "ogólne";
const rooms: Room[] = JSON.parse(readFileSync("config/rooms.jsonc", "utf8"));
const room = rooms.find((r) => r.room === roomName);
const source = room?.src[0];
if (!room || !source) throw new Error(`Room "${roomName}" has no sources`);

console.log(`1. Reading listing "${source.title}" -> ${source.url}`);
const listing = await getMarkdown(source.url);

console.log("2. Finding dated links...");
const items = await listDatedLinks(listing);
items.sort((a, b) => b.date.localeCompare(a.date)); // newest first
const newest = items.slice(0, COUNT);
for (const item of newest) console.log(`   ${item.date} ${item.title}`);

console.log("3. Fetching articles...");
const pages: string[] = [];
for (const item of newest) {
  try {
    pages.push(await getMarkdown(item.url));
  } catch (err) {
    console.warn(`   skipped ${item.url}: ${(err as Error).message}`);
  }
}
if (pages.length === 0) throw new Error("No articles could be fetched");

console.log("4. Summarizing...\n");
console.log(await summarize(room.room, pages));