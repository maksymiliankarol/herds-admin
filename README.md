# herds-news

Builds a short Polish news roundup for a city chat room. For each source in the room it picks the newest dated items (articles or social media posts) and summarizes each into one short paragraph.

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
pnpm news <city> <room>
```

- `city`: city id from `config/cities.json`
- `room`: room name from the city's file in `config/cities/`

Example:

```bash
pnpm news krakow kultura
```

Each `articles` source gives its 1 newest article, and each `feed` source gives its 3 newest posts. The result is one note for the room: one paragraph per item, each ending with a reference like `[1]`, followed by a list of links. It is printed and saved to `articles/dd-mm-yyyy/<city>-<room>.md`. Failed sources or articles are skipped with a warning.

## Config

`config/cities.json` lists the cities:

```json
[
  { "id": "krakow", "country": "PL", "name": "Kraków" }
]
```

- `id`: used in the command and as the file name in `config/cities/`
- `country`: two-letter country code
- `name`: display name

`config/cities/<id>.json` lists the city's rooms:

```json
[
  {
    "room": "kultura",
    "src": [
      { "title": "Example", "url": "https://example.com/news" },
      { "title": "Example feed", "url": "https://example.com/feed", "type": "feed" }
    ]
  }
]
```

- `room`: room name, used in the command. Names like `kultura_teatr` are fine, but each room is separate: a parent room does not include its children.
- `src`: sources, each with a `title`, a `url` and an optional `type`
- `type`:
  - `articles` (default): the `url` is a listing page that shows article dates. The newest article is opened and read.
  - `feed`: the `url` is a feed page (e.g. a social media page or an RSS bridge). The newest posts are read directly from it, with no second fetch.
- A room with an empty `src` fails.
- Plain JSON only: no comments, no trailing commas.

To add a city: add it to `cities.json` and create `config/cities/<id>.json`.

## Tuning

- The paragraph length limit is the `MAX_WORDS` constant in `src/ai/summarize.ts`.
- The number of newest items read per source type is the `NEWEST` constant in `src/run.ts`.