const { ADMIN_KEY, API_URL = "https://herds-api.metalogrom.com" } = process.env;

export async function api(method: string, path: string, body?: unknown) {
  if (!ADMIN_KEY) throw new Error("Missing ADMIN_KEY");

  console.log(`${method} ${API_URL}${path}`); // shows which server you are hitting

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${ADMIN_KEY}`,
      ...(body !== undefined && { "Content-Type": "application/json" }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);

  return res.status === 204 ? null : res.json();
}