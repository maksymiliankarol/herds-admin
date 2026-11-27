// Usage: pnpm check <url>   (can Browser Run read this page? does the site have a feed?)
import { getMarkdown } from "./fetch/browser.ts";

const url = process.argv[2];
if (!url) throw new Error("Usage: pnpm check <url>");

// --- Browser Run ---
try {
  const markdown = await getMarkdown(url);
  console.log(`Browser Run: OK (${markdown.length} characters)`);
} catch (err) {
  console.log(`Browser Run: FAILED: ${(err as Error).message}`);
}

// --- RSS / Atom: look at common feed locations ---
const { origin } = new URL(url);
let found = false;
for (const path of ["/feed", "/rss", "/rss.xml", "/feed.xml", "/atom.xml"]) {
  try {
    const res = await fetch(origin + path, { signal: AbortSignal.timeout(15_000) });
    if (res.ok && /<(rss|feed|rdf:RDF)\b/i.test((await res.text()).slice(0, 1000))) {
      console.log(`Feed: ${origin + path}`);
      found = true;
    }
  } catch {
    // unreachable path, try the next one
  }
}
if (!found) console.log("Feed: none found");