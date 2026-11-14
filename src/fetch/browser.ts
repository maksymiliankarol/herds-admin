// Step 1a: turn any web page into clean Markdown using Cloudflare Browser Run.
const { CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN } = process.env;

export async function getMarkdown(url: string, retries = 2): Promise<string> {
  if (!["http:", "https:"].includes(new URL(url).protocol)) {
    throw new Error(`Only http(s) URLs are allowed: ${url}`);
  }
  if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_API_TOKEN) {
    throw new Error("Missing CLOUDFLARE_ACCOUNT_ID or CLOUDFLARE_API_TOKEN");
  }

  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/browser-rendering/markdown`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`,
      },
      body: JSON.stringify({ url }),
      signal: AbortSignal.timeout(60_000),
    },
  );

  // Too many requests: wait as long as Cloudflare asks, then try again.
  if (res.status === 429 && retries > 0) {
    const seconds = Number(res.headers.get("Retry-After")) || 10;
    console.log(`   rate limited, waiting ${seconds}s...`);
    await new Promise((resolve) => setTimeout(resolve, seconds * 1000));
    return getMarkdown(url, retries - 1);
  }

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(`Browser Run failed (HTTP ${res.status}): ${JSON.stringify(data.errors)}`);
  }
  return data.result;
}