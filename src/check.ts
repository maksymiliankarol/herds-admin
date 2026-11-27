// Usage: pnpm check <url>   (can Browser Run read this page? does the site have a feed?)
import { getMarkdown } from "./fetch/browser.ts";
import { pickNewest } from "./ai/extract.ts";

const url = process.argv[2];
if (!url) throw new Error("Usage: pnpm check <url>");
const { origin } = new URL(url); // throws on an invalid URL

// --- 1. Browser Run, then the same newest-article step the real run uses ---
console.log("Browser Run:");
try {
  const markdown = await getMarkdown(url);
  console.log(`   OK, ${markdown.length} characters of Markdown`);
  const item = await pickNewest(markdown);
  console.log(item ? `   newest: ${item.date} ${item.title}\n           ${item.url}` : "   readable, but no dated article found");
} catch (err) {
  console.log(`   FAILED: ${(err as Error).message}`);
}

// --- 2. RSS / Atom ---
async function getText(u: string): Promise<string | undefined> {
  try {
    const res = await fetch(u, { signal: AbortSignal.timeout(15_000) });
    return res.ok ? await res.text() : undefined;
  } catch {
    return undefined;
  }
}

const isFeed = (body: string) => /^\s*(<\?xml[^>]*>\s*)?(<!--[\s\S]*?-->\s*)?<(rss|feed|rdf:RDF)\b/i.test(body);

// Feeds announced in the page's <link> tags, plus a few common locations.
const candidates = new Set(["/feed", "/rss", "/rss.xml", "/feed.xml", "/atom.xml"].map((p) => origin + p));
const html = (await getText(url)) ?? "";
for (const tag of html.match(/<link\b[^>]*>/gi) ?? []) {
  if (!/type=["']application\/(rss|atom)\+xml["']/i.test(tag)) continue;
  const href = tag.match(/href=["']([^"']+)["']/i)?.[1];
  if (href) candidates.add(new URL(href, url).href);
}

console.log("\nRSS/Atom:");
let found = 0;
for (const candidate of candidates) {
  if (!["http:", "https:"].includes(new URL(candidate).protocol)) continue;
  const body = await getText(candidate);
  if (body && isFeed(body)) {
    console.log(`   found ${candidate}`);
    found++;
  }
}
if (!found) console.log("   none found");