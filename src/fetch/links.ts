// Not sure we need this file anymore

const { CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN } = process.env;

export async function getLinks(url: string): Promise<string[]> {
  if (!["http:", "https:"].includes(new URL(url).protocol)) {
    throw new Error(`Only http(s) URLs are allowed: ${url}`);
  }
  if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_API_TOKEN) {
    throw new Error("Missing CLOUDFLARE_ACCOUNT_ID or CLOUDFLARE_API_TOKEN");
  }

  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/browser-rendering/links`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`,
      },
      body: JSON.stringify({ url, visibleLinksOnly: true, excludeExternalLinks: true }),
      signal: AbortSignal.timeout(60_000),
    },
  );

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(`Browser Run failed (HTTP ${res.status}): ${JSON.stringify(data.errors)}`);
  }
  return [...new Set<string>(data.result)];
}