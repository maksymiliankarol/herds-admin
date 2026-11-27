// Usage: pnpm admin <group> <action> [args]
import { readFileSync } from "node:fs";
import { parseArgs } from "node:util";
import { api } from "./api.ts";

const { positionals, values } = parseArgs({
  allowPositionals: true,
  options: {
    username: { type: "string" },
    ip: { type: "string" },
    ban: { type: "string" }, // hours
  },
});
const [group, action, ...args] = positionals;

// Ids go into URLs, so they must be plain positive integers
const id = (s?: string) => {
  const n = Number(s);
  if (!Number.isInteger(n) || n < 1) throw new Error(`Invalid id: ${s}`);
  return n;
};

// The API validates everything else and returns a readable error
const commands: Record<string, () => Promise<unknown>> = {
  "city add": () => api("POST", "/cities", { title: args[0], search: args[1], country_code: args[2] }),
  "city delete": () => api("DELETE", `/cities/${id(args[0])}`),

  "room add": () => api("POST", "/rooms", { title: args[0], city_id: id(args[1]) }),
  "room delete": () => api("DELETE", `/rooms/${id(args[0])}`),
  "room users": () => api("GET", `/rooms/${id(args[0])}/users`),
  "room kick": () =>
    api("POST", `/rooms/${id(args[0])}/kick`, {
      username: values.username,
      ip: values.ip,
      ban_hours: values.ban ? Number(values.ban) : undefined,
    }),

  "news add": () =>
    api("POST", "/news", { content: readFileSync("editor.md", "utf8").trim(), room_id: id(args[0]) }),
  "news delete": () => api("DELETE", `/news/${id(args[0])}`),
};

const run = commands[`${group} ${action}`];
if (!run) {
  console.error(`Usage: pnpm admin <command>\n\n  ${Object.keys(commands).join("\n  ")}`);
  process.exit(1);
}

console.log((await run()) ?? "OK");