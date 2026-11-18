# herds-news

Builds short news roundups for chat rooms, per city. It reads each source's listing page, picks the newest dated articles, and summarizes them.

## Config

Cities are listed in `config/cities.jsonc`:

```
[
  { "id": "warsaw", "country": "PL", "name": "Warszawa" },
  { "id": "berlin", "country": "DE", "name": "Berlin" }
]
```

- `id`: city name used in the command, and the file name in `config/cities/`.
- `country`: two-letter country code.
- `name`: display name.

Each city has its own file with its rooms, e.g. `config/cities/warsaw.jsonc`:

```
[
  {
    "room": "ogólne",
    "src": [
      { 
        "title": "Example 1", 
        "url": "https://example1.com" 
      },
      { 
        "title": "Example 2", 
        "url": "https://example2.com" 
      }
    ]
  },
  { "room": "hobby", "src": [] }
]
```

- `room`: room name, used as the CLI argument.
- `src`: sources for that room, each with a `title` and the `url` of a listing page that shows article dates.
- A room with an empty `src` fails.
- No comments or trailing commas (the files are read as plain JSON).

To add a city, add it to `cities.jsonc` and create `config/cities/<id>.jsonc`.

Optional: set `MODEL` to use another AI Gateway model (default `mistral/ministral-8b`).

## Usage

- `city`: city id from `cities.jsonc` (required).
- `room`: room name from the city's file (required).
- `--count N`: newest articles to take from each source, 1-5 (default 3).
- `--summary room`: one roundup for the whole room (default).
- `--summary source`: one roundup per source.

## Examples

```bash
pnpm news warsaw ogólne
pnpm news warsaw ogólne --count 2
pnpm news warsaw ogólne --summary source
pnpm news berlin allgemein --count 1 --summary source
```

Failed sources or articles are skipped with a warning.