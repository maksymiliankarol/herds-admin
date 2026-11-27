// Usage: pnpm post <room_id>   (publishes editor.md as news)
import { readFileSync } from "node:fs";

const { ADMIN_KEY, API_URL = "https://herds-api.metalogrom.com" } = process.env;

const roomId = Number(process.argv[2]);
if (!Number.isInteger(roomId) || roomId < 1) throw new Error("Usage: pnpm post <room_id>");
if (!ADMIN_KEY) throw new Error("Missing ADMIN_KEY");

const content = readFileSync("editor.md", "utf8").trim();

const res = await fetch(`${API_URL}/news`, {
  method: "POST",
  headers: { "Content-Type": "application/json", Authorization: `Bearer ${ADMIN_KEY}` },
  body: JSON.stringify({ content, room_id: roomId }),
  signal: AbortSignal.timeout(30_000),
});
if (!res.ok) throw new Error(`Failed (HTTP ${res.status}): ${await res.text()}`);

console.log("Published:", await res.json());