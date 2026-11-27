# herds-admin

CLI for managing Herds: admin commands for `herds-api` and a news harvester.

## Setup

```bash
pnpm install
```

`.env`:

```
ADMIN_KEY=...                  # must match the API's ADMIN_KEY
API_URL=http://localhost:8787  # optional, defaults to production
CLOUDFLARE_ACCOUNT_ID=...
CLOUDFLARE_API_TOKEN=...
AI_GATEWAY_API_KEY=...
```

## Commands

Harvest news and save a summary to `articles/dd-mm-yyyy/<city>-<room>.md`:

```bash
pnpm news <city> <room>
```

Cities:

```bash
pnpm admin city add <title> <search> <country>   # create
pnpm admin city delete <id>                      # delete
```

Rooms:

```bash
pnpm admin room add <title> <city_id>            # create
pnpm admin room delete <id>                      # delete
pnpm admin room users <id>                       # list users (names + IPs)
pnpm admin room kick <id> --username <name> [--ip <ip>] [--ban <hours>]   # kick, optionally ban IP
```

News:

```bash
pnpm admin news add <room_id>                    # publish editor.md
pnpm admin news delete <id>                      # delete
```

## Workflow

1. `pnpm news krakow kultura_teatr`
2. Copy the result into `editor.md` and polish it
3. `pnpm admin news add <room_id>`

## Config

- `config/cities.json`: cities (`id`, `country`, `name`, `language`)
- `config/cities/<id>.json`: rooms and their sources (`articles` or `bluesky`)