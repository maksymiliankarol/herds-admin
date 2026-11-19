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
pnpm news krakow kultura --count 3 --summary source

# Two sources per room so single summary with two paragraphs. Each paragraph is written from 3 newset article on source.

...

```

```bash
pnpm news krakow kultura --summary source

# Two sources per room so single summary with two paragraphs. Each paragraph is written from newset article on source.

## Teatr im. Juliusza Słowackiego

W minionym roku odeszli z życia trzej aktorzy związani z Krakowskim Teatrem im. Juliusza Słowackiego. Romuald Michalski, który grał w teatrze przez 14 lat, pełnił także funkcję dyrektora artystycznego w innych teatrach, m.in. w Koszalinie, i zmarł w wieku 87 lat. Ireneusz Pastuszak, absolwent PWST, występował w Krakowie w latach 1986–1992, a później w Tarnowie, gdzie był znanym aktorem; zmarł podczas wakacji w Maroku w wieku 65 lat. Ryszard Jasiński, związany z teatrem w latach 1980–2003, znany z ról w spektaklach m.in. *Syn z Pieszo* i *Weselu*, zmarł w wieku 69 lat. [1]

---

Maciej Pesta, który współpracował z krakowskim teatrem w spektaklu *Jedz*, występował wcześniej w teatrach w Kielcach, Bydgoszczy, Warszawie i Gdańsku. [2]

- [1](https://teatrwkrakowie.pl/aktualnosci/odeszli-w-minionym-roku-pamietamy-4)

## Narodowy Stary Teatr

27 listopada o godz. 20:30 w sali im. Heleny Modrzejewskiej na ul. Jagiellońskiej 5 odbędzie się spotkanie Jakuba Skrzywanka, zastępcy dyrektora Starego Teatru, z reżyserką Agnieszką Holland. Rozmowa będzie towarzyszyć premierom spektakli „E:/Migranci” i „Sąsiadów”, które poruszają tematy współczesnej wspólnoty, migracji i społecznych podziałów. [1]

---

Agnieszka Holland to laureatka m.in. Złotego Globu, Złotego Lwa, BAFTY i trzykrotnie nominowana do Oscara. W swojej karierze wyreżyserowała ponad trzydzieści filmów, w tym „Zieloną Granicę” (2023) i „Pokot” (2017). W latach 2021–2024 była przewodniczącą Europejskiej Akademii Filmowej. [2]

- [1](https://stary.pl/pl/polska-sprawdzam-spotkanie-z-agnieszka-holland/)

```

```bash 
pnpm news krakow kultura --summary room

# Two sources per room so single summary with two paragraphs. Each paragraph is written from newset article on source.

Teatr im. Juliusza Słowackiego w Krakowie zaprasza na sylwestrowe spektakle 31 grudnia. Na Dużej Scenie będzie można obejrzeć „Proszę Państwa, Wyspiański umiera” Agaty Dudy-Gracz, a na Scenie MOS – „Szymborska. Kropki, przecinki, papierosy”. Oba przedstawienia połączone będą z toastem i sylwestrową atmosferą. Bilety są już dostępne [1].

Narodowy Stary Teatr zaprasza na spotkanie z psychoanalizą 22 listopada o godz. 16:00. Po spektaklu „Zamknij oczy Nel. W pustyni i w puszczy – epilog” odbędzie się dyskusja z udziałem psychiatrów i aktorów, podczas której przyjrzą się znaczeniom kryjącym się w teatralnej opowieści [2].

- [1](https://teatrwkrakowie.pl/aktualnosci/sylwester-w-teatrze-slowackiego-dwie-sceny-dwie-niezwykle-opowiesci-i-wspolny-toast-za-nowy-rok)
- [2](https://stary.pl/pl/teatr-a-psychoanaliza/)

```