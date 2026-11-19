# herds-news

Builds a short Polish news roundup for a city chat room. It reads each source's listing page, picks the newest dated articles, and summarizes them.

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
pnpm news <city> <room> [--count N] [--summary room|source]
```

- `city`: city id from `config/cities.jsonc` (required)
- `room`: room name from the city's file (required)
- `--count N`: newest articles to read per source, 1-5 (default 1)
- `--summary room`: one roundup for the whole room (default)
- `--summary source`: one roundup per source

## Examples

```bash
# 1 newest article per source, one roundup for the room
pnpm news warsaw ogólne

# 3 newest articles per source, one roundup for the room
pnpm news warsaw ogólne --count 3

# 1 article per source, one roundup per source
pnpm news warsaw ogólne --summary source

# 2 articles per source, one roundup per source
pnpm news berlin allgemein --count 2 --summary source
```

The result is printed and saved to `articles/dd-mm-yyyy/<city>-<room>.md`.
Failed sources or articles are skipped with a warning.

## Config

`config/cities.jsonc` lists the cities:

```json
[
  { "id": "warsaw", "country": "PL", "name": "Warszawa" }
]
```

- `id`: used in the command and as the file name in `config/cities/`
- `country`: two-letter country code
- `name`: display name

`config/cities/<id>.jsonc` lists the city's rooms:

```json
[
  {
    "room": "ogólne",
    "src": [{ "title": "Example", "url": "https://example.com/news" }]
  }
]
```

- `room`: room name, used in the command
- `src`: sources, each with a `title` and the `url` of a listing page that shows article dates
- A room with an empty `src` fails.
- Plain JSON only: no comments, no trailing commas.

To add a city: add it to `cities.jsonc` and create `config/cities/<id>.jsonc`.

# Return examples

```bash 
pnpm news warsaw ogólne

Warszawa (PL) / ogólne

[Bagatela] reading listing...
  2026-11-17 Nowy repertuar na grudzień

[Teats] reading listing...
  2026-11-16 Królowa Śniegu wraca na scenę

[Teatr Wielki] reading listing...
  2026-11-14 Premiera „Słodkiego ptaka młodości"

Summarizing...

Teatry zapowiadają grudzień i nową premierę

Teatr przy ul. Kamienica ogłosił repertuar na grudzień, w którym znalazły się nowe tytuły i dodatkowe terminy. W Teatrze Capitol wraca „Królowa Śniegu", spektakl dla dzieci od 6 lat, z piosenkami i efektami scenicznymi. Teatr Narodowy pokazał premierę „Słodkiego ptaka młodości" Tennessee Williamsa w reżyserii Małgorzaty Bogajewskiej. Bilety na wszystkie wydarzenia można kupić online.

Saved to articles/18-11-2026/warsaw-ogólne.md
```

```bash
pnpm news warsaw ogólne --count 3

# Same flow, but 3 articles are listed per source and the summary covers all 9:

Warszawa (PL) / ogólne

[Bagatela] reading listing...
  2026-11-17 Nowy repertuar na grudzień
  2026-11-12 Zmiany w godzinach pracy kasy
  2026-11-05 Spotkanie z autorem sztuki

[Teats] reading listing...
  2026-11-16 Królowa Śniegu wraca na scenę
  2026-11-10 Spotkania z Mikołajem w grudniu
  2026-11-03 Nowa wystawa w foyer

[Teatr Wielki] reading listing...
  2026-11-14 Premiera „Słodkiego ptaka młodości"
  2026-11-09 Spektakl dla szkół
  2026-11-02 Rozmowa z reżyserką premiery

Summarizing...

Warszawskie teatry przygotowują się do świątecznego sezonu

Teatry ogłosiły grudniowy repertuar i zmiany w pracy kas biletowych. Capitol zaprasza rodziny na „Królowę Śniegu" oraz spotkania z Mikołajem po wybranych spektaklach, a w foyer otwarto nową wystawę. Teatr Narodowy po premierze „Słodkiego ptaka młodości" proponuje spektakl dla szkół i rozmowę z reżyserką. Jedna ze scen zaprasza też na spotkanie z autorem sztuki.

Saved to articles/18-11-2026/warsaw-ogólne.md
```

```bash 
pnpm news warsaw ogólne --summary source

# The log is the same as in example 1. Only the summarizing part differs, with one block per source:

Summarizing...

## Bagatela

Nowy repertuar na grudzień

Teatr opublikował repertuar na grudzień z nowymi tytułami i dodatkowymi terminami. Część spektakli zagrana zostanie w weekendy. Bilety są dostępne online i w kasie teatru.

## Teats

Królowa Śniegu wraca na scenę

Capitol przypomina spektakl dla dzieci od 6 lat, z piosenkami i efektami scenicznymi. Przedstawienia odbędą się o 10:30 i 14:00. Bilety można rezerwować online.

## Teatr Wielki

Premiera „Słodkiego ptaka młodości"

Teatr Narodowy pokazał dramat Tennessee Williamsa w reżyserii Małgorzaty Bogajewskiej. W rolach głównych wystąpią Gabriela Muskała i Paweł Brzeszcz. Premiera odbyła się 14 listopada.

Saved to articles/18-11-2026/warsaw-ogólne.md
```