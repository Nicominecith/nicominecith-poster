import { test, mock } from "node:test";
import assert from "node:assert/strict";
import {
  buildDetailQuery,
  buildSearchQuery,
  filmFromRows,
  getFilmDetail,
  pickAwards,
  pickCast,
  pickCredits,
  pickRuntimeMinutes,
  searchFilms,
} from "../src/film/wikidata";
import {
  extractStorySummary,
  pickReleaseDate,
  shortenToSentences,
  sparqlString,
} from "@freetsy/catalog";
import { filmContent } from "../src/film/content";
import {
  buildPosterSpec,
  type EditableContent,
  emptyLists,
  hasValidPosterInput,
  isValidCount,
  listingTextInfo,
  newInfoRow,
  newListRow,
  parseCount,
  POSTER_FORM_DEFAULTS,
  posterTextInfo,
  resolveLayout,
} from "@freetsy/poster";
import { defaultCreditLabels } from "@freetsy/renderer";
import i18n from "@freetsy/i18n";

type Row = Parameters<typeof pickCast>[0][number];

function row(kind: string, value: string, extra = "", more: Partial<Row> = {}): Row {
  return { kind, value, extra, person: "", ordinal: "", links: "", ...more };
}

const filmContentBase: EditableContent = {
  ...POSTER_FORM_DEFAULTS.content,
  title: "Inception",
  subtitle: "Christopher Nolan",
  releaseDate: "2010-07-08",
  runtime: "148",
  format: "cast",
  lists: {
    ...emptyLists(),
    cast: [
      newListRow({ name: "Leonardo DiCaprio", detail: "Dominick Cobb" }),
      newListRow({ name: "  ", detail: "unused row" }),
      newListRow({ name: "Michael Caine", detail: "", emphasized: true }),
    ],
    awards: [newListRow({ name: "Oscar für die beste Kamera", detail: "2011" })],
  },
  quote: "„Du musst den Mut haben, größer zu träumen.“",
  freeformText: "First paragraph.\n\nSecond paragraph.",
};

void test("typed search text cannot break out of the SPARQL string it is spliced into", () => {
  assert.equal(sparqlString('Herr der "Ringe" \\ teil\n2'), '"Herr der \\"Ringe\\" \\\\ teil 2"');
  const query = buildSearchQuery('a" } DELETE {', "de");
  assert.ok(query.includes('mwapi:srsearch "a\\" } DELETE {'));
  assert.ok(query.includes("haswbstatement:P31=Q11424|"));
  assert.ok(query.includes('wikibase:language "de,mul,en"'));
  assert.ok(buildDetailQuery("Q25188", "en").includes('wikibase:language "en,mul,de"'));
});

void test("the release date is the earliest year, as precisely as that year is known", () => {
  assert.deepEqual(
    pickReleaseDate([
      row("date", "2010-07-16T00:00:00Z", "11"),
      row("date", "2010-01-01T00:00:00Z", "9"),
      row("date", "2010-07-08T00:00:00Z", "11"),
      row("date", "2011-01-01T00:00:00Z", "11"),
    ]),
    { releaseDate: "2010-07-08", releaseDatePrecision: "day" },
  );
  assert.deepEqual(pickReleaseDate([row("date", "1999-01-01T00:00:00Z", "9")]), {
    releaseDate: "1999",
    releaseDatePrecision: "year",
  });
  assert.deepEqual(pickReleaseDate([row("date", "1900-01-01T00:00:00Z", "7")]), {
    releaseDate: "",
    releaseDatePrecision: "year",
  });
});

void test("the runtime is read in minutes whatever unit it is stored in, theatrical cut first", () => {
  const entity = (id: string) => `http://www.wikidata.org/entity/${id}`;
  assert.equal(
    pickRuntimeMinutes([
      row("runtime", "175", entity("Q7727")),
      row("runtime", "202", entity("Q7727")),
    ]),
    175,
  );
  assert.equal(pickRuntimeMinutes([row("runtime", "8880", entity("Q11574"))]), 148);
  assert.equal(pickRuntimeMinutes([row("runtime", "2", entity("Q25235"))]), 120);
  assert.equal(pickRuntimeMinutes([row("runtime", "5", entity("Q11573"))]), 0);
});

void test("the cast lists each actor once, numbered credits first, then the best known", () => {
  const cast = pickCast(
    [
      row("cast", "Michael Caine", "", { person: "p:caine", links: "90" }),
      row("cast", "Tom Berenger", "Eames", { person: "p:berenger", links: "40" }),
      row("cast", "Tom Berenger", "Peter Browning", { person: "p:berenger", links: "40" }),
      row("cast", "Leonardo DiCaprio", "Dominick Cobb", { person: "p:dicaprio", links: "120" }),
      row("cast", "Elliot Page", "Ariadne", { person: "p:page", ordinal: "1", links: "60" }),
      row("cast", "Q123456", "", { person: "p:unlabelled", links: "999" }),
      row("cast", "Ken Watanabe", "Q999", { person: "p:watanabe", links: "70" }),
    ],
    4,
  );
  assert.deepEqual(cast, [
    { name: "Elliot Page", role: "Ariadne" },
    { name: "Leonardo DiCaprio", role: "Dominick Cobb" },
    { name: "Michael Caine", role: "" },
    { name: "Ken Watanabe", role: "" },
  ]);
  assert.deepEqual(
    pickCast([
      row("cast", "Tom Berenger", "Eames", { person: "p:b" }),
      row("cast", "Tom Berenger", "Peter Browning", { person: "p:b" }),
    ]),
    [{ name: "Tom Berenger", role: "Eames / Peter Browning" }],
  );
});

void test("a film links its article in the interface language, a series credits its creators", () => {
  const rows = [
    row("label", "Der Pate"),
    row("director", "Francis Ford Coppola"),
    row("article", "The Godfather", "https://en.wikipedia.org/"),
    row("article", "Der Pate (Film)", "https://de.wikipedia.org/"),
  ];
  const german = filmFromRows("Q47703", rows, "de");
  assert.equal(german.sourceUrl, "https://de.wikipedia.org/wiki/Der_Pate_(Film)");
  assert.deepEqual(german.article, { wiki: "de", title: "Der Pate (Film)" });
  assert.deepEqual(german.directors, ["Francis Ford Coppola"]);
  assert.equal(
    filmFromRows("Q47703", rows, "en").sourceUrl,
    "https://en.wikipedia.org/wiki/The_Godfather",
  );

  const series = filmFromRows(
    "Q1079",
    [
      row("label", "Breaking Bad"),
      row("creator", "Vince Gilligan"),
      ...["A", "B", "C", "D"].map((name) => row("director", name)),
      row("start", "2008-01-20T00:00:00Z", "11"),
    ],
    "de",
  );
  assert.deepEqual(series.directors, ["Vince Gilligan"]);
  assert.equal(series.releaseDate, "2008-01-20");
  assert.equal(series.sourceUrl, "https://www.wikidata.org/wiki/Q1079");
});

void test("the summary is the plot section, subsections included, else the lead", () => {
  const article = [
    "Inception ist ein Science-Fiction-Film von Christopher Nolan.",
    "",
    "",
    "== Handlung ==",
    "Cobb stiehlt Geheimnisse aus Träumen.",
    "",
    "=== Der Auftrag ===",
    "Saito bietet ihm einen letzten Job an.",
    "",
    "== Produktion ==",
    "Gedreht wurde in sechs Ländern.",
  ].join("\n");
  assert.equal(
    extractStorySummary(article),
    "Cobb stiehlt Geheimnisse aus Träumen.\nSaito bietet ihm einen letzten Job an.",
  );
  assert.equal(
    extractStorySummary("A 2010 film.\n\n== Production ==\nShot in six countries."),
    "A 2010 film.",
  );
  assert.equal(extractStorySummary("== Plot ==\n\n"), "");
});

void test("a long summary is cut at a sentence, never inside one", () => {
  assert.deepEqual(shortenToSentences(["One two. Three four. Five six."], 20), [
    "One two. Three four.",
  ]);
  assert.deepEqual(shortenToSentences(["A first. A second.", "Next paragraph."], 20), [
    "A first. A second.",
  ]);
  assert.deepEqual(shortenToSentences(["An overly long opening sentence."], 5), [
    "An overly long opening sentence.",
  ]);
});

void test("a picked film fills the fields the form holds", () => {
  const fields = filmContent(
    {
      id: "Q25188",
      title: "Inception",
      directors: ["Christopher Nolan"],
      releaseDate: "2010-07-08",
      releaseDatePrecision: "day",
      runtimeMinutes: 148,
      cast: [{ name: "Leonardo DiCaprio", role: "Dominick Cobb" }],
      awards: [{ name: "Oscar für die beste Kamera", role: "2011" }],
      summary: "Cobb stiehlt Geheimnisse.",
      summarySource: null,
      sourceUrl: "https://de.wikipedia.org/wiki/Inception",
      credits: [
        { key: "director", values: ["Christopher Nolan"] },
        { key: "writer", values: ["Christopher Nolan"] },
        { key: "genre", values: ["Thriller", "Actionfilm"] },
      ],
    },
    (key) => `label:${key}`,
  );
  assert.equal(fields.subtitle, "Christopher Nolan");
  assert.equal(fields.runtime, "148");
  assert.deepEqual(fields.cast, [
    { name: "Leonardo DiCaprio", detail: "Dominick Cobb", emphasized: false },
  ]);
  assert.deepEqual(fields.awards, [
    { name: "Oscar für die beste Kamera", detail: "2011", emphasized: false },
  ]);
  assert.equal(fields.freeformText, "Cobb stiehlt Geheimnisse.");
  assert.deepEqual(fields.credits, [{ label: "label:writer", value: "Christopher Nolan" }]);
  assert.deepEqual(fields.creditOptions, [
    { label: "label:director", value: "Christopher Nolan" },
    { label: "label:writer", value: "Christopher Nolan" },
    { label: "label:genre", value: "Thriller, Actionfilm" },
  ]);
});

void test("a film poster prints its cast with roles, unnumbered, and its runtime as typed", () => {
  const info = listingTextInfo(filmContentBase, "film");
  assert.equal(info.kind, "film");
  assert.equal(info.numbered, false);
  assert.equal(info.totalDurationMs, 148 * 60_000);
  assert.equal(info.releaseDatePrecision, "day");
  assert.deepEqual(
    info.columns.flat().map((track) => [track.name, track.durationLabel, track.emphasized]),
    [
      ["Leonardo DiCaprio", "Dominick Cobb", false],
      ["Michael Caine", "", true],
    ],
  );

  const summary = listingTextInfo({ ...filmContentBase, format: "freeform" }, "film");
  assert.deepEqual(
    summary.columns.flat().map((track) => track.name),
    ["First paragraph.", "Second paragraph."],
  );
  const awards = listingTextInfo({ ...filmContentBase, format: "awards" }, "film");
  assert.deepEqual(
    awards.columns.flat().map((track) => [track.name, track.durationLabel]),
    [["Oscar für die beste Kamera", "2011"]],
  );
  const quote = listingTextInfo({ ...filmContentBase, format: "quote" }, "film");
  assert.deepEqual(
    quote.columns.flat().map((track) => track.name),
    ["„Du musst den Mut haben, größer zu träumen.“"],
  );
  assert.equal(posterTextInfo(filmContentBase, "film").kind, "film");
  assert.equal(posterTextInfo(filmContentBase, "music").kind, undefined);
});

void test("the runtime accepts whole minutes only and blocks the export otherwise", () => {
  assert.equal(isValidCount(""), true);
  assert.equal(isValidCount(" 148 "), true);
  assert.equal(isValidCount("2:28"), false);
  assert.equal(parseCount("abc"), 0);
  assert.equal(
    hasValidPosterInput({ ...POSTER_FORM_DEFAULTS, content: { ...filmContentBase, runtime: "x" } }),
    false,
  );
  assert.equal(hasValidPosterInput({ ...POSTER_FORM_DEFAULTS, content: filmContentBase }), true);
});

void test("film credits are called premiere and runtime unless renamed", () => {
  const t = i18n.t.bind(i18n);
  assert.deepEqual(defaultCreditLabels("film", t), { released: "Premiere", length: "Laufzeit" });
  assert.deepEqual(defaultCreditLabels(undefined, t), {
    released: "Erschienen",
    length: "Album-Länge",
  });
});

function sparqlRows(rows: Array<Record<string, string>>) {
  return {
    results: {
      bindings: rows.map((entry) =>
        Object.fromEntries(Object.entries(entry).map(([key, value]) => [key, { value }])),
      ),
    },
  };
}

void test("searching reads the hits in the order Wikidata ranked them", async () => {
  let requested: URL | undefined;
  const fetchMock = mock.method(globalThis, "fetch", (url: URL) => {
    requested = url;
    return Promise.resolve(
      Response.json(
        sparqlRows([
          {
            item: "http://www.wikidata.org/entity/Q47703",
            label: "Der Pate",
            released: "1972-03-15T00:00:00Z",
            directors: "Francis Ford Coppola",
            series: "false",
          },
          { item: "http://www.wikidata.org/entity/Q1079", label: "Breaking Bad", series: "true" },
        ]),
      ),
    );
  });
  try {
    const result = await searchFilms("pate", "de");
    assert.deepEqual(result._unsafeUnwrap(), [
      {
        id: "Q47703",
        title: "Der Pate",
        year: "1972",
        directors: "Francis Ford Coppola",
        isSeries: false,
      },
      { id: "Q1079", title: "Breaking Bad", year: "", directors: "", isSeries: true },
    ]);
    assert.equal(`${requested?.origin}${requested?.pathname}`, "https://query.wikidata.org/sparql");
    assert.equal(requested?.searchParams.get("format"), "json");
    assert.equal((await searchFilms("  ", "de"))._unsafeUnwrap().length, 0);
  } finally {
    fetchMock.mock.restore();
  }
});

void test("a film loads with its plot, and loses only the plot when Wikipedia fails", async () => {
  const detail = sparqlRows([
    { kind: "label", value: "Inception" },
    { kind: "director", value: "Christopher Nolan", person: "p:nolan" },
    { kind: "runtime", value: "148", extra: "http://www.wikidata.org/entity/Q7727" },
    { kind: "date", value: "2010-07-08T00:00:00Z", extra: "11" },
    { kind: "cast", value: "Leonardo DiCaprio", extra: "Dominick Cobb", person: "p:l" },
    { kind: "article", value: "Inception", extra: "https://de.wikipedia.org/" },
  ]);
  const article = {
    query: {
      pages: [{ title: "Inception", extract: "Lead.\n\n== Handlung ==\nCobb stiehlt Träume." }],
    },
  };

  let wikipediaUp = true;
  const fetchMock = mock.method(globalThis, "fetch", (url: URL) => {
    if (url.hostname === "query.wikidata.org") return Promise.resolve(Response.json(detail));
    assert.equal(url.hostname, "de.wikipedia.org");
    assert.equal(url.searchParams.get("origin"), "*");
    assert.equal(url.searchParams.get("titles"), "Inception");
    return Promise.resolve(
      wikipediaUp ? Response.json(article) : new Response("busy", { status: 429 }),
    );
  });
  try {
    const film = (await getFilmDetail("Q25188", "de"))._unsafeUnwrap();
    assert.equal(film.title, "Inception");
    assert.equal(film.runtimeMinutes, 148);
    assert.deepEqual(film.cast, [{ name: "Leonardo DiCaprio", role: "Dominick Cobb" }]);
    assert.equal(film.summary, "Cobb stiehlt Träume.");
    assert.deepEqual(film.summarySource, {
      kind: "wikipedia",
      title: "Inception",
      url: "https://de.wikipedia.org/wiki/Inception",
      shortened: false,
    });
    assert.equal(film.sourceUrl, "https://de.wikipedia.org/wiki/Inception");

    wikipediaUp = false;
    const withoutPlot = (await getFilmDetail("Q25188", "de"))._unsafeUnwrap();
    assert.equal(withoutPlot.title, "Inception");
    assert.equal(withoutPlot.summary, "");
    assert.equal(withoutPlot.summarySource, null);

    assert.equal((await getFilmDetail("Q1; DROP", "de")).isErr(), true);
  } finally {
    fetchMock.mock.restore();
  }
});

void test("listable facts come in a fixed order, best known names first, three at most", () => {
  const credits = pickCredits(
    [
      row("credit:genre", "Thriller", "", { links: "42" }),
      row("credit:studio", "Syncopy Films", "", { links: "29" }),
      row("credit:studio", "Warner Bros. Pictures", "", { links: "34" }),
      row("credit:studio", "Legendary Pictures", "", { links: "32" }),
      row("credit:studio", "Q1234", "", { links: "99" }),
      row("credit:studio", "Small Studio", "", { links: "1" }),
      row("credit:writer", "Christopher Nolan", "", { links: "107" }),
      row("credit:writer", "Christopher Nolan", "", { links: "107" }),
    ],
    ["Christopher Nolan"],
  );
  assert.deepEqual(credits, [
    { key: "director", values: ["Christopher Nolan"] },
    { key: "writer", values: ["Christopher Nolan"] },
    {
      key: "studio",
      values: ["Warner Bros. Pictures", "Legendary Pictures", "Syncopy Films"],
    },
    { key: "genre", values: ["Thriller"] },
  ]);
  assert.ok(buildDetailQuery("Q25188", "de").includes('("credit:rating" wdt:P1981)'));
  assert.ok(buildDetailQuery("Q25188", "en").includes('("credit:rating" wdt:P1657)'));
});

void test("the user decides what prints: subtitle, roles and each info line", () => {
  const content: EditableContent = {
    ...filmContentBase,
    credits: [
      newInfoRow({ label: "Drehbuch", value: " Christopher Nolan " }),
      newInfoRow({ label: "Leer", value: "  " }),
    ],
  };
  const shown = posterTextInfo(content, "film");
  assert.equal(shown.artist, "Christopher Nolan");
  assert.equal(shown.columns.flat()[0].durationLabel, "Dominick Cobb");
  assert.deepEqual(shown.extraCredits, [{ label: "Drehbuch", value: "Christopher Nolan" }]);

  const bare = posterTextInfo(content, "film", {
    showSubtitle: false,
    showListDetails: false,
    showTextSource: true,
    textSourceLabel: "Text",
  });
  assert.equal(bare.artist, "");
  assert.deepEqual(
    bare.columns.flat().map((track) => track.durationLabel),
    ["", ""],
  );
  assert.deepEqual(posterTextInfo({ ...content, credits: [] }, "music").extraCredits, []);
});

void test("info lines take room in the side column, so the cover makes way for them", () => {
  const layoutWith = (extraCredits: Array<{ label: string; value: string }>) =>
    resolveLayout({
      spec: { ...buildPosterSpec(listingTextInfo(filmContentBase, "film"), "", []), extraCredits },
      style: "classic",
      widthMm: 210,
      heightMm: 297,
    }).coverSize;
  const many = Array.from({ length: 8 }, (_, index) => ({
    label: `Info ${index}`,
    value: "Christopher Nolan, Jonathan Nolan, Emma Thomas",
  }));
  assert.ok(layoutWith(many) < layoutWith([]));
});

void test("an upright cover keeps its proportions and never outgrows the poster", () => {
  const spec = (coverAspect?: number) => ({
    ...buildPosterSpec(listingTextInfo(filmContentBase, "film"), "", []),
    coverAspect,
  });
  const square = resolveLayout({ spec: spec(), style: "classic", widthMm: 210, heightMm: 297 });
  assert.equal(square.coverHeight, square.coverSize);

  const upright = resolveLayout({
    spec: spec(2 / 3),
    style: "classic",
    widthMm: 210,
    heightMm: 297,
  });
  assert.ok(Math.abs(upright.coverHeight - upright.coverSize * 1.5) < 1e-6);
  assert.ok(upright.coverSize <= upright.contentWidth);
  assert.ok(upright.coverSize < square.coverSize);
});

void test("awards list the best-known prize first, each with its year, once", () => {
  assert.deepEqual(
    pickAwards([
      row("award", "Saturn Award für den besten Science-Fiction-Film", "2011", { links: "20" }),
      row("award", "Oscar für die beste Kamera", "2011", { links: "60" }),
      row("award", "Oscar für die beste Kamera", "2011", { links: "60" }),
      row("award", "Q123", "2011", { links: "99" }),
      row("award", "National Board of Review/Top Ten Filme", "", { links: "5" }),
    ]),
    [
      { name: "Oscar für die beste Kamera", role: "2011" },
      { name: "Saturn Award für den besten Science-Fiction-Film", role: "2011" },
      { name: "National Board of Review/Top Ten Filme", role: "" },
    ],
  );
  const query = buildDetailQuery("Q25188", "de");
  assert.ok(query.includes("p:P166"));
  assert.ok(query.includes('("credit:basedOn" wdt:P144)'));
  assert.ok(query.includes('("credit:filmingLocation" wdt:P915)'));
});
