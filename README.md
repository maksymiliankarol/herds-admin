# herds-news

Builds a short Polish news roundup for a city chat room. For each source in the room it reads the listing page, picks the newest dated articles, and summarizes each into one short paragraph.

## Setup

```bash
pnpm install
```

Create a `.env` file:

```
CLOUDFLARE_ACCOUNT_ID=...
CLOUDFLARE_API_TOKEN=...
AI_GATEWAY_API_KEY=...
MODEL=mistral/ministral-8b   # optional, any AI Gateway model
```

## Usage

```bash
pnpm news <city> <room> [--count N]
```

- `city`: city id from `config/cities.jsonc`
- `room`: room name from the city's file in `config/cities/`
- `--count N`: newest articles to read per source, 1-5 (default 1)

Examples:

```bash
# 1 newest article per source
pnpm news krakow kultura

# 3 newest articles per source
pnpm news krakow kultura --count 3
```

The result is one note for the room: one paragraph per article, each ending with a reference like `[1]`, followed by a list of links. It is printed and saved to `articles/dd-mm-yyyy/<city>-<room>.md`. Failed sources or articles are skipped with a warning.

## Config

`config/cities.jsonc` lists the cities:

```json
[
  { "id": "krakow", "country": "PL", "name": "Kraków" }
]
```

- `id`: used in the command and as the file name in `config/cities/`
- `country`: two-letter country code
- `name`: display name

`config/cities/<id>.jsonc` lists the city's rooms:

```json
[
  {
    "room": "kultura",
    "src": [{ "title": "Example", "url": "https://example.com/news" }]
  }
]
```

- `room`: room name, used in the command
- `src`: sources, each with a `title` and the `url` of a listing page that shows article dates
- A room with an empty `src` fails.
- Plain JSON only: no comments, no trailing commas.

To add a city: add it to `cities.jsonc` and create `config/cities/<id>.jsonc`.

## Tuning

The paragraph length limit is the `MAX_WORDS` constant in `src/ai/summarize.ts`.